import { NextResponse } from "next/server";
import { mockSimulation } from "@/lib/skinAnalysis";

/**
 * POST /api/simulate
 *
 * MOCK IMPLEMENTATION. Body: { baselineConcerns, weekIndex, totalWeeks }.
 * Returns the projected per-concern scores at the requested week, exactly
 * like the client-side mockSimulation() the TimelineSlider calls today.
 *
 * Real integration point (see ROADMAP.md Milestones M1–M3):
 *   1. Accept the baseline image + target concerns (multipart/form-data or
 *      base64 + concerns JSON), not just numeric concerns.
 *   2. Forward to YouCam's AI Skin Simulation API using YOUCAM_API_KEY,
 *      which must only ever be read here, server-side — never exposed to
 *      the client. The real API returns actual before/after IMAGES, not
 *      interpolated numbers, so the response mapping below (projected
 *      scores + projected image urls) is intentionally shaped to let the
 *      timeline UI upgrade from a number curve to a real visual scrub.
 *   3. Map YouCam's real response fields onto { projectedScores,
 *      projectedImages } so the TimelineSlider can render real visuals
 *      without changing call sites elsewhere.
 *
 * This route exists (rather than calling mockSimulation directly from the
 * client) specifically so the real swap is a same-file change, not an
 * architecture change — mirroring the /api/analyze pattern.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      baselineConcerns,
      weekIndex = 0,
      totalWeeks = 12,
    } = body;

    if (!baselineConcerns || typeof baselineConcerns !== "object") {
      return NextResponse.json(
        { error: "Missing baselineConcerns data." },
        { status: 400 }
      );
    }

    // Simulate realistic network latency so the timeline doesn't feel
    // misleadingly instant compared to how the real API will feel.
    await new Promise((resolve) => setTimeout(resolve, 250));

    const projectedScores = mockSimulation(
      baselineConcerns,
      weekIndex,
      totalWeeks
    );

    return NextResponse.json({
      projectedScores,
      projectedImages: null, // populated once YouCam AI Skin Simulation is wired
      mock: true,
    });
  } catch (err) {
    console.error("Simulate route error:", err);
    return NextResponse.json(
      { error: "Simulation failed. Please try again." },
      { status: 500 }
    );
  }
}
