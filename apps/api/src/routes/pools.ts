import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@steam-auction/db";
import {
  createPoolSchema,
  addGameSchema,
  pickGameSchema,
  limitSchema,
  forbiddenRegex,
  pickWeighted,
} from "@steam-auction/shared";

type Candidate = {
  id: string;
  name: string;
  appId: number;
  storeUrl: string;
  weight: number;
};

const poolsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /pools — list pools for the current user
  fastify.get(
    "/",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const pools = await prisma.auctionPool.findMany({
        where: { ownerId: request.userId },
        include: { friend: true, games: true },
        orderBy: { createdAt: "desc" },
      });
      return { pools };
    }
  );

  // POST /pools — create a new pool
  fastify.post(
    "/",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const validation = createPoolSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({ error: "Invalid input" });
      }

      const { friendId, name } = validation.data;
      const pool = await prisma.auctionPool.create({
        data: {
          ownerId: request.userId,
          friendId,
          name: name ?? "Auction Pool",
        },
      });

      return reply.status(201).send({ pool });
    }
  );

  // POST /pools/:poolId/games — add a game to a pool
  fastify.post(
    "/:poolId/games",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { poolId } = request.params as { poolId: string };

      const pool = await prisma.auctionPool.findFirst({
        where: { id: poolId, ownerId: request.userId },
      });
      if (!pool) {
        return reply.status(404).send({ error: "Pool not found" });
      }

      const validation = addGameSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({ error: "Invalid input" });
      }

      const { appId, name, storeUrl, tags, weight } = validation.data;

      if (forbiddenRegex?.test(name)) {
        const match = name.match(forbiddenRegex)?.[0] ?? null;
        return reply.send({ skipped: true, reason: "forbidden_word", word: match, name });
      }

      const game = await prisma.game.upsert({
        where: { appId },
        update: {},
        create: {
          appId,
          name,
          storeUrl: storeUrl ?? `https://store.steampowered.com/app/${appId}`,
          tags: tags?.join(","),
        },
      });

      const poolGame = await prisma.poolGame.upsert({
        where: { poolId_gameId: { poolId, gameId: game.id } },
        update: { weight: weight ?? 1, tags: tags?.join(",") },
        create: { poolId, gameId: game.id, weight: weight ?? 1, tags: tags?.join(",") },
      });

      return reply.send({ poolGame });
    }
  );

  // POST /pools/:poolId/pick — pick a random game from a pool
  fastify.post(
    "/:poolId/pick",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { poolId } = request.params as { poolId: string };

      const validation = pickGameSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({ error: "Invalid input" });
      }

      const body = validation.data;

      const pool = await prisma.auctionPool.findFirst({
        where: { id: poolId, ownerId: request.userId },
        include: { games: { include: { game: true } } },
      });

      if (!pool) {
        return reply.status(404).send({ error: "Pool not found" });
      }

      if (pool.games.length === 0) {
        return reply.status(400).send({ error: "Pool is empty. Add games before picking." });
      }

      let candidates: Candidate[] = pool.games.map((pg: { gameId: string; game: { name: string; appId: number; storeUrl: string }; weight: number }) => ({
        id: pg.gameId,
        name: pg.game.name,
        appId: pg.game.appId,
        storeUrl: pg.game.storeUrl,
        weight: pg.weight,
      }));

      if (Array.isArray(body.appIds) && body.appIds.length > 0) {
        const allowed = new Set(body.appIds.map(Number).filter(Number.isFinite));
        if (allowed.size > 0) {
          const filtered = candidates.filter((g) => allowed.has(g.appId));
          if (filtered.length > 0) candidates = filtered;
        }
      }

      if (body.mode === "avoid" && (body.avoidCount ?? 0) > 0) {
        const recent = await prisma.pickHistory.findMany({
          where: { poolId },
          orderBy: { pickedAt: "desc" },
          take: body.avoidCount,
        });
        const recentIds = new Set(recent.map((p: { gameId: string }) => p.gameId));
        const filtered = candidates.filter((g) => !recentIds.has(g.id));
        if (filtered.length > 0) candidates = filtered;
      }

      const chosen = pickWeighted(candidates);

      await prisma.pickHistory.create({
        data: {
          userId: request.userId,
          poolId,
          gameId: chosen.id,
          mode: body.mode ?? "pure",
          avoidCount: body.mode === "avoid" ? Math.max(0, body.avoidCount ?? 0) : null,
          candidateAppIds: body.appIds?.length ? body.appIds : undefined,
        },
      });

      return reply.send({ pick: chosen });
    }
  );

  // GET /pools/:poolId/recent-picks
  fastify.get(
    "/:poolId/recent-picks",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { poolId } = request.params as { poolId: string };
      const limitParam = (request.query as Record<string, string>)["limit"];
      const validation = limitSchema.safeParse(limitParam);
      const safeLimit = validation.success ? validation.data : 0;

      if (safeLimit === 0) {
        return reply.send({ appIds: [] });
      }

      const pool = await prisma.auctionPool.findFirst({
        where: { id: poolId, ownerId: request.userId },
      });
      if (!pool) {
        return reply.status(404).send({ error: "Pool not found" });
      }

      const picks = await prisma.pickHistory.findMany({
        where: { poolId },
        orderBy: { pickedAt: "desc" },
        take: safeLimit,
        include: { game: true },
      });

      const appIds = picks
        .map((p: { game?: { appId?: number } | null }) => p.game?.appId)
        .filter((id: unknown): id is number => typeof id === "number");

      return reply.send({ appIds });
    }
  );
};

export default poolsRoutes;
