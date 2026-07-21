import { NextResponse } from "next/server";
import { mockSkinAnalysis } from "@/lib/skinAnalysis";
import { analyzeWithYouCamFromUrl, friendlyYouCamError } from "@/lib/youcam";
import { createClient } from "@/lib/supabase/server";

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

    // Upload to Supabase Storage so we get a public URL that YouCam can
    // download without any special headers (avoids S3 pre-signed URL
    // download failures).
    const supabase = createClient();
    const blob = new Blob([buffer], { type: contentType });
    const path = `scans/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("scan-photos")
      .upload(path, blob, { contentType, upsert: true });

    if (uploadError) {
      console.error("Supabase upload failed:", uploadError);
      return NextResponse.json(
        { error: `Image upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicData } = supabase.storage.from("scan-photos").getPublicUrl(path);
    const publicUrl = publicData?.publicUrl;
    if (!publicUrl) {
      return NextResponse.json({ error: "Failed to get public image URL." }, { status: 500 });
    }

    const { concerns, zones, masks, overall, skinAge, skinTypes, resizeImage } =
      await analyzeWithYouCamFromUrl(publicUrl);

    await new Promise((resolve) => setTimeout(resolve, 300));

    return NextResponse.json({
      concerns,
      zones,
      masks,
      overall,
      skinAge,
      skinTypes,
      resizeImage,
      imageUrl: publicUrl,
      mock: false,
    });
  } catch (err) {
    console.error("Analyze route error:", err.message);
    const code = err.message?.match(/error_[a-z_]+/)?.[0];
    return NextResponse.json(
      { error: friendlyYouCamError(code, err.message || "Analysis failed. Please try again.") },
      { status: err.status || 502 }
    );
  }
}
