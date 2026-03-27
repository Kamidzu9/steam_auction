import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { z } from "zod";

function loadEnvFile() {
  if (typeof process.loadEnvFile !== "function") {
    return;
  }

  // Prefer the nearest .env to the current working directory.
  const candidates = [".env", "../.env", "../../.env", "../../../.env"];
  for (const candidate of candidates) {
    const absolutePath = resolve(process.cwd(), candidate);
    if (existsSync(absolutePath)) {
      process.loadEnvFile(absolutePath);
      return;
    }
  }
}

loadEnvFile();

// Auto-generate a JWT secret for development if not provided.
// Note: this secret changes on every restart, so sessions won't survive
// server restarts in development. Set JWT_SECRET in .env for persistence.
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== "production") {
  process.env.JWT_SECRET = randomBytes(32).toString("hex");
}

// Default DATABASE_URL to a local SQLite file if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3010),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  REFRESH_EXPIRES_DAYS: z.coerce.number().default(30),
  STEAM_API_KEY: z.string().optional(),
  STEAM_REALM: z.string().optional(),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  COOKIE_SECURE: z
    .string()
    .transform((v) => v === "true")
    .default(false),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues.map(
      (i) => `  ${i.path.join(".")}: ${i.message}`,
    );
    throw new Error(`Invalid environment configuration:\n${errors.join("\n")}`);
  }
  const cfg = result.data;

  // Provide warning when STEAM_API_KEY is not set.
  if (!cfg.STEAM_API_KEY && cfg.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.warn(
      "Warning: STEAM_API_KEY is not set. Steam-related functionality will be disabled until you configure a Steam API Key.",
    );
  }

  return cfg;
}

export const config = loadConfig();

export function setSteamConfig(apiKey: string, realm?: string) {
  config.STEAM_API_KEY = apiKey;
  const normalizedRealm = realm?.trim();
  config.STEAM_REALM = normalizedRealm ? normalizedRealm : undefined;
}
