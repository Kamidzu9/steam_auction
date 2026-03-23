import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@steam-auction/db";
import { buildSteamOpenIdUrl, verifySteamOpenId, getSteamBaseUrl } from "../lib/steam.js";
import { getPlayerSummaries } from "../lib/steam-api.js";
import { createSession, validateRefreshToken, rotateRefreshToken, revokeSession } from "../lib/session.js";
import { config } from "../config.js";

function refreshCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: config.COOKIE_SECURE || config.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/auth/refresh",
    expires: expiresAt,
  };
}

function accessCookieOptions() {
  return {
    httpOnly: true,
    secure: config.COOKIE_SECURE || config.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    // Access token is short-lived — let it expire naturally via JWT exp.
    // No explicit maxAge so it's a session cookie from the browser's perspective,
    // but the JWT itself enforces expiry.
  };
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /auth/steam — redirect user to Steam OpenID login page
  fastify.get("/steam", async (request, reply) => {
    const baseUrl = getSteamBaseUrl(request.url.startsWith("http")
      ? request.url
      : `${config.STEAM_REALM ?? `http://localhost:${config.PORT}`}${request.url}`);
    const apiBaseUrl = config.STEAM_REALM ?? `http://localhost:${config.PORT}`;
    const returnTo = `${apiBaseUrl}/auth/steam/callback`;

    const redirectUrl = buildSteamOpenIdUrl(returnTo, getSteamBaseUrl(apiBaseUrl));
    return reply.redirect(redirectUrl, 302);
  });

  // GET /auth/steam/callback — Steam returns the user here after login
  fastify.get("/steam/callback", async (request, reply) => {
    const params = new URLSearchParams(
      Object.entries(request.query as Record<string, string>)
    );

    const verification = await verifySteamOpenId(params);
    if (!verification.valid) {
      return reply.redirect(`${config.FRONTEND_URL}/dashboard?login=failed`, 302);
    }

    const { steamId } = verification;
    let displayName: string | undefined;
    let avatarUrl: string | undefined;

    if (config.STEAM_API_KEY) {
      try {
        const summary = await getPlayerSummaries([steamId], config.STEAM_API_KEY);
        const player = summary.ok ? summary.data.response.players[0] : null;
        if (player) {
          displayName = player.personaname;
          avatarUrl = player.avatarfull;
        }
      } catch {
        // Profile enrichment is non-critical.
      }
    }

    const user = await prisma.user.upsert({
      where: { steamId },
      update: { displayName, avatarUrl },
      create: { steamId, displayName, avatarUrl },
    });

    const { sessionId, refreshToken, expiresAt } = await createSession(user.id);

    const accessToken = fastify.jwt.sign(
      { sub: user.id, steamId: user.steamId },
      { expiresIn: config.JWT_ACCESS_EXPIRES_IN }
    );

    reply
      .setCookie("access_token", accessToken, accessCookieOptions())
      .setCookie("refresh", refreshToken, refreshCookieOptions(expiresAt))
      .setCookie("session_id", sessionId, {
        httpOnly: true,
        secure: config.COOKIE_SECURE || config.NODE_ENV === "production",
        sameSite: "lax",
        path: "/auth",
      });

    return reply.redirect(`${config.FRONTEND_URL}/dashboard`, 302);
  });

  // POST /auth/refresh — exchange refresh token for a new access token
  fastify.post("/refresh", async (request, reply) => {
    const refreshToken =
      request.cookies["refresh"] ??
      (request.body as Record<string, string> | undefined)?.refreshToken;

    const validated = await validateRefreshToken(refreshToken);
    if (!validated) {
      reply
        .clearCookie("access_token", { path: "/" })
        .clearCookie("refresh", { path: "/auth/refresh" });
      return reply.status(401).send({ error: "Invalid or expired refresh token" });
    }

    const { session, user } = validated;
    const { refreshToken: newRefreshToken, expiresAt } = await rotateRefreshToken(session.id);

    const accessToken = fastify.jwt.sign(
      { sub: user.id, steamId: user.steamId },
      { expiresIn: config.JWT_ACCESS_EXPIRES_IN }
    );

    reply
      .setCookie("access_token", accessToken, accessCookieOptions())
      .setCookie("refresh", newRefreshToken, refreshCookieOptions(expiresAt));

    return reply.send({
      accessToken,
      expiresIn: 15 * 60,
      user: {
        id: user.id,
        steamId: user.steamId,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  });

  // POST /auth/logout
  fastify.post("/logout", async (request, reply) => {
    const sessionId = request.cookies["session_id"];
    if (sessionId) {
      await revokeSession(sessionId);
    }

    reply
      .clearCookie("access_token", { path: "/" })
      .clearCookie("refresh", { path: "/auth/refresh" })
      .clearCookie("session_id", { path: "/auth" });

    return reply.send({ ok: true });
  });
};

export default authRoutes;
