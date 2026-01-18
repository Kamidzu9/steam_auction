import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("steam_user_id")?.value;

  if (!userId) {
    return NextResponse.json({ friends: [] }, { status: 200 });
  }

  const friends = await prisma.friend.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ friends });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("steam_user_id")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    steamId: string;
    displayName?: string;
  };

  if (!body.steamId) {
    return NextResponse.json({ error: "Missing steamId" }, { status: 400 });
  }

  const friend = await prisma.friend.upsert({
    where: {
      userId_steamId: { userId, steamId: body.steamId },
    },
    update: {
      displayName: body.displayName,
    },
    create: {
      userId,
      steamId: body.steamId,
      displayName: body.displayName,
    },
  });

  return NextResponse.json({ friend });
}

export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("steam_user_id")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string; steamId?: string };

  if (!body?.id && !body?.steamId) {
    return NextResponse.json({ error: "Missing id or steamId" }, { status: 400 });
  }

  try {
    if (body.id) {
      await prisma.friend.deleteMany({ where: { id: body.id, userId } });
    } else if (body.steamId) {
      await prisma.friend.deleteMany({ where: { steamId: body.steamId, userId } });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
