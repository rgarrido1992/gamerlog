import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { SessionLogger } from "./SessionLogger";

export const dynamic = "force-dynamic";

export default async function GamePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const entry = await prisma.gameEntry.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      game: true,
      platform: true,
      sessions: { orderBy: { playedAt: "desc" } },
    },
  });

  if (!entry) notFound();

  const totalMinutes = entry.sessions.reduce(
    (acc, s) => acc + (s.durationMinutes ?? 0),
    0
  );
  const knownSessions = entry.sessions.filter((s) => s.durationMinutes != null).length;
  const unknownSessions = entry.sessions.length - knownSessions;

  const title = entry.game.manualTitle ?? entry.game.title;
  const cover = entry.game.manualCoverUrl ?? entry.game.coverUrl;
  const releaseYear = entry.game.releaseDate?.getFullYear();

  return (
    <main className="min-h-screen">
      <header className="border-b border-ink-800 px-6 lg:px-12 py-6">
        <div className="max-w-6xl mx-auto">
          <a href="/" className="font-mono text-xs uppercase tracking-widest2 text-amber-glow">
            ← Volver al archivo
          </a>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 lg:px-12 py-16 grid lg:grid-cols-[280px_1fr] gap-12">
        {/* Cover, but static (no 3D wobble on detail) */}
        <div>
          <div className="aspect-[3/4] bg-ink-800 overflow-hidden shadow-2xl">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={title} className="w-full h-full object-cover" />
            ) : null}
          </div>
        </div>

        <div>
          <div className="font-mono text-xs tracking-widest2 uppercase text-amber-glow mb-3">
            ▸ {entry.status.toLowerCase()}
            {entry.completion ? ` · ${entry.completion.toLowerCase()}` : ""}
          </div>
          <h1 className="font-display font-black text-5xl lg:text-6xl text-bone-50 leading-[0.95]">
            {title}
          </h1>
          <div className="mt-3 font-mono text-sm text-bone-200/60 tracking-wider">
            {releaseYear ?? "—"}
            {entry.platform ? `  ·  ${entry.platform.name}` : ""}
          </div>

          {entry.game.developers.length > 0 && (
            <div className="mt-6 font-body text-bone-200/80">
              <span className="font-mono text-xs uppercase tracking-widest2 mr-3">Dev</span>
              {entry.game.developers.join(", ")}
            </div>
          )}

          {entry.game.summary && (
            <p className="mt-8 text-bone-200 leading-relaxed max-w-2xl">
              {entry.game.summary}
            </p>
          )}

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-b border-ink-800 py-6">
            <Stat label="Sesiones" value={entry.sessions.length.toString()} />
            <Stat
              label="Tiempo registrado"
              value={
                totalMinutes > 0
                  ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
                  : "—"
              }
            />
            <Stat
              label="Sin recordar"
              value={unknownSessions > 0 ? `${unknownSessions} ses.` : "—"}
            />
          </div>

          {/* Session log */}
          <div className="mt-12">
            <div className="rule mb-6"><span>Registro de sesiones</span></div>
            <SessionLogger entryId={entry.id} />

            <ul className="mt-8 space-y-3">
              {entry.sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex justify-between items-baseline border-b border-ink-800 pb-3"
                >
                  <div>
                    <span className="font-mono text-xs uppercase tracking-widest2 text-bone-200/80">
                      {s.playedAt.toISOString().slice(0, 10)}
                    </span>
                    {s.notes && <p className="text-sm text-bone-200/70 mt-1">{s.notes}</p>}
                  </div>
                  <div className="font-display text-xl text-amber-glow">
                    {s.durationMinutes != null
                      ? `${Math.floor(s.durationMinutes / 60)}h ${s.durationMinutes % 60}m`
                      : <span className="italic text-bone-200/40 text-base">no recuerdo</span>}
                  </div>
                </li>
              ))}
              {entry.sessions.length === 0 && (
                <li className="text-bone-200/40 italic">Sin sesiones registradas.</li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-xs uppercase tracking-widest2 text-bone-200/60 mb-2">
        {label}
      </div>
      <div className="font-display text-3xl text-bone-50">{value}</div>
    </div>
  );
}
