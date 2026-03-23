import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@steam-auction/db";
import { fetchSteam } from "../lib/steam-api.js";

const recommendationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", async (request) => {
    let userId: string | undefined;
    try {
      await request.jwtVerify();
      const payload = request.user as { sub: string };
      userId = payload.sub;
    } catch {
      // Public access — anonymous users see global recommendations.
    }

    const topPicked = await prisma.pickHistory.groupBy({
      by: ["gameId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 12,
    });

    const topGames = (
      await Promise.all(
        topPicked.map(async (p) => {
          const g = await prisma.game.findUnique({ where: { id: p.gameId } });
          return g ? { appId: g.appId, name: g.name, picks: p._count.id } : null;
        })
      )
    ).filter(Boolean);

    let recent: Array<{ appId: number; name: string }> = [];
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const apiKey = process.env.STEAM_API_KEY;
      if (user?.steamId && apiKey) {
        try {
          const url = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${apiKey}&steamid=${user.steamId}`;
          const res = await fetchSteam<{
            response?: { games?: Array<{ appid: number; name: string }> };
          }>(url);
          if (res.ok) {
            recent = (res.data.response?.games ?? [])
              .slice(0, 8)
              .map((g) => ({ appId: g.appid, name: g.name }));
          }
        } catch {
          // Non-critical.
        }
      }
    }

    return { topGames, recent };
  });
};

export default recommendationsRoutes;
