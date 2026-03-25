import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@steam-auction/db";
import { addFriendSchema, bulkAddFriendsSchema } from "@steam-auction/shared";
import { z } from "zod";

const deleteFriendSchema = z.object({
  id: z.string().min(1).optional(),
  steamId: z.string().min(1).optional(),
}).refine((data) => data.id || data.steamId, {
  message: "Either id or steamId is required",
});

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
      const validation = deleteFriendSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({ error: validation.error.issues[0]?.message ?? "Invalid input" });
      }

      const { id, steamId } = validation.data;
      try {
        if (id) {
          await prisma.friend.deleteMany({ where: { id, userId: request.userId } });
        } else if (steamId) {
          await prisma.friend.deleteMany({ where: { steamId, userId: request.userId } });
        }
        return reply.send({ ok: true });
      } catch {
        return reply.status(500).send({ error: "Failed to delete friend" });
      }
    }
  );
};

export default friendsRoutes;
