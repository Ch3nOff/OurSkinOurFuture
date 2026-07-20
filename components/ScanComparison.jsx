"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { compareScans } from "@/lib/skinAnalysis";

function DeltaBadge({ delta }) {
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-mono text-sage">
        <ArrowUp size={11} />
        {delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-mono text-clay">
        <ArrowDown size={11} />
        {Math.abs(delta)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-mono text-faint">
      <Minus size={11} />
      0
    </span>
  );
}

/**
 * currentScan: the scan just completed this session.
 * history: array of the user's past scans, newest first, NOT including
 *          currentScan (currentScan may not be persisted yet at render time).
 */
export default function ScanComparison({ currentScan, history }) {
  const [selectedId, setSelectedId] = useState(history[0]?.id ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const comparedTo = useMemo(
    () => history.find((h) => h.id === selectedId) ?? null,
    [history, selectedId]
  );

  const comparison = useMemo(() => {
    if (!comparedTo) return null;
    return compareScans(currentScan, comparedTo);
  }, [currentScan, comparedTo]);

  if (history.length === 0) {
    return (
      <section className="rounded-3xl p-6 bg-card border border-border">
        <div className="text-xs font-mono uppercase tracking-widest mb-2 text-muted">Progress Comparison</div>
        <p className="text-sm text-muted leading-relaxed">
          This is your first saved scan. Come back next week and this section will compare your new results
          against today's baseline automatically.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl p-6 bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-mono uppercase tracking-widest text-muted">Progress Comparison</div>

        <div className="relative">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-ink bg-paper border border-border rounded-full px-3 py-1.5"
          >
            vs. {comparedTo ? new Date(comparedTo.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
            <ChevronDown size={13} className={pickerOpen ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>

          {pickerOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 max-h-56 overflow-y-auto rounded-2xl bg-card border border-border shadow-lg z-10 py-1.5">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    setSelectedId(h.id);
                    setPickerOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                    h.id === selectedId ? "text-ink bg-paper" : "text-muted hover:bg-paper"
                  }`}
                >
                  {new Date(h.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {comparison && (
        <>
          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-2xl font-semibold text-ink">
              {comparison.overallDelta > 0 ? "Improved" : comparison.overallDelta < 0 ? "Changed" : "Steady"}
            </span>
            <span className="text-xs font-mono text-faint">
              over {comparison.daysBetween} {comparison.daysBetween === 1 ? "day" : "days"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {Object.entries(comparison.deltas)
              .sort((a, b) => Math.abs(b[1].delta) - Math.abs(a[1].delta))
              .slice(0, 5)
              .map(([key, d]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 bg-paper border border-border"
                >
                  <span className="text-xs font-medium text-[#4A453B]">{d.label}</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-mono text-faint">
                      {d.previous} → {d.current}
                    </span>
                    <DeltaBadge delta={d.delta} />
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </section>
  );
}
