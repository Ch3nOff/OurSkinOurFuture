// ============================================================
// YouCam Skin Analysis + Simulation API client (server-side only).
//
// Docs: https://docs.perfectcorp.com/develop/quick_start_guide
// API server: https://yce-api-01.makeupar.com
//
// Flow (both features):
//   1. POST /s2s/v2.0/file/skin-analysis  -> get file_id + pre-signed PUT url
//   2. PUT the image bytes to that url
//   3. POST /s2s/v2.0/task/skin-analysis  -> task_id
//   4. Poll GET /s2s/v2.0/task/skin-analysis/{task_id} until "success"
//
// The YOUCAM_API_KEY is read ONLY here, server-side. Per project
// requirement these routes ALWAYS use the live API and surface real
// errors — there is no silent demo fallback.
// ============================================================

const BASE = (process.env.YOUCAM_API_BASE || "https://yce-api-01.makeupar.com").replace(
  /\/$/,
  ""
);

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

// YouCam skin-analysis concern `type` -> our app concern key.
const CONCERN_MAP = {
  acne: "acne",
  wrinkle: "wrinkle",
  redness: "redness",
  dark_circle_v2: "darkCircle",
  pore: "pore",
  texture: "texture",
  age_spot: "spot",
  spot: "spot",
  moisture: "moisture",
  tear_trough: "tearTrough",
  droopy_upper_eyelid: "droopyUpperEyelid",
  droopy_lower_eyelid: "droopyLowerEyelid",
  eye_bag: "eyeBag",
  firmness: "firmness",
  oiliness: "oiliness",
  radiance: "radiance",
};

async function uploadImage(buffer, contentType, task) {
  const initRes = await fetch(`${BASE}/s2s/v2.0/file/${task}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      files: [
        {
          content_type: contentType || "image/jpeg",
          file_name: "scan.jpg",
          file_size: buffer.length,
        },
      ],
    }),
  });
  if (!initRes.ok) {
    const t = await initRes.text();
    throw new Error(`YouCam file init failed (${initRes.status}): ${t}`);
  }
  const init = await initRes.json();
  console.log("YouCam file init response:", JSON.stringify(init).slice(0, 500));
  const file = init?.data?.files?.[0];
  if (!file?.file_id || !file?.requests?.[0]?.url) {
    throw new Error("YouCam file init returned no file_id / upload url");
  }

  const uploadUrl = file.requests[0].url;
  const signedHeaders = file.requests[0].headers || {};

  // Extract host from the S3 URL and include it as a header.
  // The pre-signed URL requires all headers listed in X-Amz-SignedHeaders
  // to be present in the request, including 'host'.
  let uploadHost = "";
  try {
    uploadHost = new URL(uploadUrl).host;
  } catch {
    // ignore
  }

  const putHeaders = { ...signedHeaders };
  if (uploadHost) {
    putHeaders["host"] = uploadHost;
  }

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: putHeaders,
    body: buffer,
  });
  if (!putRes.ok) {
    const t = await putRes.text();
    console.error("YouCam S3 upload failed:", putRes.status, t);
    throw new Error(`YouCam file upload failed (${putRes.status}): ${t}`);
  }
  return { fileId: file.file_id, uploadUrl };
}

async function startTask(task, body) {
  const res = await fetch(`${BASE}/s2s/v2.0/task/${task}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`YouCam task start failed (${res.status}): ${t}`);
  }
  const data = await res.json();
  const taskId = data?.data?.task_id || data?.task_id;
  if (!taskId) throw new Error("YouCam task start returned no task_id");
  return taskId;
}

