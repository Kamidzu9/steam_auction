import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@steam-auction/db";

const leaderboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", async () => {
    const topPickers = await prisma.pickHistory.groupBy({
      by: ["userId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const pickers = await Promise.all(
      topPickers.map(async (p) => {
        const user = await prisma.user.findUnique({ where: { id: p.userId } });
        return {
          userId: p.userId,
          name: user?.displayName ?? user?.steamId ?? "Unknown",
          picks: p._count.id,
        };
      })
    );

    const topGames = await prisma.pickHistory.groupBy({
      by: ["gameId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    });

    const games = (
      await Promise.all(
        topGames.map(async (g) => {
          const game = await prisma.game.findUnique({ where: { id: g.gameId } });
          return game
            ? { appId: game.appId, name: game.name, picks: g._count.id }
            : null;
        })
      )
    ).filter(Boolean);

    return { pickers, games };
  });
};

export default leaderboardRoutes;
