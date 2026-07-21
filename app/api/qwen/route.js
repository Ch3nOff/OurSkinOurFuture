import { NextResponse } from "next/server";
import { CONCERN_LABELS, topConcerns } from "@/lib/skinAnalysis";
import { callQwen } from "@/lib/qwen";

/**
 * POST /api/qwen
 *
 * LIVE — calls Alibaba Qwen (via DashScope's OpenAI-compatible endpoint)
 * server-side. Body: { concerns, routine, preferences }.
 *
 * The Qwen key (DASHSCOPE_API_KEY) is read ONLY here, server-side.
 *
 * Produces a personalized facial-care plan that:
 *   - explains the value of what the user ALREADY uses (their routine)
 *   - recommends what to add/change based on the face analysis
 *   - translates the facial signals into daily health & lifestyle habits
 *     (sleep, water, sun, diet, stress) the user can act on.
 *
 * Falls back to a templated plan if the key is missing or the call fails,
 * so the results screen always has content.
 */
export async function POST(request) {
  try {
    const { concerns, routine, preferences } = await request.json();
    if (!concerns) {
      return NextResponse.json({ error: "Missing concerns data." }, { status: 400 });
    }

    const top = topConcerns(concerns, 4);
    const concernSummary = top
      .map((c) => `${c.label}: severity ${c.score}/100`)
      .join("\n");

    const routineText =
      typeof routine === "string" && routine.trim()
        ? routine.trim()
        : "(The user has not listed any current products.)";

    const prefs = preferences && typeof preferences === "object" ? preferences : {};
    const prefsText = Object.entries(prefs)
      .filter(([, v]) => v)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");
    const prefsBlock = prefsText || "(No lifestyle preferences provided.)";

    const prompt = `You are a friendly, evidence-based skincare and lifestyle coach. A user just scanned their face and received a skin analysis, and told you about the products they currently use and how they live day to day. Write a practical, warm, plain-language plan in English (no clinical coldness, no overpromising).

Skin analysis (top concerns):
${concernSummary}

Products the user currently uses (their routine):
${routineText}

User's daily-life preferences / context:
${prefsBlock}

Write in this exact structure with these headings:

## What your current routine is doing for you
One short paragraph: validate the value of what they already use, and gently note anything they use that may not help their top concerns.

## What to add or change
2-4 bullet points — each names a specific active/ingredient matched to one of their top concerns, and a simple how-to (morning/night, frequency).

## Daily habits your skin is asking for
3-4 bullet points translating their facial signals into everyday health actions (sleep, water, sun protection, diet, stress). Be specific and kind.

## Realistic expectation
One sentence: consistent routine + habits over 4-12 weeks, not instant results.

Maximum 320 words total. No markdown tables. Plain text under the headings above.`;

    const text = await callQwen({
      system:
        "You are a skincare and lifestyle coach. Output only the requested plan structure.",
      user: prompt,
      maxTokens: 900,
      temperature: 0.7,
    });

    return NextResponse.json({ plan: text, source: "qwen" });
  } catch (err) {
    console.error("Qwen route error:", err);
    return NextResponse.json(
      { error: err.message || "Personalized plan generation failed." },
      { status: err.status || 500 }
    );
  }
}
