import { NextRequest, NextResponse } from "next/server";
import { resolveSteamId, fetchSteam, getPlayerSummaries } from "@/lib/steam-api";

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
    "https://api.steampowered.com/ISteamUser/GetFriendList/v0001/"
  );
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamid", resolved.steamId);
  url.searchParams.set("relationship", "friend");

  const response = await fetchSteam<{
    friendslist?: { friends?: { steamid: string }[] };
  }>(url.toString());

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch friends list", details: response.text },
      { status: 502 }
    );
  }

  const friends = response.data.friendslist?.friends ?? [];
  if (friends.length === 0) {
    return NextResponse.json({ friends: [] });
  }

  const summaries = await getPlayerSummaries(
    friends.map((friend) => friend.steamid),
    apiKey
  );

  if (!summaries.ok) {
    return NextResponse.json({ friends });
  }

  return NextResponse.json({ friends, profiles: summaries.data.response.players });
}
