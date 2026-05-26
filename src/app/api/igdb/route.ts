import { NextRequest, NextResponse } from "next/server";
import { searchGames, normalizeIgdbGame } from "@/lib/igdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  try {
    const games = await searchGames(q, 12);
    const results = games.map((g) => normalizeIgdbGame(g));
    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
