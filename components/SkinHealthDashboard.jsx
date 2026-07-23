import { useMemo } from "react";
import { topConcerns, CONCERN_LABELS } from "@/lib/skinAnalysis";

export default function SkinHealthDashboard({ analysis }) {
  const snapshot = useMemo(() => {
    if (!analysis?.concerns) return null;
    const top = topConcerns(analysis.concerns, 3);
    if (top.length === 0) return null;
    const avg = Math.round(top.reduce((s, c) => s + c.score, 0) / top.length);
    const label = avg >= 70 ? "Needs attention" : avg >= 40 ? "Moderate" : "Good";
    const color = avg >= 70 ? "#B85C4A" : avg >= 40 ? "#C9A876" : "#4A6355";
    const bg = avg >= 70 ? "#B85C4A10" : avg >= 40 ? "#C9A87610" : "#4A635510";
    return { avg, label, color, bg, top };
  }, [analysis]);

  if (!snapshot) return null;

  return (
    <section className="rounded-3xl p-5 mb-4 bg-card border border-border">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">Skin Health Dashboard</div>
      <div className="flex flex-wrap gap-3">
        {snapshot.top.map((c) => {
          const icon = typeof CONCERN_LABELS[c.key] === "string" ? "" : CONCERN_LABELS[c.key]?.icon || "";
          const label = typeof CONCERN_LABELS[c.key] === "string" ? CONCERN_LABELS[c.key] : CONCERN_LABELS[c.key]?.label || c.key;
          const pct = Math.min(100, Math.max(0, c.score));
          const barColor = pct >= 61 ? "bg-[#B85C4A]" : pct >= 31 ? "bg-[#C9A876]" : "bg-[#4A6355]";
          return (
            <div key={c.key} className="flex-1 min-w-[120px] rounded-2xl p-3 border border-border group hover:shadow-md hover:border-[#C9A876]/40 hover:-translate-y-0.5 transition-all duration-200" style={{ background: snapshot.bg }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm leading-none">{icon}</span>
                <span className="text-[11px] font-medium text-ink truncate">{label}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#F0EBDD] overflow-hidden mb-1">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="text-right text-[10px] font-mono" style={{ color: snapshot.color }}>{pct}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
