"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GameTile } from "@/components/GameTile";

interface Props {
  list: { id: string; name: string; description: string | null };
  items: {
    gameId: string;
    title: string;
    coverUrl: string | null;
    year: number | null;
    entryId: string | null;
    status: string | null;
  }[];
}

export function ListDetailClient({ list, items }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/lists/${list.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", name, description: description || null }),
      });
      if (!res.ok) {
        alert("Error al guardar");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(gameId: string) {
    const res = await fetch(`/api/lists/${list.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", gameId }),
    });
    if (res.ok) router.refresh();
  }

  async function deleteList() {
    setBusy(true);
    try {
      const res = await fetch(`/api/lists/${list.id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Error al borrar");
        return;
      }
      router.push("/lists");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-[1600px] mx-auto px-6 lg:px-10 py-10">
      <a href="/lists" className="font-mono text-xs uppercase tracking-widest text-accent hover:text-accent-hover">
        ← Volver a listas
      </a>

      {editing ? (
        <div className="mt-4 mb-10 p-6 rounded-2xl bg-bg-elevated border border-white/10 space-y-4 max-w-2xl">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input text-2xl font-display font-bold" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-20" />
          <div className="flex gap-3">
            <button onClick={save} disabled={busy} className="btn btn-primary">Guardar</button>
            <button onClick={() => setEditing(false)} className="btn btn-secondary">Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-start justify-between gap-4 flex-wrap mb-10">
          <div>
            <h1 className="font-display font-bold text-4xl lg:text-5xl tracking-tight">{list.name}</h1>
            {list.description && (
              <p className="text-text-muted mt-3 max-w-2xl">{list.description}</p>
            )}
            <p className="font-mono text-xs text-text-dim uppercase tracking-widest mt-3">
              {items.length} juego{items.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="btn btn-secondary">✎ Editar</button>
            <button onClick={() => setConfirmDelete(true)} className="btn btn-danger">🗑 Borrar lista</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20 px-8 rounded-2xl border border-dashed border-white/10">
          <p className="text-text-muted">
            Lista vacía. Para añadir juegos, abre la ficha de cualquier juego y pulsa &quot;Añadir a lista&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {items.map((item) => (
            <div key={item.gameId} className="relative group">
              <GameTile
                href={item.entryId ? `/game/${item.entryId}` : "#"}
                title={item.title}
                coverUrl={item.coverUrl}
                year={item.year}
                status={item.status ?? undefined}
              />
              <button
                onClick={() => removeItem(item.gameId)}
                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-danger text-white text-sm font-bold shadow-lg"
                title="Quitar de la lista"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="max-w-md bg-bg-elevated border border-white/10 rounded-2xl p-6">
            <h3 className="font-display font-bold text-xl mb-3">¿Borrar esta lista?</h3>
            <p className="text-text-muted mb-6 text-sm">
              Se elimina la lista y todas sus referencias a juegos. Los juegos en sí no se borran.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(false)} className="btn btn-secondary">Cancelar</button>
              <button onClick={deleteList} disabled={busy} className="btn btn-danger">Sí, borrar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