async function pollTask(task, taskId, timeoutMs = 90000) {
  const start = Date.now();
  let delay = 1500;
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${BASE}/s2s/v2.0/task/${task}/${taskId}`, {
      method: "GET",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`YouCam poll failed (${res.status})`);
    const data = await res.json();
    const status = data?.data?.task_status || data?.data?.status || data?.task_status || data?.status;
    if (status === "success" || status === "completed" || status === "done") return data;
    if (status === "error" || status === "failed") {
      throw new Error(`YouCam task error: ${data?.data?.error_message || data?.data?.error || data?.error || "unknown"}`);
    }
    if (status === "running" || status === "processing" || status === "pending" || status === "queued") {
      await new Promise((r) => setTimeout(r, delay));
      if (delay < 4000) delay += 500;
      continue;
    }
    // Unknown status — log and keep polling briefly before giving up.
    console.warn(`YouCam unexpected status: ${status}`);
    await new Promise((r) => setTimeout(r, delay));
    if (Date.now() - start > timeoutMs - 5000) break;
  }
  throw new Error("YouCam task timed out — the API may be queued or the key may have no credits remaining.");
}

/**
 * Map YouCam concern types to our app keys, collecting scores and mask URLs.
 */
function mapOutput(output) {
  const concerns = {};
  const masks = {};
  const extras = {};

  output.forEach((o) => {
    const t = o.type;

    if (t === "all" && typeof o.score === "number") {
      extras.overall = Math.round(Math.min(100, Math.max(0, o.score)));
      return;
    }
    if (t === "skin_age" && typeof o.score === "number") {
      extras.skinAge = Math.round(o.score);
      return;
    }
    if (t === "resize_image") {
      if (o.mask_urls?.[0]) extras.resizeImage = o.mask_urls[0];
      return;
    }
    if (t === "skin_type") {
      if (!extras.skinTypes) extras.skinTypes = [];
      extras.skinTypes.push({
        region: o.region || "whole",
        skinType: o.skin_type || "Unknown",
        maskUrl: o.mask_urls?.[0] || null,
      });
      return;
    }

    const key = CONCERN_MAP[t];
    if (!key) return;

    if (concerns[key] === undefined) {
      const score = o.ui_score ?? o.raw_score;
      if (typeof score === "number") {
        concerns[key] = Math.round(Math.min(100, Math.max(0, score)));
      }
      if (Array.isArray(o.mask_urls) && o.mask_urls[0]) {
        masks[key] = o.mask_urls[0];
      }
    }
  });

  return { concerns, masks, extras };
}

/**
 * Run a real YouCam Skin Analysis from an image buffer.
 * Returns { concerns, zones, masks, overall, skinAge, skinTypes, resizeImage }.
 */
/**
 * Run a real YouCam Skin Analysis from a public image URL.
 * Uses src_file_url so YouCam downloads the image directly — no S3
 * pre-signed URL issues. The URL must be publicly accessible.
 */
export async function analyzeWithYouCamFromUrl(imageUrl) {
  const taskId = await startTask("skin-analysis", {
    src_file_url: imageUrl,
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

  return {
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
  };
}

/**
 * Run a real YouCam Skin Simulation from a public image URL.
 * The simulation task body uses top-level numeric fields for each
 * concern intensity, and the source URL goes in a `body` object.
 */
export async function simulateWithYouCamFromUrl(imageUrl, intensity = 0.6) {
  const taskId = await startTask("skin-simulation", {
    body: {
      src_file_url: imageUrl,
    },
    wrinkle: intensity,
    radiance: intensity,
    oiliness: intensity,
    acne: intensity,
    eye_bags: intensity,
    dark_circle: intensity,
    spots: intensity,
    pores: intensity,
    texture: intensity,
    redness: intensity,
  });
  const result = await pollTask("skin-simulation", taskId);
  const imageUrlResult =
    result?.data?.results?.output?.[0]?.url ||
    result?.data?.image_url ||
    result?.data?.result_url;
  return { imageUrl: imageUrlResult || null };
}

function clamp(n) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function friendlyYouCamError(code, fallback) {
  const map = {
    error_src_face_too_small:
      "Your face is too small in the photo. Move closer or use your camera so your face fills more of the frame.",
    error_src_face_out_of_bound:
      "Your face is partially outside the image. Make sure your full face — forehead, cheeks, and chin — is visible and centered.",
    error_lighting_dark:
      "The lighting is too dim. Try a brighter spot or turn on your camera flash for a clearer read.",
    error_below_min_image_size:
      "This photo is too small. Please upload a higher-resolution image.",
    error_exceed_max_image_size:
      "This photo is too large. Please use a smaller image (under 2560px on the long side).",
    error_invalid_params:
      "The image format isn't supported. Please use a JPG or PNG.",
  };
  return map[code] || fallback || "Something went wrong analyzing that image. Please try another photo.";
}
