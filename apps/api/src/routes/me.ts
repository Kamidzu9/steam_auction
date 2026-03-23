import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@steam-auction/db";

const meRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
        select: {
          id: true,
          steamId: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      return reply
        .header("Cache-Control", "no-store")
        .send({ user });
    }
  );
};

export default meRoutes;
