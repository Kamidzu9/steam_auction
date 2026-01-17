import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySteamOpenId } from "@/lib/steam";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const params = url.searchParams;

  const verification = await verifySteamOpenId(request.url, params);

  console.log("[auth/steam/callback] verification:", verification);

  if (!verification.valid) {
    console.warn("[auth/steam/callback] Steam verification failed");
    return NextResponse.redirect(new URL("/", request.url));
  }

  const steamId = verification.steamId;
  const user = await prisma.user.upsert({
    where: { steamId },
    update: {},
    create: {
      steamId,
    },
  });


  console.log("[auth/steam/callback] upserted user id=", user.id);

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.set("steam_user_id", String(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  console.log("[auth/steam/callback] set-cookie steam_user_id", user.id);

  return response;
}
