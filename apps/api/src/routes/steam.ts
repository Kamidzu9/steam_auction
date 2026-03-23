import type { FastifyPluginAsync } from "fastify";
import { resolveSteamId, fetchSteam, getPlayerSummaries } from "../lib/steam-api.js";
import { appIdSchema, steamIdSchema } from "@steam-auction/shared";

const steamRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /steam/owned-games?steamId=...
  fastify.get(
    "/owned-games",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const apiKey = process.env.STEAM_API_KEY;
      if (!apiKey) {
        return reply.status(503).send({ error: "Service unavailable" });
      }

      const steamIdParam = (request.query as Record<string, string>)["steamId"];
      const validation = steamIdSchema.safeParse(steamIdParam);
      if (!validation.success) {
        return reply.status(400).send({ error: "Invalid Steam ID" });
      }

      const resolved = await resolveSteamId(validation.data, apiKey);
      if (!resolved.ok) {
        return reply.status(400).send({ error: "Invalid Steam ID" });
      }

      const url = new URL("https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/");
      url.searchParams.set("key", apiKey);
      url.searchParams.set("steamid", resolved.steamId);
      url.searchParams.set("include_appinfo", "1");
      url.searchParams.set("include_played_free_games", "1");

      const response = await fetchSteam<{
        response?: { games?: { appid: number; name: string; playtime_forever?: number }[] };
      }>(url.toString());

      if (!response.ok) {
        return reply.status(502).send({ error: "Failed to fetch owned games" });
      }

      const games = (response.data.response?.games ?? []).map((g) => ({
        appid: g.appid,
        name: g.name,
        playtime_forever: g.playtime_forever ?? 0,
      }));

      return reply.send({ games });
    }
  );

  // GET /steam/friends?steamId=...
  fastify.get(
    "/friends",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const apiKey = process.env.STEAM_API_KEY;
      if (!apiKey) {
        return reply.status(503).send({ error: "Service unavailable" });
      }

      const steamIdParam = (request.query as Record<string, string>)["steamId"];
      const validation = steamIdSchema.safeParse(steamIdParam);
      if (!validation.success) {
        return reply.status(400).send({ error: "Invalid Steam ID" });
      }

      const resolved = await resolveSteamId(validation.data, apiKey);
      if (!resolved.ok) {
        return reply.status(400).send({ error: "Invalid Steam ID" });
      }

      const url = new URL("https://api.steampowered.com/ISteamUser/GetFriendList/v0001/");
      url.searchParams.set("key", apiKey);
      url.searchParams.set("steamid", resolved.steamId);
      url.searchParams.set("relationship", "friend");

      const response = await fetchSteam<{
        friendslist?: { friends?: { steamid: string }[] };
      }>(url.toString());

      if (!response.ok) {
        return reply.status(502).send({ error: "Failed to fetch friends list" });
      }

      const friends = response.data.friendslist?.friends ?? [];
      if (friends.length === 0) {
        return reply.send({ friends: [] });
      }

      const summaries = await getPlayerSummaries(
        friends.map((f) => f.steamid),
        apiKey
      );

      if (!summaries.ok) {
        return reply.send({ friends });
      }

      return reply.send({ friends, profiles: summaries.data.response.players });
    }
  );

  // GET /steam/app-details?appId=...
  fastify.get("/app-details", async (request, reply) => {
    const appIdParam = (request.query as Record<string, string>)["appId"];
    const validation = appIdSchema.safeParse(appIdParam);
    if (!validation.success) {
      return reply.status(400).send({ error: "Invalid app ID" });
    }

    const appId = validation.data;
    const url = `https://store.steampowered.com/api/appdetails?appids=${encodeURIComponent(appId)}&l=en`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        return reply.status(502).send({ error: "Store API failed" });
      }
      const body = await res.json() as Record<string, { success: boolean; data?: Record<string, unknown> }>;
      const entry = body[appId];
      if (!entry?.success) {
        return reply.status(404).send({ error: "No data" });
      }

      const data = entry.data ?? {};
      const categories = (Array.isArray(data["categories"]) ? data["categories"] : [])
        .map((c: { description?: string }) => c.description)
        .filter(Boolean);
      const genres = (Array.isArray(data["genres"]) ? data["genres"] : [])
        .map((g: { description?: string }) => g.description)
        .filter(Boolean);

      return reply.send({ categories, genres, data });
    } catch {
      return reply.status(500).send({ error: "Fetch error" });
    }
  });
};

export default steamRoutes;
