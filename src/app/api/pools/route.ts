import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("steam_user_id")?.value;

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
