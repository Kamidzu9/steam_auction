import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(
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

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 0;
  const safeLimit = Number.isFinite(limit) ? Math.min(50, Math.max(0, Math.floor(limit))) : 0;
  if (safeLimit === 0) {
    return NextResponse.json({ appIds: [] });
  }

  const pool = await prisma.auctionPool.findFirst({
    where: { id: poolId, ownerId: userId },
  });
  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  const picks = await prisma.pickHistory.findMany({
    where: { poolId },
    orderBy: { pickedAt: "desc" },
    take: safeLimit,
    include: { game: true },
  });

  const appIds = picks
    .map((pick) => pick.game?.appId)
    .filter((id): id is number => typeof id === "number");

  return NextResponse.json({ appIds });
}
