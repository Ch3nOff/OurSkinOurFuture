import { NextResponse } from "next/server";
import { mockSkinAnalysis } from "@/lib/skinAnalysis";
import { analyzeWithYouCamFromUrl, friendlyYouCamError } from "@/lib/youcam";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function uploadToSupabase(buffer, contentType) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase not configured");
  }
  const path = `scans/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
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

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/scan-photos/${path}`;
  return publicUrl;
}

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
    const publicUrl = await uploadToSupabase(buffer, contentType);

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

export async function GET(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");

  if (mode === "color-tone" || mode === "face-attribute") {
    const image = url.searchParams.get("image");
    if (!image) {
      return NextResponse.json({ error: "image query param required" }, { status: 400 });
    }

    const apiKey = process.env.YOUCAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ colorTone: null, faceAttributes: null, mock: true });
    }

    try {
      const result = image.startsWith("data:")
        ? await analyzeFromBuffer(image, mode)
        : { colorTone: null, faceAttributes: null };

      return NextResponse.json({ ...result, mock: false });
    } catch (err) {
      console.error(`/${mode} route error:`, err.message);
      return NextResponse.json(
        { error: err.message || `${mode} analysis failed.` },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}

async function analyzeFromBuffer(dataUrl, mode) {
  const base64 = dataUrl.split(",")[1] || dataUrl;
  const buffer = Buffer.from(base64, "base64");
  const contentType = "image/jpeg";

  const fileInitRes = await fetch(`${BASE}/s2s/v2.0/file/${mode === "face-attribute" ? "face-attribute" : "skin-analysis"}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      files: [{ content_type: contentType, file_name: "scan.jpg", file_size: buffer.length }],
    }),
  });

  if (!fileInitRes.ok) {
    const t = await fileInitRes.text();
    throw new Error(`YouCam file init failed (${fileInitRes.status}): ${t}`);
  }

  const initData = await fileInitRes.json();
  const file = initData?.data?.files?.[0];
  if (!file?.file_id || !file?.requests?.[0]?.url) {
    throw new Error("YouCam file init returned no file_id / upload url");
  }

  const uploadUrl = file.requests[0].url;
  const signedHeaders = file.requests[0].headers || {};
  let uploadHost = "";
  try { uploadHost = new URL(uploadUrl).host; } catch {}

  const putHeaders = { ...signedHeaders };
  if (uploadHost) putHeaders["host"] = uploadHost;

  const putRes = await fetch(uploadUrl, { method: "PUT", headers: putHeaders, body: buffer });
  if (!putRes.ok) {
    const t = await putRes.text();
    throw new Error(`YouCam upload failed (${putRes.status}): ${t}`);
  }

  const taskType = mode === "face-attribute" ? "face-attribute" : "skin-analysis";
  const taskRes = await fetch(`${BASE}/s2s/v2.0/task/${taskType}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      src_file_id: file.file_id,
      format: "json",
      ...(mode === "face-attribute" ? {} : { dst_actions: getDstActions(), miniserver_args: { enable_mask_overlay: true } }),
    }),
  });

  if (!taskRes.ok) {
    const t = await taskRes.text();
    throw new Error(`YouCam task start failed (${taskRes.status}): ${t}`);
  }

  const taskData = await taskRes.json();
  const taskId = taskData?.data?.task_id || taskData?.task_id;
  if (!taskId) throw new Error("YouCam task start returned no task_id");

  const pollResult = await pollTask(taskType, taskId);
  const output = pollResult?.data?.results?.output || [];

  if (mode === "face-attribute") {
    return { faceAttributes: output };
  }

  const { concerns, masks, extras } = mapOutput(output);
  return { concerns, zones, masks, overall: extras.overall, skinAge: extras.skinAge, skinTypes: extras.skinTypes, resizeImage: extras.resizeImage };
}

function getDstActions() {
  return [
    "acne", "wrinkle", "redness", "dark_circle_v2", "pore", "texture",
    "age_spot", "moisture", "tear_trough", "droopy_upper_eyelid", "droopy_lower_eyelid",
    "eye_bag", "firmness", "oiliness", "radiance", "skin_type",
  ];
}
