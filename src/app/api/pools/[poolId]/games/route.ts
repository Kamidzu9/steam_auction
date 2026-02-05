import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbiddenWords } from "@/config/forbiddenWords";
import { getCurrentUserId } from "@/lib/session";
import { addGameSchema } from "@/lib/validation";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const forbiddenRegex =
  forbiddenWords.length > 0
    ? new RegExp(`\\b(${forbiddenWords.map(escapeRegExp).join("|")})\\b`, "i")
    : null;

export async function POST(
  request: NextRequest,
  { params }: { params: { poolId: string } | Promise<{ poolId: string }> }
) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poolId } = await Promise.resolve(params);
  if (!poolId) {
    return NextResponse.json({ error: "Invalid pool ID" }, { status: 400 });
  }

  const pool = await prisma.auctionPool.findFirst({
    where: { id: poolId, ownerId: userId },
  });
  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const validation = addGameSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validation.error.issues },
      { status: 400 }
    );
  }

  const { appId, name, storeUrl, tags, weight } = validation.data;

  if (forbiddenRegex && forbiddenRegex.test(name)) {
    const match = name.match(forbiddenRegex)?.[0] ?? null;
    return NextResponse.json(
      { skipped: true, reason: "forbidden_word", word: match, name },
      { status: 200 }
    );
  }

  const game = await prisma.game.upsert({
    where: { appId },
    update: {},
    create: {
      appId,
      name,
      storeUrl: storeUrl ?? `https://store.steampowered.com/app/${appId}`,
      tags: tags?.join(","),
    },
  });

  const poolGame = await prisma.poolGame.upsert({
    where: { poolId_gameId: { poolId, gameId: game.id } },
    update: {
      weight: weight ?? 1,
      tags: tags?.join(","),
    },
    create: {
      poolId,
      gameId: game.id,
      weight: weight ?? 1,
      tags: tags?.join(","),
    },
  });

  return NextResponse.json({ poolGame });
}
