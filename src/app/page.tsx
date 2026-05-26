import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { GameTile } from "@/components/GameTile";
import { FilterBar } from "@/components/FilterBar";
import { GameStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

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

  const where: Prisma.GameEntryWhereInput = { userId: user.id };

  if (searchParams.status && searchParams.status in STATUS_LABELS) {
    where.status = searchParams.status as GameStatus;
  }
  if (searchParams.platform) {
    where.platform = { slug: searchParams.platform };
  }
  if (searchParams.releaseYear || searchParams.releaseMonth) {
    const ry = searchParams.releaseYear ? parseInt(searchParams.releaseYear) : null;
    const rm = searchParams.releaseMonth ? parseInt(searchParams.releaseMonth) : null;
    where.game = { releaseDate: buildDateFilter(ry, rm) };
  }
  if (searchParams.playedYear || searchParams.playedMonth) {
    const py = searchParams.playedYear ? parseInt(searchParams.playedYear) : null;
    const pm = searchParams.playedMonth ? parseInt(searchParams.playedMonth) : null;
    where.OR = [
      { sessions: { some: { playedAt: buildDateFilter(py, pm) ?? undefined } } },
      { finishedAt: buildDateFilter(py, pm) ?? undefined },
    ];
  }

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
    <main className="max-w-[1600px] mx-auto px-6 lg:px-10 py-10">
      {/* Hero */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-accent mb-2">
            ▸ Tu archivo
          </div>
          <h1 className="font-display font-bold text-5xl lg:text-6xl tracking-tight">
            Biblioteca
          </h1>
        </div>
        <div className="flex gap-8 font-mono text-xs text-text-muted">
          <div>
            <div className="text-2xl font-display font-bold text-text-DEFAULT">
              {entries.length.toString().padStart(2, "0")}
            </div>
            <div className="uppercase tracking-widest mt-1">Entradas</div>
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-success">
              {statusCounts.find((c) => c.status === "COMPLETED")?._count ?? 0}
            </div>
            <div className="uppercase tracking-widest mt-1">Completados</div>
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-accent">
              {statusCounts.find((c) => c.status === "STARTED")?._count ?? 0}
            </div>
            <div className="uppercase tracking-widest mt-1">En curso</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <section className="mb-10 p-5 rounded-2xl bg-bg-elevated/40 border border-white/5">
        <FilterBar
          statuses={statuses}
          platforms={allPlatforms.map((p) => ({ slug: p.slug, name: p.name }))}
          releaseYears={releaseYears}
          playedYears={playedYears}
        />
      </section>

      {/* Grid */}
      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {entries.map((entry, i) => (
            <div key={entry.id} className="fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              <GameTile
                href={`/game/${entry.id}`}
                title={entry.game.manualTitle ?? entry.game.title}
                coverUrl={entry.game.manualCoverUrl ?? entry.game.coverUrl}
                status={entry.status}
                year={entry.game.releaseDate?.getFullYear() ?? null}
                platform={
                  entry.platform
                    ? {
                        badgeText: entry.platform.badgeText,
                        badgeBg: entry.platform.badgeBg,
                        badgeFg: entry.platform.badgeFg,
                      }
                    : null
                }
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function buildDateFilter(year: number | null, month: number | null) {
  if (!year && !month) return null;
  if (year && month) {
    return {
      gte: new Date(Date.UTC(year, month - 1, 1)),
      lt: new Date(Date.UTC(year, month, 1)),
    };
  }
  if (year) {
    return {
      gte: new Date(Date.UTC(year, 0, 1)),
      lt: new Date(Date.UTC(year + 1, 0, 1)),
    };
  }
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
    <div className="text-center py-24 px-8 rounded-2xl border border-dashed border-white/10">
      <div className="text-6xl mb-6">🎮</div>
      <h2 className="font-display font-bold text-3xl mb-3">
        Tu archivo está vacío
      </h2>
      <p className="text-text-muted max-w-md mx-auto mb-8">
        Empieza por añadir tu primer juego. Busca en IGDB, elige plataforma y estado,
        y empezarás a construir tu memoria de jugador.
      </p>
      <a href="/add" className="btn btn-primary">+ Añadir mi primer juego</a>
    </div>
  );
}
