import { NextResponse } from "next/server";
import { mockSimulation } from "@/lib/skinAnalysis";
import { simulateWithYouCam } from "@/lib/youcam";

/**
 * POST /api/simulate
 *
 * Body: { image, baselineConcerns, weekIndex, totalWeeks }
 *
 * When YOUCAM_API_KEY is set, the uploaded image is forwarded to the real
 * YouCam AI Skin Simulation API (server-side only), which returns an actual
 * before/after PROJECTION IMAGE. The simulation intensity scales with the
 * requested week so dragging the timeline shows progressively improved skin.
 *
 * Always uses the live API when the key is present (no silent demo). The
 * local mock only runs without a key so the UI still renders in dev.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { image, baselineConcerns, weekIndex = 0, totalWeeks = 12 } = body;
    const apiKey = process.env.YOUCAM_API_KEY;

    if (!apiKey) {
      const simulated = mockSimulation(baselineConcerns, weekIndex, totalWeeks);
      return NextResponse.json({ projectedScores: simulated, projectedImages: null, mock: true });
    }

    if (typeof image !== "string" || !image.startsWith("data:")) {
      return NextResponse.json(
        { error: "A valid image (data URL) is required for simulation." },
        { status: 400 }
      );
    }

    // Intensity grows from 0 at week 0 to 1 at the final week.
    const intensity = totalWeeks > 0 ? weekIndex / totalWeeks : 0;
    const [meta, b64] = image.split(",");
    const contentType = (meta.match(/data:(.*?);/) || [])[1] || "image/jpeg";
    const buffer = Buffer.from(b64, "base64");

    const { imageUrl } = await simulateWithYouCam(buffer, contentType, intensity);

    const projectedScores = mockSimulation(baselineConcerns, weekIndex, totalWeeks);

    return NextResponse.json({
      projectedScores,
      projectedImages: imageUrl ? [imageUrl] : null,
      mock: false,
    });
  } catch (err) {
    console.error("Simulate route error:", err.message);
    return NextResponse.json(
      { error: err.message || "Simulation failed. Please try again." },
      { status: err.status || 502 }
    );
  }
}
