import { NextResponse } from "next/server";
import { mockSimulation } from "@/lib/skinAnalysis";
import { simulateWithYouCamFromUrl } from "@/lib/youcam";

export async function POST(request) {
  try {
    const body = await request.json();
    const { image, baselineConcerns, weekIndex = 0, totalWeeks = 12 } = body;
    const apiKey = process.env.YOUCAM_API_KEY;

    if (!apiKey) {
      const simulated = mockSimulation(baselineConcerns, weekIndex, totalWeeks);
      return NextResponse.json({
        projectedScores: simulated,
        projectedImages: null,
        baselineImage: image,
        mock: true,
      });
    }

    if (!image) {
      return NextResponse.json(
        { error: "An image is required for simulation." },
        { status: 400 }
      );
    }

    let publicUrl = image;
    if (image.startsWith("data:")) {
      publicUrl = image;
    }

    let projectedImages = null;
    let mock = false;
    let projectedScores = mockSimulation(baselineConcerns, weekIndex, totalWeeks);

    try {
      const intensity = totalWeeks > 0 ? weekIndex / totalWeeks : 0;
      const { imageUrl } = await simulateWithYouCamFromUrl(publicUrl, intensity);
      projectedImages = imageUrl ? [imageUrl] : null;
      mock = false;
    } catch (err) {
      console.warn("YouCam simulation failed, using local fallback:", err.message);
      projectedImages = null;
      mock = true;
    }

    return NextResponse.json({
      projectedScores,
      projectedImages,
      baselineImage: publicUrl,
      mock,
    });
  } catch (err) {
    console.error("Simulate route error:", err.message);
    return NextResponse.json(
      { error: err.message || "Simulation failed. Please try again." },
      { status: err.status || 502 }
    );
  }
}
