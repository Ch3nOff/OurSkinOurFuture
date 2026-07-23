export const GARMENT_CATALOG = [
  {
    id: "emerald-green-tee",
    name: "Emerald Green Tee",
    color: "#2E8B57",
    colorName: "Emerald Green",
    category: "tops",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
    undertones: ["cool", "neutral"],
    bestFor: ["redness", "oiliness"],
    reason: "Cool green tones neutralize facial redness and calm inflammation visually.",
  },
  {
    id: "soft-navy-blouse",
    name: "Soft Navy Blouse",
    color: "#3B5998",
    colorName: "Soft Navy",
    category: "tops",
    imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop",
    undertones: ["cool", "warm"],
    bestFor: ["wrinkle", "age_spot"],
    reason: "Deep navy adds sophistication while balancing warm undertones.",
  },
  {
    id: "dusty-rose-top",
    name: "Dusty Rose Top",
    color: "#D4A5A5",
    colorName: "Dusty Rose",
    category: "tops",
    imageUrl: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=500&fit=crop",
    undertones: ["warm", "neutral"],
    bestFor: ["dryness", "dullness"],
    reason: "Warm rose harmonizes with golden undertones and adds healthy glow.",
  },
  {
    id: "olive-casual-shirt",
    name: "Olive Casual Shirt",
    color: "#808000",
    colorName: "Olive",
    category: "tops",
    imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=400&h=500&fit=crop",
    undertones: ["warm", "neutral"],
    bestFor: ["redness", "sensitivity"],
    reason: "Olive green counterbalances redness and works with earthy undertones.",
  },
  {
    id: "lavender-silk-blouse",
    name: "Lavender Silk Blouse",
    color: "#E6E6FA",
    colorName: "Lavender",
    category: "tops",
    imageUrl: "https://images.unsplash.com/photo-1551488852-080175b9270e?w=400&h=500&fit=crop",
    undertones: ["cool", "neutral"],
    bestFor: ["acne", "darkCircle"],
    reason: "Soft lavender calms visual irritation and complements cool undertones.",
  },
  {
    id: "terracotta-cotton-tee",
    name: "Terracotta Cotton Tee",
    color: "#E2725B",
    colorName: "Terracotta",
    category: "tops",
    imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=500&fit=crop",
    undertones: ["warm"],
    bestFor: ["dullness", "uneven_tone"],
    reason: "Warm terracotta adds vibrancy and works beautifully with golden skin.",
  },
  {
    id: "charcoal-merino",
    name: "Charcoal Merino",
    color: "#36454F",
    colorName: "Charcoal",
    category: "tops",
    imageUrl: "https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=400&h=500&fit=crop",
    undertones: ["cool", "warm", "neutral"],
    bestFor: ["oiliness", "pore"],
    reason: "Neutral charcoal creates contrast that minimizes appearance of pores.",
  },
  {
    id: "blush-pink-sweater",
    name: "Blush Pink Sweater",
    color: "#DE5D83",
    colorName: "Blush Pink",
    category: "tops",
    imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cda3a80?w=400&h=500&fit=crop",
    undertones: ["cool", "warm"],
    bestFor: ["redness", "sensitivity"],
    reason: "Soft pink distracts from redness and adds a healthy flush effect.",
  },
];

export function getGarmentsForUndertone(undertone = "neutral", topConcerns = []) {
  const scored = GARMENT_CATALOG.map((g) => {
    let score = 0;
    if (g.undertones.includes(undertone)) score += 2;
    if (g.undertones.includes("neutral")) score += 1;
    topConcerns.forEach((c) => {
      if (g.bestFor.includes(c)) score += 2;
    });
    return { ...g, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
