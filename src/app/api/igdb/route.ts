import { NextRequest, NextResponse } from "next/server";
import { searchGames, igdbCoverUrl } from "@/lib/igdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  try {
    const games = await searchGames(q, 12);
    const results = games.map((g) => ({
      igdbId: g.id,
      title: g.name,
      slug: g.slug,
      summary: g.summary ?? null,
      releaseDate: g.first_release_date
        ? new Date(g.first_release_date * 1000).toISOString()
        : null,
      coverUrl: g.cover ? igdbCoverUrl(g.cover.image_id, "cover_big") : null,
      genres: g.genres?.map((x) => x.name) ?? [],
      developers:
        g.involved_companies?.filter((c) => c.developer).map((c) => c.company.name) ?? [],
      publishers:
        g.involved_companies?.filter((c) => c.publisher).map((c) => c.company.name) ?? [],
    }));
    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
