import { cookies } from "next/headers";
import { prisma } from "./prisma";
import crypto from "crypto";

const REFRESH_DAYS = 30;
const REFRESH_EXPIRES_MS = REFRESH_DAYS * 24 * 60 * 60 * 1000;

function generateToken() {
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const refreshToken = generateToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_MS);

  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash,
      expiresAt,
    },
  });

  return { sessionId: session.id, refreshToken, expiresAt };
}

export async function validateSessionById(sessionId?: string) {
  if (!sessionId) return null;
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return null;
  if (session.revoked) return null;
  if (new Date() > session.expiresAt) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;
  return { session, user };
}

export async function validateRefreshToken(refreshToken?: string) {
  if (!refreshToken) return null;
  const hash = hashToken(refreshToken);
  const session = await prisma.session.findFirst({ where: { refreshTokenHash: hash, revoked: false } });
  if (!session) return null;
  if (new Date() > session.expiresAt) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;
  return { session, user };
}

export async function rotateRefreshToken(sessionId: string) {
  const newToken = generateToken();
  const newHash = hashToken(newToken);
  const newExpires = new Date(Date.now() + REFRESH_EXPIRES_MS);
  await prisma.session.update({ where: { id: sessionId }, data: { refreshTokenHash: newHash, expiresAt: newExpires, lastUsedAt: new Date() } });
  return { refreshToken: newToken, expiresAt: newExpires };
}

export async function revokeSession(sessionId: string | undefined) {
  if (!sessionId) return;
  await prisma.session.updateMany({ where: { id: sessionId }, data: { revoked: true } });
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const sid = cookieStore.get("sid")?.value;
    const refresh = cookieStore.get("refresh")?.value;

    // Fast path: valid session id
    const validated = await validateSessionById(sid ?? undefined);
    if (validated) return true;

    // Try refresh flow server-side: rotate token and set cookies
    const refreshValidated = await validateRefreshToken(refresh ?? undefined);
    if (!refreshValidated) return false;

    const { session } = refreshValidated;
    const { refreshToken, expiresAt } = await rotateRefreshToken(session.id);

    // set cookies server-side so response has new tokens
    cookieStore.set("sid", session.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(Date.now() + 60 * 60 * 1000), // sid short (1h)
    });
    cookieStore.set("refresh", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth",
      expires: expiresAt,
    });

    return true;
  } catch (e) {
    return false;
  }
}

export default isAuthenticated;
