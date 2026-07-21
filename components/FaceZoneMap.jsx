"use client";

import { useState } from "react";
import { ZONE_LABELS, scoreColor, scoreLabel, zoneExplanation } from "@/lib/skinAnalysis";

const POSITIONS = {
  forehead: { cx: 150, cy: 55, r: 34 },
  leftCheek: { cx: 90, cy: 150, r: 30 },
  rightCheek: { cx: 210, cy: 150, r: 30 },
  nose: { cx: 150, cy: 135, r: 20 },
  underEye: { cx: 150, cy: 95, r: 16 },
  chin: { cx: 150, cy: 215, r: 26 },
};

export default function FaceZoneMap({ image, zones }) {
  const [hoveredZone, setHoveredZone] = useState(null);

  return (
    <div className="relative">
      <div className="relative w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-paper border border-border">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="Scan"
            className="w-full aspect-[4/5] object-cover"
          />
        )}
        <svg
          viewBox="0 0 300 260"
          className="absolute inset-0 w-full h-full"
          style={{ aspectRatio: "4/5" }}
        >
          {Object.entries(POSITIONS).map(([key, pos]) => {
            const score = zones[key] ?? 0;
            const isHovered = hoveredZone === key;
            return (
              <g key={key}>
                <circle
                  cx={pos.cx}
                  cy={pos.cy}
                  r={pos.r}
                  fill={scoreColor(score)}
                  fillOpacity={isHovered ? 0.35 : 0.2}
                  stroke={scoreColor(score)}
                  strokeWidth={isHovered ? 2.5 : 1.2}
                  strokeOpacity={0.8}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredZone(key)}
                  onMouseLeave={() => setHoveredZone(null)}
                />
                <text
                  x={pos.cx}
                  y={pos.cy}
                  textAnchor="middle"
                  dy="0.35em"
                  fontSize="12"
                  fontFamily="'IBM Plex Mono', monospace"
                  fontWeight="700"
                  fill="#0F1210"
                  className="pointer-events-none select-none"
                >
                  {score}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="text-center mt-2 min-h-[44px]">
        {hoveredZone && (
          <div className="inline-flex flex-col items-start text-left bg-card border border-border rounded-2xl px-3 py-2 shadow-sm">
            <span className="text-xs font-semibold text-ink">{ZONE_LABELS[hoveredZone]}</span>
            <span className="text-[11px] text-muted">
              {zones[hoveredZone] ?? 0}/100 · {scoreLabel(zones[hoveredZone] ?? 0)} · {zoneExplanation(hoveredZone)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
