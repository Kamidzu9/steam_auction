import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { config } from "./config.js";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import friendsRoutes from "./routes/friends.js";
import poolsRoutes from "./routes/pools.js";
import steamRoutes from "./routes/steam.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import recommendationsRoutes from "./routes/recommendations.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "production" ? "warn" : "info",
    },
  });

  // ── Plugins ────────────────────────────────────────────────────────────────

  await app.register(cookie);

  await app.register(cors, {
    origin: config.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(jwt, {
    secret: config.JWT_SECRET,
    // Accept token from Authorization header *and* from the access_token cookie.
    // This lets web clients use httpOnly cookies while desktop/mobile use Bearer.
    cookie: { cookieName: "access_token", signed: false },
    sign: { expiresIn: config.JWT_ACCESS_EXPIRES_IN },
  });

  await app.register(authPlugin);

  // ── Routes ─────────────────────────────────────────────────────────────────

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(meRoutes, { prefix: "/me" });
  await app.register(friendsRoutes, { prefix: "/friends" });
  await app.register(poolsRoutes, { prefix: "/pools" });
  await app.register(steamRoutes, { prefix: "/steam" });
  await app.register(leaderboardRoutes, { prefix: "/leaderboard" });
  await app.register(recommendationsRoutes, { prefix: "/recommendations" });

  // ── Health check ──────────────────────────────────────────────────────────

  app.get("/health", async () => ({ ok: true, ts: Date.now() }));

  return app;
}
