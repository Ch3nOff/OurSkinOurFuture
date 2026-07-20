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
  History,
  ClipboardList,
  HeartPulse,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { topConcerns } from "@/lib/skinAnalysis";
import FaceZoneMap from "@/components/FaceZoneMap";
import IngredientCard from "@/components/IngredientCard";
import TimelineSlider from "@/components/TimelineSlider";
import ScanComparison from "@/components/ScanComparison";
import CameraCapture from "@/components/CameraCapture";

export default function DashboardClient({ initialUser, initialHistory }) {
  const [stage, setStage] = useState("capture"); // capture | camera | analyzing | results | routine
  const [imagePreview, setImagePreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [recSource, setRecSource] = useState(null);
  const [recLoading, setRecLoading] = useState(false);

  const [routine, setRoutine] = useState("");
  const [prefs, setPrefs] = useState({
    sleep: "",
    sunExposure: "",
    diet: "",
    stress: "",
    activity: "",
  });
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planSource, setPlanSource] = useState(null);

  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [user, setUser] = useState(initialUser);
  const [history, setHistory] = useState(initialHistory);
  const [showHistory, setShowHistory] = useState(false);
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
    setAnalysisError(null);
    setStage("analyzing");

    try {
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, seed }),
      });
      const result = await analyzeRes.json();
      if (!analyzeRes.ok || result.error) {
        throw new Error(result.error || "Analysis failed");
      }
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
      setRecSource(recData.source ?? null);
    } catch (err) {
      console.error("Analysis flow failed:", err);
      setAnalysisError(err.message || "Analysis failed. Please try again.");
      setStage("capture");
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
    setRoutine("");
    setPrefs({ sleep: "", sunExposure: "", diet: "", stress: "", activity: "" });
    setPlan(null);
    setPlanSource(null);
    setSaveState("idle");
  }

  async function generatePlan() {
    setPlanLoading(true);
    try {
      const res = await fetch("/api/qwen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concerns: analysis.concerns,
          routine,
          preferences: prefs,
        }),
      });
      const data = await res.json();
      setPlan(data.plan);
      setPlanSource(data.source ?? "fallback");
    } catch {
      setPlan(null);
      setPlanSource("fallback");
    } finally {
      setPlanLoading(false);
    }
  }

  function loadPastScan(scan) {
    setAnalysis({
      concerns: scan.concern_scores,
      zones: scan.zone_scores,
      mock: scan.mock ?? false,
    });
    setImagePreview(scan.image_url || null);
    setRecommendation(scan.recommendation_text || null);
    setRoutine(scan.routine || "");
    setPlan(scan.qwen_plan || null);
    setPlanSource(scan.qwen_plan ? "qwen" : null);
    if (scan.preferences) setPrefs({ sleep: "", sunExposure: "", diet: "", stress: "", activity: "", ...scan.preferences });
    setStage("results");
    setShowHistory(false);
  }

  async function handleSave() {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    if (!analysis) return;

    setSaveState("saving");
    try {
      let imageUrl = imagePreview;

      // Upload the captured image only if it's a fresh data URL (not a
      // already-saved public URL being re-viewed from history).
      if (imagePreview && imagePreview.startsWith("data:")) {
        const blob = await (await fetch(imagePreview)).blob();
        const path = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("scan-photos").upload(path, blob, {
          contentType: "image/jpeg",
        });
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from("scan-photos").getPublicUrl(path);
          imageUrl = publicUrlData?.publicUrl ?? imageUrl;
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
          routine: routine || null,
          preferences: prefs || null,
          qwen_plan: plan || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSaveState("saved");
      setHistory((prev) => [inserted, ...prev.filter((h) => h.id !== inserted.id)]);
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

        <div className="flex items-center gap-3">
          {user && history.length > 0 && (
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors"
            >
              <History size={13} />
              History
            </button>
          )}
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
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 pb-16">
        {showHistory && (
          <div className="mt-4 rounded-3xl p-5 bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-mono uppercase tracking-widest text-muted">Your past tests</div>
              <button onClick={() => setShowHistory(false)} className="text-muted hover:text-ink">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {history.map((scan) => (
                <button
                  key={scan.id}
                  onClick={() => loadPastScan(scan)}
                  className="w-full flex items-center gap-3 rounded-2xl p-3 bg-paper border border-border hover:border-gold transition-colors text-left"
                >
                  {scan.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={scan.image_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-border shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-ink">
                      {new Date(scan.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      ·{" "}
                      {new Date(scan.created_at).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-[11px] text-faint truncate">
                      {scan.routine ? "Routine + plan saved" : "Tap to view this test"}
                    </div>
                  </div>
                  <ChevronRight size={16} className="ml-auto text-faint shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === "capture" && (
          <div className="mt-6">
            {analysisError && (
              <div className="flex items-start gap-2 mb-4 rounded-2xl p-3 bg-clay/10 border border-clay/40 text-clay">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p className="text-xs leading-relaxed">{analysisError}</p>
              </div>
            )}
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
                Analysis is powered by the YouCam Skin Analysis API when configured; otherwise a demo model is
                used. Your personalized plan is generated by Qwen. See ROADMAP.md for details.
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
              // eslint-disable-next-line @next/next/no-img-element
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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="Scan result" className="w-11 h-11 rounded-xl object-cover border border-border" />
                )}
                <div>
                  <div className="text-sm font-semibold text-ink">Analysis Results</div>
                  <div className="text-[11px] font-mono text-faint">
                    {analysis.mock ? "Demo model" : "YouCam Skin Analysis"}
                  </div>
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
                <>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-[#F0EBDD]">
                    {recommendation || "Your personalized note will appear here after analysis."}
                  </p>
                  {!recLoading && recommendation && recSource === "fallback" && (
                    <p className="text-[10px] font-mono text-faint mt-2">demo note · set DASHSCOPE_API_KEY for a live Qwen note</p>
                  )}
                </>
              )}
            </section>

            <section className="rounded-3xl p-6 mb-4 bg-card border border-border">
              <div className="text-xs font-mono uppercase tracking-widest mb-4 text-muted">Treatment Simulation</div>
              <TimelineSlider image={imagePreview} baselineConcerns={analysis.concerns} totalWeeks={12} />
            </section>

            <div className="mb-4">
              <ScanComparison
                currentScan={{ concern_scores: analysis.concerns, created_at: new Date().toISOString() }}
                history={history}
              />
            </div>

            <button
              onClick={() => setStage("routine")}
              className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold bg-gold text-ink active:scale-[0.98] transition-transform"
            >
              <ClipboardList size={16} />
              What should I do? (Your routine + lifestyle)
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {stage === "routine" && analysis && (
          <div className="mt-4 space-y-4">
            <button
              onClick={() => setStage("results")}
              className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink"
            >
              <X size={13} /> Back to results
            </button>

            <section className="rounded-3xl p-5 bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList size={14} className="text-gold" />
                <span className="text-xs font-mono uppercase tracking-widest text-muted">Your current routine</span>
              </div>
              <p className="text-[11px] text-faint mb-2">
                List the products you already use (cleanser, serum, moisturizer, sunscreen…). We'll show what they're
                doing for your skin.
              </p>
              <textarea
                value={routine}
                onChange={(e) => setRoutine(e.target.value)}
                rows={4}
                placeholder="e.g. CeraVe cleanser, The Ordinary Niacinamide, La Roche-Posay SPF 50…"
                className="w-full rounded-2xl p-3 bg-paper border border-border text-sm text-ink placeholder:text-faint focus:outline-none focus:border-gold"
              />
            </section>

            <section className="rounded-3xl p-5 bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <HeartPulse size={14} className="text-gold" />
                <span className="text-xs font-mono uppercase tracking-widest text-muted">Your daily life</span>
              </div>
              <p className="text-[11px] text-faint mb-3">
                This helps the AI turn your facial signals into daily health habits. All optional.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <RoutineField label="Sleep" value={prefs.sleep} onChange={(v) => setPrefs((p) => ({ ...p, sleep: v }))} placeholder="~6h, irregular" />
                <RoutineField label="Sun exposure" value={prefs.sunExposure} onChange={(v) => setPrefs((p) => ({ ...p, sunExposure: v }))} placeholder="Mostly indoors" />
                <RoutineField label="Diet" value={prefs.diet} onChange={(v) => setPrefs((p) => ({ ...p, diet: v }))} placeholder="Lots of sugar" />
                <RoutineField label="Stress" value={prefs.stress} onChange={(v) => setPrefs((p) => ({ ...p, stress: v }))} placeholder="High" />
                <RoutineField label="Activity" value={prefs.activity} onChange={(v) => setPrefs((p) => ({ ...p, activity: v }))} placeholder="Gym 3x/week" />
              </div>
            </section>

            {!plan && (
              <button
                onClick={generatePlan}
                disabled={planLoading}
                className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold bg-sage text-paper active:scale-[0.98] transition-transform disabled:opacity-70"
              >
                {planLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {planLoading ? "Generating your plan..." : "Generate my personalized plan"}
              </button>
            )}

            {plan && (
              <section className="rounded-3xl p-5 bg-ink">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} className="text-gold" />
                    <span className="text-[11px] font-mono uppercase tracking-widest text-gold">Your plan</span>
                  </div>
                  <span className="text-[10px] font-mono text-faint">
                    {planSource === "qwen" ? "by Qwen" : "demo plan"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line text-[#F0EBDD]">{plan}</p>
              </section>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={handleSave}
                disabled={saveState === "saving" || saveState === "saved"}
                className="flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold bg-sage text-paper active:scale-[0.98] transition-transform disabled:opacity-70"
              >
                {saveState === "saving" && <Loader2 size={15} className="animate-spin" />}
                {saveState === "idle" && (user ? "Save This Test" : "Sign In to Save")}
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

function RoutineField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl p-2.5 bg-paper border border-border text-sm text-ink placeholder:text-faint focus:outline-none focus:border-gold"
      />
    </label>
  );
}
