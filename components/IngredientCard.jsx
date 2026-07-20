"use client";

import ScoreRing from "./ScoreRing";
import { INGREDIENT_MAP } from "@/lib/skinAnalysis";

export default function IngredientCard({ concern }) {
  const ingredients = INGREDIENT_MAP[concern.key] || [];
  return (
    <div className="rounded-2xl p-4 bg-card border border-border">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-semibold text-ink">{concern.label}</span>
        <ScoreRing score={concern.score} size={40} stroke={4} />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {ingredients.map((ing) => (
          <span key={ing} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F0EBDD] text-[#6B5D42]">
            {ing}
          </span>
        ))}
      </div>
    </div>
  );
}
