import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { limitSchema } from "@/lib/validation";

export async function GET(
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

  const limitParam = request.nextUrl.searchParams.get("limit");
  const validation = limitSchema.safeParse(limitParam);
  const safeLimit = validation.success ? validation.data : 0;

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
