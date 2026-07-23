"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { TrendingUp, AlertCircle } from "lucide-react";
import { topConcerns, overallScore } from "@/lib/skinAnalysis";

function interpolateScores(baseline, projected, t) {
  const result = {};
  const keys = new Set([...Object.keys(baseline || {}), ...Object.keys(projected || {})]);
  keys.forEach((key) => {
    const a = baseline[key];
    const b = projected[key];
    if (typeof a === "number" && typeof b === "number") {
      result[key] = Math.round(a + (b - a) * t);
    } else if (typeof a === "number") {
      result[key] = a;
    } else if (typeof b === "number") {
      result[key] = b;
    }
  });
  return result;
}

export default function TimelineSlider({ image, baselineConcerns, totalWeeks = 12, savedSimulation, onSimulationReady }) {
  const [week, setWeek] = useState(0);
  const [baselineImage, setBaselineImage] = useState(null);
  const [projectedImage, setProjectedImage] = useState(null);
  const [simulated, setSimulated] = useState(() => baselineConcerns || {});
  const [imgLoading, setImgLoading] = useState(false);
  const [error, setError] = useState(null);
  const [finalScores, setFinalScores] = useState(null);
  const [ready, setReady] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const canvasRef = useRef(null);
  const imgARef = useRef(null);
  const imgBRef = useRef(null);

  const t = totalWeeks > 0 ? week / totalWeeks : 0;

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setWeek(0);
    setProjectedImage(null);
    setFinalScores(null);
    setError(null);
    setShowOriginal(false);

    async function load() {
      if (savedSimulation && Object.keys(savedSimulation).length > 0) {
        const simulated = savedSimulation.projectedScores || savedSimulation.scores || baselineConcerns || {};
        setSimulated(simulated);
        setFinalScores(simulated);
        setBaselineImage(savedSimulation.baselineImage || image);
        setProjectedImage(savedSimulation.projectedImage || null);
        setReady(true);
        return;
      }

      try {
        const res = await fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image,
            baselineConcerns: baselineConcerns || {},
            weekIndex: totalWeeks,
            totalWeeks,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Simulation failed");
        }
        const data = await res.json();
        if (cancelled) return;
        const simulated = data.projectedScores || baselineConcerns || {};
        setBaselineImage(data.baselineImage || image);
        setProjectedImage(data.projectedImages?.[0] || null);
        setFinalScores(simulated);
        setSimulated(simulated);
        setReady(true);

        if (typeof onSimulationReady === "function") {
          onSimulationReady({
            projectedScores: data.projectedScores || null,
            projectedImage: data.projectedImages?.[0] || null,
            baselineImage: data.baselineImage || null,
            mock: data.mock || false,
          });
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Simulation failed");
        setBaselineImage(image);
        setReady(true);
      }
    }

    if (image) {
      load();
    }
    return () => {
      cancelled = true;
    };
  }, [image, baselineConcerns, totalWeeks, savedSimulation, onSimulationReady]);

  const currentScores = useMemo(() => {
    if (!finalScores || week === 0) {
      return baselineConcerns || {};
    }
    return interpolateScores(baselineConcerns || {}, finalScores, t);
  }, [baselineConcerns, finalScores, week, totalWeeks]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const a = imgARef.current;
    const b = imgBRef.current;

    if (!a || !b || !a.complete || !b.complete) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (showOriginal) {
        ctx.fillStyle = "#FDFBF6";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(a, 0, 0, w / 2, h);
        ctx.drawImage(b, w / 2, 0, w / 2, h);

        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(w / 2 - 1, 0, 2, h);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px sans-serif";
        ctx.fillText("Before", 10, 20);
        ctx.fillText("After", w / 2 + 10, 20);
      } else {
        ctx.globalAlpha = 1 - t;
        ctx.drawImage(a, 0, 0, w, h);

        ctx.globalAlpha = t;
        ctx.drawImage(b, 0, 0, w, h);

        ctx.globalAlpha = 1;
      }
    };

    draw();
  }, [t, baselineImage, projectedImage, ready, showOriginal]);

  const overallBaseline = overallScore(baselineConcerns || {});
  const overallNow = overallScore(currentScores);
  const improvementPct =
    overallBaseline > 0 ? Math.round(((overallBaseline - overallNow) / overallBaseline) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-muted">
            Week {week} Projection
          </div>
          <div className="text-2xl font-semibold mt-0.5 text-ink">
            {week === 0 ? "Current Condition" : `${improvementPct}% Improved`}
          </div>
        </div>
        <TrendingUp size={20} className={improvementPct > 0 ? "text-sage" : "text-muted"} />
      </div>

      {error && (
        <div className="mb-4 rounded-2xl p-3 bg-clay/10 border border-clay/40 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-clay" />
          <p className="text-xs text-clay">{error}</p>
        </div>
      )}

      <div className="mb-4 rounded-2xl overflow-hidden border border-border bg-paper">
        {baselineImage && (
          <canvas
            ref={canvasRef}
            width={512}
            height={512}
            className="w-full aspect-square object-contain"
            style={{ background: "#FDFBF6" }}
          />
        )}
        {!baselineImage && (
          <div className="aspect-square flex items-center justify-center text-[11px] text-faint">
            {imgLoading ? "Rendering projection…" : error ? "Projection unavailable" : "Projected image will appear here"}
          </div>
        )}
        {baselineImage && projectedImage && (
          <>
            <img
              ref={imgARef}
              src={baselineImage}
              alt="Baseline"
              className="hidden"
              crossOrigin="anonymous"
            />
            <img
              ref={imgBRef}
              src={projectedImage}
              alt="Projected"
              className="hidden"
              crossOrigin="anonymous"
            />
          </>
        )}
      </div>

      {baselineImage && projectedImage && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowOriginal(false)}
            className={`flex-1 rounded-2xl py-2 text-xs font-semibold border transition-colors ${!showOriginal ? "bg-ink text-paper border-ink" : "bg-paper text-ink border-border"}`}
          >
            Blended View
          </button>
          <button
            onClick={() => setShowOriginal(true)}
            className={`flex-1 rounded-2xl py-2 text-xs font-semibold border transition-colors ${showOriginal ? "bg-ink text-paper border-ink" : "bg-paper text-ink border-border"}`}
          >
            Side by Side
          </button>
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
        {topConcerns(baselineConcerns || {}, 4).map(({ key, label }) => {
          const before = baselineConcerns[key];
          const now = currentScores[key] ?? before;
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
        Dual-state visual projection: original photo blended with YouCam simulated final state.
        Drag the slider to preview the projected improvement curve.
      </p>
    </div>
  );
}
