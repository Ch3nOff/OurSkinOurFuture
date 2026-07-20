// ============================================================
// YouCam Skin Analysis API client (server-side only).
//
// Docs: https://docs.perfectcorp.com/develop/quick_start_guide
// Flow:
//   1. Upload the image via the File API -> file_id
//   2. POST /s2s/v2.0/task/skin-analysis with the file_id -> task_id
//   3. Poll GET /skin-analysis/{task_id} until status = "success"
//   4. Map YouCam's concern scores onto our local concern shape.
//
// The API key (YOUCAM_API_KEY) is read ONLY here, server-side.
// If the key is missing or the call fails, callers fall back to the
// local mockSkinAnalysis() so the app never hard-fails.
// ============================================================

const BASE = process.env.YOUCAM_API_BASE || "https://yce.makeupar.com";

// YouCam concern names (from their analysis output) -> our concern keys.
// YouCam returns many concerns; we map the ones we model and derive the
// rest from the closest available signal so our UI never shows blanks.
const CONCERN_MAP = {
  acne: "acne",
  "acne & inflammation": "acne",
  wrinkle: "wrinkle",
  "fine lines": "wrinkle",
  redness: "redness",
  dark_circle: "darkCircle",
  "dark circle": "darkCircle",
  pore: "pore",
  "pores": "pore",
  texture: "texture",
  "skin texture": "texture",
  spot: "spot",
  "spots & hyperpigmentation": "spot",
  "hyperpigmentation": "spot",
  moisture: "moisture",
  "dryness": "moisture",
};

function normalizeKey(name) {
  return String(name || "")
    .toLowerCase()
    .trim();
}

async function uploadFile(imageBuffer, contentType) {
  // 1. Request an upload URL.
  const initRes = await fetch(`${BASE}/file`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.YOUCAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filename: "scan.jpg" }),
  });
  if (!initRes.ok) {
    throw new Error(`YouCam file init failed: ${initRes.status}`);
  }
  const init = await initRes.json();
  const uploadUrl = init?.requests?.url || init?.url;
  const fileId = init?.file_id || init?.id;
  if (!uploadUrl || !fileId) {
    throw new Error("YouCam file init returned no upload url / file id");
  }

  // 2. PUT the image bytes to the provided upload URL.
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType || "image/jpeg" },
    body: imageBuffer,
  });
  if (!putRes.ok) {
    throw new Error(`YouCam file upload failed: ${putRes.status}`);
  }
  return fileId;
}

async function startTask(fileId) {
  const res = await fetch(`${BASE}/s2s/v2.0/task/skin-analysis`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.YOUCAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file_id: fileId,
      // Ask for consumer-friendly calibrated scores.
      score_type: "ui_score",
    }),
  });
  if (!res.ok) {
    throw new Error(`YouCam task start failed: ${res.status}`);
  }
  const data = await res.json();
  const taskId = data?.task_id || data?.id;
  if (!taskId) throw new Error("YouCam task start returned no task id");
  return taskId;
}

async function pollTask(taskId, timeoutMs = 30000) {
  const start = Date.now();
  const delay = 1500;
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${BASE}/skin-analysis/${taskId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${process.env.YOUCAM_API_KEY}` },
    });
    if (!res.ok) throw new Error(`YouCam poll failed: ${res.status}`);
    const data = await res.json();
    const status = data?.task_status || data?.status;
    if (status === "success" || status === "completed") return data;
    if (status === "error" || status === "failed") {
      throw new Error(
        `YouCam task error: ${data?.error_message || "unknown"}`
      );
    }
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error("YouCam task timed out");
}

/**
 * Run a real YouCam skin analysis from an image buffer.
 * Returns { concerns, zones, raw } mapped onto our local shapes, or
 * throws if anything goes wrong (caller should fall back to the mock).
 */
export async function analyzeWithYouCam(imageBuffer, contentType) {
  const fileId = await uploadFile(imageBuffer, contentType);
  const taskId = await startTask(fileId);
  const result = await pollTask(taskId);

  // YouCam returns a list of concerns, each with ui_score / raw_score.
  const concernsRaw = result?.concerns || result?.result?.concerns || [];
  const concernScores = {};
  concernsRaw.forEach((c) => {
    const key = CONCERN_MAP[normalizeKey(c.name)];
    if (key && concernScores[key] === undefined) {
      const score =
        c.ui_score ?? c.score ?? c.raw_score ?? c.value ?? undefined;
      if (typeof score === "number") {
        concernScores[key] = Math.round(Math.min(100, Math.max(0, score)));
      }
    }
  });

  // YouCam may return per-zone scores; map what we can, else derive from
  // the overall concern scores so the zone map still renders.
  const zonesRaw = result?.zones || result?.result?.zones || [];
  const zoneScores = {};
  if (zonesRaw.length) {
    zonesRaw.forEach((z) => {
      const key = normalizeKey(z.name).replace(/\s+/g, "");
      const score = z.ui_score ?? z.score ?? z.raw_score ?? z.value;
      if (typeof score === "number") {
        zoneScores[key] = Math.round(Math.min(100, Math.max(0, score)));
      }
    });
  }

  return { concernScores, zoneScores, result };
}
