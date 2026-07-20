"use client";

import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { mockSimulation, topConcerns, overallScore } from "@/lib/skinAnalysis";

export default function TimelineSlider({ image, baselineConcerns, totalWeeks = 12 }) {
  const [week, setWeek] = useState(0);
  const [simulated, setSimulated] = useState(() =>
    mockSimulation(baselineConcerns, 0, totalWeeks)
  );
  const [projectedImage, setProjectedImage] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setWeek(0);
    setProjectedImage(null);
    async function load(weekIndex) {
      try {
        const res = await fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image,
            baselineConcerns,
            weekIndex,
            totalWeeks,
          }),
        });
        if (!res.ok) throw new Error("simulate failed");
        const data = await res.json();
        if (cancelled) return;
        if (data.projectedScores) setSimulated(data.projectedScores);
        if (data.projectedImages?.length) {
          setImgLoading(true);
          setProjectedImage(data.projectedImages[0]);
        } else {
          setProjectedImage(null);
        }
      } catch {
        if (cancelled) return;
        setSimulated(mockSimulation(baselineConcerns, weekIndex, totalWeeks));
        setProjectedImage(null);
      } finally {
        if (!cancelled) setImgLoading(false);
      }
    }
    load(0);
    return () => {
      cancelled = true;
    };
  }, [image, baselineConcerns, totalWeeks]);

  useEffect(() => {
    if (week === 0) return;
    let cancelled = false;
    async function loadWeek() {
      try {
        const res = await fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image,
            baselineConcerns,
            weekIndex: week,
            totalWeeks,
          }),
        });
        if (!res.ok) throw new Error("simulate failed");
        const data = await res.json();
        if (cancelled) return;
        if (data.projectedScores) setSimulated(data.projectedScores);
        if (data.projectedImages?.length) {
          setImgLoading(true);
          setProjectedImage(data.projectedImages[0]);
        } else {
          setProjectedImage(null);
        }
      } catch {
        if (cancelled) return;
        setSimulated(mockSimulation(baselineConcerns, week, totalWeeks));
        setProjectedImage(null);
      } finally {
        if (!cancelled) setImgLoading(false);
      }
    }
    loadWeek();
    return () => {
      cancelled = true;
    };
  }, [week, image, baselineConcerns, totalWeeks]);

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

      {projectedImage ? (
        <div className="mb-4 rounded-2xl overflow-hidden border border-border bg-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={projectedImage}
            alt={`Projected skin at week ${week}`}
            className="w-full h-56 object-cover"
          />
          {imgLoading && (
            <div className="text-[11px] text-center text-faint py-1">Rendering projection…</div>
          )}
        </div>
      ) : (
        <div className="mb-4 rounded-2xl h-32 flex items-center justify-center bg-paper border border-border text-[11px] text-faint">
          {imgLoading ? "Rendering projection…" : "Projected image will appear here"}
        </div>
      )}

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
        Simulated using YouCam's AI Skin Simulation — the projection image shows how consistent care could
        look by week {week}. Actual results vary by consistency of use and individual skin condition.
      </p>
    </div>
  );
}
