import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config.js";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import friendsRoutes from "./routes/friends.js";
import poolsRoutes from "./routes/pools.js";
import steamRoutes from "./routes/steam.js";
import systemRoutes from "./routes/system.js";

function isLoopbackAddress(ip: string | undefined) {
  if (!ip) {
    return false;
  }

  return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
}

function isAllowedOrigin(origin: string) {
  if (origin === config.FRONTEND_URL) {
    return true;
  }

  if (origin === "tauri://localhost") {
    return true;
  }

  try {
    const url = new URL(origin);
    const desktopHosts = new Set(["tauri.localhost", "localhost", "127.0.0.1"]);

    if (desktopHosts.has(url.hostname)) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "production" ? "warn" : "info",
    },
  });

  // ── Plugins ────────────────────────────────────────────────────────────────

  await app.register(cookie);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    allowList: (request) => isLoopbackAddress(request.ip),
  });

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed"), false);
    },
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
  await app.register(systemRoutes, { prefix: "/system" });

  // ── Health check ──────────────────────────────────────────────────────────

  app.get("/health", async () => ({ ok: true, ts: Date.now() }));

  return app;
}
