"use client";

import { useRef, useState } from "react";

interface GameCoverProps {
  title: string;
  coverUrl?: string | null;
  platform?: string;
  status: string;
  year?: number | null;
  href?: string;
}

const STATUS_COLOR: Record<string, string> = {
  WISHLIST: "text-bone-200",
  PENDING: "text-amber-glow",
  STARTED: "text-amber-burn",
  PLAYED: "text-bone-50",
  COMPLETED: "text-amber-glow",
};

const STATUS_LABEL: Record<string, string> = {
  WISHLIST: "Wishlist",
  PENDING: "Pendiente",
  STARTED: "En curso",
  PLAYED: "Jugado",
  COMPLETED: "Completado",
};

export function GameCover({
  title,
  coverUrl,
  platform,
  status,
  year,
  href,
}: GameCoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    // Range tuned for "physical object" feel, not exaggerated
    const ry = -14 + (px * 16); // -14° to +2°
    const rx = 6 - (py * 10);   //  6° to -4°
    el.style.setProperty("--ry", `${ry}deg`);
    el.style.setProperty("--rx", `${rx}deg`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.removeProperty("--ry");
    el.style.removeProperty("--rx");
    setHovered(false);
  }

  const Wrapper: any = href ? "a" : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper {...wrapperProps} className="block group">
      <div className="cover-stage relative pb-12">
        <div
          ref={ref}
          className="cover-card aspect-[3/4] w-full relative"
          onMouseMove={onMove}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={onLeave}
        >
          {/* Shadow under the case */}
          <div className="cover-shadow" />

          {/* Spine (left edge) */}
          <div className="cover-spine" />

          {/* Cover face */}
          <div className="cover-face absolute inset-0 overflow-hidden bg-ink-800">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4 text-center">
                <span className="font-display text-2xl text-bone-100 leading-tight">
                  {title}
                </span>
              </div>
            )}

            {/* Sheen overlay */}
            <div className="cover-sheen" />

            {/* Bottom gradient + meta */}
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent">
              <div className="flex items-center justify-between gap-2">
                <span className={`status-pill ${STATUS_COLOR[status] ?? ""}`}>
                  {STATUS_LABEL[status] ?? status}
                </span>
                {platform && (
                  <span className="font-mono text-[10px] tracking-widest uppercase text-bone-200/80">
                    {platform}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Title block — outside the 3D card, editorial */}
        <div className="mt-5 px-1">
          <h3 className="font-display text-xl leading-tight text-bone-50 group-hover:text-amber-glow transition-colors">
            {title}
          </h3>
          {year && (
            <p className="font-mono text-xs tracking-widest uppercase text-bone-200/60 mt-1">
              {year}
            </p>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
