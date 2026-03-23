import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";

// Extend FastifyRequest with authenticated user fields.
declare module "fastify" {
  interface FastifyRequest {
    userId: string;
    userSteamId: string;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Convenience decorator used as a preHandler hook on protected routes.
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const payload = request.user as { sub: string; steamId: string };
        request.userId = payload.sub;
        request.userSteamId = payload.steamId;
      } catch {
        await reply.status(401).send({ error: "Unauthorized" });
      }
    }
  );
};

export default fp(authPlugin, { name: "auth" });
