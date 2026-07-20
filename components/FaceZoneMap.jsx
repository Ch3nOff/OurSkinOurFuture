"use client";

import { useState } from "react";
import { ZONE_LABELS, scoreColor } from "@/lib/skinAnalysis";

const POSITIONS = {
  forehead: { cx: 150, cy: 55, r: 34 },
  leftCheek: { cx: 90, cy: 150, r: 30 },
  rightCheek: { cx: 210, cy: 150, r: 30 },
  nose: { cx: 150, cy: 135, r: 20 },
  underEye: { cx: 150, cy: 95, r: 16 },
  chin: { cx: 150, cy: 215, r: 26 },
};

export default function FaceZoneMap({ zones }) {
  const [hoveredZone, setHoveredZone] = useState(null);

  return (
    <div className="relative">
      <svg viewBox="0 0 300 260" className="w-full max-w-[280px] mx-auto">
        <path
          d="M150 15 C 210 15, 245 60, 245 130 C 245 195, 205 245, 150 245 C 95 245, 55 195, 55 130 C 55 60, 90 15, 150 15 Z"
          fill="#FDFBF6"
          stroke="#D9D2BE"
          strokeWidth="1.5"
        />
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
                fillOpacity={isHovered ? 0.32 : 0.18}
                stroke={scoreColor(score)}
                strokeWidth={isHovered ? 2 : 1}
                strokeOpacity={0.6}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredZone(key)}
                onMouseLeave={() => setHoveredZone(null)}
              />
              <text
                x={pos.cx}
                y={pos.cy}
                textAnchor="middle"
                dy="0.35em"
                fontSize="13"
                fontFamily="'IBM Plex Mono', monospace"
                fontWeight="600"
                fill="#0F1210"
                className="pointer-events-none select-none"
              >
                {score}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="text-center mt-1 h-4">
        {hoveredZone && (
          <span className="text-xs font-mono tracking-wide text-muted">{ZONE_LABELS[hoveredZone]}</span>
        )}
      </div>
    </div>
  );
}
