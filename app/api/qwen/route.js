import { NextResponse } from "next/server";
import { CONCERN_LABELS, topConcerns } from "@/lib/skinAnalysis";

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

    const apiKey = process.env.DASHSCOPE_API_KEY;
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

    if (!apiKey) {
      return NextResponse.json({
        plan:
          fallbackPlan(concernSummary, routineText, prefsBlock),
        source: "fallback",
      });
    }

    const baseUrl =
      process.env.DASHSCOPE_BASE_URL ||
      "https://dashscope-us.aliyuncs.com/compatible-mode/v1";

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.DASHSCOPE_MODEL || "qwen-plus",
        messages: [
          {
            role: "system",
            content:
              "You are a skincare and lifestyle coach. Output only the requested plan structure.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 900,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Qwen API error:", res.status, errText);
      return NextResponse.json({
        plan: fallbackPlan(concernSummary, routineText, prefsBlock),
        source: "fallback",
      });
    }

    const data = await res.json();
    const plan = data.choices?.[0]?.message?.content?.trim() || null;

    return NextResponse.json({
      plan: plan || fallbackPlan(concernSummary, routineText, prefsBlock),
      source: plan ? "qwen" : "fallback",
    });
  } catch (err) {
    console.error("Qwen route error:", err);
    return NextResponse.json(
      { error: "Personalized plan generation failed." },
      { status: 500 }
    );
  }
}

function fallbackPlan(concernSummary, routineText, prefsBlock) {
  return `## What your current routine is doing for you
Based on your analysis, lean into the products that target your top concerns and drop anything that feels redundant.

## What to add or change
- Match each top concern to a proven active (e.g. Niacinamide for redness/ pores, Retinol for texture/ fine lines, Vitamin C for spots).
- Introduce one new active at a time, at night, 2-3x per week to start.

## Daily habits your skin is asking for
- Sleep 7-8 hours; skin repairs overnight.
- Drink enough water and use broad-spectrum SPF every morning.
- Manage stress and favor an anti-inflammatory diet (less sugar, more omega-3).

## Realistic expectation
Consistent routine plus habits over 4-12 weeks beats any single product.`;
}
