import { NextResponse } from "next/server";

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

export async function POST(request) {
  try {
    const body = await request.json();
    const { image, style = "casual", season = "all", skinTone } = body;

    if (!image) {
      return NextResponse.json({ error: "An image is required for try-on." }, { status: 400 });
    }

    if (!YOUCAM_KEY) {
      return NextResponse.json({
        tryOnImage: null,
        recommendation: {
          style,
          season,
          skinTone: skinTone || "neutral",
          palette: ["#2C3E50", "#E74C3C", "#ECF0F1", "#8E44AD"],
          pieces: ["structured blazer", "neutral crewneck", "tailored trousers"],
          reason: "Demo mode — set YOUCAM_API_KEY to enable real Apparel VTO.",
        },
        mock: true,
      });
    }

    const taskId = await startTryOnTask(image, { style, season, skinTone });
    const result = await pollTryOnTask(taskId);

    const tryOnUrl =
      result?.data?.results?.url ||
      result?.data?.results?.output?.[0]?.url ||
      null;

    return NextResponse.json({
      tryOnImage: tryOnUrl,
      recommendation: {
        style,
        season,
        skinTone: skinTone || "neutral",
        palette: extractPalette(skinTone),
        pieces: recommendPieces(style, season),
        reason: "Based on detected undertone and current skin condition.",
      },
      mock: false,
    });
  } catch (err) {
    console.error("Try-on route error:", err.message);
    return NextResponse.json(
      { error: err.message || "Try-on failed. Please try again." },
      { status: err.status || 502 }
    );
  }
}

async function startTryOnTask(imageUrl, params) {
  const res = await fetch(`${YOUCAM_BASE}/s2s/v2.0/task/apparel-try-on`, {
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
  console.log("YouCam try-on request:", `style=${params.style} season=${params.season}`, `status:`, res.status, text.slice(0, 200));

  if (!res.ok) {
    throw new Error(`YouCam try-on task start failed (${res.status}): ${text}`);
  }

  const data = JSON.parse(text);
  const taskId = data?.data?.task_id || data?.task_id;
  if (!taskId) throw new Error("YouCam try-on task start returned no task_id");
  return taskId;
}

async function pollTryOnTask(taskId) {
  const start = Date.now();
  let delay = 1500;
  while (Date.now() - start < 90000) {
    const res = await fetch(`${YOUCAM_BASE}/s2s/v2.0/task/apparel-try-on/${taskId}`, {
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
