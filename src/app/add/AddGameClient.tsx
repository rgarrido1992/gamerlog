"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PlatformBadge } from "@/components/PlatformBadge";

interface PlatformInfo {
  slug: string;
  name: string;
  igdbIds: number[];
  badgeText: string;
  badgeBg: string;
  badgeFg: string;
}

interface IgdbResult {
  igdbId: number;
  title: string;
  slug: string;
  summary: string | null;
  releaseDate: string | null;
  coverUrl: string | null;
  artworkUrl: string | null;
  screenshots: string[];
  videoYoutubeId: string | null;
  igdbRating: number | null;
  genres: string[];
  gameModes: string[];
  developers: string[];
  publishers: string[];
  igdbPlatformIds: number[];
  similarIgdbIds: number[];
}

const STATUSES = [
  { value: "WISHLIST", label: "Wishlist" },
  { value: "PENDING", label: "Pendiente" },
  { value: "STARTED", label: "En curso" },
  { value: "PLAYED", label: "Jugado" },
  { value: "COMPLETED", label: "Completado" },
];

const COMPLETIONS = [
  { value: "", label: "—" },
  { value: "MAIN", label: "Historia principal" },
  { value: "HUNDRED", label: "100% / Platino" },
  { value: "ABANDONED", label: "Abandonado" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function AddGameClient({ platforms }: { platforms: PlatformInfo[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IgdbResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<IgdbResult | null>(null);

  // Form state
  const [platformSlug, setPlatformSlug] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [completion, setCompletion] = useState("");
  const [startedAt, setStartedAt] = useState(todayISO());
  const [finishedAt, setFinishedAt] = useState(todayISO());
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Filter platforms to only those available for the picked game
  const availablePlatforms = useMemo(() => {
    if (!picked || picked.igdbPlatformIds.length === 0) return [];
    return platforms.filter((p) =>
      p.igdbIds.some((id) => picked.igdbPlatformIds.includes(id))
    );
  }, [picked, platforms]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/igdb?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!picked) return;
    setSaving(true);
    try {
      const body = {
        igdbId: picked.igdbId,
        title: picked.title,
        slug: picked.slug,
        coverUrl: picked.coverUrl,
        artworkUrl: picked.artworkUrl,
        screenshots: picked.screenshots,
        videoYoutubeId: picked.videoYoutubeId,
        releaseDate: picked.releaseDate,
        summary: picked.summary,
        igdbRating: picked.igdbRating,
        genres: picked.genres,
        gameModes: picked.gameModes,
        developers: picked.developers,
        publishers: picked.publishers,
        igdbPlatformIds: picked.igdbPlatformIds,
        similarIgdbIds: picked.similarIgdbIds,

        platformSlug: platformSlug || null,
        status,
        completion: completion || null,
        startedAt: startedAt ? new Date(startedAt).toISOString() : null,
        finishedAt: status === "COMPLETED" && finishedAt ? new Date(finishedAt).toISOString() : null,
        rating: rating ? parseInt(rating) : null,
        notes: notes || null,
      };

      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        alert("Error: " + JSON.stringify(err.error));
        return;
      }
      router.push("/");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
      <div className="mb-10">
        <a href="/" className="font-mono text-xs uppercase tracking-widest text-accent hover:text-accent-hover">
          ← Volver
        </a>
        <h1 className="font-display font-bold text-4xl lg:text-5xl mt-3">Añadir juego</h1>
      </div>

      <div className="grid lg:grid-cols-[420px_1fr] gap-10">
        {/* SEARCH PANEL */}
        <section>
          <div className="section-label mb-4"><span>1 · Buscar en IGDB</span></div>
          <form onSubmit={search} className="flex gap-2 mb-5">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hollow Knight, Persona 5…"
              className="input flex-1"
            />
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "…" : "Buscar"}
            </button>
          </form>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
            {results.map((r) => (
              <button
                key={r.igdbId}
                onClick={() => setPicked(r)}
                className={`w-full flex gap-3 p-3 rounded-lg border transition-all text-left ${
                  picked?.igdbId === r.igdbId
                    ? "border-accent bg-accent/5 shadow-glow"
                    : "border-white/5 bg-bg-elevated hover:border-white/15"
                }`}
              >
                {r.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.coverUrl} alt="" className="w-14 h-20 object-cover rounded" />
                ) : (
                  <div className="w-14 h-20 rounded bg-bg-hover" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-DEFAULT truncate">{r.title}</div>
                  <div className="font-mono text-xs text-text-muted mt-1">
                    {r.releaseDate ? r.releaseDate.slice(0, 4) : "—"}
                  </div>
                  <div className="text-xs text-text-muted truncate mt-0.5">
                    {r.developers.slice(0, 2).join(", ")}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* FORM PANEL */}
        <section>
          <div className="section-label mb-4"><span>2 · Detalles de tu entrada</span></div>
          {!picked ? (
            <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center text-text-muted">
              Selecciona un juego de la búsqueda para continuar.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Game preview */}
              <div className="flex gap-4 p-4 rounded-xl bg-bg-elevated border border-white/5">
                {picked.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={picked.coverUrl} alt="" className="w-20 h-28 object-cover rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-lg">{picked.title}</h3>
                  <p className="text-xs text-text-muted">
                    {picked.releaseDate ? picked.releaseDate.slice(0, 4) : "—"} · {picked.developers.join(", ")}
                  </p>
                  {availablePlatforms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {availablePlatforms.map((p) => (
                        <PlatformBadge key={p.slug} badgeText={p.badgeText} badgeBg={p.badgeBg} badgeFg={p.badgeFg} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Field label="¿En qué plataforma lo tienes / lo jugaste?">
                {availablePlatforms.length === 0 ? (
                  <p className="text-sm text-text-muted italic py-2">
                    IGDB no tiene información de plataformas para este juego. Lo añadirás sin plataforma asignada.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availablePlatforms.map((p) => (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => setPlatformSlug(platformSlug === p.slug ? "" : p.slug)}
                        className={`chip ${platformSlug === p.slug ? "" : ""}`}
                        data-active={platformSlug === p.slug}
                      >
                        <PlatformBadge badgeText={p.badgeText} badgeBg={p.badgeBg} badgeFg={p.badgeFg} />
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </Field>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Estado">
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </Field>
                {(status === "PLAYED" || status === "COMPLETED") && (
                  <Field label="Tipo de finalización">
                    <select value={completion} onChange={(e) => setCompletion(e.target.value)} className="input">
                      {COMPLETIONS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>

              {(status === "STARTED" || status === "PLAYED" || status === "COMPLETED") && (
                <Field label="Fecha de comienzo (opcional)">
                  <DateField value={startedAt} onChange={setStartedAt} />
                </Field>
              )}

              {status === "COMPLETED" && (
                <Field label="Fecha de finalización (opcional)">
                  <DateField value={finishedAt} onChange={setFinishedAt} />
                </Field>
              )}

              {(status === "PLAYED" || status === "COMPLETED") && (
                <Field label="Tu puntuación (0-100, opcional)">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="input"
                    placeholder="ej. 88"
                  />
                </Field>
              )}

              <Field label="Notas">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input min-h-24"
                  placeholder="Cualquier cosa que quieras recordar…"
                />
              </Field>

              <button onClick={submit} disabled={saving} className="btn btn-primary w-full py-4 text-base">
                {saving ? "Guardando…" : "✓ Añadir al archivo"}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-[11px] uppercase tracking-widest text-text-muted mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="input" />
      {value && (
        <button type="button" onClick={() => onChange("")} className="btn btn-secondary px-3" title="Limpiar">
          ✕
        </button>
      )}
    </div>
  );
}
