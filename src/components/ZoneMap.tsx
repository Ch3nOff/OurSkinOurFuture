"use client";

import { useState } from "react";
import {
  ALL_ZONES,
  severityFor,
  type SkinAnalysis,
  type ZoneKey,
} from "@/lib/types";

function zoneColor(score: number): string {
  if (score < 34) return "var(--good)";
  if (score < 67) return "var(--warn)";
  return "var(--bad)";
}

// Position of each zone hotspot on a 0–100 viewBox face outline.
const ZONE_POS: Record<ZoneKey, { x: number; y: number }> = {
  forehead: { x: 50, y: 22 },
  underEye: { x: 50, y: 42 },
  nose: { x: 50, y: 52 },
  cheeks: { x: 32, y: 52 },
  chin: { x: 50, y: 74 },
};

export function ZoneMap({ analysis }: { analysis: SkinAnalysis }) {
  const [active, setActive] = useState<ZoneKey | null>(null);
  const activeZone = analysis.zones.find((z) => z.key === active) ?? null;

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <div className="relative mx-auto w-full max-w-[260px]">
        <svg viewBox="0 0 100 120" className="w-full">
          {/* face outline */}
          <path
            d="M50 6 C26 6 16 28 16 52 C16 82 30 114 50 114 C70 114 84 82 84 52 C84 28 74 6 50 6 Z"
            fill="var(--panel-2)"
            stroke="var(--line)"
            strokeWidth="1.5"
          />
          {analysis.zones.map((z) => {
            const pos = ZONE_POS[z.key];
            const color = zoneColor(z.score);
            const isActive = active === z.key;
            return (
              <g
                key={z.key}
                onMouseEnter={() => setActive(z.key)}
                onMouseLeave={() => setActive(null)}
                onClick={() => setActive(isActive ? null : z.key)}
                className="cursor-pointer"
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isActive ? 9 : 7}
                  fill={color}
                  fillOpacity={0.85}
                  stroke="#fff"
                  strokeWidth={isActive ? 1.5 : 0.8}
                />
                <circle cx={pos.x} cy={pos.y} r={2} fill="#0b0f17" />
              </g>
            );
          })}
        </svg>
        <p className="mt-2 text-center text-xs text-[var(--muted)]">
          Hover or tap a zone to see its scores
        </p>
      </div>

      <div className="space-y-2">
        {ALL_ZONES.map((key) => {
          const z = analysis.zones.find((zz) => zz.key === key)!;
          const color = zoneColor(z.score);
          const isActive = active === key;
          return (
            <button
              key={key}
              onMouseEnter={() => setActive(key)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setActive(isActive ? null : key)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--panel-2)]"
                  : "border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--panel-2)]"
              }`}
            >
              <span className="font-medium">{z.label}</span>
              <span className="flex items-center gap-2">
                <span className="text-sm text-[var(--muted)]">
                  {severityFor(z.score)}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-sm font-semibold"
                  style={{ background: color, color: "#0b0f17" }}
                >
                  {z.score}
                </span>
              </span>
            </button>
          );
        })}

        {activeZone && (
          <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-4">
            <p className="mb-2 text-sm font-semibold">
              {activeZone.label} — concern breakdown
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(activeZone.concerns)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[var(--muted)]">{k}</span>
                    <span>{v as number}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
