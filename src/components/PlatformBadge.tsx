interface PlatformBadgeProps {
  badgeText: string;
  badgeBg: string;
  badgeFg: string;
  size?: "sm" | "md";
}

export function PlatformBadge({ badgeText, badgeBg, badgeFg, size = "sm" }: PlatformBadgeProps) {
  return (
    <span
      className="badge"
      style={{
        backgroundColor: badgeBg,
        color: badgeFg,
        fontSize: size === "md" ? "12px" : undefined,
        height: size === "md" ? "26px" : undefined,
        padding: size === "md" ? "3px 10px" : undefined,
      }}
    >
      {badgeText}
    </span>
  );
}
