import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

type Candidate = {
  id: string;
  name: string;
  appId: number;
  storeUrl: string;
  weight: number;
};

import { pickWeighted } from "@/lib/pickUtils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ poolId: string }> }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("steam_user_id")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    mode?: "pure" | "avoid";
    avoidCount?: number;
  };

  const pool = await prisma.auctionPool.findUnique({
    where: { id: poolId },
    include: {
      games: { include: { game: true } },
    },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  if (pool.games.length === 0) {
    return NextResponse.json(
      { error: "Pool is empty. Add games before picking." },
      { status: 400 }
    );
  }

  let candidates: Candidate[] = pool.games.map(
    (pg: {
      gameId: string;
      weight: number;
      game: { appId: number; name: string; storeUrl: string };
    }) => ({
    id: pg.gameId,
    name: pg.game.name,
    appId: pg.game.appId,
    storeUrl: pg.game.storeUrl,
    weight: pg.weight,
    })
  );

  if (body.mode === "avoid" && (body.avoidCount ?? 0) > 0) {
    const recent = await prisma.pickHistory.findMany({
      where: { poolId },
      orderBy: { pickedAt: "desc" },
      take: body.avoidCount,
    });
    const recentIds = new Set(recent.map((pick: { gameId: string }) => pick.gameId));
    const filtered = candidates.filter((game) => !recentIds.has(game.id));
    if (filtered.length > 0) {
      candidates = filtered;
    }
  }

  const chosen = pickWeighted(candidates);

  await prisma.pickHistory.create({
    data: {
      userId,
      poolId,
      gameId: chosen.id,
    },
  });

  return NextResponse.json({ pick: chosen });
}
