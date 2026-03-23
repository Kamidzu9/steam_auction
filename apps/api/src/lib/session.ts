import crypto from "node:crypto";
import { prisma } from "@steam-auction/db";
import { config } from "../config.js";

const REFRESH_EXPIRES_MS = config.REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000;

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const refreshToken = generateToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_MS);

  const session = await prisma.session.create({
    data: { userId, refreshTokenHash, expiresAt },
  });

  return { sessionId: session.id, refreshToken, expiresAt };
}

export async function validateRefreshToken(token: string | undefined) {
  if (!token) return null;

  const hash = hashToken(token);
  const session = await prisma.session.findFirst({
    where: { refreshTokenHash: hash, revoked: false },
  });

  if (!session) return null;
  if (new Date() > session.expiresAt) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;

  return { session, user };
}

export async function rotateRefreshToken(sessionId: string) {
  const newToken = generateToken();
  const newHash = hashToken(newToken);
  const newExpiresAt = new Date(Date.now() + REFRESH_EXPIRES_MS);

  await prisma.session.update({
    where: { id: sessionId },
    data: {
      refreshTokenHash: newHash,
      expiresAt: newExpiresAt,
      lastUsedAt: new Date(),
    },
  });

  return { refreshToken: newToken, expiresAt: newExpiresAt };
}

export async function revokeSession(sessionId: string) {
  await prisma.session.updateMany({
    where: { id: sessionId },
    data: { revoked: true },
  });
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId },
    data: { revoked: true },
  });
}
