"use client";

import { useMemo, useState } from "react";
import {
  ALL_CONCERNS,
  CONCERN_LABELS,
  type SkinSimulation,
} from "@/lib/types";

const WEEKS = [0, 1, 2, 4, 6, 8, 10, 12];

function nearestPoint(sim: SkinSimulation, week: number) {
  // timeline is ordered; pick the surrounding points for smooth interpolation
  const t = sim.timeline;
  if (week <= t[0].week) return { a: t[0], b: t[0], f: 0 };
  if (week >= t[t.length - 1].week)
    return { a: t[t.length - 1], b: t[t.length - 1], f: 0 };
  for (let i = 0; i < t.length - 1; i++) {
    if (week >= t[i].week && week <= t[i + 1].week) {
      const f = (week - t[i].week) / (t[i + 1].week - t[i].week);
      return { a: t[i], b: t[i + 1], f };
    }
  }
  return { a: t[0], b: t[0], f: 0 };
}

function lerp(a: number, b: number, f: number) {
  return Math.round(a + (b - a) * f);
}

export function Timeline({ simulation }: { simulation: SkinSimulation }) {
  const [week, setWeek] = useState(0);

  const current = useMemo(() => {
    const { a, b, f } = nearestPoint(simulation, week);
    const concerns = {} as Record<(typeof ALL_CONCERNS)[number], number>;
    for (const key of ALL_CONCERNS) {
      concerns[key] = lerp(a.concerns[key], b.concerns[key], f);
    }
    return concerns;
  }, [simulation, week]);

  const baseline = simulation.timeline[0].concerns;

  const avgNow =
    ALL_CONCERNS.reduce((s, k) => s + current[k], 0) / ALL_CONCERNS.length;
  const avgBase =
    ALL_CONCERNS.reduce((s, k) => s + baseline[k], 0) / ALL_CONCERNS.length;
  const reduction =
    avgBase > 0 ? Math.round(((avgBase - avgNow) / avgBase) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">Projected at week</p>
          <p className="text-3xl font-bold text-[var(--accent-2)]">
            {week}
            <span className="ml-1 text-base font-normal text-[var(--muted)]">
              {week === 1 ? "week" : "weeks"}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--muted)]">Avg severity reduction</p>
          <p className="text-3xl font-bold text-[var(--good)]">
            {reduction}%
          </p>
        </div>
      </div>

      <input
        type="range"
        className="timeline w-full"
        min={0}
        max={12}
        step={1}
        value={week}
        onChange={(e) => setWeek(Number(e.target.value))}
        list="timeline-weeks"
      />
      <datalist id="timeline-weeks">
        {WEEKS.map((w) => (
          <option key={w} value={w} />
        ))}
      </datalist>
      <div className="flex justify-between text-xs text-[var(--muted)]">
        <span>Week 0 (today)</span>
        <span>Week 12</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {ALL_CONCERNS.map((key) => {
          const now = current[key];
          const base = baseline[key];
          const delta = base - now;
          return (
            <div
              key={key}
              className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{CONCERN_LABELS[key]}</span>
                <span
                  className={`text-xs font-semibold ${
                    delta > 0 ? "text-[var(--good)]" : "text-[var(--muted)]"
                  }`}
                >
                  {delta > 0 ? `−${delta}` : "—"}
                </span>
              </div>
              <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-[var(--panel-2)]">
                <div
                  className="h-full bg-[var(--bad)]"
                  style={{ width: `${base}%` }}
                />
                <div
                  className="h-full bg-[var(--good)]"
                  style={{ width: `${Math.max(0, now - base)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-[var(--muted)]">
                <span>now {now}</span>
                <span>start {base}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-[var(--muted)]">
        Projection uses a diminishing-returns curve per concern. Real YouCam AI
        Skin Simulation will replace these numbers with actual before/after
        imagery in M3.
      </p>
    </div>
  );
}
