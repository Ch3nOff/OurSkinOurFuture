"use client";

import { useState } from "react";
import { ZONE_LABELS, scoreColor, scoreLabel, zoneExplanation, CONCERN_LABELS } from "@/lib/skinAnalysis";

const POSITIONS = {
  forehead: { cx: 150, cy: 55, r: 34, x: 105, y: 18, w: 90, h: 74 },
  leftCheek: { cx: 90, cy: 150, r: 30, x: 45, y: 100, w: 90, h: 100 },
  rightCheek: { cx: 210, cy: 150, r: 30, x: 165, y: 100, w: 90, h: 100 },
  nose: { cx: 150, cy: 135, r: 20, x: 125, y: 115, w: 50, h: 40 },
  underEye: { cx: 150, cy: 95, r: 16, x: 128, y: 78, w: 44, h: 34 },
  chin: { cx: 150, cy: 215, r: 26, x: 118, y: 185, w: 64, h: 60 },
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

export default function FaceZoneMap({ image, zones, masks, concerns, onImageClick }) {
  const [hoveredZone, setHoveredZone] = useState(null);
  const [showMasks, setShowMasks] = useState(true);
  const [selectedMask, setSelectedMask] = useState(null);

  const maskEntries = Object.entries(masks || {});
  const concernEntries = concerns
    ? Object.entries(concerns)
        .filter(([, score]) => typeof score === "number")
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    : [];

  return (
    <div>
      {/* Face with overlay */}
      <div className="relative w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-paper border border-border">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="Scan"
            className="w-full aspect-[3/4] object-contain cursor-zoom-in"
            style={{ background: "#FDFBF6" }}
            onClick={() => onImageClick?.(image)}
          />
        )}

        {/* Mask overlay layer */}
        {showMasks && maskEntries.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {maskEntries.map(([key, url]) => {
              const zone = maskZone(url);
              const pos = POSITIONS[zone];
              if (!pos) return null;
              const isSelected = selectedMask === key;
              return (
                <img
                  key={key}
                  src={url}
                  alt=""
                  className={`absolute object-cover mix-blend-multiply rounded-sm transition-opacity ${
                    selectedMask && !isSelected ? "opacity-20" : "opacity-60"
                  }`}
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

        {/* Zone indicator circles */}
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

      {/* Zone tooltip */}
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

      {/* Per-concern breakdown with masks */}
      {concernEntries.length > 0 && (
        <div className="mt-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">All Concerns</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {concernEntries.map(([key, score]) => {
              const maskUrl = masks?.[key];
              const label = typeof CONCERN_LABELS[key] === "string" ? CONCERN_LABELS[key] : CONCERN_LABELS[key]?.label || key;
              const isSelected = selectedMask === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedMask(isSelected ? null : key)}
                  className={`rounded-xl p-2 text-left border transition-colors ${
                    isSelected ? "border-gold bg-[#F0EBDD]" : "border-border bg-card hover:border-gold"
                  }`}
                >
                  {maskUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={maskUrl}
                      alt=""
                      className="w-full aspect-square object-cover rounded-lg mb-1.5 opacity-80 cursor-zoom-in"
                      onClick={(e) => {
                        e.stopPropagation();
                        onImageClick?.(maskUrl);
                      }}
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-lg bg-paper mb-1.5 flex items-center justify-center">
                      <span className="text-lg font-semibold text-muted">{score}</span>
                    </div>
                  )}
                  <div className="text-[11px] font-medium text-ink truncate">{label}</div>
                  <div className="text-[10px] font-mono" style={{ color: scoreColor(score) }}>
                    {score}/100 · {scoreLabel(score)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mask toggle */}
      {maskEntries.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowMasks((s) => !s)}
            className="text-[10px] font-mono uppercase tracking-widest text-muted hover:text-ink px-2 py-1 rounded-full border border-border"
          >
            {showMasks ? "Hide masks" : "Show masks"}
          </button>
        </div>
      )}
    </div>
  );
}
