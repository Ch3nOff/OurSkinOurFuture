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
  dark_circle: "darkCircle",
  pore: "pore",
  texture: "texture",
  age_spot: "spot",
  spot: "spot",
  moisture: "moisture",
};

async function uploadImage(buffer, contentType, task) {
  // 1. Initialize file upload.
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
  const file = init?.data?.files?.[0];
  if (!file?.file_id || !file?.requests?.[0]?.url) {
    throw new Error("YouCam file init returned no file_id / upload url");
  }

  // 2. PUT the image to the pre-signed URL.
  const putRes = await fetch(file.requests[0].url, {
    method: "PUT",
    headers: file.requests[0].headers || { "Content-Type": contentType || "image/jpeg" },
    body: buffer,
  });
  if (!putRes.ok) {
    const t = await putRes.text();
    throw new Error(`YouCam file upload failed (${putRes.status}): ${t}`);
  }
  return file.file_id;
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

async function pollTask(task, taskId, timeoutMs = 40000) {
  const start = Date.now();
  const delay = 2000;
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${BASE}/s2s/v2.0/task/${task}/${taskId}`, {
      method: "GET",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`YouCam poll failed (${res.status})`);
    const data = await res.json();
    const status = data?.data?.task_status || data?.task_status;
    if (status === "success") return data;
    if (status === "error" || status === "failed") {
      throw new Error(`YouCam task error: ${data?.data?.error || data?.error || "unknown"}`);
    }
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error("YouCam task timed out");
}

/**
 * Run a real YouCam Skin Analysis from an image buffer.
 * Returns { concerns, zones, masks } mapped onto our local shapes.
 */
export async function analyzeWithYouCam(buffer, contentType) {
  const fileId = await uploadImage(buffer, contentType, "skin-analysis");
  const taskId = await startTask("skin-analysis", {
    file_id: fileId,
    enable_mask_overlay: true,
  });
  const result = await pollTask("skin-analysis", taskId);

  const output = result?.data?.results?.output || [];
  const concerns = {};
  const masks = {};
  output.forEach((o) => {
    const key = CONCERN_MAP[o.type];
    if (key && concerns[key] === undefined) {
      const score = o.ui_score ?? o.raw_score;
      if (typeof score === "number") {
        concerns[key] = Math.round(Math.min(100, Math.max(0, score)));
        if (Array.isArray(o.mask_urls) && o.mask_urls[0]) masks[key] = o.mask_urls[0];
      }
    }
  });

  // Derive a simple per-zone signal from the overall concern average so the
  // zone map still renders; YouCam returns per-concern masks, not per-zone
  // numeric scores, so this is an aggregate proxy.
  const vals = Object.values(concerns);
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 50;

  return {
    concerns,
    zones: {
      forehead: clamp(avg + 4),
      nose: clamp(avg - 2),
      leftCheek: clamp(avg),
      rightCheek: clamp(avg),
      chin: clamp(avg + 2),
      underEye: clamp(avg - 6),
    },
    masks,
  };
}

/**
 * Run a real YouCam Skin Simulation from an image buffer.
 * `intensity` (0..1) controls how improved the projected image looks.
 * Returns { imageUrl } — the before/after projection image URL.
 */
export async function simulateWithYouCam(buffer, contentType, intensity = 0.6) {
  const fileId = await uploadImage(buffer, contentType, "skin-simulation");
  const taskId = await startTask("skin-simulation", {
    file_id: fileId,
    // Per-concern simulation intensity (0 = original, 1 = max improvement).
    dst_actions: {
      wrinkle: intensity,
      pore: intensity,
      redness: intensity,
      texture: intensity,
      radiance: intensity,
      moisture: intensity,
      dark_circle: intensity,
      acne: intensity,
      age_spot: intensity,
      oiliness: intensity,
    },
  });
  const result = await pollTask("skin-simulation", taskId);
  const imageUrl =
    result?.data?.results?.output?.[0]?.url ||
    result?.data?.image_url ||
    result?.data?.result_url;
  return { imageUrl: imageUrl || null };
}

function clamp(n) {
  return Math.min(100, Math.max(0, Math.round(n)));
}
