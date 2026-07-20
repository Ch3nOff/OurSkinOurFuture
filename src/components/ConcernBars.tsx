"use client";

import { severityFor, type ConcernScore } from "@/lib/types";

function barColor(score: number): string {
  if (score < 34) return "var(--good)";
  if (score < 67) return "var(--warn)";
  return "var(--bad)";
}

export function ConcernBars({ concerns }: { concerns: ConcernScore[] }) {
  const sorted = [...concerns].sort((a, b) => b.score - a.score);
  return (
    <div className="space-y-3">
      {sorted.map((c) => (
        <div key={c.key}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">{c.label}</span>
            <span className="text-[var(--muted)]">
              {c.score} · {severityFor(c.score)}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--panel-2)]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${c.score}%`,
                background: barColor(c.score),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
