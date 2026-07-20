import { NextResponse } from "next/server";
import { mockSkinAnalysis } from "@/lib/skinAnalysis";
import { analyzeWithYouCam } from "@/lib/youcam";

/**
 * POST /api/analyze
 *
 * Body: { image: "data:image/jpeg;base64,...." }
 *
 * When YOUCAM_API_KEY is set, the uploaded image is forwarded to the real
 * YouCam Skin Analysis API (server-side only). The response is mapped onto
 * { concerns, zones, masks } — the same shape the frontend consumes.
 *
 * Per project requirement this route ALWAYS uses the live API when the key
 * is present and surfaces real errors (no silent demo fallback). The local
 * mock only runs when the key is absent, so a developer without a key can
 * still run the UI.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.YOUCAM_API_KEY;

    if (!apiKey) {
      const seed = typeof body.seed === "number" ? body.seed : Date.now();
      const mock = mockSkinAnalysis(seed);
      return NextResponse.json({ ...mock, mock: true });
    }

    if (typeof body.image !== "string" || !body.image.startsWith("data:")) {
      return NextResponse.json(
        { error: "A valid image (data URL) is required." },
        { status: 400 }
      );
    }

    const [meta, b64] = body.image.split(",");
    const contentType = (meta.match(/data:(.*?);/) || [])[1] || "image/jpeg";
    const buffer = Buffer.from(b64, "base64");

    const { concerns, zones, masks } = await analyzeWithYouCam(buffer, contentType);

    // Simulate a touch of network latency so the loading state feels real.
    await new Promise((resolve) => setTimeout(resolve, 300));

    return NextResponse.json({ concerns, zones, masks, mock: false });
  } catch (err) {
    console.error("Analyze route error:", err.message);
    return NextResponse.json(
      { error: err.message || "Analysis failed. Please try again." },
      { status: err.status || 502 }
    );
  }
}
