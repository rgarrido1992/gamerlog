import Link from "next/link";
import { PlatformBadge } from "./PlatformBadge";

interface GameTileProps {
  href: string;
  title: string;
  coverUrl?: string | null;
  status?: string;
  year?: number | null;
  platform?: {
    badgeText: string;
    badgeBg: string;
    badgeFg: string;
  } | null;
}

const STATUS_LABEL: Record<string, string> = {
  WISHLIST: "Wishlist",
  PENDING: "Pendiente",
  STARTED: "En curso",
  PLAYED: "Jugado",
  COMPLETED: "Completado",
};

const STATUS_CLASS: Record<string, string> = {
  WISHLIST: "status-wishlist",
  PENDING: "status-pending",
  STARTED: "status-started",
  PLAYED: "status-played",
  COMPLETED: "status-completed",
};

export function GameTile({ href, title, coverUrl, status, year, platform }: GameTileProps) {
  return (
    <Link href={href} className="tile block">
      <div
        className="tile-image"
        style={
          coverUrl
            ? { backgroundImage: `url(${coverUrl})` }
            : { background: "linear-gradient(135deg, #1a2031, #131826)" }
        }
      >
        {!coverUrl && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <span className="font-display font-bold text-text-DEFAULT text-xl leading-tight">
              {title}
            </span>
          </div>
        )}

        {/* Status chip top-left */}
        {status && (
          <div className="absolute top-3 left-3">
            <span className={`status-chip ${STATUS_CLASS[status] ?? ""}`}>
              {STATUS_LABEL[status] ?? status}
            </span>
          </div>
        )}

        {/* Platform badge top-right */}
        {platform && (
          <div className="absolute top-3 right-3">
            <PlatformBadge {...platform} />
          </div>
        )}

        <div className="tile-overlay" />

        {/* Title at bottom */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-display font-semibold text-text-DEFAULT text-base leading-tight line-clamp-2">
            {title}
          </h3>
          {year && (
            <p className="font-mono text-xs text-text-muted mt-1">{year}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
