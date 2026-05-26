"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ListPreview {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
  previews: { gameId: string; title: string; coverUrl: string | null }[];
}

export function ListsClient({ lists }: { lists: ListPreview[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null }),
      });
      if (!res.ok) {
        alert("Error al crear lista");
        return;
      }
      setName("");
      setDescription("");
      setCreating(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-accent mb-2">
            ▸ Tus colecciones
          </div>
          <h1 className="font-display font-bold text-5xl lg:text-6xl tracking-tight">
            Listas
          </h1>
        </div>
        <button onClick={() => setCreating(!creating)} className="btn btn-primary">
          {creating ? "Cancelar" : "+ Nueva lista"}
        </button>
      </div>

      {creating && (
        <div className="mb-10 p-6 rounded-2xl bg-bg-elevated border border-white/10 space-y-4 max-w-2xl">
          <label className="block">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
              Nombre
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mis juegos de LEGO favoritos"
              className="input"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
              Descripción (opcional)
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-20"
              placeholder="Para qué es esta lista…"
            />
          </label>
          <button onClick={create} disabled={busy || !name.trim()} className="btn btn-primary">
            {busy ? "Creando…" : "✓ Crear lista"}
          </button>
        </div>
      )}

      {lists.length === 0 ? (
        <div className="text-center py-24 px-8 rounded-2xl border border-dashed border-white/10">
          <div className="text-6xl mb-6">📚</div>
          <h2 className="font-display font-bold text-3xl mb-3">Sin listas todavía</h2>
          <p className="text-text-muted max-w-md mx-auto">
            Las listas te dejan agrupar juegos por temática: &quot;Mis Lego favoritos&quot;,
            &quot;Para jugar con amigos&quot;, &quot;Pendientes de 2026&quot;…
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}`}
              className="group block p-5 rounded-2xl bg-bg-card border border-white/5 hover:border-accent transition-all hover:shadow-glow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-display font-bold text-xl group-hover:text-accent transition-colors">
                  {list.name}
                </h3>
                <span className="font-mono text-xs text-text-muted tabular-nums">
                  {list.itemCount.toString().padStart(2, "0")}
                </span>
              </div>
              {list.description && (
                <p className="text-sm text-text-muted mb-4 line-clamp-2">{list.description}</p>
              )}
              {list.previews.length > 0 ? (
                <div className="flex gap-2">
                  {list.previews.map((p) => (
                    <div
                      key={p.gameId}
                      className="w-12 h-16 rounded bg-bg-hover overflow-hidden flex-shrink-0"
                      style={
                        p.coverUrl
                          ? { backgroundImage: `url(${p.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                          : undefined
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-dim italic">Lista vacía</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
