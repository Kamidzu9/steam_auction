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
  { params }: { params: { poolId: string } | Promise<{ poolId: string }> }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("steam_user_id")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId } = await Promise.resolve(params);
  if (!poolId) {
    return NextResponse.json({ error: "Missing poolId" }, { status: 400 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    mode?: "pure" | "avoid";
    avoidCount?: number;
    appIds?: number[];
  };

  const pool = await prisma.auctionPool.findFirst({
    where: { id: poolId, ownerId: userId },
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

  if (Array.isArray(body.appIds) && body.appIds.length > 0) {
    const allowed = new Set(
      body.appIds
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
    );
    if (allowed.size > 0) {
      const filtered = candidates.filter((game) => allowed.has(game.appId));
      if (filtered.length > 0) {
        candidates = filtered;
      }
    }
  }

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
