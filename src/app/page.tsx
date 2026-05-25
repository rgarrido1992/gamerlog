import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { GameCover } from "@/components/GameCover";
import { FilterBar } from "@/components/FilterBar";
import { GameStatus, Prisma } from "@prisma/client";

interface PageProps {
  searchParams: {
    status?: string;
    platform?: string;
    releaseYear?: string;
    releaseMonth?: string;
    playedYear?: string;
    playedMonth?: string;
  };
}

const STATUS_LABELS: Record<GameStatus, string> = {
  WISHLIST: "Wishlist",
  PENDING: "Pendiente",
  STARTED: "En curso",
  PLAYED: "Jugado",
  COMPLETED: "Completado",
};

export default async function Home({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  // Build filter WHERE clauses
  const where: Prisma.GameEntryWhereInput = { userId: user.id };

  if (searchParams.status && searchParams.status in STATUS_LABELS) {
    where.status = searchParams.status as GameStatus;
  }
  if (searchParams.platform) {
    where.platform = { slug: searchParams.platform };
  }

  // Release date filter (on the related Game.releaseDate)
  if (searchParams.releaseYear || searchParams.releaseMonth) {
    const ry = searchParams.releaseYear ? parseInt(searchParams.releaseYear) : null;
    const rm = searchParams.releaseMonth ? parseInt(searchParams.releaseMonth) : null;
    where.game = {
      releaseDate: buildDateFilter(ry, rm),
    };
  }

  // Played date filter — on play sessions OR finishedAt fallback
  if (searchParams.playedYear || searchParams.playedMonth) {
    const py = searchParams.playedYear ? parseInt(searchParams.playedYear) : null;
    const pm = searchParams.playedMonth ? parseInt(searchParams.playedMonth) : null;
    where.OR = [
      { sessions: { some: { playedAt: buildDateFilter(py, pm) ?? undefined } } },
      { finishedAt: buildDateFilter(py, pm) ?? undefined },
    ];
  }

  // Parallel queries
  const [entries, statusCounts, allPlatforms, releaseYears, playedYears] =
    await Promise.all([
      prisma.gameEntry.findMany({
        where,
        include: { game: true, platform: true },
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.gameEntry.groupBy({
        by: ["status"],
        where: { userId: user.id },
        _count: true,
      }),
      prisma.platform.findMany({
        where: { entries: { some: { userId: user.id } } },
        orderBy: { name: "asc" },
      }),
      getDistinctYears(user.id, "release"),
      getDistinctYears(user.id, "played"),
    ]);

  const statuses = (Object.keys(STATUS_LABELS) as GameStatus[]).map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
    count: statusCounts.find((c) => c.status === s)?._count ?? 0,
  }));

  return (
    <main className="min-h-screen">
      {/* ─── Hero ─────────────────────────────────────── */}
      <header className="relative border-b border-ink-800 scanlines">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
          <div className="flex items-baseline justify-between flex-wrap gap-4">
            <div>
              <div className="font-mono text-xs tracking-widest2 uppercase text-amber-glow mb-4">
                ▸ Gamelog · Personal archive
              </div>
              <h1 className="font-display font-black text-6xl lg:text-8xl leading-[0.9] text-bone-50">
                What I&apos;ve
                <br />
                <span className="italic text-amber-glow">played</span>.
              </h1>
            </div>
            <div className="font-mono text-xs text-bone-200/60 tracking-wider">
              <div>{entries.length.toString().padStart(3, "0")} entries</div>
              <div>{new Date().toISOString().slice(0, 10)}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Filters ──────────────────────────────────── */}
      <section className="border-b border-ink-800 bg-ink-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
          <FilterBar
            statuses={statuses}
            platforms={allPlatforms.map((p) => ({ slug: p.slug, name: p.name }))}
            releaseYears={releaseYears}
            playedYears={playedYears}
          />
        </div>
      </section>

      {/* ─── Shelf ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        {entries.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className="lift-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <GameCover
                  title={entry.game.manualTitle ?? entry.game.title}
                  coverUrl={entry.game.manualCoverUrl ?? entry.game.coverUrl}
                  platform={entry.platform?.name}
                  status={entry.status}
                  year={
                    entry.game.releaseDate
                      ? entry.game.releaseDate.getFullYear()
                      : null
                  }
                  href={`/game/${entry.id}`}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-ink-800 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 font-mono text-xs text-bone-200/40 tracking-wider flex justify-between">
          <span>gamelog · v0.1</span>
          <span>{user.email}</span>
        </div>
      </footer>
    </main>
  );
}

// ─── Helpers ────────────────────────────────────────────────

function buildDateFilter(year: number | null, month: number | null) {
  if (!year && !month) return null;
  // If only month: across all years
  if (year && month) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    return { gte: start, lt: end };
  }
  if (year) {
    return {
      gte: new Date(Date.UTC(year, 0, 1)),
      lt: new Date(Date.UTC(year + 1, 0, 1)),
    };
  }
  // Month-only filter handled in raw SQL would be cleaner; for now we skip
  return null;
}

async function getDistinctYears(userId: string, kind: "release" | "played") {
  if (kind === "release") {
    const rows = await prisma.$queryRaw<{ year: number }[]>`
      SELECT DISTINCT EXTRACT(YEAR FROM g."releaseDate")::int AS year
      FROM "GameEntry" e
      JOIN "Game" g ON g.id = e."gameId"
      WHERE e."userId" = ${userId}
        AND g."releaseDate" IS NOT NULL
      ORDER BY year DESC;
    `;
    return rows.map((r) => r.year);
  } else {
    const rows = await prisma.$queryRaw<{ year: number }[]>`
      SELECT DISTINCT year FROM (
        SELECT EXTRACT(YEAR FROM ps."playedAt")::int AS year
        FROM "PlaySession" ps
        JOIN "GameEntry" e ON e.id = ps."entryId"
        WHERE e."userId" = ${userId}
        UNION
        SELECT EXTRACT(YEAR FROM e."finishedAt")::int AS year
        FROM "GameEntry" e
        WHERE e."userId" = ${userId} AND e."finishedAt" IS NOT NULL
      ) y
      WHERE year IS NOT NULL
      ORDER BY year DESC;
    `;
    return rows.map((r) => r.year);
  }
}

function EmptyState() {
  return (
    <div className="border border-dashed border-ink-700 py-24 px-8 text-center">
      <div className="font-mono text-xs tracking-widest2 uppercase text-amber-glow mb-4">
        ▸ Shelf empty
      </div>
      <h2 className="font-display text-3xl text-bone-50 mb-3">
        Aún no hay juegos registrados.
      </h2>
      <p className="text-bone-200/70 max-w-md mx-auto">
        Busca un juego en IGDB para añadirlo a tu wishlist, marcarlo como
        empezado, o registrarlo como completado.
      </p>
      <a
        href="/add"
        className="inline-block mt-8 px-6 py-3 bg-amber-glow text-ink-950 font-mono uppercase tracking-widest text-xs hover:bg-amber-burn transition-colors"
      >
        + Añadir juego
      </a>
    </div>
  );
}
