"use client";

import { useState } from "react";
import { UploadStep } from "@/components/UploadStep";
import { ZoneMap } from "@/components/ZoneMap";
import { ConcernBars } from "@/components/ConcernBars";
import { IngredientCards } from "@/components/IngredientCards";
import { Narrative } from "@/components/Narrative";
import { Timeline } from "@/components/Timeline";
import { mockSkinAnalysis } from "@/lib/mockAnalysis";
import { mockSimulation } from "@/lib/mockSimulation";
import { buildRecommendations } from "@/lib/recommendations";
import type {
  IngredientRecommendation,
  SkinAnalysis,
  SkinSimulation,
} from "@/lib/types";

type Phase = "idle" | "analyzing" | "results";

interface UploadedImage {
  name: string;
  size: number;
  dataUrl: string;
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [simulation, setSimulation] = useState<SkinSimulation | null>(null);
  const [recs, setRecs] = useState<IngredientRecommendation[]>([]);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [narrativeSource, setNarrativeSource] = useState<
    "claude" | "fallback" | null
  >(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImage(img: UploadedImage) {
    setError(null);
    setImage(img);
    setPhase("analyzing");
    setAnalysis(null);
    setSimulation(null);
    setRecs([]);
    setNarrative(null);
    setNarrativeSource(null);

    try {
      // M3: replace mockSkinAnalysis() here with the /api/analyze route.
      const result = await mockSkinAnalysis(img);
      setAnalysis(result);
      setRecs(buildRecommendations(result));

      // M3: replace mockSimulation() here with the /api/simulate route.
      const sim = await mockSimulation(result);
      setSimulation(sim);

      setPhase("results");

      // Live LLM narrative (real call when ANTHROPIC_API_KEY is set).
      setNarrativeLoading(true);
      try {
        const res = await fetch("/api/narrative", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ analysis: result }),
        });
        const data = await res.json();
        if (res.ok && data.narrative) {
          setNarrative(data.narrative);
          setNarrativeSource(data.source ?? "fallback");
        }
      } catch {
        // Narrative is non-blocking; the rest of the results still show.
      } finally {
        setNarrativeLoading(false);
      }
    } catch (e) {
      setError(
        "Something went wrong analyzing that image. Please try another photo."
      );
      setPhase("idle");
    }
  }

  function reset() {
    setPhase("idle");
    setImage(null);
    setAnalysis(null);
    setSimulation(null);
    setRecs([]);
    setNarrative(null);
    setNarrativeSource(null);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
          OurSkinOurFuture
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--muted)] sm:text-base">
          A skin diagnostic that shows what your skin looks like months from now
          — if you act on the recommendation.
        </p>
      </header>

      {phase === "idle" && <UploadStep onImage={handleImage} />}

      {phase === "analyzing" && (
        <div className="flex flex-col items-center justify-center py-20">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.dataUrl}
              alt="Uploaded selfie being analyzed"
              className="mb-6 h-40 w-40 rounded-2xl object-cover opacity-70"
            />
          )}
          <div className="relative flex h-12 w-12">
            <span className="pulse-ring absolute inline-flex h-full w-full" />
            <span className="relative inline-flex h-12 w-12 rounded-full bg-[var(--accent)]" />
          </div>
          <p className="mt-5 text-lg font-medium">Analyzing your skin…</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Scoring 8 concerns across 5 facial zones
          </p>
        </div>
      )}

      {phase === "results" && analysis && simulation && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <button
              onClick={reset}
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--panel-2)]"
            >
              ← New photo
            </button>
            <div className="text-right">
              <p className="text-xs text-[var(--muted)]">Skin health</p>
              <p className="text-2xl font-bold text-[var(--good)]">
                {analysis.healthScore}
                <span className="text-sm font-normal text-[var(--muted)]">
                  /100
                </span>
              </p>
            </div>
          </div>

          <Section title="Your diagnosis" subtitle="Per-concern severity, 0–100">
            <ConcernBars concerns={analysis.concerns} />
          </Section>

          <Section
            title="Where it shows up"
            subtitle="Skin isn't uniform — here's the zone-by-zone breakdown"
          >
            <ZoneMap analysis={analysis} />
          </Section>

          <Narrative
            text={narrative}
            source={narrativeSource}
            loading={narrativeLoading}
          />

          <Section
            title="What to use"
            subtitle="Top concerns mapped to specific actives"
          >
            <IngredientCards recommendations={recs} />
          </Section>

          <Section
            title="If you follow through"
            subtitle={`Projected improvement over 12 weeks · ~${simulation.improvementPct}% avg reduction`}
          >
            <Timeline simulation={simulation} />
          </Section>

          <p className="pb-4 text-center text-xs text-[var(--muted)]">
            Built for the YouCam Skin AI hackathon · Diagnosis via YouCam Skin
            Analysis API · Projection via YouCam AI Skin Simulation API
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 text-center text-sm text-[var(--bad)]">{error}</p>
      )}
    </main>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[var(--muted)]">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}
