import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    friends: { steamId: string; displayName?: string }[];
  };

  if (!body.friends?.length) {
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction(
    body.friends.map((friend) =>
      prisma.friend.upsert({
        where: { userId_steamId: { userId, steamId: friend.steamId } },
        update: { displayName: friend.displayName },
        create: {
          userId,
          steamId: friend.steamId,
          displayName: friend.displayName,
        },
      })
    )
  );

  return NextResponse.json({ ok: true, count: body.friends.length });
}
