import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function seed(supabase) {
  const concerns = [
    { slug: "redness", display_name: "Redness", description: "Irritation, sensitivity, or flushing", source_api_key: "redness_score", display_order: 1 },
    { slug: "hyperpigmentation", display_name: "Spots & Hyperpigmentation", description: "Dark spots, age spots, or pigmentation", source_api_key: "spot_score", display_order: 2 },
    { slug: "fine-lines-wrinkles", display_name: "Fine Lines & Wrinkles", description: "Fine lines or loss of firmness", source_api_key: "wrinkle_score", display_order: 3 },
    { slug: "skin-texture", display_name: "Skin Texture", description: "Rough or uneven skin surface", source_api_key: "texture_score", display_order: 4 },
  ];

  const ingredients = [
    { slug: "salicylic-acid", display_name: "Salicylic Acid (BHA)", inci_name: "Salicylic Acid", aliases: ["BHA"], description: "Oil-soluble exfoliant", example_products: "Paula's Choice 2% BHA", caution_note: "Can be drying", pregnancy_safe: false },
    { slug: "niacinamide", display_name: "Niacinamide", inci_name: "Niacinamide", aliases: ["Vitamin B3"], description: "Calms redness", example_products: "The Ordinary Niacinamide 10%", caution_note: null, pregnancy_safe: true },
    { slug: "azelaic-acid", display_name: "Azelaic Acid", inci_name: "Azelaic Acid", aliases: [], description: "Dual-action", example_products: "The Ordinary Azelaic Acid 10%", caution_note: null, pregnancy_safe: true },
    { slug: "retinol", display_name: "Retinol", inci_name: "Retinol", aliases: [], description: "Gold-standard for fine lines", example_products: "Olay Regenerist", caution_note: null, pregnancy_safe: false },
    { slug: "peptide-complex", display_name: "Peptide Complex", inci_name: "Palmitoyl Tripeptide-5", aliases: [], description: "Supports firmness", example_products: "The Ordinary Buffet", caution_note: null, pregnancy_safe: true },
    { slug: "vitamin-c", display_name: "Vitamin C (L-Ascorbic Acid)", inci_name: "Ascorbic Acid", aliases: ["L-Ascorbic Acid"], description: "Brightens dark spots", example_products: "SkinCeuticals C E Ferulic", caution_note: null, pregnancy_safe: true },
    { slug: "bakuchiol", display_name: "Bakuchiol", inci_name: "Bakuchiol", aliases: [], description: "Gentle retinol alternative", example_products: "Herbivore Botanicals", caution_note: null, pregnancy_safe: true },
    { slug: "centella-asiatica", display_name: "Centella Asiatica (Cica)", inci_name: "Centella Asiatica Extract", aliases: ["Cica"], description: "Soothes redness", example_products: "La Roche-Posay Cicaplast", caution_note: null, pregnancy_safe: true },
    { slug: "hyaluronic-acid", display_name: "Hyaluronic Acid", inci_name: "Sodium Hyaluronate", aliases: ["HA"], description: "Hydration hero", example_products: "The Ordinary HA", caution_note: null, pregnancy_safe: true },
    { slug: "squalane", display_name: "Squalane", inci_name: "Squalane", aliases: [], description: "Mimics skin oils", example_products: "Biossance Squalane", caution_note: null, pregnancy_safe: true },
    { slug: "benzoyl-peroxide", display_name: "Benzoyl Peroxide", inci_name: "Benzoyl Peroxide", aliases: [], description: "Antibacterial", example_products: "La Roche-Posay Effaclar", caution_note: null, pregnancy_safe: false },
    { slug: "zinc-oxide-spf", display_name: "Zinc Oxide (SPF)", inci_name: "Zinc Oxide", aliases: ["Mineral Sunscreen"], description: "Mineral sunscreen", example_products: "La Roche-Posay Anthelios", caution_note: null, pregnancy_safe: true },
    { slug: "tea-tree-oil", display_name: "Tea Tree Oil", inci_name: "Melaleuca Alternifolia Leaf Oil", aliases: [], description: "Natural antibacterial", example_products: "The Body Shop Tea Tree", caution_note: null, pregnancy_safe: true },
    { slug: "aha-glycolic-acid", display_name: "AHA / Glycolic Acid", inci_name: "Glycolic Acid", aliases: ["AHA"], description: "Surface exfoliant", example_products: "Paula's Choice 8% AHA", caution_note: null, pregnancy_safe: false },
    { slug: "ceramides", display_name: "Ceramides", inci_name: "Ceramide NP", aliases: [], description: "Barrier-repair lipids", example_products: "CeraVe Moisturizing Cream", caution_note: null, pregnancy_safe: true },
  ];

  const brands = [
    { slug: "cerave", name: "CeraVe", website: "https://www.cerave.com" },
    { slug: "la-roche-posay", name: "La Roche-Posay", website: "https://www.laroche-posay.us" },
    { slug: "the-ordinary", name: "The Ordinary", website: "https://www.theordinary.com" },
    { slug: "paulas-choice", name: "Paula's Choice", website: "https://www.paulaschoice.com" },
    { slug: "cosrx", name: "COSRX", website: "https://www.cosrx.com" },
    { slug: "olay", name: "Olay", website: "https://www.olay.com" },
    { slug: "skinceuticals", name: "SkinCeuticals", website: "https://www.skinceuticals.com" },
    { slug: "neutrogena", name: "Neutrogena", website: "https://www.neutrogena.com" },
    { slug: "supergoop", name: "Supergoop", website: "https://www.supergoop.com" },
    { slug: "biossance", name: "Biossance", website: "https://www.biossance.com" },
  ];

  const products = [
    { slug: "cerave-hydrating-cleanser", name: "Hydrating Facial Cleanser", brand_slug: "cerave", product_type: "cleanser", description: "Gentle daily cleanser", tier: "good" },
    { slug: "cerave-moisturizing-cream", name: "Moisturizing Cream", brand_slug: "cerave", product_type: "moisturizer", description: "Ceramide-rich barrier repair", tier: "good" },
    { slug: "cerave-vitamin-c-serum", name: "Skin Renewing Vitamin C Serum", brand_slug: "cerave", product_type: "serum", description: "Brightening vitamin C", tier: "good" },
    { slug: "lrposay-cleanser", name: "Effaclar Purifying Foaming Gel", brand_slug: "la-roche-posay", product_type: "cleanser", description: "Salicylic acid cleanser", tier: "good" },
    { slug: "lrposay-cicaplast", name: "Cicaplast Baume B5+", brand_slug: "la-roche-posay", product_type: "treatment", description: "Multi-purpose repairing balm", tier: "better" },
    { slug: "lrposay-anthelios", name: "Anthelios UVMune 400", brand_slug: "la-roche-posay", product_type: "sunscreen", description: "High-protection sunscreen", tier: "better" },
    { slug: "ordinary-niacinamide", name: "Niacinamide 10% + Zinc 1%", brand_slug: "the-ordinary", product_type: "serum", description: "Multi-tasking serum", tier: "good" },
    { slug: "ordinary-aha-30", name: "AHA 30% + BHA 2% Peeling Solution", brand_slug: "the-ordinary", product_type: "exfoliant", description: "Weekly resurfacing", tier: "good" },
    { slug: "ordinary-ha", name: "Hyaluronic Acid 2% + B5", brand_slug: "the-ordinary", product_type: "serum", description: "Hydration serum", tier: "good" },
    { slug: "ordinary-azelaic", name: "Azelaic Acid Suspension 10%", brand_slug: "the-ordinary", product_type: "serum", description: "Brightening treatment", tier: "good" },
    { slug: "ordinary-bakuchiol", name: "Bakuchiol", brand_slug: "the-ordinary", product_type: "serum", description: "Gentle anti-aging", tier: "good" },
    { slug: "paulas-choice-2pct-bha", name: "2% BHA Liquid Exfoliant", brand_slug: "paulas-choice", product_type: "exfoliant", description: "Cult-favorite BHA", tier: "better" },
    { slug: "paulas-choice-8pct-aha", name: "8% AHA Gel Exfoliant", brand_slug: "paulas-choice", product_type: "exfoliant", description: "Weekly surface exfoliant", tier: "better" },
    { slug: "paulas-choice-c15", name: "C15 Super Booster", brand_slug: "paulas-choice", product_type: "serum", description: "Potent vitamin C", tier: "better" },
    { slug: "cosrx-snail", name: "Snail Mucin 96%", brand_slug: "cosrx", product_type: "serum", description: "Hydrating snail mucin", tier: "good" },
    { slug: "cosrx-bha", name: "BHA Blackhead Power Liquid", brand_slug: "cosrx", product_type: "exfoliant", description: "Daily BHA", tier: "good" },
    { slug: "olay-regenerist-retinol", name: "Regenerist Retinol 24 Night", brand_slug: "olay", product_type: "treatment", description: "Overnight retinol", tier: "better" },
    { slug: "neutrogena-rapid-wrinkle", name: "Rapid Wrinkle Repair Retinol", brand_slug: "neutrogena", product_type: "serum", description: "Fast-absorbing retinol", tier: "better" },
    { slug: "supergoop-unseen", name: "Unseen Sunscreen SPF 40", brand_slug: "supergoop", product_type: "sunscreen", description: "Invisible mineral SPF", tier: "better" },
    { slug: "biossance-squalane", name: "100% Squalane Oil", brand_slug: "biossance", product_type: "oil", description: "Lightweight moisture oil", tier: "good" },
  ];

  for (const c of concerns) {
    await supabase.from("skin_concerns").upsert(c, { onConflict: "slug" });
  }

  for (const i of ingredients) {
    await supabase.from("ingredients").upsert(i, { onConflict: "slug" });
  }

  for (const b of brands) {
    await supabase.from("brands").upsert(b, { onConflict: "slug" });
  }

  const brandIds = {};
  const brandsResult = await supabase.from("brands").select("id, slug");
  if (brandsResult.data) {
    for (const b of brandsResult.data) brandIds[b.slug] = b.id;
  }

  const productRows = products.map((p) => ({
    ...p,
    brand_id: brandIds[p.brand_slug],
    is_active: true,
  }));

  for (const p of productRows) {
    await supabase.from("products").upsert(p, { onConflict: "slug" });
  }

  const productsResult = await supabase.from("products").select("id, slug");
  const productIds = {};
  if (productsResult.data) {
    for (const p of productsResult.data) productIds[p.slug] = p.id;
  }

  const ingredientsResult = await supabase.from("ingredients").select("id, slug");
  const ingredientIds = {};
  if (ingredientsResult.data) {
    for (const i of ingredientsResult.data) ingredientIds[i.slug] = i.id;
  }

  const links = [
    ["cerave-hydrating-cleanser", "ceramides", null, 1],
    ["cerave-moisturizing-cream", "ceramides", null, 1],
    ["cerave-moisturizing-cream", "hyaluronic-acid", null, 2],
    ["cerave-vitamin-c-serum", "vitamin-c", 10, 1],
    ["lrposay-cleanser", "salicylic-acid", null, 1],
    ["lrposay-cicaplast", "centella-asiatica", null, 1],
    ["lrposay-anthelios", "zinc-oxide-spf", null, 1],
    ["ordinary-niacinamide", "niacinamide", 10, 1],
    ["ordinary-niacinamide", "zinc-oxide-spf", 1, 2],
    ["ordinary-aha-30", "aha-glycolic-acid", 30, 1],
    ["ordinary-ha", "hyaluronic-acid", 2, 1],
    ["ordinary-azelaic", "azelaic-acid", 10, 1],
    ["ordinary-bakuchiol", "bakuchiol", null, 1],
    ["paulas-choice-2pct-bha", "salicylic-acid", 2, 1],
    ["paulas-choice-8pct-aha", "aha-glycolic-acid", 8, 1],
    ["paulas-choice-c15", "vitamin-c", 15, 1],
    ["cosrx-snail", "centella-asiatica", null, 1],
    ["cosrx-bha", "salicylic-acid", 2, 1],
    ["olay-regenerist-retinol", "retinol", null, 1],
    ["neutrogena-rapid-wrinkle", "retinol", null, 1],
    ["supergoop-unseen", "zinc-oxide-spf", null, 1],
    ["biossance-squalane", "squalane", null, 1],
  ];

  for (const [prodSlug, ingSlug, concentration, rank] of links) {
    const pid = productIds[prodSlug];
    const iid = ingredientIds[ingSlug];
    if (pid && iid) {
      await supabase.from("product_ingredients").upsert(
        { product_id: pid, ingredient_id: iid, concentration_pct: concentration, rank },
        { onConflict: "product_id, ingredient_id" }
      );
    }
  }

  const availability = [
    ["cerave-hydrating-cleanser", "US", "sephora", "https://www.sephora.com/product/hydrating-facial-cleanser-P439009", 1499],
    ["cerave-moisturizing-cream", "US", "sephora", "https://www.sephora.com/product/moisturizing-cream-P123456", 1699],
    ["cerave-vitamin-c-serum", "US", "sephora", "https://www.sephora.com/product/skin-renewing-vitamin-c-serum", 2199],
    ["lrposay-cleanser", "US", "sephora", "https://www.sephora.com/product/effaclar-purifying-foaming-gel", 1499],
    ["lrposay-cicaplast", "US", "sephora", "https://www.sephora.com/product/cicaplast-baume-b5-plus", 1399],
    ["lrposay-anthelios", "US", "sephora", "https://www.sephora.com/product/anthelios-uvmune-400", 3600],
    ["ordinary-niacinamide", "US", "sephora", "https://www.sephora.com/product/niacinamide-10-zinc-1", 680],
    ["ordinary-aha-30", "US", "sephora", "https://www.sephora.com/product/aha-30-bha-2-peeling-solution", 960],
    ["ordinary-ha", "US", "sephora", "https://www.sephora.com/product/hyaluronic-acid-2-b5", 720],
    ["ordinary-azelaic", "US", "sephora", "https://www.sephora.com/product/azelaic-acid-suspension-10", 990],
    ["ordinary-bakuchiol", "US", "sephora", "https://www.sephora.com/product/bakuchiol", 1000],
    ["paulas-choice-2pct-bha", "US", "sephora", "https://www.sephora.com/product/2-bha-liquid-exfoliant", 3200],
    ["paulas-choice-8pct-aha", "US", "sephora", "https://www.sephora.com/product/8-aha-gel-exfoliant", 2900],
    ["paulas-choice-c15", "US", "sephora", "https://www.sephora.com/product/c15-super-booster", 4400],
    ["cosrx-snail", "US", "sephora", "https://www.sephora.com/product/snail-mucin-96", 1600],
    ["cosrx-bha", "US", "sephora", "https://www.sephora.com/product/bha-blackhead-power-liquid", 1700],
    ["olay-regenerist-retinol", "US", "sephora", "https://www.sephora.com/product/regenerist-retinol-24-night", 2899],
    ["neutrogena-rapid-wrinkle", "US", "sephora", "https://www.sephora.com/product/rapid-wrinkle-repair-retinol", 2199],
    ["supergoop-unseen", "US", "sephora", "https://www.sephora.com/product/unseen-sunscreen-spf-40", 2200],
    ["biossance-squalane", "US", "sephora", "https://www.sephora.com/product/100-squalane-oil", 2400],
  ];

  for (const [prodSlug, country, retailer, url, priceCents] of availability) {
    const pid = productIds[prodSlug];
    if (pid) {
      await supabase.from("product_availability").upsert(
        { product_id: pid, country_code: country, retailer, purchase_url: url, price_local_cents: priceCents, local_currency: "USD", is_regulatory_approved: true, in_stock: true },
        { onConflict: "product_id, country_code, retailer" }
      );
    }
  }

  return { concerns: concerns.length, ingredients: ingredients.length, brands: brands.length, products: products.length };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const confirm = body.confirm;
    if (confirm !== "SEED_DB") {
      return NextResponse.json({ error: "Set confirm: 'SEED_DB' in the request body to enable seeding." }, { status: 400 });
    }

    const supabase = await createClient();
    const result = await seed(supabase);

    return NextResponse.json({ ok: true, seeded: result });
  } catch (err) {
    console.error("Seed route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
