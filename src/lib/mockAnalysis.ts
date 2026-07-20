import {
  ALL_CONCERNS,
  ALL_ZONES,
  CONCERN_LABELS,
  ZONE_LABELS,
  severityFor,
  type ConcernKey,
  type ConcernScore,
  type SkinAnalysis,
  type ZoneKey,
  type ZoneScore,
} from "./types";

/**
 * STUB FOR YOUCAM SKIN ANALYSIS API.
 *
 * This stands in for the real YouCam Skin Analysis endpoint. It returns data in
 * the same shape the real endpoint is expected to produce (per-concern severity
 * 0–100 + per-zone breakdown), so swapping in the real call in M2/M3 is a
 * drop-in change — replace the body of `mockSkinAnalysis` with a fetch to
 * /api/analyze and map the response here.
 *
 * The result is seeded from the uploaded image bytes so different photos yield
 * different but stable results, mirroring how real analysis varies per face.
 */
export async function mockSkinAnalysis(
  image: { name: string; size: number; dataUrl: string }
): Promise<SkinAnalysis> {
  const seed = seedFromImage(image);

  // Per-concern baseline severity, jittered by the seed.
  const concerns: ConcernScore[] = ALL_CONCERNS.map((key, i) => {
    const base = BASELINE_CONCERNS[key];
    const jitter = (pseudo(seed + i * 101) - 0.5) * 34;
    const score = clamp(Math.round(base + jitter), 2, 98);
    return {
      key,
      label: CONCERN_LABELS[key],
      score,
      severity: severityFor(score),
    };
  });

  // Per-zone, per-concern severity. Zones are not uniform — e.g. under-eye
  // skews toward dark circles / wrinkles, nose toward pores / redness.
  const zones: ZoneScore[] = ALL_ZONES.map((zKey) => {
    const concernsForZone = {} as Record<ConcernKey, number>;
    let sum = 0;
    for (const cKey of ALL_CONCERNS) {
      const zoneBias = ZONE_BIAS[zKey][cKey] ?? 0;
      const global = concerns.find((c) => c.key === cKey)!.score;
      const v = clamp(Math.round(global + zoneBias + (pseudo(seed + hash(zKey) + hash(cKey)) - 0.5) * 16), 1, 99);
      concernsForZone[cKey] = v;
      sum += v;
    }
    return {
      key: zKey,
      label: ZONE_LABELS[zKey],
      score: Math.round(sum / ALL_CONCERNS.length),
      concerns: concernsForZone,
    };
  });

  const overall = Math.round(
    concerns.reduce((s, c) => s + c.score, 0) / concerns.length
  );

  return {
    overall,
    concerns,
    zones,
    healthScore: 100 - overall,
  };
}

// YouCam documents a severity scale; these baselines approximate a typical
// young-to-middle-age face so the mock demo reads believably.
const BASELINE_CONCERNS: Record<ConcernKey, number> = {
  wrinkles: 38,
  darkSpots: 44,
  redness: 52,
  darkCircles: 58,
  acne: 47,
  pores: 55,
  dryness: 41,
  firmness: 33,
};

const ZONE_BIAS: Record<ZoneKey, Partial<Record<ConcernKey, number>>> = {
  forehead: { wrinkles: 8, dryness: 6, pores: 4 },
  cheeks: { redness: 6, darkSpots: 8, dryness: 4 },
  nose: { pores: 14, redness: 10, acne: 8 },
  chin: { acne: 12, redness: 6 },
  underEye: { darkCircles: 16, wrinkles: 10, dryness: 8 },
};

function seedFromImage(image: { name: string; size: number; dataUrl: string }): number {
  let h = 2166136261;
  const str = `${image.name}:${image.size}:${image.dataUrl.length}`;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pseudo(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 997;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
