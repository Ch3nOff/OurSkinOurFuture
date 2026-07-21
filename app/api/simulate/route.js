import { NextResponse } from "next/server";
import { mockSimulation } from "@/lib/skinAnalysis";
import { simulateWithYouCamFromUrl } from "@/lib/youcam";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { image, baselineConcerns, weekIndex = 0, totalWeeks = 12 } = body;
    const apiKey = process.env.YOUCAM_API_KEY;

    if (!apiKey) {
      const simulated = mockSimulation(baselineConcerns, weekIndex, totalWeeks);
      return NextResponse.json({ projectedScores: simulated, projectedImages: null, mock: true });
    }

    if (!image) {
      return NextResponse.json(
        { error: "An image is required for simulation." },
        { status: 400 }
      );
    }

    let publicUrl = image;
    // If the client sent a data URL, upload to Supabase Storage first
    // so YouCam can download it from a public URL.
    if (image.startsWith("data:")) {
      const [meta, b64] = image.split(",");
      const contentType = (meta.match(/data:(.*?);/) || [])[1] || "image/jpeg";
      const buffer = Buffer.from(b64, "base64");
      const supabase = createClient();
      const blob = new Blob([buffer], { type: contentType });
      const path = `scans/sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("scan-photos")
        .upload(path, blob, { contentType, upsert: true });
      if (uploadError) {
        return NextResponse.json(
          { error: `Image upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }
      const { data: publicData } = supabase.storage.from("scan-photos").getPublicUrl(path);
      publicUrl = publicData?.publicUrl || image;
    }

    const intensity = totalWeeks > 0 ? weekIndex / totalWeeks : 0;
    const { imageUrl } = await simulateWithYouCamFromUrl(publicUrl, intensity);

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
