"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { mockSimulation, topConcerns, overallScore } from "@/lib/skinAnalysis";

export default function TimelineSlider({ baselineConcerns, totalWeeks = 12 }) {
  const [week, setWeek] = useState(0);
  const simulated = mockSimulation(baselineConcerns, week, totalWeeks);
  const overallBaseline = overallScore(baselineConcerns);
  const overallNow = overallScore(simulated);
  const improvementPct =
    overallBaseline > 0 ? Math.round(((overallBaseline - overallNow) / overallBaseline) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted">Week {week} Projection</div>
          <div className="text-2xl font-semibold mt-0.5 text-ink">
            {week === 0 ? "Current Condition" : `${improvementPct}% Improved`}
          </div>
        </div>
        <TrendingUp size={20} className={improvementPct > 0 ? "text-sage" : "text-muted"} />
      </div>

      <input
        type="range"
        min={0}
        max={totalWeeks}
        value={week}
        onChange={(e) => setWeek(Number(e.target.value))}
        className="w-full cursor-pointer range-input"
        aria-label="Drag to preview future weeks"
      />
      <div className="flex justify-between text-[10px] font-mono mt-1 text-faint">
        <span>Week 0</span>
        <span>Week {Math.round(totalWeeks / 2)}</span>
        <span>Week {totalWeeks}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-5">
        {topConcerns(baselineConcerns, 4).map(({ key, label }) => {
          const before = baselineConcerns[key];
          const now = simulated[key];
          return (
            <div key={key} className="rounded-xl px-3 py-2.5 flex items-center justify-between bg-paper border border-border">
              <span className="text-xs font-medium text-[#4A453B]">{label}</span>
              <span className="text-xs font-mono text-muted">
                {before}
                <span className="mx-1 text-gold">→</span>
                <span className="text-sage font-semibold">{now}</span>
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] mt-4 leading-relaxed text-muted">
        Simulated using a typical improvement curve for the recommended ingredients. Actual results vary by
        consistency of use and individual skin condition.
      </p>
    </div>
  );
}
