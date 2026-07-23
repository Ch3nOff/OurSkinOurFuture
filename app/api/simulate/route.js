import { NextResponse } from "next/server";
import { mockSimulation } from "@/lib/skinAnalysis";
import { simulateWithYouCamFromUrl } from "@/lib/youcam";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function uploadToSupabase(buffer, contentType) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase not configured");
  }
  const path = `scans/sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const url = `${SUPABASE_URL}/storage/v1/object/scan-photos/${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Supabase upload failed (${res.status}): ${t}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/scan-photos/${path}`;
}

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
      const [meta, b64] = image.split(",");
      const contentType = (meta.match(/data:(.*?);/) || [])[1] || "image/jpeg";
      const buffer = Buffer.from(b64, "base64");
      publicUrl = await uploadToSupabase(buffer, contentType);
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
