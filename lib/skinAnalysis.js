// ============================================================
// Domain logic for skin analysis, ingredient mapping, and
// scan-to-scan comparison. Imported by both API routes and
// client components so there's exactly one definition of each
// concern, zone, and ingredient — not copies drifting apart.
// ============================================================

export const CONCERN_LABELS = {
  acne: "Acne & Inflammation",
  wrinkle: "Fine Lines & Wrinkles",
  redness: "Redness",
  darkCircle: "Dark Circles",
  pore: "Pores",
  texture: "Skin Texture",
  spot: "Spots & Hyperpigmentation",
  moisture: "Moisture",
  tearTrough: "Tear Trough",
  droopyUpperEyelid: "Droopy Upper Eyelid",
  droopyLowerEyelid: "Droopy Lower Eyelid",
  eyeBag: "Eye Bags",
  firmness: "Firmness",
  oiliness: "Oiliness",
  radiance: "Radiance",
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
  return Object.entries(concerns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, score]) => ({ key, score, label: CONCERN_LABELS[key] }));
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
  Object.keys(CONCERN_LABELS).forEach((key) => {
    const currentVal = current.concern_scores[key] ?? 0;
    const previousVal = previous.concern_scores[key] ?? 0;
    deltas[key] = {
      current: currentVal,
      previous: previousVal,
      delta: previousVal - currentVal, // positive = improved
      label: CONCERN_LABELS[key],
    };
  });

  const overallCurrent = overallScore(current.concern_scores);
  const overallPrevious = overallScore(previous.concern_scores);

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
  return CONCERN_EXPLANATIONS[key] || "Skin condition indicator";
}

export function zoneExplanation(key) {
  return ZONE_EXPLANATIONS[key] || "Facial zone";
}
