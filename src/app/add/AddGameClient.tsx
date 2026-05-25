"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface IgdbResult {
  igdbId: number;
  title: string;
  slug: string;
  summary: string | null;
  releaseDate: string | null;
  coverUrl: string | null;
  genres: string[];
  developers: string[];
  publishers: string[];
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

export function AddGameClient({ platforms }: { platforms: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IgdbResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<IgdbResult | null>(null);
  const [manualMode, setManualMode] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [platformSlug, setPlatformSlug] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [completion, setCompletion] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

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

  function pick(r: IgdbResult) {
    setPicked(r);
    setTitle(r.title);
    setCoverUrl(r.coverUrl ?? "");
    setReleaseDate(r.releaseDate ? r.releaseDate.slice(0, 10) : "");
    setManualMode(false);
  }

  async function submit() {
    setSaving(true);
    try {
      const body: any = {
        title,
        slug: picked?.slug ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        coverUrl: coverUrl || null,
        releaseDate: releaseDate ? new Date(releaseDate).toISOString() : null,
        summary: picked?.summary ?? null,
        genres: picked?.genres ?? [],
        developers: picked?.developers ?? [],
        publishers: picked?.publishers ?? [],
        platformSlug: platformSlug || null,
        status,
        completion: completion || null,
        notes: notes || null,
      };
      if (picked?.igdbId) body.igdbId = picked.igdbId;

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
    <main className="min-h-screen">
      <header className="border-b border-ink-800 px-6 lg:px-12 py-10">
        <div className="max-w-6xl mx-auto">
          <a href="/" className="font-mono text-xs uppercase tracking-widest2 text-amber-glow">
            ← Volver al archivo
          </a>
          <h1 className="font-display font-black text-5xl mt-4 text-bone-50">
            Añadir <span className="italic text-amber-glow">juego</span>
          </h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12 grid lg:grid-cols-2 gap-12">
        {/* ─── Search ──────────────────────────────────── */}
        <section>
          <div className="rule mb-4"><span>1 · Buscar</span></div>
          <form onSubmit={search} className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hollow Knight, Persona 5…"
              className="flex-1 bg-ink-900 border border-ink-700 px-4 py-3 text-bone-50 font-body focus:border-amber-glow outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-amber-glow text-ink-950 font-mono uppercase tracking-widest text-xs hover:bg-amber-burn disabled:opacity-50"
            >
              {loading ? "…" : "Buscar"}
            </button>
          </form>

          <button
            onClick={() => { setManualMode(true); setPicked(null); setTitle(""); setCoverUrl(""); setReleaseDate(""); }}
            className="mt-4 font-mono text-xs uppercase tracking-widest text-bone-200/70 hover:text-amber-glow"
          >
            o añadirlo a mano →
          </button>

          <div className="mt-6 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {results.map((r) => (
              <button
                key={r.igdbId}
                onClick={() => pick(r)}
                className={`w-full flex gap-4 p-3 border transition-colors text-left ${
                  picked?.igdbId === r.igdbId
                    ? "border-amber-glow bg-ink-800"
                    : "border-ink-700 hover:border-ink-600"
                }`}
              >
                {r.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.coverUrl} alt="" className="w-12 h-16 object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg text-bone-50 truncate">{r.title}</div>
                  <div className="font-mono text-xs text-bone-200/60">
                    {r.releaseDate ? r.releaseDate.slice(0, 4) : "—"} ·{" "}
                    {r.developers.slice(0, 2).join(", ")}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ─── Form ──────────────────────────────────────── */}
        <section>
          <div className="rule mb-4"><span>2 · Detalles</span></div>
          {!picked && !manualMode ? (
            <p className="text-bone-200/60 italic">
              Selecciona un resultado o entra en modo manual.
            </p>
          ) : (
            <div className="space-y-5">
              <Field label="Título">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Carátula (URL)">
                <input
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="input"
                  placeholder="https://…"
                />
              </Field>
              <Field label="Fecha de lanzamiento">
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Plataforma">
                <select
                  value={platformSlug}
                  onChange={(e) => setPlatformSlug(e.target.value)}
                  className="input"
                >
                  <option value="">— ninguna —</option>
                  {platforms.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Estado">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
              {(status === "PLAYED" || status === "COMPLETED") && (
                <Field label="Tipo de finalización">
                  <select
                    value={completion}
                    onChange={(e) => setCompletion(e.target.value)}
                    className="input"
                  >
                    {COMPLETIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Notas">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input min-h-24"
                />
              </Field>
              <button
                onClick={submit}
                disabled={saving || !title}
                className="w-full px-6 py-4 bg-amber-glow text-ink-950 font-mono uppercase tracking-widest text-sm hover:bg-amber-burn disabled:opacity-50"
              >
                {saving ? "Guardando…" : "✓ Añadir al archivo"}
              </button>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: theme('colors.ink.900');
          border: 1px solid theme('colors.ink.700');
          padding: 10px 14px;
          color: theme('colors.bone.50');
          font-family: var(--font-body);
          outline: none;
          transition: border-color 150ms;
        }
        .input:focus { border-color: theme('colors.amber.glow'); }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-xs uppercase tracking-widest2 text-bone-200/70 block mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}
