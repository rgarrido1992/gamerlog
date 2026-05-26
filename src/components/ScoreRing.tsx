interface ScoreRingProps {
  label: string;
  score: number | null;
  /** 0-100 */
  max?: number;
  size?: number;
}

function colorForScore(score: number): string {
  if (score >= 75) return "#4ade80";    // success green
  if (score >= 50) return "#fbbf24";    // warning yellow
  if (score >= 30) return "#fb923c";    // orange
  return "#f87171";                      // danger red
}

export function ScoreRing({ label, score, max = 100, size = 72 }: ScoreRingProps) {
  const pct = score != null ? Math.min(100, Math.max(0, (score / max) * 100)) : 0;
  const color = score != null ? colorForScore(score) : "#3a4258";
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={stroke}
          />
          {score != null && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 400ms ease" }}
            />
          )}
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center font-display font-bold"
          style={{ color: score != null ? color : "#5a6578", fontSize: size * 0.28 }}
        >
          {score != null ? score : "—"}
        </div>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
        {label}
      </span>
    </div>
  );
}
