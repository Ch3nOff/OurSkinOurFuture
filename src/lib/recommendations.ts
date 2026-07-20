import {
  type ConcernKey,
  type IngredientRecommendation,
  type SkinAnalysis,
} from "./types";

interface IngredientInfo {
  ingredient: string;
  explanation: string;
}

// Plain-language mapping from a skin concern to the active ingredient that
// targets it, with a short explanation of why it helps.
const INGREDIENT_BY_CONCERN: Record<ConcernKey, IngredientInfo> = {
  wrinkles: {
    ingredient: "Retinol",
    explanation:
      "Speeds cell turnover and kickstarts collagen, which softens fine lines over 8–12 weeks of consistent nightly use.",
  },
  darkSpots: {
    ingredient: "Vitamin C",
    explanation:
      "A brightening antioxidant that interrupts excess pigment and helps existing dark spots fade when worn in the morning under sunscreen.",
  },
  redness: {
    ingredient: "Centella Asiatica",
    explanation:
      "A calming botanical that strengthens the skin barrier and visibly reduces reactive redness and sensitivity.",
  },
  darkCircles: {
    ingredient: "Caffeine + Vitamin K",
    explanation:
      "Caffeine de-puffs and tightens the under-eye area while Vitamin K supports the tiny vessels that cause discoloration.",
  },
  acne: {
    ingredient: "Salicylic Acid (BHA)",
    explanation:
      "Oil-soluble exfoliant that clears inside the pore, reducing active blemishes and preventing new ones without stripping skin.",
  },
  pores: {
    ingredient: "Niacinamide",
    explanation:
      "Regulates oil production and improves skin texture so pores look tighter and less visible within a few weeks.",
  },
  dryness: {
    ingredient: "Hyaluronic Acid",
    explanation:
      "Pulls moisture into the skin and holds it there, restoring bounce and relieving tightness from the first use.",
  },
  firmness: {
    ingredient: "Peptides",
    explanation:
      "Signal-building blocks that support the skin's own collagen network, improving firmness and resilience over time.",
  },
};

/**
 * Build a ranked list of ingredient recommendations from the top concerns.
 * Concerns are weighted by their severity so the most pressing issues surface
 * the strongest recommendations.
 */
export function buildRecommendations(
  analysis: SkinAnalysis,
  topN = 4
): IngredientRecommendation[] {
  const ranked = [...analysis.concerns]
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  const maxScore = ranked[0]?.score ?? 100;

  return ranked.map((c) => {
    const info = INGREDIENT_BY_CONCERN[c.key];
    return {
      concern: c.key,
      concernLabel: c.label,
      ingredient: info.ingredient,
      explanation: info.explanation,
      weight: Math.round((c.score / maxScore) * 100) / 100,
    };
  });
}
