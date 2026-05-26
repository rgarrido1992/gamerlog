"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlatformBadge } from "@/components/PlatformBadge";

interface PlatformOpt {
  slug: string;
  name: string;
  badgeText: string;
  badgeBg: string;
  badgeFg: string;
}

interface ListOpt {
  id: string;
  name: string;
  alreadyContains: boolean;
}

interface Props {
  entryId: string;
  gameId: string;
  initial: {
    status: string;
    completion: string | null;
    platformSlug: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    rating: number | null;
    notes: string | null;
  };
  availablePlatforms: PlatformOpt[];
  allPlatforms: PlatformOpt[];
  lists: ListOpt[];
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

export function EntryActions({
  entryId,
  gameId,
  initial,
  availablePlatforms,
  allPlatforms,
  lists,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"closed" | "edit" | "delete" | "lists">("closed");

  // Edit state
  const [status, setStatus] = useState(initial.status);
  const [completion, setCompletion] = useState(initial.completion ?? "");
  const [platformSlug, setPlatformSlug] = useState(initial.platformSlug ?? "");
  const [startedAt, setStartedAt] = useState(initial.startedAt?.slice(0, 10) ?? "");
  const [finishedAt, setFinishedAt] = useState(initial.finishedAt?.slice(0, 10) ?? "");
  const [rating, setRating] = useState(initial.rating?.toString() ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [busy, setBusy] = useState(false);

  // Use availablePlatforms if any, otherwise fallback to all (for legacy games without
  // platform info on IGDB or older entries from v1).
  const platformPool = availablePlatforms.length > 0 ? availablePlatforms : allPlatforms;

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/games/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          completion: completion || null,
          platformSlug: platformSlug || null,
          startedAt: startedAt ? new Date(startedAt).toISOString() : null,
          finishedAt: finishedAt ? new Date(finishedAt).toISOString() : null,
          rating: rating ? parseInt(rating) : null,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        alert("Error al guardar");
        return;
      }
      setMode("closed");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    setBusy(true);
    try {
      const res = await fetch(`/api/games/${entryId}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Error al borrar");
        return;
      }
      router.push("/");
    } finally {
      setBusy(false);
    }
  }

  async function toggleList(listId: string, contains: boolean) {
    const res = await fetch(`/api/lists/${listId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: contains ? "remove" : "add",
        gameId,
      }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <>
      {/* Action buttons row */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setMode("edit")} className="btn btn-primary">
          ✎ Editar entrada
        </button>
        <button onClick={() => setMode("lists")} className="btn btn-secondary">
          ＋ Añadir a lista
        </button>
        <button onClick={() => setMode("delete")} className="btn btn-danger">
          🗑 Borrar
        </button>
      </div>

      {/* EDIT MODAL */}
      {mode === "edit" && (
        <Modal title="Editar entrada" onClose={() => setMode("closed")}>
          <div className="space-y-5">
            <FieldRow>
              <Field label="Estado">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              {(status === "PLAYED" || status === "COMPLETED") && (
                <Field label="Tipo de finalización">
                  <select value={completion} onChange={(e) => setCompletion(e.target.value)} className="input">
                    {COMPLETIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
              )}
            </FieldRow>

            <Field label="Plataforma">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPlatformSlug("")}
                  className="chip"
                  data-active={!platformSlug}
                >
                  — sin plataforma —
                </button>
                {platformPool.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => setPlatformSlug(p.slug)}
                    className="chip"
                    data-active={platformSlug === p.slug}
                  >
                    <PlatformBadge badgeText={p.badgeText} badgeBg={p.badgeBg} badgeFg={p.badgeFg} />
                    {p.name}
                  </button>
                ))}
              </div>
            </Field>

            {(status === "STARTED" || status === "PLAYED" || status === "COMPLETED") && (
              <Field label="Fecha de comienzo">
                <DateField value={startedAt} onChange={setStartedAt} />
              </Field>
            )}
            {status === "COMPLETED" && (
              <Field label="Fecha de finalización">
                <DateField value={finishedAt} onChange={setFinishedAt} />
              </Field>
            )}

            {(status === "PLAYED" || status === "COMPLETED") && (
              <Field label="Tu puntuación (0-100)">
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
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-24" />
            </Field>

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setMode("closed")} className="btn btn-secondary">
                Cancelar
              </button>
              <button onClick={save} disabled={busy} className="btn btn-primary">
                {busy ? "Guardando…" : "✓ Guardar"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE MODAL */}
      {mode === "delete" && (
        <Modal title="Borrar entrada" onClose={() => setMode("closed")}>
          <p className="text-text-muted mb-6">
            Se eliminará tu entrada y todas sus sesiones. El juego seguirá existiendo en
            el catálogo, pero desaparecerá de tu archivo. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setMode("closed")} className="btn btn-secondary">Cancelar</button>
            <button onClick={del} disabled={busy} className="btn btn-danger">
              {busy ? "…" : "Sí, borrar"}
            </button>
          </div>
        </Modal>
      )}

      {/* LISTS MODAL */}
      {mode === "lists" && (
        <Modal title="Añadir a listas" onClose={() => setMode("closed")}>
          {lists.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-text-muted mb-5">Aún no tienes ninguna lista.</p>
              <a href="/lists" className="btn btn-primary">+ Crear lista</a>
            </div>
          ) : (
            <ul className="space-y-2">
              {lists.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => toggleList(l.id, l.alreadyContains)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-bg-elevated border border-white/5 hover:border-accent transition-colors"
                  >
                    <span className="font-semibold">{l.name}</span>
                    {l.alreadyContains ? (
                      <span className="text-accent font-mono text-xs">✓ EN LISTA</span>
                    ) : (
                      <span className="text-text-muted font-mono text-xs">+ AÑADIR</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-3 justify-end mt-6">
            <a href="/lists" className="btn btn-secondary">Gestionar listas</a>
            <button onClick={() => setMode("closed")} className="btn btn-primary">Cerrar</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-bg-elevated border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-bg-elevated z-10">
          <h2 className="font-display font-bold text-xl">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-DEFAULT text-2xl">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
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
        <button type="button" onClick={() => onChange("")} className="btn btn-secondary px-3">✕</button>
      )}
    </div>
  );
}
