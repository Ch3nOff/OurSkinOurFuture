import { NextResponse } from "next/server";
import {
  CONCERN_LABELS,
  ZONE_LABELS,
  type ConcernScore,
  type SkinAnalysis,
  type ZoneScore,
} from "@/lib/types";

export const runtime = "nodejs";

interface NarrativeRequest {
  analysis: SkinAnalysis;
}

/**
 * Live LLM narrative generation. Calls Anthropic Claude to turn the top
 * concerns into a personal, plain-language read on the skin. This is the one
 * piece of the prototype that is intentionally NOT mocked — it's a real API
 * call (when ANTHROPIC_API_KEY is set).
 *
 * If no API key is configured, it falls back to a deterministic templated
 * narrative so the demo still runs locally without credentials.
 */
export async function POST(req: Request) {
  let body: NarrativeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { analysis } = body;
  if (!analysis?.concerns?.length) {
    return NextResponse.json(
      { error: "Missing analysis data" },
      { status: 400 }
    );
  }

  const top3 = [...analysis.concerns]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const narrative = await generateWithClaude(apiKey, analysis, top3);
      return NextResponse.json({ narrative, source: "claude" });
    } catch (err) {
      // Fall through to the templated narrative rather than failing the demo.
      console.error("Claude narrative failed, using fallback:", err);
    }
  }

  const narrative = fallbackNarrative(analysis, top3);
  return NextResponse.json({ narrative, source: "fallback" });
}

function buildPrompt(analysis: SkinAnalysis, top3: ConcernScore[]): string {
  const concernLines = analysis.concerns
    .map((c) => `- ${c.label}: ${c.score}/100 (${c.severity})`)
    .join("\n");

  const zoneLines = analysis.zones
    .map((z: ZoneScore) => {
      const worst = [...analysis.concerns].sort(
        (a, b) => z.concerns[b.key] - z.concerns[a.key]
      )[0];
      return `- ${z.label}: overall ${z.score}/100, most affected by ${CONCERN_LABELS[worst.key]} (${z.concerns[worst.key]}/100)`;
    })
    .join("\n");

  const top3Text = top3
    .map((c, i) => `${i + 1}. ${c.label} (${c.score}/100, ${c.severity})`)
    .join("\n");

  return `You are a warm, knowledgeable dermatology-educated skincare coach writing a short personal read for someone who just scanned their face. Keep it under 90 words, plain language, encouraging but honest. Do NOT diagnose. Do NOT use clinical jargon. Reference the skin's overall health score of ${analysis.healthScore}/100. Name the top concerns and which facial zone each shows up strongest in. End with a hopeful one-line note about what consistent care can do.

Top 3 concerns to focus on:
${top3Text}

All concern scores (0 = best, 100 = most severe):
${concernLines}

Facial zone breakdown:
${zoneLines}`;
}

async function generateWithClaude(
  apiKey: string,
  analysis: SkinAnalysis,
  top3: ConcernScore[]
): Promise<string> {
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      system:
        "You are a friendly, body-positive skincare coach. Never shame. Never diagnose medical conditions. Always frame skin as normal and treatable.",
      messages: [{ role: "user", content: buildPrompt(analysis, top3) }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.content
    ?.filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("")
    .trim();
  if (!text) throw new Error("Empty response from Claude");
  return text;
}

function fallbackNarrative(
  analysis: SkinAnalysis,
  top3: ConcernScore[]
): string {
  const zoneFor = (key: ConcernScore["key"]) => {
    const z = [...analysis.zones].sort(
      (a, b) => b.concerns[key] - a.concerns[key]
    )[0];
    return z ? z.label : "your face";
  };

  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  const parts = [
    `Your skin is sitting at a health score of ${analysis.healthScore} out of 100 — that's a solid starting point, and the things showing up are very common.`,
  ];

  if (first) {
    parts.push(
      `The biggest signal is ${first.label.toLowerCase()}, most noticeable around ${zoneFor(
        first.key
      ).toLowerCase()}.`
    );
  }
  if (second) {
    parts.push(
      ` ${second.label} follows, concentrated in ${zoneFor(
        second.key
      ).toLowerCase()}.`
    );
  }
  if (third) {
    parts.push(
      ` And ${third.label.toLowerCase()} rounds out the top three, strongest on ${zoneFor(
        third.key
      ).toLowerCase()}.`
    );
  }

  parts.push(
    ` None of this is a flaw — it's just where a focused, consistent routine will pay off fastest. Stick with it and the timeline below shows what's realistic in three months.`
  );

  return parts.join("");
}
