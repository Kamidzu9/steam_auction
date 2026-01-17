import { NextResponse } from "next/server";
import { buildSteamOpenIdUrl, getBaseUrl } from "@/lib/steam";

export async function GET() {
  const baseUrl = await getBaseUrl();
  const returnTo = `${baseUrl}/api/auth/steam/callback`;
  const realm = process.env.STEAM_REALM ?? baseUrl;

  const redirectUrl = buildSteamOpenIdUrl(returnTo, realm);
  return NextResponse.redirect(redirectUrl);
}
