import { NextResponse } from "next/server";
import { mockSkinAnalysis } from "@/lib/skinAnalysis";
import { analyzeWithYouCam } from "@/lib/youcam";

/**
 * POST /api/analyze
 *
 * Body (real mode):  { image: "data:image/jpeg;base64,...." }
 * Body (mock mode):  { seed: number }
 *
 * When YOUCAM_API_KEY is configured, the uploaded image is forwarded to
 * the real YouCam Skin Analysis API (server-side only). The response is
 * mapped onto { concerns, zones } — the same shape the frontend already
 * consumes — so no component code changes between mock and real modes.
 *
 * Without a key, it falls back to the deterministic mock so the app stays
 * fully usable in local/dev and demo environments.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.YOUCAM_API_KEY;

    let concerns;
    let zones;
    let usedMock = true;

    if (apiKey && typeof body.image === "string" && body.image.startsWith("data:")) {
      try {
        const [meta, b64] = body.image.split(",");
        const contentType = (meta.match(/data:(.*?);/) || [])[1] || "image/jpeg";
        const imageBuffer = Buffer.from(b64, "base64");
        const { concernScores, zoneScores } = await analyzeWithYouCam(
          imageBuffer,
          contentType
        );

        concerns = concernScores;
        // Derive any missing concerns from the seed-shaped mock so the UI
        // always has all 8 values, then merge real scores on top.
        const base = mockSkinAnalysis(body.seed ?? Date.now());
        concerns = { ...base.concerns, ...concernScores };
        zones = Object.keys(zoneScores).length ? zoneScores : base.zones;
        usedMock = false;
      } catch (youcamErr) {
        console.error("YouCam analyze failed, using mock:", youcamErr.message);
      }
    }

    if (usedMock) {
      const seed = typeof body.seed === "number" ? body.seed : Date.now();
      const mock = mockSkinAnalysis(seed);
      concerns = mock.concerns;
      zones = mock.zones;
    }

    // Simulate realistic network latency so the loading state in the UI
    // isn't misleadingly instant compared to how the real API will feel.
    await new Promise((resolve) => setTimeout(resolve, 400));

    return NextResponse.json({ concerns, zones, mock: usedMock });
  } catch (err) {
    console.error("Analyze route error:", err);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
