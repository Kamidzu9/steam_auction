import { NextRequest, NextResponse } from "next/server";
import { resolveSteamId, fetchSteam, getPlayerSummaries } from "@/lib/steam-api";
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
      { error: "Failed to fetch friends list" },
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
