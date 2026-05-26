"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SessionLogger({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [unknown, setUnknown] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const duration = unknown
        ? null
        : (parseInt(hours || "0") || 0) * 60 + (parseInt(minutes || "0") || 0);

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId,
          playedAt: new Date(playedAt).toISOString(),
          durationMinutes: duration,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        alert("Error al guardar sesión");
        return;
      }
      setHours("");
      setMinutes("");
      setNotes("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-5 rounded-xl bg-bg-card border border-white/5 space-y-4">
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
        <label className="block">
          <span className="block font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1.5">
            Fecha
          </span>
          <input type="date" value={playedAt} onChange={(e) => setPlayedAt(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="block font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1.5">H</span>
          <input type="number" min="0" value={hours} disabled={unknown} onChange={(e) => setHours(e.target.value)} className="input w-20" />
        </label>
        <label className="block">
          <span className="block font-mono text-[10px] uppercase tracking-widest text-text-muted mb-1.5">M</span>
          <input type="number" min="0" max="59" value={minutes} disabled={unknown} onChange={(e) => setMinutes(e.target.value)} className="input w-20" />
        </label>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={unknown} onChange={(e) => setUnknown(e.target.checked)} className="w-4 h-4 accent-accent" />
        <span className="text-sm text-text-DEFAULT">No recuerdo cuánto jugué</span>
      </label>

      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Nota opcional…" className="input" />

      <button onClick={submit} disabled={saving} className="btn btn-primary">
        {saving ? "Guardando…" : "+ Registrar sesión"}
      </button>
    </div>
  );
}
