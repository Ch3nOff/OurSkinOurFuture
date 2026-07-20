"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  Upload,
  ChevronRight,
  Sparkles,
  AlertCircle,
  X,
  Loader2,
  LogIn,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { topConcerns } from "@/lib/skinAnalysis";
import FaceZoneMap from "@/components/FaceZoneMap";
import IngredientCard from "@/components/IngredientCard";
import TimelineSlider from "@/components/TimelineSlider";
import ScanComparison from "@/components/ScanComparison";
import CameraCapture from "@/components/CameraCapture";

export default function DashboardClient({ initialUser, initialHistory }) {
  const [stage, setStage] = useState("capture"); // capture | camera | analyzing | results
  const [imagePreview, setImagePreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [user, setUser] = useState(initialUser);
  const [history, setHistory] = useState(initialHistory);
  const fileInputRef = useRef(null);

  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function runAnalysis(dataUrl, seed) {
    setImagePreview(dataUrl);
    setStage("analyzing");

    try {
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed }),
      });
      const result = await analyzeRes.json();
      setAnalysis(result);
      setStage("results");

      setRecLoading(true);
      const recRes = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concerns: result.concerns }),
      });
      const recData = await recRes.json();
      setRecommendation(recData.recommendation);
    } catch (err) {
      console.error("Analysis flow failed:", err);
    } finally {
      setRecLoading(false);
    }
  }

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const seed = file.size + file.name.length * 7;
      runAnalysis(e.target.result, seed);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }, [handleFile]);

  function handleCameraCapture(dataUrl) {
    const seed = dataUrl.length + Date.now();
    runAnalysis(dataUrl, seed);
  }

  function reset() {
    setStage("capture");
    setImagePreview(null);
    setAnalysis(null);
    setRecommendation(null);
    setSaveState("idle");
  }

  async function handleSave() {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    if (!analysis) return;

    setSaveState("saving");
    try {
      let imageUrl = null;

      if (imagePreview) {
        const blob = await (await fetch(imagePreview)).blob();
        const path = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("scan-photos").upload(path, blob, {
          contentType: "image/jpeg",
        });
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from("scan-photos").getPublicUrl(path);
          imageUrl = publicUrlData?.publicUrl ?? null;
        }
      }

      const { data: inserted, error: insertError } = await supabase
        .from("scans")
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          concern_scores: analysis.concerns,
          zone_scores: analysis.zones,
          recommendation_text: recommendation,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSaveState("saved");
      setHistory((prev) => [inserted, ...prev]);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveState("error");
    }
  }

  return (
    <div className="min-h-screen w-full bg-paper">
      {/* Header */}
      <header className="max-w-2xl mx-auto px-5 pt-8 pb-2 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-ink">
            <Sparkles size={14} color="#C9A876" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-ink">
            Our<span className="text-gold">Skin</span>Our<span className="text-gold">Future</span>
          </span>
        </Link>

        {user ? (
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        ) : (
          <Link href="/auth" className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors">
            <LogIn size={13} />
            Sign in
          </Link>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-5 pb-16">
        {stage === "capture" && (
          <div className="mt-6">
            <h1 className="text-3xl font-bold leading-tight mb-2 text-ink">
              Understand your skin.
              <br />
              See where it's headed.
            </h1>
            <p className="text-sm mb-6 leading-relaxed text-muted">
              Use your camera or upload a photo for a skin condition analysis, ingredient recommendations, and a
              projection of what consistent care could look like.
            </p>

            <div className="flex gap-2.5 mb-3">
              <button
                onClick={() => setStage("camera")}
                className="flex-1 rounded-2xl py-4 flex flex-col items-center justify-center gap-1.5 bg-ink text-paper"
              >
                <Camera size={20} />
                <span className="text-xs font-semibold">Use Camera</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 rounded-2xl py-4 flex flex-col items-center justify-center gap-1.5 bg-card border border-border text-ink"
              >
                <Upload size={20} />
                <span className="text-xs font-semibold">Upload Photo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            <p className="text-[11px] text-center mb-6 text-faint">
              For the most accurate read, using your camera performs better than uploading an existing photo —
              live capture avoids compression and lighting shifts from prior edits.
            </p>

            <div className="flex items-start gap-2 px-1">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-faint" />
              <p className="text-[11px] leading-relaxed text-faint">
                This build runs on simulated analysis data for demo purposes. See ROADMAP.md for the plan to
                connect the live YouCam Skin Analysis and AI Skin Simulation APIs.
              </p>
            </div>
          </div>
        )}

        {stage === "camera" && (
          <div className="mt-6">
            <CameraCapture onCapture={handleCameraCapture} onClose={() => setStage("capture")} />
          </div>
        )}

        {stage === "analyzing" && (
          <div className="mt-20 flex flex-col items-center">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 rounded-2xl object-cover mb-6 opacity-80 border-2 border-border"
              />
            )}
            <Loader2 size={24} className="animate-spin mb-3 text-sage" />
            <p className="text-sm font-medium text-ink">Analyzing skin condition...</p>
            <p className="text-xs mt-1 text-faint">Checking 8 indicators across 6 facial zones</p>
          </div>
        )}

        {stage === "results" && analysis && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {imagePreview && (
                  <img src={imagePreview} alt="Scan result" className="w-11 h-11 rounded-xl object-cover border border-border" />
                )}
                <div>
                  <div className="text-sm font-semibold text-ink">Analysis Results</div>
                  <div className="text-[11px] font-mono text-faint">8 indicators detected</div>
                </div>
              </div>
              <button
                onClick={reset}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F0EBDD]"
                aria-label="Start over"
              >
                <X size={14} className="text-[#8A7A52]" />
              </button>
            </div>

            <section className="rounded-3xl p-6 mb-4 bg-card border border-border">
              <div className="text-xs font-mono uppercase tracking-widest mb-4 text-muted">Facial Zone Map</div>
              <FaceZoneMap zones={analysis.zones} />
            </section>

            <section className="mb-4">
              <div className="text-xs font-mono uppercase tracking-widest mb-3 px-1 text-muted">
                Recommended Ingredients
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topConcerns(analysis.concerns, 4).map((c) => (
                  <IngredientCard key={c.key} concern={c} />
                ))}
              </div>
            </section>

            <section className="rounded-3xl p-5 mb-4 bg-ink">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={13} className="text-gold" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-gold">Personal Note</span>
              </div>
              {recLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 size={14} className="animate-spin text-paper" />
                  <span className="text-xs text-faint">Writing your personal recommendation...</span>
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-line text-[#F0EBDD]">
                  {recommendation || "Recommendation unavailable right now. Try uploading the photo again."}
                </p>
              )}
            </section>

            <section className="rounded-3xl p-6 mb-4 bg-card border border-border">
              <div className="text-xs font-mono uppercase tracking-widest mb-4 text-muted">Treatment Simulation</div>
              <TimelineSlider baselineConcerns={analysis.concerns} totalWeeks={12} />
            </section>

            <div className="mb-4">
              <ScanComparison
                currentScan={{ concern_scores: analysis.concerns, created_at: new Date().toISOString() }}
                history={history}
              />
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={handleSave}
                disabled={saveState === "saving" || saveState === "saved"}
                className="flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold bg-sage text-paper active:scale-[0.98] transition-transform disabled:opacity-70"
              >
                {saveState === "saving" && <Loader2 size={15} className="animate-spin" />}
                {saveState === "idle" && (user ? "Save This Scan" : "Sign In to Save")}
                {saveState === "saving" && "Saving..."}
                {saveState === "saved" && "Saved ✓"}
                {saveState === "error" && "Retry Save"}
              </button>
              <button
                onClick={reset}
                className="flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold bg-ink text-paper active:scale-[0.98] transition-transform"
              >
                Scan Another
                <ChevronRight size={16} />
              </button>
            </div>
            {saveState === "error" && (
              <p className="text-xs text-clay mt-2 text-center">Couldn't save — check your connection and try again.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
