import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeSession } from "@/lib/session";

function clearCookies(response: NextResponse) {
  response.cookies.set("sid", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(0) });
  response.cookies.set("refresh", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth", expires: new Date(0) });
}

export async function POST() {
  const cookieStore = cookies();
  const sid = cookieStore.get("sid")?.value;
  if (sid) await revokeSession(sid);

  const response = NextResponse.json({ ok: true });
  clearCookies(response);
  return response;
}

export async function GET(request: Request) {
  const cookieStore = cookies();
  const sid = cookieStore.get("sid")?.value;
  if (sid) await revokeSession(sid);

  const response = NextResponse.redirect(new URL("/", request.url));
  clearCookies(response);
  return response;
}
