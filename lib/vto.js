const YOUCAM_BASE = (process.env.YOUCAM_API_BASE || "https://yce-api-01.makeupar.com").replace(/\/$/, "");
const YOUCAM_KEY = process.env.YOUCAM_API_KEY;

function authHeaders() {
  if (!YOUCAM_KEY) {
    const err = new Error("YOUCAM_API_KEY is not configured on the server.");
    err.status = 500;
    throw err;
  }
  return {
    Authorization: `Bearer ${YOUCAM_KEY}`,
    "Content-Type": "application/json",
  };
}

async function startTryOnTask(imageUrl, params) {
  const endpoints = [
    "/s2s/v2.0/task/apparel-try-on",
    "/s2s/v2.0/task/virtual-try-on",
    "/s2s/v2.0/task/vto",
    "/s2s/v2.0/try-on",
  ];

  for (const path of endpoints) {
    const res = await fetch(`${YOUCAM_BASE}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        src_file_url: imageUrl,
        style_category: params.style,
        season: params.season,
        skin_tone: params.skinTone || "neutral",
        format: "json",
      }),
    });

    const text = await res.text();
    console.log(`YouCam try-on attempt ${path}:`, `status:`, res.status, text.slice(0, 200));

    if (res.ok) {
      const data = JSON.parse(text);
      const taskId = data?.data?.task_id || data?.task_id;
      if (taskId) {
        return { taskId, pollPath: path };
      }
    }
  }

  throw new Error("YouCam try-on: no valid endpoint found. Check YOUCAM_API_KEY and endpoint availability.");
}

async function pollTryOnTask(taskId, pollPath = "/s2s/v2.0/task/apparel-try-on") {
  const start = Date.now();
  let delay = 1500;
  while (Date.now() - start < 90000) {
    const res = await fetch(`${YOUCAM_BASE}${pollPath}/${taskId}`, {
      method: "GET",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`YouCam try-on poll failed (${res.status})`);
    const data = await res.json();
    const status = data?.data?.task_status || data?.data?.status || data?.task_status || data?.status;
    if (status === "success" || status === "completed" || status === "done") return data;
    if (status === "error" || status === "failed") {
      throw new Error(`YouCam try-on task error: ${data?.data?.error_message || data?.data?.error || data?.error || "unknown"}`);
    }
    await new Promise((r) => setTimeout(r, delay));
    if (delay < 4000) delay += 500;
  }
  throw new Error("YouCam try-on task timed out.");
}

function extractPalette(skinTone) {
  const palettes = {
    warm: ["#C0392B", "#E67E22", "#F1C40F", "#8E44AD", "#2C3E50"],
    cool: ["#2980B9", "#1ABC9C", "#ECF0F1", "#9B59B6", "#34495E"],
    neutral: ["#E74C3C", "#3498DB", "#ECF0F1", "#8E44AD", "#2C3E50"],
  };
  return palettes[skinTone] || palettes.neutral;
}

function recommendPieces(style, season) {
  const pieces = {
    casual: ["structured blazer", "neutral crewneck", "tailored trousers"],
    formal: ["silk blouse", "wide-leg trousers", "pointed-toe heels"],
    streetwear: ["oversized hoodie", "cargo pants", "chunky sneakers"],
    default: ["versatile jacket", "neutral tee", "classic denim"],
  };
  return pieces[style] || pieces.default;
}

export { startTryOnTask, pollTryOnTask, extractPalette, recommendPieces };
