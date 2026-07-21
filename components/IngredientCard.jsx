"use client";

import ScoreRing from "./ScoreRing";
import { INGREDIENT_MAP, scoreLabel, concernExplanation } from "@/lib/skinAnalysis";

export default function IngredientCard({ concern }) {
  const ingredients = INGREDIENT_MAP[concern.key] || [];
  return (
    <div className="rounded-2xl p-4 bg-card border border-border">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-ink">{concern.label}</span>
        <ScoreRing score={concern.score} size={40} stroke={4} />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{
            color: concern.score >= 61 ? "#B85C4A" : concern.score >= 31 ? "#C9A876" : "#4A6355",
            background: concern.score >= 61 ? "#B85C4A15" : concern.score >= 31 ? "#C9A87615" : "#4A635515",
          }}
        >
          {scoreLabel(concern.score)}
        </span>
        <span className="text-[11px] text-muted">{concernExplanation(concern.key)}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {ingredients.map((ing) => (
          <span key={ing} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F0EBDD] text-[#6B5D42]">
            {ing}
          </span>
        ))}
      </div>
    </div>
  );
}
