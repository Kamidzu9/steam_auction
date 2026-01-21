import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateRefreshToken, rotateRefreshToken } from "@/lib/session";

export async function POST() {
  const cookieStore = cookies();
  const refresh = cookieStore.get("refresh")?.value;
  const validated = await validateRefreshToken(refresh ?? undefined);

  if (!validated) {
    const res = NextResponse.json({ user: null }, { status: 401 });
    res.cookies.set("sid", "", { httpOnly: true, path: "/", expires: new Date(0) });
    res.cookies.set("refresh", "", { httpOnly: true, path: "/api/auth", expires: new Date(0) });
    return res;
  }

  const { session, user } = validated;
  const { refreshToken, expiresAt } = await rotateRefreshToken(session.id);

  const res = NextResponse.json({ user });
  res.cookies.set("sid", session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(Date.now() + 60 * 60 * 1000),
  });
  res.cookies.set("refresh", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    expires: expiresAt,
  });

  return res;
}
