// ============================================================
// Domain logic for skin analysis, ingredient mapping, and
// scan-to-scan comparison. Imported by both API routes and
// client components so there's exactly one definition of each
// concern, zone, and ingredient — not copies drifting apart.
// ============================================================

export const CONCERN_LABELS = {
  acne: { label: "Acne & Inflammation", icon: "🫧" },
  wrinkle: { label: "Fine Lines & Wrinkles", icon: "🧬" },
  redness: { label: "Redness", icon: "🔴" },
  darkCircle: { label: "Dark Circles", icon: "🌑" },
  pore: { label: "Pores", icon: "⚫" },
  texture: { label: "Skin Texture", icon: "🟫" },
  spot: { label: "Spots & Hyperpigmentation", icon: "🟤" },
  moisture: { label: "Moisture", icon: "💧" },
  tearTrough: { label: "Tear Trough", icon: "💧" },
  droopyUpperEyelid: { label: "Droopy Upper Eyelid", icon: "👁️" },
  droopyLowerEyelid: { label: "Droopy Lower Eyelid", icon: "👁️" },
  eyeBag: { label: "Eye Bags", icon: "👜" },
  firmness: { label: "Firmness", icon: "💪" },
  oiliness: { label: "Oiliness", icon: "✨" },
  radiance: { label: "Radiance", icon: "🌟" },
};

export const ZONE_LABELS = {
  forehead: "Forehead",
  nose: "Nose",
  leftCheek: "Left Cheek",
  rightCheek: "Right Cheek",
  chin: "Chin",
  underEye: "Under-Eye",
};

export const INGREDIENT_MAP = {
  acne: ["Salicylic Acid (BHA)", "Niacinamide", "Tea Tree Oil", "Benzoyl Peroxide (low %)"],
  wrinkle: ["Retinol", "Peptide Complex", "Vitamin C", "Bakuchiol (gentler retinol alternative)"],
  redness: ["Centella Asiatica (Cica)", "Azelaic Acid", "Allantoin", "Panthenol"],
  darkCircle: ["Vitamin K", "Caffeine", "Peptide Eye Complex", "Vitamin C"],
  pore: ["Niacinamide", "BHA (Salicylic Acid)", "Clay-Based Mask", "Zinc PCA"],
  texture: ["AHA (Glycolic/Lactic Acid)", "Retinol", "Enzyme Exfoliant", "Ceramide"],
  spot: ["Vitamin C", "Alpha Arbutin", "Tranexamic Acid", "Niacinamide"],
  moisture: ["Hyaluronic Acid", "Ceramide", "Squalane", "Glycerin"],
};

/**
 * Deterministic pseudo-random so repeated analysis of visually similar
 * input feels stable rather than jarringly random on every call.
 */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * MOCK — stands in for the YouCam Skin Analysis API.
 *
 * Real integration point: replace this function's body with a fetch()
 * to your own /api/analyze backend call to YouCam, once you complete
 * roadmap milestones M1 (confirm real response shape) and M2 (backend
 * proxy holding the API key). The return shape below — concerns and
 * zones as 0-100 scores — is deliberately modeled on YouCam's documented
 * severity scale, so the rest of the app does not need to change when
 * this function is swapped out.
 */
export function mockSkinAnalysis(seed) {
  const concerns = {};
  Object.keys(CONCERN_LABELS).forEach((key, i) => {
    const r = seededRandom(seed + i * 17);
    concerns[key] = Math.round(20 + r * 60);
  });

  const zones = {};
  Object.keys(ZONE_LABELS).forEach((key, i) => {
    const r = seededRandom(seed + i * 31 + 100);
    zones[key] = Math.round(30 + r * 55);
  });

  return { concerns, zones };
}

