import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySteamOpenId } from "@/lib/steam";
import { getPlayerSummaries } from "@/lib/steam-api";
import { createSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const params = url.searchParams;

  const verification = await verifySteamOpenId(request.url, params);

  console.log("[auth/steam/callback] verification:", verification);

  if (!verification.valid) {
    console.warn("[auth/steam/callback] Steam verification failed");
    return NextResponse.redirect(new URL("/dashboard?login=failed", request.url));
  }

  const steamId = verification.steamId;
  const apiKey = process.env.STEAM_API_KEY;
  let displayName: string | undefined;
  let avatarUrl: string | undefined;

  if (apiKey) {
    try {
      const summary = await getPlayerSummaries([steamId], apiKey);
      const player = summary.ok ? summary.data.response.players[0] : null;
      if (player) {
        displayName = player.personaname;
        avatarUrl = player.avatarfull;
      }
    } catch {
      // ignore profile enrichment errors
    }
  }

  const user = await prisma.user.upsert({
    where: { steamId },
    update: {
      displayName: displayName ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
    },
    create: {
      steamId,
      displayName,
      avatarUrl,
    },
  });


  console.log("[auth/steam/callback] upserted user id=", user.id);

  // create session and set cookies (sid + refresh)
  const { sessionId, refreshToken, expiresAt } = await createSession(user.id);

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.set("sid", String(sessionId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // short-lived session id cookie
    expires: new Date(Date.now() + 60 * 60 * 1000),
  });

  response.cookies.set("refresh", String(refreshToken), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    expires: expiresAt,
  });

  console.log("[auth/steam/callback] set-session", user.id, sessionId);

  return response;
}
