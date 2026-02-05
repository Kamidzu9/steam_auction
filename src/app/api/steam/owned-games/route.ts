import { NextRequest, NextResponse } from "next/server";
import { resolveSteamId, fetchSteam } from "@/lib/steam-api";
import { getCurrentUserId } from "@/lib/session";
import { steamIdSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const steamIdParam = searchParams.get("steamId");
  const apiKey = process.env.STEAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const validation = steamIdSchema.safeParse(steamIdParam);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid steam ID" },
      { status: 400 }
    );
  }

  const steamId = validation.data;

  const resolved = await resolveSteamId(steamId, apiKey);
  if (!resolved.ok) {
    return NextResponse.json({ error: "Invalid Steam ID" }, { status: 400 });
  }

  const url = new URL(
    "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/"
  );
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamid", resolved.steamId);
  url.searchParams.set("include_appinfo", "1");
  url.searchParams.set("include_played_free_games", "1");

  const response = await fetchSteam<{
    response?: { games?: { appid: number; name: string; playtime_forever?: number }[] };
  }>(url.toString());
  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch owned games" },
      { status: 502 }
    );
  }

  // Include playtime_forever when available
  const games = (response.data.response?.games ?? []).map((g: { appid: number; name: string; playtime_forever?: number }) => ({
    appid: g.appid,
    name: g.name,
    playtime_forever: g.playtime_forever ?? 0,
  }));

  return NextResponse.json({ games });
}
