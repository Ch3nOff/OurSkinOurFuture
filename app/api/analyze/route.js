import { NextResponse } from "next/server";
import { mockSkinAnalysis } from "@/lib/skinAnalysis";
import { uploadImage, startTask, pollTask, mapOutput, clamp, friendlyYouCamError } from "@/lib/youcam";

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

    const { fileId } = await uploadImage(buffer, contentType, "skin-analysis");

    const taskId = await startTask("skin-analysis", {
      src_file_id: fileId,
      dst_actions: [
        "acne",
        "wrinkle",
        "redness",
        "dark_circle_v2",
        "pore",
        "texture",
        "age_spot",
        "moisture",
        "tear_trough",
        "droopy_upper_eyelid",
        "droopy_lower_eyelid",
        "eye_bag",
        "firmness",
        "oiliness",
        "radiance",
        "skin_type",
      ],
      miniserver_args: { enable_mask_overlay: true },
      format: "json",
      pf_camera_kit: false,
    });

    const result = await pollTask("skin-analysis", taskId);

    const output = result?.data?.results?.output || [];
    const { concerns, masks, extras } = mapOutput(output);

    const vals = Object.values(concerns);
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 50;

    return NextResponse.json({
      concerns,
      zones: {
        forehead: clamp(avg + 3),
        nose: clamp(avg - 4),
        leftCheek: clamp(avg - 1),
        rightCheek: clamp(avg - 1),
        chin: clamp(avg + 1),
        underEye: clamp(avg - 8),
      },
      masks,
      overall: extras.overall ?? avg,
      skinAge: extras.skinAge ?? null,
      skinTypes: extras.skinTypes ?? [],
      resizeImage: extras.resizeImage ?? null,
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

  const { concerns, zones, masks, overall } = mapOutput(output);
  return { concerns, zones, masks, overall };
}

const BASE = (process.env.YOUCAM_API_BASE || "https://yce-api-01.makeupar.com").replace(/\/$/, "");

function authHeaders() {
  const key = process.env.YOUCAM_API_KEY;
  if (!key) {
    const err = new Error("YOUCAM_API_KEY is not configured on the server.");
    err.status = 500;
    throw err;
  }
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function getDstActions() {
  return [
    "acne", "wrinkle", "redness", "dark_circle_v2", "pore", "texture",
    "age_spot", "moisture", "tear_trough", "droopy_upper_eyelid", "droopy_lower_eyelid",
    "eye_bag", "firmness", "oiliness", "radiance", "skin_type",
  ];
}
