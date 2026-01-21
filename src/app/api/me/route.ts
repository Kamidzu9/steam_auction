import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { validateSessionById, validateRefreshToken, rotateRefreshToken } from "@/lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const sid = cookieStore.get("sid")?.value;
  const refresh = cookieStore.get("refresh")?.value;

  // Try sid first
  const validated = await validateSessionById(sid ?? undefined);
  if (validated) {
    return NextResponse.json({ user: validated.user });
  }

  // Attempt silent refresh
  const refreshValidated = await validateRefreshToken(refresh ?? undefined);
  if (!refreshValidated) {
    const response = NextResponse.json({ user: null });
    response.cookies.set("sid", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(0) });
    response.cookies.set("refresh", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth", expires: new Date(0) });
    return response;
  }

  const { session, user } = refreshValidated;
  const { refreshToken, expiresAt } = await rotateRefreshToken(session.id);

  const response = NextResponse.json({ user });
  response.cookies.set("sid", session.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(Date.now() + 60 * 60 * 1000) });
  response.cookies.set("refresh", refreshToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth", expires: expiresAt });
  return response;
}
