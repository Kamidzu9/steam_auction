import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { friendId: string; name?: string };

  if (!body.friendId) {
    return NextResponse.json({ error: "Missing friendId" }, { status: 400 });
  }

  const pool = await prisma.auctionPool.create({
    data: {
      ownerId: userId,
      friendId: body.friendId,
      name: body.name ?? "Auction Pool",
    },
  });

  return NextResponse.json({ pool });
}

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ pools: [] }, { status: 200 });
  }

  const pools = await prisma.auctionPool.findMany({
    where: { ownerId: userId },
    include: {
      friend: true,
      games: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ pools });
}
