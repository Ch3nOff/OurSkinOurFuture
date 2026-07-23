import { NextResponse } from "next/server";
import { startTryOnTask, pollTryOnTask } from "@/lib/vto";
import { getGarmentsForUndertone } from "@/lib/garmentCatalog";

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
    const { userImage, garmentImage, category = "tops", skinTone = "neutral" } = body;

    if (!userImage || !garmentImage) {
      return NextResponse.json(
        { error: "Both userImage and garmentImage are required for try-on." },
        { status: 400 }
      );
    }

    if (!YOUCAM_KEY) {
      return NextResponse.json({
        tryOnImage: userImage,
        recommendation: null,
        mock: true,
        error: "YOUCAM_API_KEY not configured",
      });
    }

    try {
      const { taskId, pollPath } = await startTryOnTask(userImage, garmentImage, category);
      const result = await pollTryOnTask(taskId, pollPath);

      const tryOnUrl =
        result?.data?.results?.url ||
        result?.data?.results?.output?.[0]?.url ||
        null;

      return NextResponse.json({
        tryOnImage: tryOnUrl,
        recommendation: null,
        mock: false,
      });
    } catch (apiErr) {
      console.warn("YouCam VTO failed, falling back to demo preview:", apiErr.message);
      return NextResponse.json({
        tryOnImage: userImage,
        recommendation: null,
        mock: true,
        error: apiErr.message,
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const undertone = searchParams.get("undertone") || "neutral";
    const concerns = searchParams.get("concerns")?.split(",").filter(Boolean) || [];

    const garments = getGarmentsForUndertone(undertone, concerns);
    return NextResponse.json({ garments, undertone, concerns });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
