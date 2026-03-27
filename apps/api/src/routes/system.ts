import { FastifyInstance } from "fastify";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { config, setSteamConfig } from "../config.js";

const configSchema = z.object({
  apiKey: z.string().min(1, "Steam API Key is required"),
  realm: z.string().optional(),
});

export default async function systemRoutes(app: FastifyInstance) {
  // GET /system/status - Check if the system is fully configured
  app.get("/status", async () => {
    return {
      configured: !!config.STEAM_API_KEY,
      hasSteamApiKey: !!config.STEAM_API_KEY,
    };
  });

  // POST /system/config - Set system configuration (Steam API Key)
  app.post("/config", async (request, reply) => {
    const result = configSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        error: "Invalid configuration data",
        details: result.error.format(),
      });
    }

    const { apiKey } = result.data;
    const realm = result.data.realm?.trim() || undefined;

    // 1. Update the running in-memory configuration
    setSteamConfig(apiKey, realm);

    // 2. Attempt to persist the configuration to the local .env file
    // This is crucial for the standalone app / local-first architecture
    // so the user doesn't have to enter the key every time the app starts.
    try {
      // Find the best place for the .env file. In a Tauri app running from a binary,
      // this might need to be an app data directory in the future, but for local
      // dev / Docker / basic standalone, the current working directory works well.
      const envPath = path.resolve(process.cwd(), ".env");
      let envContent = "";

      try {
        envContent = await fs.readFile(envPath, "utf-8");
      } catch (e) {
        // File doesn't exist, we'll create a new one
      }

      // Update or append STEAM_API_KEY
      if (envContent.includes("STEAM_API_KEY=")) {
        envContent = envContent.replace(
          /STEAM_API_KEY=.*/g,
          `STEAM_API_KEY="${apiKey}"`,
        );
      } else {
        envContent += `\nSTEAM_API_KEY="${apiKey}"`;
      }

      // Update, append, or remove STEAM_REALM
      if (realm) {
        if (envContent.includes("STEAM_REALM=")) {
          envContent = envContent.replace(
            /STEAM_REALM=.*/g,
            `STEAM_REALM="${realm}"`,
          );
        } else {
          envContent += `\nSTEAM_REALM="${realm}"`;
        }
      } else {
        envContent = envContent
          .split("\n")
          .filter((line) => !line.startsWith("STEAM_REALM="))
          .join("\n");
      }

      // Clean up multiple newlines and save
      envContent = envContent.replace(/\n{3,}/g, "\n\n").trim() + "\n";
      await fs.writeFile(envPath, envContent, "utf-8");

      app.log.info("Successfully persisted Steam configuration to .env");
    } catch (err) {
      app.log.warn(
        { err },
        "Failed to persist configuration to .env file. Changes are only applied in-memory.",
      );
    }

    return { success: true };
  });
}
