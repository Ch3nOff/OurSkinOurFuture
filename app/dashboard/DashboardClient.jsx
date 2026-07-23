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
import { topConcerns, CONCERN_LABELS, concernExplanation, INGREDIENT_MAP } from "@/lib/skinAnalysis";
import FaceZoneMap from "@/components/FaceZoneMap";
import IngredientCard from "@/components/IngredientCard";
import TimelineSlider from "@/components/TimelineSlider";
import ScanComparison from "@/components/ScanComparison";
import CameraCapture from "@/components/CameraCapture";
import { detectPhotoType } from "@/lib/imageUtils";

export default function DashboardClient({ initialUser, initialHistory }) {
  const [stage, setStage] = useState("capture"); // capture | camera | analyzing | results | routine
  const [imagePreview, setImagePreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recSource, setRecSource] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [productsSlugs, setProductsSlugs] = useState([]);

  const [tryOnResult, setTryOnResult] = useState(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnError, setTryOnError] = useState(null);

  const [garments, setGarments] = useState([]);
  const [selectedGarment, setSelectedGarment] = useState(null);
  const [garmentLoading, setGarmentLoading] = useState(false);

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

  const [progressReview, setProgressReview] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);

  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [user, setUser] = useState(initialUser);
  const [history, setHistory] = useState(initialHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [photoType, setPhotoType] = useState(null);
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
    setPhotoType(null);

    try {
      const detected = await detectPhotoType(dataUrl);
      setPhotoType(detected);

      let faceImage = dataUrl;
      try {
        faceImage = await cropToFaceZone(dataUrl);
      } catch (e) {
        console.warn("Face crop failed, using full image:", e);
      }

      const res = await fetch("/api/analyze-and-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, faceImage, seed, style: "casual", season: "all", userId: user?.id }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || "Analysis failed");
      }
      setAnalysis(result.analysis);
      setTryOnResult(result.tryOnImage ? { tryOnImage: result.tryOnImage, recommendation: result.recommendation, mock: result.mock } : null);
      setStage("results");
      fetchGarments();
    } catch (err) {
      console.error("Analysis flow failed:", err);
      setAnalysisError(err.message || "Analysis failed. Please try again.");
      setStage("capture");
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
    setAnalysisError(null);
    setRecommendation(null);
    setRecommendationLoading(false);
    setRecSource(null);
    setProducts([]);
    setProductsLoading(false);
    setProductsError(null);
    setProductsSlugs([]);
    setTryOnResult(null);
    setTryOnLoading(false);
    setTryOnError(null);
    setGarments([]);
    setSelectedGarment(null);
    setGarmentLoading(false);
    setPhotoType(null);
    setProgressReview(null);
    setProgressLoading(false);
    setRoutine("");
    setPrefs({ sleep: "", sunExposure: "", diet: "", stress: "", activity: "" });
    setPlan(null);
    setPlanSource(null);
    setSaveState("idle");
  }

  async function fetchProducts() {
    if (!analysis?.concerns) return;
    setProductsLoading(true);
    setProductsError(null);
    try {
      const topSlugs = Object.entries(analysis.concerns || {})
        .filter(([, s]) => typeof s === "number" && s >= 31)
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
        .slice(0, 4)
        .map(([slug]) => {
          const map = {
            acne: "acne-inflammation",
            wrinkle: "fine-lines-wrinkles",
            redness: "redness",
            darkCircle: "dark-circles",
            pore: "pores",
            texture: "skin-texture",
            spot: "hyperpigmentation",
            moisture: "moisture",
          };
          return map[slug] || slug;
        });

      setProductsSlugs(topSlugs);

      if (topSlugs.length > 0) {
        const prodRes = await fetch("/api/products/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concernSlugs: topSlugs, countryCode: "US" }),
        });
        const prodData = await prodRes.json();
        if (prodData.error) {
          setProductsError(prodData.error);
        }
        setProducts(prodData.recommendations || []);
      }
    } catch (err) {
      setProductsError(err.message);
    } finally {
      setProductsLoading(false);
    }
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
      if (data.error) {
        setPlan(`Plan unavailable: ${data.error}`);
        setPlanSource("error");
      } else {
        setPlan(data.plan);
        setPlanSource(data.source ?? "qwen");
      }
    } catch (err) {
      setPlan(`Plan unavailable: ${err.message || "Failed to generate plan."}`);
      setPlanSource("error");
    } finally {
      setPlanLoading(false);
    }
  }

  async function fetchProgressReview() {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    setProgressLoading(true);
    try {
      const res = await fetch("/api/progress-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.error) {
        setProgressReview(`Review unavailable: ${data.error}`);
      } else {
        setProgressReview(data.review);
      }
    } catch (err) {
      setProgressReview(`Review unavailable: ${err.message || "Failed to generate review."}`);
    } finally {
      setProgressLoading(false);
    }
  }

  async function fetchGarments() {
    if (!analysis) return;
    setGarmentLoading(true);
    setSelectedGarment(null);
    setTryOnResult(null);
    try {
      const topConcernKeys = Object.entries(analysis.concerns || {})
        .filter(([, s]) => typeof s === "number" && s >= 31)
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
        .slice(0, 3)
        .map(([key]) => key);

      const undertone = analysis.skinTypes?.[0]?.skinType === "Oily" ? "warm" : "neutral";
      const res = await fetch(`/api/try-on?undertone=${encodeURIComponent(undertone)}&concerns=${encodeURIComponent(topConcernKeys.join(","))}`);
      const data = await res.json();
      if (data.garments) {
        setGarments(data.garments);
      }
    } catch (err) {
      console.error("Failed to fetch garments:", err);
    } finally {
      setGarmentLoading(false);
    }
  }

  async function fetchRecommendation() {
    if (!analysis?.concerns) return;
    setRecommendationLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concerns: analysis.concerns }),
      });
      const data = await res.json();
      if (data.error) {
        setRecommendation(`Note unavailable: ${data.error}`);
        setRecSource("error");
      } else {
        setRecommendation(data.recommendation);
        setRecSource(data.source ?? null);
      }
    } catch (err) {
      setRecommendation(`Note unavailable: ${err.message || "Failed to generate note."}`);
      setRecSource("error");
    } finally {
      setRecommendationLoading(false);
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
            {photoType && (
              <p className="text-[11px] mt-1 text-faint italic">{photoType.reason}</p>
            )}
            <p className="text-[11px] mt-1 text-faint">Checking 8 indicators across 6 facial zones</p>
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

            {/* Save button - available immediately on results */}
            <div className="mb-4">
              <button
                onClick={handleSave}
                disabled={saveState === "saving" || saveState === "saved"}
                className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-semibold bg-sage text-paper active:scale-[0.98] transition-transform disabled:opacity-70"
              >
                {saveState === "saving" && <Loader2 size={15} className="animate-spin" />}
                {saveState === "idle" && (user ? "Save This Test" : "Sign In to Save")}
                {saveState === "saving" && "Saving..."}
                {saveState === "saved" && "Saved ✓"}
                {saveState === "error" && "Retry Save"}
              </button>
              {saveState === "error" && (
                <p className="text-xs text-clay mt-2 text-center">Couldn't save — check your connection and try again.</p>
              )}
            </div>

            {/* Analysis Summary: overall + per-concern breakdown */}
            <section className="rounded-3xl p-5 mb-4 bg-card border border-border">
              <div className="text-xs font-mono uppercase tracking-widest mb-3 text-muted">Analysis Summary</div>
              
              {/* Overall scores row */}
              <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-border">
                {analysis.overall != null && (
                  <div className="text-center">
                    <div className="text-3xl font-semibold text-ink">{analysis.overall}</div>
                    <div className="text-[11px] text-muted">Overall Score</div>
                  </div>
                )}
                {analysis.skinAge != null && (
                  <div className="text-center">
                    <div className="text-3xl font-semibold text-ink">{analysis.skinAge}</div>
                    <div className="text-[11px] text-muted">Skin Age</div>
                  </div>
                )}
                {analysis.skinTypes?.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    {analysis.skinTypes.map((st, i) => (
                      <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#F0EBDD] text-[#6B5D42]">
                        {st.region === "whole" ? "Skin" : st.region.replace("_", " ")}: {st.skinType}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Per-concern breakdown */}
              <div className="space-y-2.5">
                {Object.entries(analysis.concerns || {})
                  .filter(([, score]) => typeof score === "number")
                  .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                  .map(([key, score]) => {
                    const label = CONCERN_LABELS[key] || key;
                    const explanation = concernExplanation(key);
                    const ingredients = INGREDIENT_MAP[key] || [];
                    const severity = score >= 61 ? "High" : score >= 31 ? "Moderate" : "Low";
                    const severityColor = score >= 61 ? "#B85C4A" : score >= 31 ? "#C9A876" : "#4A6355";
                    return (
                      <div key={key} className="rounded-2xl p-3 bg-paper border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-ink">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ color: severityColor, background: `${severityColor}15` }}>
                              {severity}
                            </span>
                            <span className="text-lg font-semibold font-mono" style={{ color: severityColor }}>{score}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted mb-2">{explanation}</p>
                        {ingredients.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {ingredients.map((ing) => (
                              <span key={ing} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F0EBDD] text-[#6B5D42]">
                                {ing}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* Score legend */}
            <div className="mb-5 rounded-2xl p-3 bg-card border border-border">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">How to read scores</div>
              <div className="flex flex-wrap gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4A6355]" /> Low (0–30)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C9A876]" /> Moderate (31–60)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B85C4A]" /> High (61–100)
                </span>
              </div>
            </div>

            <section className="rounded-3xl p-6 mb-4 bg-card border border-border">
              <div className="text-xs font-mono uppercase tracking-widest mb-4 text-muted">Facial Zone Map</div>
              <FaceZoneMap image={imagePreview} zones={analysis.zones} masks={analysis.masks} concerns={analysis.concerns} />
            </section>

            {(analysis.overall != null || analysis.skinAge != null || analysis.skinTypes?.length) && (
              <section className="rounded-3xl p-5 mb-4 bg-card border border-border">
                <div className="text-xs font-mono uppercase tracking-widest mb-4 text-muted">Your Skin Profile</div>
                <div className="flex flex-wrap gap-4">
                  {/* Skin health ring */}
                  {analysis.overall != null && (
                    <div className="flex flex-col items-center gap-1">
                      <svg width="72" height="72" viewBox="0 0 72 72">
                        <circle cx="36" cy="36" r="30" fill="none" stroke="#F0EBDD" strokeWidth="6" />
                        <circle
                          cx="36"
                          cy="36"
                          r="30"
                          fill="none"
                          stroke={analysis.overall >= 70 ? "#4A6355" : analysis.overall >= 40 ? "#C9A876" : "#B85C4A"}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 30}`}
                          strokeDashoffset={`${2 * Math.PI * 30 * (1 - analysis.overall / 100)}`}
                          transform="rotate(-90 36 36)"
                        />
                        <text x="36" y="40" textAnchor="middle" className="text-xs font-semibold fill-ink">
                          {analysis.overall}
                        </text>
                      </svg>
                      <span className="text-[10px] text-muted">Skin health</span>
                    </div>
                  )}
                  {analysis.skinAge != null && (
                    <div>
                      <div className="text-2xl font-semibold text-ink">{analysis.skinAge}</div>
                      <div className="text-[11px] text-muted">Skin age</div>
                    </div>
                  )}
                  {analysis.skinTypes?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {analysis.skinTypes.map((st, i) => (
                        <span key={i} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F0EBDD] text-[#6B5D42]">
                          {st.region === "whole" ? "Skin" : st.region.replace("_", " ")}: {st.skinType}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 ml-auto">
                    <div className="w-8 h-8 rounded-full border-2 border-border" style={{ background: "linear-gradient(135deg, #FDBCB4, #E8B4B8)" }} />
                    <div>
                      <div className="text-[11px] font-medium text-ink">Undertone</div>
                      <div className="text-[10px] text-muted">Warm / Neutral</div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-3xl p-6 mb-4 bg-card border border-border">
              <div className="text-xs font-mono uppercase tracking-widest mb-4 text-muted">Top Concerns</div>
              <div className="space-y-3">
                {topConcerns(analysis.concerns, 5).map((c) => {
                  const pct = Math.min(100, Math.max(0, c.score));
                  const color = pct >= 61 ? "bg-[#B85C4A]" : pct >= 31 ? "bg-[#C9A876]" : "bg-[#4A6355]";
                  return (
                    <div key={c.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-ink">{CONCERN_LABELS[c.key] || c.key}</span>
                        <span className="text-[11px] font-mono text-muted">{pct}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#F0EBDD] overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl p-6 mb-4 bg-card border border-border">
              <div className="text-xs font-mono uppercase tracking-widest mb-4 text-muted">Your Color Harmony</div>
              <p className="text-[11px] text-muted mb-3">Based on your undertone and active concerns, these hues will complement your complexion.</p>
              <div className="flex gap-3">
                {[ "#2E8B57", "#3B5998", "#D4A5A5", "#E2725B", "#36454F" ].map((hex, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-full border-2 border-border shadow-sm" style={{ background: hex }} title={hex} />
                    <span className="text-[10px] font-mono text-muted">{hex}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl p-6 mb-4 bg-card border border-border">
              <div className="text-xs font-mono uppercase tracking-widest mb-4 text-muted">Skin Condition Radar</div>
              <div className="flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-48 h-48">
                  <polygon points="100,20 180,75 150,160 50,160 20,75" fill="none" stroke="#F0EBDD" strokeWidth="1" />
                  <polygon points="100,50 150,80 130,130 70,130 50,80" fill="none" stroke="#F0EBDD" strokeWidth="1" />
                  {(() => {
                    const items = topConcerns(analysis.concerns, 5);
                    if (items.length === 0) return null;
                    const cx = 100, cy = 90, r = 65;
                    const angleStep = (2 * Math.PI) / items.length;
                    const startAngle = -Math.PI / 2;
                    const pts = items.map((c, i) => {
                      const angle = startAngle + i * angleStep;
                      const dist = (Math.min(100, Math.max(0, c.score)) / 100) * r;
                      return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`;
                    }).join(" ");
                    return <polygon points={pts} fill="rgba(201,168,118,0.25)" stroke="#C9A876" strokeWidth="2" strokeLinejoin="round" />;
                  })()}
                  {topConcerns(analysis.concerns, 5).map((c, i) => {
                    const cx = 100, cy = 90, r = 65;
                    const angleStep = (2 * Math.PI) / 5;
                    const startAngle = -Math.PI / 2;
                    const angle = startAngle + i * angleStep;
                    const x = cx + r * Math.cos(angle);
                    const y = cy + r * Math.sin(angle);
                    return (
                      <g key={c.key}>
                        <circle cx={x} cy={y} r="3" fill="#C9A876" />
                        <text x={x + (Math.cos(angle) > 0 ? 6 : -6)} y={y + 3} textAnchor={Math.cos(angle) > 0 ? "start" : "end"} className="text-[8px] fill-muted">
                          {CONCERN_LABELS[c.key] || c.key}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
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
              {recommendationLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 size={14} className="animate-spin text-paper" />
                  <span className="text-xs text-faint">Writing your personal recommendation...</span>
                </div>
              ) : recommendation ? (
                <>
                  <p className={`text-sm leading-relaxed whitespace-pre-line ${recSource === "error" ? "text-clay" : "text-[#F0EBDD]"}`}>
                    {recommendation}
                  </p>
                  {!recommendationLoading && recommendation && recSource === "error" && (
                    <p className="text-[10px] font-mono text-clay mt-2">Qwen error · check DASHSCOPE_API_KEY in Vercel</p>
                  )}
                </>
              ) : (
                <button
                  onClick={fetchRecommendation}
                  disabled={!analysis}
                  className="rounded-2xl px-5 py-2.5 text-xs font-semibold bg-gold text-ink active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={13} />
                    Get my personal note
                  </span>
                </button>
              )}
            </section>

            <section className="rounded-3xl p-6 mb-4 bg-card border border-border">
              <div className="text-xs font-mono uppercase tracking-widest mb-4 text-muted">Treatment Simulation</div>
              <TimelineSlider image={imagePreview} baselineConcerns={analysis.concerns} totalWeeks={12} />
            </section>

            <section className="rounded-3xl p-6 mb-4 bg-card border border-border">
              <div className="text-xs font-mono uppercase tracking-widest mb-4 text-muted">Style Try-On</div>
              {tryOnResult ? (
                <div className="space-y-3">
                  <div className="rounded-2xl overflow-hidden border border-border bg-paper relative">
                    {tryOnResult.tryOnImage ? (
                      <img src={tryOnResult.tryOnImage} alt="Try-on result" className="w-full aspect-[3/4] object-contain" style={{ background: "#FDFBF6" }} />
                    ) : (
                      <div className="aspect-[3/4] flex items-center justify-center text-[11px] text-faint">No try-on image returned</div>
                    )}
                    {tryOnResult.mock && (
                      <span className="absolute top-2 right-2 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-ink/80 text-paper backdrop-blur-sm">
                        Demo Preview
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { setTryOnResult(null); setTryOnError(null); }}
                    className="w-full rounded-2xl py-2.5 text-xs font-semibold bg-paper text-ink border border-border active:scale-[0.98] transition-transform"
                  >
                    Back to wardrobe
                  </button>
                </div>
              ) : garmentLoading ? (
                <div className="text-center py-6">
                  <Loader2 size={18} className="animate-spin mx-auto mb-2 text-muted" />
                  <p className="text-xs text-faint">Curating color-harmonized wardrobe...</p>
                </div>
              ) : garments.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-muted mb-2">Color-matched to your undertone & current concerns</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {garments.map((g) => (
                      <button
                        key={g.id}
                        onClick={async () => {
                          setSelectedGarment(g);
                          setTryOnLoading(true);
                          setTryOnError(null);
                          try {
                            const res = await fetch("/api/try-on", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                userImage: imagePreview,
                                garmentImage: g.imageUrl,
                                category: g.category,
                                skinTone: "neutral",
                              }),
                            });
                            const data = await res.json();
                            if (data.error) {
                              setTryOnError(data.error);
                            } else {
                              setTryOnResult(data);
                            }
                          } catch (err) {
                            setTryOnError(err.message || "Try-on failed");
                          } finally {
                            setTryOnLoading(false);
                          }
                        }}
                        disabled={tryOnLoading}
                        className="group rounded-2xl overflow-hidden border border-border bg-paper active:scale-[0.98] transition-all duration-200 disabled:opacity-50 text-left hover:shadow-lg hover:border-[#C9A876]/40 hover:-translate-y-0.5"
                      >
                        <div className="aspect-[3/4] relative">
                          <img src={g.imageUrl} alt={g.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                            <p className="text-[10px] font-medium text-white">{g.name}</p>
                            <p className="text-[9px] text-white/80">{g.reason}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-faint text-xs">Color-matched outfits will appear here after your scan</div>
              )}
            </section>

            <div className="mb-4">
              <ScanComparison
                currentScan={{ concern_scores: analysis.concerns, created_at: new Date().toISOString() }}
                history={history}
              />
            </div>

            {user && (
              <section className="rounded-3xl p-6 mb-4 bg-card border border-border">
                <div className="text-xs font-mono uppercase tracking-widest mb-3 text-muted">Progress Review</div>
                {!progressReview ? (
                  <button
                    onClick={fetchProgressReview}
                    disabled={progressLoading}
                    className="w-full rounded-2xl py-3 text-xs font-semibold bg-ink text-paper active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {progressLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    {progressLoading ? "Analyzing your progress..." : "Get my progress review (last 30 days)"}
                  </button>
                ) : (
                  <div className="rounded-2xl p-4 bg-paper border border-border">
                    <p className="text-sm leading-relaxed text-ink whitespace-pre-line">{progressReview}</p>
                    <button
                      onClick={() => setProgressReview(null)}
                      className="mt-3 text-[11px] font-medium text-muted hover:text-ink transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Product Recommendations from Supabase */}
            <section className="rounded-3xl p-5 mb-4 bg-card border border-border">
              <div className="text-xs font-mono uppercase tracking-widest mb-3 text-muted">Recommended For You</div>
              {productsLoading ? (
                <div className="text-center py-4">
                  <span className="text-xs text-faint">Finding best products for your skin…</span>
                  {productsSlugs.length > 0 && (
                    <span className="text-[10px] font-mono text-faint block mt-1">
                      Looking up: {productsSlugs.join(", ")}
                    </span>
                  )}
                </div>
                ) : products.length > 0 ? (
                <div className="space-y-2">
                  {products.map((prod, i) => (
                    <a
                      key={i}
                      href={prod.purchase_url || prod.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl p-3 bg-paper border border-border hover:border-gold transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink truncate">{prod.product_name}</div>
                        <div className="text-[11px] text-muted">{prod.brand_name} · {prod.concern_display_name || prod.concern_label}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#F0EBDD] text-[#6B5D42]">
                            {prod.tier}
                          </span>
                          {prod.headline_ingredient && (
                            <span className="text-[10px] text-muted">{prod.headline_ingredient}</span>
                          )}
                          {prod.ingredient_label && !prod.headline_ingredient && (
                            <span className="text-[10px] text-muted">{prod.ingredient_label}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        {prod.price_local_cents != null && (
                          <span className="text-sm font-semibold text-ink">
                            {(prod.price_local_cents / 100).toFixed(2)} {prod.local_currency || ""}
                          </span>
                        )}
                        {prod.price != null && prod.price_local_cents == null && (
                          <span className="text-sm font-semibold text-ink">
                            {Number(prod.price).toFixed(2)} {prod.currency || "USD"}
                          </span>
                        )}
                        <ChevronRight size={14} className="ml-1 text-faint" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-faint mb-3">No products matched your scan yet.</p>
                  <button
                    onClick={fetchProducts}
                    className="rounded-2xl px-5 py-2.5 text-xs font-semibold bg-sage text-paper active:scale-[0.98] transition-transform"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={13} />
                      Check Products
                    </span>
                  </button>
                  {productsSlugs.length > 0 && (
                    <p className="text-[10px] font-mono text-faint mt-2">
                      Tried: {productsSlugs.join(", ")}
                    </p>
                  )}
                  {productsError && (
                    <p className="text-[10px] text-clay mt-2 break-words">{productsError}</p>
                  )}
                  <p className="text-[10px] text-faint mt-2">
                    Run the 3 Supabase SQL files in order, then click Check Products again.
                  </p>
                </div>
              )}
            </section>

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
              <section className={`rounded-3xl p-5 ${planSource === "error" ? "bg-clay/10 border border-clay/40" : "bg-ink"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} className={planSource === "error" ? "text-clay" : "text-gold"} />
                    <span className={`text-[11px] font-mono uppercase tracking-widest ${planSource === "error" ? "text-clay" : "text-gold"}`}>
                      {planSource === "error" ? "Plan unavailable" : "Your plan"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-faint">
                    {planSource === "qwen" ? "by Qwen" : planSource === "error" ? "API error" : "demo plan"}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed whitespace-pre-line ${planSource === "error" ? "text-clay" : "text-[#F0EBDD]"}`}>{plan}</p>
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
