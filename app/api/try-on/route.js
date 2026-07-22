import { NextResponse } from "next/server";
import { startTryOnTask, pollTryOnTask, extractPalette, recommendPieces } from "@/lib/vto";

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
        tryOnImage: image,
        recommendation: {
          style,
          season,
          skinTone: skinTone || "neutral",
          palette: extractPalette(skinTone),
          pieces: recommendPieces(style, season),
          reason: "Demo preview — connect YouCam Apparel VTO for live try-on.",
        },
        mock: true,
      });
    }

    try {
      const { taskId, pollPath } = await startTryOnTask(image, { style, season, skinTone });
      const result = await pollTryOnTask(taskId, pollPath);

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
    } catch (apiErr) {
      console.warn("YouCam VTO failed, falling back to demo preview:", apiErr.message);
      return NextResponse.json({
        tryOnImage: image,
        recommendation: {
          style,
          season,
          skinTone: skinTone || "neutral",
          palette: extractPalette(skinTone),
          pieces: recommendPieces(style, season),
          reason: "Demo preview — live VTO coming soon.",
        },
        mock: true,
      });
    }
  } catch (err) {
    console.error("Try-on route error:", err.message);
    return NextResponse.json(
      { error: err.message || "Try-on failed. Please try again." },
      { status: err.status || 502 }
    );
  }
}
