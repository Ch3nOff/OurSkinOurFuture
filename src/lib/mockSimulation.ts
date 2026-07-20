import {
  ALL_CONCERNS,
  type ConcernKey,
  type ProjectionPoint,
  type SkinAnalysis,
  type SkinSimulation,
} from "./types";

/**
 * STUB FOR YOUCAM AI SKIN SIMULATION API.
 *
 * NOTE: the real YouCam AI Skin Simulation API returns *images* (before/after
 * render of the face under a treatment), not numbers. This mock deliberately
 * returns only numbers — the projected severity per concern along a 12-week
 * timeline — because that is the cheapest stand-in that lets the timeline
 * slider work today. Replacing this with the real, image-based API in M3 is the
 * single highest-leverage task on the roadmap.
 *
 * The curve uses a diminishing-returns shape (1 - e^{-k t}), so early weeks show
 * the most change and the tail flattens — matching how real routines behave.
 */
export async function mockSimulation(
  analysis: SkinAnalysis
): Promise<SkinSimulation> {
  const weeks = [0, 1, 2, 4, 6, 8, 10, 12];

  // Each concern responds to treatment at a different rate and ceiling.
  const rate = (key: ConcernKey): number => RATE[key];
  const ceiling = (key: ConcernKey): number => CEILING[key];

  const timeline: ProjectionPoint[] = weeks.map((week) => {
    const concerns = {} as Record<ConcernKey, number>;
    for (const key of ALL_CONCERNS) {
      const start = analysis.concerns.find((c) => c.key === key)!.score;
      const t = week / 12;
      const k = rate(key);
      const improvement = (1 - Math.exp(-k * t)) * ceiling(key);
      concerns[key] = Math.max(1, Math.round(start * (1 - improvement)));
    }
    return { week, concerns };
  });

  const startAvg =
    analysis.concerns.reduce((s, c) => s + c.score, 0) /
    analysis.concerns.length;
  const endAvg =
    ALL_CONCERNS.reduce(
      (s, key) => s + timeline[timeline.length - 1].concerns[key],
      0
    ) / ALL_CONCERNS.length;
  const improvementPct = Math.round(((startAvg - endAvg) / startAvg) * 100);

  return { timeline, improvementPct };
}

// Fraction of severity that can be improved at week 12 for each concern.
const CEILING: Record<ConcernKey, number> = {
  wrinkles: 0.28,
  darkSpots: 0.34,
  redness: 0.4,
  darkCircles: 0.3,
  acne: 0.55,
  pores: 0.22,
  dryness: 0.6,
  firmness: 0.2,
};

// Speed of response (higher = faster early gains).
const RATE: Record<ConcernKey, number> = {
  wrinkles: 1.6,
  darkSpots: 0.9,
  redness: 2.4,
  darkCircles: 1.1,
  acne: 2.8,
  pores: 1.4,
  dryness: 3.2,
  firmness: 0.8,
};
