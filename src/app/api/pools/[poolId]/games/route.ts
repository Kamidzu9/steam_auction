import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { forbiddenWords } from "@/config/forbiddenWords";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const forbiddenRegex =
  forbiddenWords.length > 0
    ? new RegExp(`\\b(${forbiddenWords.map(escapeRegExp).join("|")})\\b`, "i")
    : null;

export async function POST(
  request: NextRequest,
  { params }: { params: { poolId: string } }
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("steam_user_id")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId } = params;
  const pool = await prisma.auctionPool.findFirst({
    where: { id: poolId, ownerId: userId },
  });
  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }
  const body = (await request.json()) as {
    appId: number;
    name: string;
    storeUrl?: string;
    tags?: string[];
    weight?: number;
  };

  if (!body.appId || !body.name) {
    return NextResponse.json({ error: "Missing game info" }, { status: 400 });
  }

  if (forbiddenRegex && forbiddenRegex.test(body.name)) {
    const match = body.name.match(forbiddenRegex)?.[0] ?? null;
    return NextResponse.json(
      { skipped: true, reason: "forbidden_word", word: match, name: body.name },
      { status: 200 }
    );
  }

  const game = await prisma.game.upsert({
    where: { appId: body.appId },
    update: {},
    create: {
      appId: body.appId,
      name: body.name,
      storeUrl: body.storeUrl ?? `https://store.steampowered.com/app/${body.appId}`,
      tags: body.tags?.join(","),
    },
  });

  const poolGame = await prisma.poolGame.upsert({
    where: { poolId_gameId: { poolId, gameId: game.id } },
    update: {
      weight: body.weight ?? 1,
      tags: body.tags?.join(","),
    },
    create: {
      poolId,
      gameId: game.id,
      weight: body.weight ?? 1,
      tags: body.tags?.join(","),
    },
  });

  return NextResponse.json({ poolGame });
}
