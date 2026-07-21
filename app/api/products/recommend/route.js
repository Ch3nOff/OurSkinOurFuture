import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/products/recommend
 *
 * Body: { concernSlugs: string[], countryCode?: string }
 *
 * Calls the Supabase RPC `get_recommendations` which returns ranked,
 * geo-filtered, in-stock products from Sephora matched to the user's
 * skin concerns via the ingredient→product mapping tables.
 */
export async function POST(request) {
  try {
    const { concernSlugs = [], countryCode = "US" } = await request.json();
    if (!Array.isArray(concernSlugs) || concernSlugs.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_recommendations", {
      p_concern_slugs: concernSlugs,
      p_country_code: countryCode,
    });

    if (error) {
      console.error("Product recommendation RPC error:", error);
      return NextResponse.json({ recommendations: [], error: error.message }, { status: 200 });
    }

    console.log("Product recommendations RPC result:", { concernSlugs, count: data?.length, data });
    return NextResponse.json({ recommendations: data || [] });
  } catch (err) {
    console.error("Product recommend route error:", err.message);
    return NextResponse.json({ recommendations: [], error: err.message }, { status: 200 });
  }
}
