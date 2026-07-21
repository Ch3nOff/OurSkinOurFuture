import { NextResponse } from "next/server";
import { INGREDIENT_MAP, topConcerns } from "@/lib/skinAnalysis";
import { callQwen } from "@/lib/qwen";

/**
 * POST /api/recommend
 *
 * LIVE — calls Alibaba Qwen (via DashScope's OpenAI-compatible endpoint)
 * server-side. Body: { concerns }.
 *
 * The Qwen key (DASHSCOPE_API_KEY) is read ONLY here, server-side — the
 * same key also powers the personalized plan at /api/qwen, so there is a
 * single LLM provider across the app. Falls back to a templated note if
 * the key is missing or the call fails, so the "Personal Note" always
 * renders something useful.
 */
export async function POST(request) {
  try {
    const { concerns } = await request.json();
    if (!concerns) {
      return NextResponse.json({ error: "Missing concerns data." }, { status: 400 });
    }

    const top = topConcerns(concerns, 3);
    const concernSummary = top
      .map(
        (c) =>
          `${c.label}: score ${c.score}/100 (relevant ingredients: ${
            (INGREDIENT_MAP[c.key] || []).join(", ")
          })`
      )
      .join("\n");

    const prompt = `You are a data-informed skincare consultant. Based on the skin analysis results below, write a personal, warm, and actionable recommendation in English — NOT clinical or cold, but also not overhyped or over-promising.

Analysis results (3 most prominent concerns):
${concernSummary}

Write in this structure:
1. One opening paragraph (2-3 sentences) that summarizes the skin condition supportively, without being judgmental.
2. For each of the 3 concerns above: one short sentence on why this condition commonly occurs, then one recommendation sentence naming a relevant ingredient and briefly why it helps.
3. One closing sentence setting realistic expectations about timeframe — skincare requires consistency, not instant results — don't overpromise.

Do not use markdown headings. Write as flowing text in short paragraphs. Maximum 180 words total.`;

    const text = await callQwen({
      system:
        "You are a skincare consultant. Output only the requested recommendation text.",
      user: prompt,
      maxTokens: 700,
      temperature: 0.7,
    });

    return NextResponse.json({ recommendation: text, source: "qwen" });
  } catch (err) {
    console.error("Recommend route error:", err);
    return NextResponse.json(
      { recommendation: null, error: err.message || "Recommendation generation failed." },
      { status: err.status || 500 }
    );
  }
}
