import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PlatformBadge } from "@/components/PlatformBadge";
import { ScoreRing } from "@/components/ScoreRing";
import { GameTile } from "@/components/GameTile";
import { SessionLogger } from "./SessionLogger";
import { EntryActions } from "./EntryActions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  WISHLIST: "Wishlist",
  PENDING: "Pendiente",
  STARTED: "En curso",
  PLAYED: "Jugado",
  COMPLETED: "Completado",
};

const STATUS_CLASS: Record<string, string> = {
  WISHLIST: "status-wishlist",
  PENDING: "status-pending",
  STARTED: "status-started",
  PLAYED: "status-played",
  COMPLETED: "status-completed",
};

const COMPLETION_LABEL: Record<string, string> = {
  MAIN: "Historia principal",
  HUNDRED: "100% / Platino",
  ABANDONED: "Abandonado",
};

export default async function GamePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();

  const entry = await prisma.gameEntry.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      game: {
        include: {
          platforms: { include: { platform: true } },
        },
      },
      platform: true,
      sessions: { orderBy: { playedAt: "desc" } },
    },
  });
  if (!entry) notFound();

  const platforms = await prisma.platform.findMany({
    orderBy: [{ family: "asc" }, { name: "asc" }],
  });

  // Community average rating (avg of all GameEntry.rating for this game)
  const ratingsAgg = await prisma.gameEntry.aggregate({
    where: { gameId: entry.gameId, rating: { not: null } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  // Similar games — find which ones are in our DB
  const similarGames =
    entry.game.similarIgdbIds.length > 0
      ? await prisma.game.findMany({
          where: { igdbId: { in: entry.game.similarIgdbIds } },
          include: { entries: { where: { userId: user.id }, take: 1 } },
          take: 6,
        })
      : [];

  // User's lists (for the "add to list" picker)
  const lists = await prisma.gameList.findMany({
    where: { userId: user.id },
    include: { items: { where: { gameId: entry.gameId }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });

  // Session stats
  const totalMinutes = entry.sessions.reduce(
    (acc, s) => acc + (s.durationMinutes ?? 0),
    0
  );
  const unknownSessions = entry.sessions.filter((s) => s.durationMinutes == null).length;

  const title = entry.game.manualTitle ?? entry.game.title;
  const cover = entry.game.manualCoverUrl ?? entry.game.coverUrl;
  const artwork = entry.game.artworkUrl ?? entry.game.screenshots[0] ?? cover;
  const releaseYear = entry.game.releaseDate?.getFullYear();

  return (
    <main className="pb-20">
      {/* ─── HERO Netflix-style ─── */}
      <section className="relative -mt-16">
        <div className="relative aspect-[21/9] md:aspect-[21/8] lg:aspect-[21/7] w-full overflow-hidden">
          {artwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artwork}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-bg-elevated to-bg" />
          )}
          {/* Heavy gradient overlays for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/40 to-transparent" />

          {/* Hero content */}
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-[1600px] w-full mx-auto px-6 lg:px-10 pb-10 lg:pb-14 pt-32">
              <div className="flex items-end gap-6 flex-wrap">
                {/* Cover */}
                {cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt={title}
                    className="w-32 lg:w-48 rounded-xl shadow-2xl hidden md:block"
                    style={{ aspectRatio: "3/4", objectFit: "cover" }}
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`status-chip ${STATUS_CLASS[entry.status]}`}>
                      {STATUS_LABEL[entry.status]}
                    </span>
                    {entry.completion && (
                      <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
                        {COMPLETION_LABEL[entry.completion]}
                      </span>
                    )}
                  </div>

                  <h1 className="font-display font-bold text-4xl lg:text-6xl tracking-tight leading-[1] mb-3 text-balance">
                    {title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs uppercase tracking-widest text-text-muted">
                    {releaseYear && <span>{releaseYear}</span>}
                    {entry.game.developers.length > 0 && (
                      <span>{entry.game.developers.slice(0, 2).join(", ")}</span>
                    )}
                    {entry.platform && (
                      <span className="flex items-center gap-2">
                        <PlatformBadge {...entry.platform} size="md" />
                        {entry.platform.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Scores cluster */}
                <div className="flex gap-5 items-center">
                  {entry.game.openCriticScore != null && (
                    <a
                      href={entry.game.openCriticUrl ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:scale-105 transition-transform"
                    >
                      <ScoreRing label="OpenCritic" score={entry.game.openCriticScore} />
                    </a>
                  )}
                  {entry.game.igdbRating != null && (
                    <ScoreRing label="IGDB" score={Math.round(entry.game.igdbRating)} />
                  )}
                  {ratingsAgg._count.rating > 0 && (
                    <ScoreRing
                      label={`Comunidad (${ratingsAgg._count.rating})`}
                      score={ratingsAgg._avg.rating != null ? Math.round(ratingsAgg._avg.rating) : null}
                    />
                  )}
                  {entry.rating != null && (
                    <ScoreRing label="Tu nota" score={entry.rating} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BODY ─── */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-12 grid lg:grid-cols-[1fr_360px] gap-12">
        {/* Main col */}
        <div className="space-y-12 min-w-0">
          {/* Actions row */}
          <EntryActions
            entryId={entry.id}
            gameId={entry.gameId}
            initial={{
              status: entry.status,
              completion: entry.completion,
              platformSlug: entry.platform?.slug ?? null,
              startedAt: entry.startedAt?.toISOString() ?? null,
              finishedAt: entry.finishedAt?.toISOString() ?? null,
              rating: entry.rating,
              notes: entry.notes,
            }}
            availablePlatforms={entry.game.platforms.map((gp) => ({
              slug: gp.platform.slug,
              name: gp.platform.name,
              badgeText: gp.platform.badgeText,
              badgeBg: gp.platform.badgeBg,
              badgeFg: gp.platform.badgeFg,
            }))}
            allPlatforms={platforms.map((p) => ({
              slug: p.slug,
              name: p.name,
              badgeText: p.badgeText,
              badgeBg: p.badgeBg,
              badgeFg: p.badgeFg,
            }))}
            lists={lists.map((l) => ({
              id: l.id,
              name: l.name,
              alreadyContains: l.items.length > 0,
            }))}
          />

          {/* Summary */}
          {entry.game.summary && (
            <section>
              <div className="section-label mb-3"><span>Sinopsis</span></div>
              <p className="text-text-DEFAULT leading-relaxed text-base max-w-3xl">
                {entry.game.summary}
              </p>
            </section>
          )}

          {/* Trailer */}
          {entry.game.videoYoutubeId && (
            <section>
              <div className="section-label mb-3"><span>Trailer</span></div>
              <div className="aspect-video rounded-xl overflow-hidden bg-bg-card max-w-4xl">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${entry.game.videoYoutubeId}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {/* Screenshots */}
          {entry.game.screenshots.length > 0 && (
            <section>
              <div className="section-label mb-3"><span>Imágenes</span></div>
              <div className="scroll-row">
                {entry.game.screenshots.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-96 aspect-video object-cover rounded-lg"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Notes from user */}
          {entry.notes && (
            <section className="p-5 rounded-xl bg-bg-card border-l-4 border-accent">
              <div className="section-label mb-2"><span>Mis notas</span></div>
              <p className="text-text-DEFAULT">{entry.notes}</p>
            </section>
          )}

          {/* Sessions */}
          <section>
            <div className="section-label mb-4"><span>Registro de sesiones</span></div>
            <SessionLogger entryId={entry.id} />

            <ul className="mt-6 space-y-2">
              {entry.sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex justify-between items-center p-3 rounded-lg bg-bg-card border border-white/5"
                >
                  <div>
                    <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
                      {s.playedAt.toISOString().slice(0, 10)}
                    </span>
                    {s.notes && <p className="text-sm text-text-DEFAULT mt-1">{s.notes}</p>}
                  </div>
                  <div className="font-display font-bold text-lg text-accent">
                    {s.durationMinutes != null
                      ? `${Math.floor(s.durationMinutes / 60)}h ${s.durationMinutes % 60}m`
                      : <span className="italic text-text-dim text-sm">no recuerdo</span>}
                  </div>
                </li>
              ))}
              {entry.sessions.length === 0 && (
                <li className="text-text-muted italic text-sm">Sin sesiones registradas.</li>
              )}
            </ul>
            {unknownSessions > 0 && (
              <p className="font-mono text-xs text-text-dim mt-2">
                ({unknownSessions} sin duración registrada)
              </p>
            )}
          </section>

          {/* Similar games */}
          {similarGames.length > 0 && (
            <section>
              <div className="section-label mb-3"><span>Si te gustó, prueba…</span></div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {similarGames.map((g) => {
                  const userEntry = g.entries[0];
                  return (
                    <GameTile
                      key={g.id}
                      href={userEntry ? `/game/${userEntry.id}` : `/add?suggest=${g.slug}`}
                      title={g.title}
                      coverUrl={g.coverUrl}
                      year={g.releaseDate?.getFullYear() ?? null}
                      status={userEntry?.status}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Available platforms */}
          {entry.game.platforms.length > 0 && (
            <Info label="Disponible en">
              <div className="flex flex-wrap gap-2">
                {entry.game.platforms.map((gp) => (
                  <span
                    key={gp.platform.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-bg-elevated border border-white/5 text-xs"
                  >
                    <PlatformBadge {...gp.platform} />
                    <span className="text-text-DEFAULT">{gp.platform.name}</span>
                  </span>
                ))}
              </div>
            </Info>
          )}

          <Info label="Desarrolla">{entry.game.developers.join(", ") || "—"}</Info>
          <Info label="Publica">{entry.game.publishers.join(", ") || "—"}</Info>
          <Info label="Lanzamiento">
            {entry.game.releaseDate
              ? entry.game.releaseDate.toISOString().slice(0, 10)
              : "—"}
          </Info>
          {entry.game.genres.length > 0 && (
            <Info label="Géneros">
              <div className="flex flex-wrap gap-1.5">
                {entry.game.genres.map((g) => (
                  <span key={g} className="text-xs px-2 py-1 rounded bg-bg-elevated text-text-muted">
                    {g}
                  </span>
                ))}
              </div>
            </Info>
          )}
          {entry.game.gameModes.length > 0 && (
            <Info label="Modos">
              <div className="flex flex-wrap gap-1.5">
                {entry.game.gameModes.map((m) => (
                  <span key={m} className="text-xs px-2 py-1 rounded bg-bg-elevated text-text-muted">
                    {m}
                  </span>
                ))}
              </div>
            </Info>
          )}

          <Info label="Tu tiempo">
            <div className="font-display font-bold text-2xl text-accent">
              {totalMinutes > 0
                ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
                : "—"}
            </div>
            <div className="text-xs text-text-muted">{entry.sessions.length} sesiones</div>
          </Info>

          {(entry.startedAt || entry.finishedAt) && (
            <Info label="Tu cronología">
              {entry.startedAt && (
                <div className="text-sm">
                  <span className="text-text-muted">Empezado: </span>
                  {entry.startedAt.toISOString().slice(0, 10)}
                </div>
              )}
              {entry.finishedAt && (
                <div className="text-sm mt-1">
                  <span className="text-text-muted">Terminado: </span>
                  {entry.finishedAt.toISOString().slice(0, 10)}
                </div>
              )}
            </Info>
          )}
        </aside>
      </div>
    </main>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-bg-card/50 border border-white/5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2">
        {label}
      </div>
      <div className="text-text-DEFAULT text-sm">{children}</div>
    </div>
  );
}
