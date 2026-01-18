import { NextResponse } from "next/server";
import { buildSteamOpenIdUrl, getSteamBaseUrl } from "@/lib/steam";

export async function GET() {
  const baseUrl = await getSteamBaseUrl();
  const returnTo = `${baseUrl}/api/auth/steam/callback`;
  const realm = baseUrl;

  const redirectUrl = buildSteamOpenIdUrl(returnTo, realm);
  return NextResponse.redirect(redirectUrl);
}
