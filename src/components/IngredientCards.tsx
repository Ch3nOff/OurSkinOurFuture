"use client";

import type { IngredientRecommendation } from "@/lib/types";

export function IngredientCards({
  recommendations,
}: {
  recommendations: IngredientRecommendation[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {recommendations.map((r) => (
        <div
          key={r.concern}
          className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="rounded-full bg-[var(--panel-2)] px-2.5 py-1 text-xs text-[var(--muted)]">
              for {r.concernLabel}
            </span>
            <span className="text-xs text-[var(--muted)]">
              priority {Math.round(r.weight * 100)}%
            </span>
          </div>
          <h4 className="text-xl font-semibold text-[var(--accent-2)]">
            {r.ingredient}
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            {r.explanation}
          </p>
        </div>
      ))}
    </div>
  );
}
