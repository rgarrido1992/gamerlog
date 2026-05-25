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
    <div className="border border-ink-700 p-5 space-y-4 bg-ink-900/50">
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
        <label>
          <span className="block font-mono text-xs uppercase tracking-widest2 text-bone-200/70 mb-2">
            Fecha
          </span>
          <input
            type="date"
            value={playedAt}
            onChange={(e) => setPlayedAt(e.target.value)}
            className="w-full bg-ink-800 border border-ink-600 px-3 py-2 text-bone-50"
          />
        </label>
        <label>
          <span className="block font-mono text-xs uppercase tracking-widest2 text-bone-200/70 mb-2">
            H
          </span>
          <input
            type="number"
            min="0"
            value={hours}
            disabled={unknown}
            onChange={(e) => setHours(e.target.value)}
            className="w-16 bg-ink-800 border border-ink-600 px-3 py-2 text-bone-50 disabled:opacity-40"
          />
        </label>
        <label>
          <span className="block font-mono text-xs uppercase tracking-widest2 text-bone-200/70 mb-2">
            M
          </span>
          <input
            type="number"
            min="0"
            max="59"
            value={minutes}
            disabled={unknown}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-16 bg-ink-800 border border-ink-600 px-3 py-2 text-bone-50 disabled:opacity-40"
          />
        </label>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={unknown}
          onChange={(e) => setUnknown(e.target.checked)}
          className="w-4 h-4 accent-amber-glow"
        />
        <span className="font-mono text-xs uppercase tracking-widest2 text-bone-200/80">
          No recuerdo cuánto jugué
        </span>
      </label>

      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Nota opcional…"
        className="w-full bg-ink-800 border border-ink-600 px-3 py-2 text-bone-50"
      />

      <button
        onClick={submit}
        disabled={saving}
        className="px-5 py-2 bg-amber-glow text-ink-950 font-mono uppercase tracking-widest text-xs hover:bg-amber-burn disabled:opacity-50"
      >
        {saving ? "…" : "+ Registrar sesión"}
      </button>
    </div>
  );
}
