import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@steam-auction/db";
import { addFriendSchema, bulkAddFriendsSchema } from "@steam-auction/shared";

const friendsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const friends = await prisma.friend.findMany({
        where: { userId: request.userId },
        orderBy: { createdAt: "desc" },
      });
      return { friends };
    }
  );

  fastify.post(
    "/",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const validation = addFriendSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({ error: "Invalid input" });
      }

      const { steamId, displayName } = validation.data;
      const friend = await prisma.friend.upsert({
        where: { userId_steamId: { userId: request.userId, steamId } },
        update: { displayName },
        create: { userId: request.userId, steamId, displayName },
      });

      return reply.status(201).send({ friend });
    }
  );

  fastify.post(
    "/bulk",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const validation = bulkAddFriendsSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({ error: "Invalid input" });
      }

      const { friends } = validation.data;
      if (friends.length === 0) {
        return reply.send({ ok: true, count: 0 });
      }

      await prisma.$transaction(
        friends.map((f) =>
          prisma.friend.upsert({
            where: { userId_steamId: { userId: request.userId, steamId: f.steamId } },
            update: { displayName: f.displayName },
            create: { userId: request.userId, steamId: f.steamId, displayName: f.displayName },
          })
        )
      );

      return reply.send({ ok: true, count: friends.length });
    }
  );

  fastify.delete(
    "/",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = request.body as { id?: string; steamId?: string } | undefined;
      if (!body?.id && !body?.steamId) {
        return reply.status(400).send({ error: "Missing id or steamId" });
      }

      try {
        if (body.id) {
          await prisma.friend.deleteMany({ where: { id: body.id, userId: request.userId } });
        } else if (body.steamId) {
          await prisma.friend.deleteMany({ where: { steamId: body.steamId, userId: request.userId } });
        }
        return reply.send({ ok: true });
      } catch {
        return reply.status(500).send({ error: "Failed to delete friend" });
      }
    }
  );
};

export default friendsRoutes;
