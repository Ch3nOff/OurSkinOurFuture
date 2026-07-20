export type ConcernKey =
  | "wrinkles"
  | "darkSpots"
  | "redness"
  | "darkCircles"
  | "acne"
  | "pores"
  | "dryness"
  | "firmness";

export interface ConcernScore {
  key: ConcernKey;
  label: string;
  /** 0 = best possible skin, 100 = most severe. Matches YouCam severity-scale shape. */
  score: number;
  /** Qualitative severity band derived from the score. */
  severity: "low" | "moderate" | "high";
}

export type ZoneKey = "forehead" | "cheeks" | "nose" | "chin" | "underEye";

export interface ZoneScore {
  key: ZoneKey;
  label: string;
  /** Average severity across concerns for this zone (0–100). */
  score: number;
  /** Per-concern breakdown within the zone. */
  concerns: Record<ConcernKey, number>;
}

export interface SkinAnalysis {
  overall: number;
  concerns: ConcernScore[];
  zones: ZoneScore[];
  /** Simple 0–100 "skin health" derived from inverse of overall severity. */
  healthScore: number;
}

export interface IngredientRecommendation {
  concern: ConcernKey;
  concernLabel: string;
  ingredient: string;
  explanation: string;
  /** How strongly this concern drives the recommendation (0–1). */
  weight: number;
}

export interface ProjectionPoint {
  /** Week number along the timeline. */
  week: number;
  /** Per-concern projected severity for that week. */
  concerns: Record<ConcernKey, number>;
}

export interface SkinSimulation {
  /** Timeline of projected severity per concern, weeks 0–12. */
  timeline: ProjectionPoint[];
  /** Headline improvement percentage at week 12 (avg severity reduction). */
  improvementPct: number;
}

export const CONCERN_LABELS: Record<ConcernKey, string> = {
  wrinkles: "Wrinkles",
  darkSpots: "Dark Spots",
  redness: "Redness",
  darkCircles: "Dark Circles",
  acne: "Acne & Blemishes",
  pores: "Pore Visibility",
  dryness: "Dryness",
  firmness: "Loss of Firmness",
};

export const ZONE_LABELS: Record<ZoneKey, string> = {
  forehead: "Forehead",
  cheeks: "Cheeks",
  nose: "Nose",
  chin: "Chin",
  underEye: "Under-Eye",
};

export const ALL_CONCERNS: ConcernKey[] = [
  "wrinkles",
  "darkSpots",
  "redness",
  "darkCircles",
  "acne",
  "pores",
  "dryness",
  "firmness",
];

export const ALL_ZONES: ZoneKey[] = [
  "forehead",
  "cheeks",
  "nose",
  "chin",
  "underEye",
];

export function severityFor(score: number): ConcernScore["severity"] {
  if (score < 34) return "low";
  if (score < 67) return "moderate";
  return "high";
}
