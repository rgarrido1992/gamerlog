"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

interface FilterBarProps {
  statuses: { value: string; label: string; count: number }[];
  platforms: { slug: string; name: string }[];
  releaseYears: number[];
  playedYears: number[];
}

const MONTHS = [
  ["01", "Ene"], ["02", "Feb"], ["03", "Mar"], ["04", "Abr"],
  ["05", "May"], ["06", "Jun"], ["07", "Jul"], ["08", "Ago"],
  ["09", "Sep"], ["10", "Oct"], ["11", "Nov"], ["12", "Dic"],
];

export function FilterBar({ statuses, platforms, releaseYears, playedYears }: FilterBarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (next.get(key) === value) next.delete(key);
      else next.set(key, value);
      router.push(`/?${next.toString()}`, { scroll: false });
    },
    [params, router]
  );

  const clear = () => router.push("/");
  const active = (k: string, v: string) => params.get(k) === v;
  const anyActive = Array.from(params.keys()).length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="font-mono text-[11px] uppercase tracking-widest text-text-muted mr-2">Estado</span>
        {statuses.map((s) => (
          <button key={s.value} className="chip" data-active={active("status", s.value)} onClick={() => toggle("status", s.value)}>
            {s.label}
            <span className="opacity-60">{s.count}</span>
          </button>
        ))}
      </div>

      {platforms.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="font-mono text-[11px] uppercase tracking-widest text-text-muted mr-2">Plataforma</span>
          {platforms.map((p) => (
            <button key={p.slug} className="chip" data-active={active("platform", p.slug)} onClick={() => toggle("platform", p.slug)}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="font-mono text-xs text-text-muted hover:text-accent uppercase tracking-widest transition-colors"
      >
        {expanded ? "▾ Menos filtros" : "▸ Filtros por fecha"}
      </button>

      {expanded && (
        <div className="grid md:grid-cols-2 gap-6 pt-2">
          <div>
            <div className="section-label mb-3"><span>Lanzamiento</span></div>
            <div className="flex flex-wrap gap-2 mb-3">
              {releaseYears.map((y) => (
                <button key={y} className="chip" data-active={active("releaseYear", String(y))} onClick={() => toggle("releaseYear", String(y))}>{y}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {MONTHS.map(([v, l]) => (
                <button key={v} className="chip" data-active={active("releaseMonth", v)} onClick={() => toggle("releaseMonth", v)}>{l}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="section-label mb-3"><span>Jugado</span></div>
            <div className="flex flex-wrap gap-2 mb-3">
              {playedYears.map((y) => (
                <button key={y} className="chip" data-active={active("playedYear", String(y))} onClick={() => toggle("playedYear", String(y))}>{y}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {MONTHS.map(([v, l]) => (
                <button key={v} className="chip" data-active={active("playedMonth", v)} onClick={() => toggle("playedMonth", v)}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {anyActive && (
        <button onClick={clear} className="font-mono text-xs uppercase tracking-widest text-accent hover:text-accent-hover">
          ← Limpiar filtros
        </button>
      )}
    </div>
  );
}
