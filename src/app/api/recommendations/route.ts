import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { fetchSteam } from "@/lib/steam-api";

export async function GET() {
  // get user from cookie
  const cookieStore = await cookies();
  const userId = cookieStore.get("steam_user_id")?.value;

  // top picked games overall
  const topPicked = await prisma.pickHistory.groupBy({
    by: ["gameId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 12,
  });

  const topGames = await Promise.all(
    topPicked.map(async (p) => {
      const g = await prisma.game.findUnique({ where: { id: p.gameId } });
      return g ? { appId: g.appId, name: g.name, picks: p._count.id } : null;
    })
  );

  // user's recent plays (if steam id available)
  let recent: Array<{ appId: number; name: string }> = [];
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const apiKey = process.env.STEAM_API_KEY;
    if (user?.steamId && apiKey) {
      try {
        const url = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${apiKey}&steamid=${user.steamId}`;
        const res = await fetchSteam<{ response?: { games?: any[] } }>(url);
        if (res.ok) {
          const gs = res.data.response?.games ?? [];
          recent = gs.slice(0, 8).map((g: any) => ({ appId: g.appid, name: g.name }));
        }
      } catch (e) {
        // ignore
      }
    }
  }

  return NextResponse.json({ topGames: topGames.filter(Boolean), recent });
}
