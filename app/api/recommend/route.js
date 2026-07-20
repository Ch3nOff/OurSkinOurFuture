import { NextResponse } from "next/server";
import { INGREDIENT_MAP, topConcerns } from "@/lib/skinAnalysis";

/**
 * POST /api/recommend
 *
 * LIVE — calls the real Anthropic API server-side. Body: { concerns }.
 *
 * This runs server-side specifically so ANTHROPIC_API_KEY never reaches
 * the browser. The earlier artifact prototype called api.anthropic.com
 * directly from client code, which only worked there because that
 * environment injects the key for you — a real deployed app must not
 * do that, so this route is the fix, not a stylistic choice.
 */
export async function POST(request) {
  try {
    const { concerns } = await request.json();
    if (!concerns) {
      return NextResponse.json({ error: "Missing concerns data." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const top = topConcerns(concerns, 3);

    if (!apiKey) {
      return NextResponse.json({
        recommendation: fallbackRecommendation(top),
        source: "fallback",
      });
    }

    const concernSummary = top
      .map(
        (c) =>
          `${c.label}: score ${c.score}/100 (relevant ingredients: ${INGREDIENT_MAP[c.key].join(", ")})`
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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return NextResponse.json({
        recommendation: fallbackRecommendation(top),
        source: "fallback",
      });
    }

    const data = await response.json();
    const text = data.content
      ?.filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return NextResponse.json({
      recommendation: text || fallbackRecommendation(top),
      source: text ? "claude" : "fallback",
    });
  } catch (err) {
    console.error("Recommend route error:", err);
    return NextResponse.json(
      { recommendation: null, error: "Recommendation generation failed." },
      { status: 200 }
    );
  }
}

function fallbackRecommendation(top) {
  if (!top || !top.length) {
    return "Your skin shows a balanced baseline. Keep a simple routine — gentle cleanser, moisturizer, and daily SPF — and revisit in a few weeks to track changes.";
  }
  const lines = top.map((c) => {
    const ingredients = (INGREDIENT_MAP[c.key] || []).slice(0, 2).join(" or ");
    return `For ${c.label.toLowerCase()}, consider adding ${ingredients}.`;
  });
  return `Your analysis highlights ${top[0].label.toLowerCase()} as the top priority. ${lines.join(
    " "
  )} Consistency over 4-12 weeks matters more than any single product — pair this with sleep, water, and daily sun protection.`;
}
