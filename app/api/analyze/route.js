import { NextResponse } from "next/server";
import { mockSkinAnalysis } from "@/lib/skinAnalysis";

/**
 * POST /api/analyze
 *
 * MOCK IMPLEMENTATION. Body: { seed: number } — derived client-side from
 * the uploaded image so repeated analysis of the same photo is stable.
 *
 * Real integration point (see ROADMAP.md Milestones M1–M3):
 *   1. Accept the actual image (multipart/form-data or base64), not a seed.
 *   2. Forward it to YouCam's Skin Analysis API using YOUCAM_API_KEY,
 *      which must only ever be read here, server-side — never exposed
 *      to the client.
 *   3. Map YouCam's real response fields onto the { concerns, zones }
 *      shape already consumed by the frontend, so no component code
 *      needs to change when this swap happens.
 *
 * This route exists (rather than calling mockSkinAnalysis directly from
 * the client) specifically so that swap is a same-file change, not an
 * architecture change.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const seed = typeof body.seed === "number" ? body.seed : Date.now();

    // Simulate realistic network latency so the loading state in the UI
    // isn't misleadingly instant compared to how the real API will feel.
    await new Promise((resolve) => setTimeout(resolve, 400));

    const result = mockSkinAnalysis(seed);

    return NextResponse.json({ ...result, mock: true });
  } catch (err) {
    console.error("Analyze route error:", err);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
