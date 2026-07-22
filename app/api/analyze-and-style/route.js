import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeWithYouCamFromUrl } from "@/lib/youcam";
import { startTryOnTask, pollTryOnTask, extractPalette, recommendPieces } from "@/lib/vto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function uploadToSupabase(buffer, contentType) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase not configured");
  }
  const path = `scans/scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const url = `${SUPABASE_URL}/storage/v1/object/scan-photos/${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
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
    const { image, faceImage, style = "casual", season = "all", userId } = body;

    if (!image && !faceImage) {
      return NextResponse.json({ error: "An image is required." }, { status: 400 });
    }

    const uploadPromises = [];
    if (faceImage) {
      uploadPromises.push(
        uploadToSupabase(Buffer.from(faceImage.split(",")[1] || faceImage, "base64"), "image/jpeg")
      );
    }
    if (image) {
      uploadPromises.push(
        uploadToSupabase(Buffer.from(image.split(",")[1] || image, "base64"), "image/jpeg")
      );
    }
    const urls = await Promise.all(uploadPromises);
    const faceUrl = faceImage ? urls[0] : (urls[1] || urls[0]);
    const fullUrl = image ? urls[urls.length - 1] : urls[0];

    const skinPromise = analyzeWithYouCamFromUrl(faceUrl).catch((err) => {
      console.error("Skin AI failed:", err.message);
      return null;
    });

    const vtoPromise = (async () => {
      try {
        const { taskId, pollPath } = await startTryOnTask(fullUrl, { style, season });
        const result = await pollTryOnTask(taskId, pollPath);
        const url = result?.data?.results?.url || result?.data?.results?.output?.[0]?.url || null;
        return { url, success: !!url };
      } catch (err) {
        console.error("VTO failed:", err.message);
        return { url: null, success: false, error: err.message };
      }
    })();

    const [skinResult, vtoResult] = await Promise.all([skinPromise, vtoPromise]);

    const analysis = skinResult || { mock: true, concerns: {}, zones: {} };
    const tryOn = vtoResult;

    if (userId) {
      const supabase = await createClient();
      await supabase.from("scans").insert({
        user_id: userId,
        image_url: fullUrl,
        concern_scores: analysis.concerns || {},
        zone_scores: analysis.zones || {},
        mock: analysis.mock ?? true,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      analysis,
      tryOnImage: tryOn?.url || null,
      recommendation: {
        style,
        season,
        skinTone: "neutral",
        palette: extractPalette("neutral"),
        pieces: recommendPieces(style, season),
        reason: "Based on your scan and selected style.",
      },
      mock: !skinResult || !tryOn?.success,
    });
  } catch (err) {
    console.error("Analyze-and-style route error:", err.message);
    return NextResponse.json(
      { error: err.message || "Analysis failed. Please try again." },
      { status: err.status || 502 }
    );
  }
}
