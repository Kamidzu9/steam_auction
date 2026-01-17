import { NextRequest, NextResponse } from "next/server";
import { resolveSteamId, fetchSteam } from "@/lib/steam-api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const steamId = searchParams.get("steamId");
  const apiKey = process.env.STEAM_API_KEY;

  if (!steamId || !apiKey) {
    return NextResponse.json(
      { error: "Missing steamId or STEAM_API_KEY" },
      { status: 400 }
    );
  }

  const resolved = await resolveSteamId(steamId, apiKey);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const url = new URL(
    "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/"
  );
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamid", resolved.steamId);
  url.searchParams.set("include_appinfo", "1");
  url.searchParams.set("include_played_free_games", "1");

  const response = await fetchSteam<{
    response?: { games?: { appid: number; name: string }[] };
  }>(url.toString());
  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch owned games", details: response.text },
      { status: 502 }
    );
  }

  return NextResponse.json({ games: response.data.response?.games ?? [] });
}
