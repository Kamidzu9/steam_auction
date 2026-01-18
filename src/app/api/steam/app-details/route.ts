import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get("appId");

  if (!appId) {
    return NextResponse.json({ error: "Missing appId" }, { status: 400 });
  }

  const url = `https://store.steampowered.com/api/appdetails?appids=${encodeURIComponent(
    appId
  )}&l=en`;

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: "Store API failed" }, { status: 502 });
    const body = await res.json();
    const entry = body[appId];
    if (!entry || !entry.success) return NextResponse.json({ error: "No data" }, { status: 404 });

    const data = entry.data ?? {};
    const categories = (Array.isArray(data.categories) ? data.categories : [])
      .map((c: { description?: string }) => c.description)
      .filter((value): value is string => Boolean(value));
    const genres = (Array.isArray(data.genres) ? data.genres : [])
      .map((g: { description?: string }) => g.description)
      .filter((value): value is string => Boolean(value));

    return NextResponse.json({ categories, genres, data });
  } catch {
    return NextResponse.json({ error: "Fetch error" }, { status: 500 });
  }
}