/**
 * MOCK — stands in for the YouCam AI Skin Simulation API.
 *
 * IMPORTANT: the real Skin Simulation API returns actual before/after
 * IMAGES, not interpolated numbers. This function only produces a
 * plausible numeric curve so the timeline UI has something to render
 * client-side. See ROADMAP.md Milestone M3 — this is the single
 * highest-priority mock to replace before submission, since a visual
 * projection is a fundamentally stronger result than a number going down.
 */
export function mockSimulation(baselineConcerns, weekIndex, totalWeeks) {
  const progress = weekIndex / totalWeeks;
  const improved = {};
  Object.entries(baselineConcerns).forEach(([key, val]) => {
    const maxImprovement = val * 0.55;
    const curve = 1 - Math.pow(1 - progress, 2);
    improved[key] = Math.max(5, Math.round(val - maxImprovement * curve));
  });
  return improved;
}

export function topConcerns(concerns, n = 3) {
  const entries = Object.entries(concerns || {});
  return entries
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, n)
    .map(([key, score]) => {
      const entry = CONCERN_LABELS[key];
      return {
        key,
        score,
        label: typeof entry === "string" ? entry : entry?.label || key,
        icon: typeof entry === "string" ? "" : entry?.icon || "",
      };
    });
}

export function overallScore(concerns) {
  const values = Object.values(concerns);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Compares two scans (current vs. a past one) and returns a per-concern
 * delta plus an overall direction. Positive delta = concern score went
 * down = skin improved, since lower severity score is better throughout
 * this app. Used by both the auto "vs. last scan" view and the manual
 * comparison picker — same function, different pair of scans passed in.
 */
export function compareScans(current, previous) {
  const deltas = {};
  const allKeys = new Set([
    ...Object.keys(current.concern_scores || {}),
    ...Object.keys(previous.concern_scores || {}),
  ]);
  allKeys.forEach((key) => {
    const currentVal = current.concern_scores[key];
    const previousVal = previous.concern_scores[key];
    if (typeof currentVal !== "number" || typeof previousVal !== "number") return;
    deltas[key] = {
      current: currentVal,
      previous: previousVal,
      delta: previousVal - currentVal,
      label: CONCERN_LABELS[key] || key,
    };
  });

  const entries = Object.values(deltas);
  const overallCurrent = entries.length
    ? Math.round(entries.reduce((a, b) => a + b.current, 0) / entries.length)
    : 0;
  const overallPrevious = entries.length
    ? Math.round(entries.reduce((a, b) => a + b.previous, 0) / entries.length)
    : 0;

  return {
    deltas,
    overallCurrent,
    overallPrevious,
    overallDelta: overallPrevious - overallCurrent,
    daysBetween: Math.round(
      (new Date(current.created_at) - new Date(previous.created_at)) / (1000 * 60 * 60 * 24)
    ),
  };
}

export function scoreColor(score) {
  if (score >= 60) return "#B85C4A";
  if (score >= 35) return "#C9A876";
  return "#4A6355";
}

export function scoreLabel(score) {
  if (score >= 61) return "Significant";
  if (score >= 31) return "Moderate";
  return "Low";
}

export const CONCERN_EXPLANATIONS = {
  acne: "Active breakouts, bumps, or inflammation",
  wrinkle: "Fine lines or loss of firmness",
  redness: "Irritation, sensitivity, or flushing",
  darkCircle: "Dark circles or under-eye dullness",
  pore: "Visible pore size or congestion",
  texture: "Rough or uneven skin surface",
  spot: "Dark spots or pigmentation",
  moisture: "Hydration level",
};

export const ZONE_EXPLANATIONS = {
  forehead: "Forehead lines, oiliness, and texture",
  nose: "Pore size, oiliness, and blackheads",
  leftCheek: "Redness, pores, and texture on the left cheek",
  rightCheek: "Redness, pores, and texture on the right cheek",
  chin: "Breakouts, texture, and pigmentation",
  underEye: "Dark circles, puffiness, and fine lines",
};

export function concernExplanation(key) {
  const entry = CONCERN_LABELS[key];
  return typeof entry === "string" ? entry : entry?.label || "Skin condition indicator";
}

export function concernIcon(key) {
  const entry = CONCERN_LABELS[key];
  return typeof entry === "string" ? "" : entry?.icon || "";
}

export function zoneExplanation(key) {
  return ZONE_EXPLANATIONS[key] || "Facial zone";
}

const ROUTINE_MAP = {
  acne: { morning: "Gentle Cleanser + Niacinamide Serum", evening: "Salicylic Acid Treatment + Light Moisturizer", weekly: "Clay Mask (1x/week)" },
  wrinkle: { morning: "Vitamin C Serum + SPF", evening: "Retinol + Rich Moisturizer", weekly: "Peptide Mask (1x/week)" },
  redness: { morning: "Centella Serum + Mineral SPF", evening: "Azelaic Acid + Barrier Cream", weekly: "Soothing Sheet Mask (1x/week)" },
  darkCircle: { morning: "Caffeine Eye Serum + SPF", evening: "Peptide Eye Cream + Retinol", weekly: "Eye Mask (2x/week)" },
  pore: { morning: "Niacinamide Serum + Clay Cleanser", evening: "BHA Treatment + Moisturizer", weekly: "Deep Pore strip/Mask (1x/week)" },
  texture: { morning: "Gentle AHA Exfoliant (2x/week)", evening: "Retinol + Ceramide Cream", weekly: "Enzyme Exfoliant (1x/week)" },
  spot: { morning: "Vitamin C + SPF (essential)", evening: "Alpha Arbutin + Niacinamide", weekly: "Brightening Mask (2x/week)" },
  moisture: { morning: "Hyaluronic Acid + Light Moisturizer", evening: "Squalane Oil + Rich Cream", weekly: "Hydrating Mask (2x/week)" },
  tearTrough: { morning: "Caffeine Eye Serum", evening: "Peptide Eye Cream + Retinol", weekly: "Eye Mask (2x/week)" },
  droopyUpperEyelid: { morning: "Caffeine Eye Roller", evening: "Peptide Eye Cream", weekly: "Cooling Eye Mask (2x/week)" },
  droopyLowerEyelid: { morning: "Caffeine Eye Roller", evening: "Peptide Eye Cream", weekly: "Cooling Eye Mask (2x/week)" },
  eyeBag: { morning: "Caffeine Eye Serum + Cold Roller", evening: "Peptide Eye Cream", weekly: "Detox Eye Mask (2x/week)" },
  firmness: { morning: "Vitamin C + Peptide Serum", evening: "Retinol + Collagen Moisturizer", weekly: "Firming Mask (1x/week)" },
  oiliness: { morning: "Niacinamide + Mattifying Moisturizer", evening: "BHA + Light Gel Moisturizer", weekly: "Clay Mask (1x/week)" },
  radiance: { morning: "Vitamin C + Exfoliant (2x/week)", evening: "Retinol + Facial Oil", weekly: "Glowing Mask (1x/week)" },
};

export function buildRoutine(concerns) {
  const top = Object.entries(concerns || {})
    .filter(([, s]) => typeof s === "number" && s >= 31)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 4)
    .map(([key]) => key);

  const routine = { morning: [], evening: [], weekly: [] };
  const seen = new Set();

  top.forEach((key) => {
    const steps = ROUTINE_MAP[key];
    if (!steps) return;
    [steps.morning, steps.evening, steps.weekly].forEach((step, idx) => {
      const bucket = idx === 0 ? "morning" : idx === 1 ? "evening" : "weekly";
      if (step && !seen.has(step)) {
        seen.add(step);
        routine[bucket].push(step);
      }
    });
  });

  if (routine.morning.length === 0) routine.morning = ["Gentle Cleanser + Moisturizer + SPF"];
  if (routine.evening.length === 0) routine.evening = ["Gentle Cleanser + Moisturizer"];
  if (routine.weekly.length === 0) routine.weekly = ["Exfoliate + Hydrating Mask (1x/week)"];

  return routine;
}
