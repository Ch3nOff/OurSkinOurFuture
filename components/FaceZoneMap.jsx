"use client";

import { useState } from "react";
import { ZONE_LABELS, scoreColor, scoreLabel, zoneExplanation } from "@/lib/skinAnalysis";

const POSITIONS = {
  forehead: { cx: 150, cy: 55, r: 34, x: 50, y: 18, w: 70, h: 35 },
  leftCheek: { cx: 90, cy: 150, r: 30, x: 18, y: 45, w: 35, h: 40 },
  rightCheek: { cx: 210, cy: 150, r: 30, x: 65, y: 45, w: 35, h: 40 },
  nose: { cx: 150, cy: 135, r: 20, x: 40, y: 40, w: 25, h: 30 },
  underEye: { cx: 150, cy: 95, r: 16, x: 30, y: 25, w: 40, h: 20 },
  chin: { cx: 150, cy: 215, r: 26, x: 35, y: 75, w: 35, h: 25 },
};

const TYPE_TO_ZONE = {
  tear_trough: "underEye",
  droopy_upper_eyelid: "underEye",
  droopy_lower_eyelid: "underEye",
  eye_bag: "underEye",
  dark_circle: "underEye",
  dark_circle_v2: "underEye",
  wrinkle: "forehead",
  forehead: "forehead",
  acne: "chin",
  pore: "nose",
  texture: "leftCheek",
  redness: "leftCheek",
  age_spot: "leftCheek",
  moisture: "leftCheek",
  firmness: "forehead",
  oiliness: "nose",
  radiance: "forehead",
};

function maskZone(url) {
  if (!url) return null;
  const lower = url.toLowerCase();
  for (const [type, zone] of Object.entries(TYPE_TO_ZONE)) {
    if (lower.includes(`_${type}_`) || lower.includes(`_${type}_output`)) return zone;
  }
  return "leftCheek";
}

export default function FaceZoneMap({ image, zones, masks }) {
  const [hoveredZone, setHoveredZone] = useState(null);
  const [showMasks, setShowMasks] = useState(true);

  const maskEntries = Object.entries(masks || {});

  return (
    <div>
      <div className="relative w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-paper border border-border">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Scan" className="w-full aspect-[4/5] object-cover" />
        )}

        {showMasks && maskEntries.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {maskEntries.map(([key, url]) => {
              const zone = maskZone(url);
              const pos = POSITIONS[zone];
              if (!pos) return null;
              return (
                <img
                  key={key}
                  src={url}
                  alt=""
                  className="absolute object-cover opacity-60 mix-blend-multiply rounded-sm"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: `${pos.w}%`,
                    height: `${pos.h}%`,
                  }}
                />
              );
            })}
          </div>
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
                  fillOpacity={isHovered ? 0.3 : 0.12}
                  stroke={scoreColor(score)}
                  strokeWidth={isHovered ? 2.5 : 1.2}
                  strokeOpacity={0.7}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredZone(key)}
                  onMouseLeave={() => setHoveredZone(null)}
                />
                <text
                  x={pos.cx}
                  y={pos.cy}
                  textAnchor="middle"
                  dy="0.35em"
                  fontSize="11"
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

      <div className="flex items-center justify-between mt-2">
        <div className="text-center min-h-[44px] flex-1">
          {hoveredZone && (
            <div className="inline-flex flex-col items-start text-left bg-card border border-border rounded-2xl px-3 py-2 shadow-sm">
              <span className="text-xs font-semibold text-ink">{ZONE_LABELS[hoveredZone]}</span>
              <span className="text-[11px] text-muted">
                {zones[hoveredZone] ?? 0}/100 · {scoreLabel(zones[hoveredZone] ?? 0)} · {zoneExplanation(hoveredZone)}
              </span>
            </div>
          )}
        </div>
        {maskEntries.length > 0 && (
          <button
            onClick={() => setShowMasks((s) => !s)}
            className="text-[10px] font-mono uppercase tracking-widest text-muted hover:text-ink px-2 py-1 rounded-full border border-border"
          >
            {showMasks ? "Hide masks" : "Show masks"}
          </button>
        )}
      </div>
    </div>
  );
}
