import { existsSync } from "node:fs";
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

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
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
  return result.data;
}

export const config = loadConfig();
