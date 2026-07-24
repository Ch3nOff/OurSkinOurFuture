"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  Upload,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  Sparkles,
  AlertCircle,
  X,
  Loader2,
  LogIn,
  LogOut,
  ClipboardList,
  HeartPulse,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ScanFace,
  HelpCircle,
  Info,
  BookOpen,
  Download,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { topConcerns, CONCERN_LABELS, concernExplanation, INGREDIENT_MAP, buildRoutine } from "@/lib/skinAnalysis";
import FaceZoneMap from "@/components/FaceZoneMap";
import IngredientCard from "@/components/IngredientCard";
import TimelineSlider from "@/components/TimelineSlider";
import ScanComparison from "@/components/ScanComparison";
import CameraCapture from "@/components/CameraCapture";
import FaceGuide from "@/components/FaceGuide";

export default function DashboardClient({ initialUser, initialHistory }) {
  const [stage, setStage] = useState("capture"); // capture | camera | validate | analyzing | results | routine
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

  const supabase = createClient();
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [saveError, setSaveError] = useState("");
  const [user, setUser] = useState(initialUser);
  const [history, setHistory] = useState(initialHistory);
  const [viewingHistory, setViewingHistory] = useState(false);
  const [validation, setValidation] = useState({ status: "idle", message: "", hasGlasses: false });
  const [simulationResult, setSimulationResult] = useState(null);
  const [lastSavedScanId, setLastSavedScanId] = useState(null);
  const [concernPage, setConcernPage] = useState(0);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [glassesConfirmStep, setGlassesConfirmStep] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!user || !lastSavedScanId || !simulationResult || Object.keys(simulationResult).length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const { error } = await supabase
          .from("scans")
          .update({ simulation: simulationResult })
          .eq("id", lastSavedScanId)
          .eq("user_id", user.id);
        if (!cancelled && !error) {
          setHistory((prev) => prev.map((h) => h.id === lastSavedScanId ? { ...h, simulation: simulationResult } : h));
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user, lastSavedScanId, simulationResult]);

  async function runAnalysis(dataUrl, seed) {
    if (analyzing) return;
    setImagePreview(dataUrl);
    setAnalysisError(null);
    setValidation({ status: "idle", message: "", hasGlasses: false });
    setViewingHistory(false);
    setStage("analyzing");
    setAnalyzing(true);
    setGlassesConfirmStep(0);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, seed }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || "Analysis failed");
      }
      setAnalysis(result);
      setStage("results");
    } catch (err) {
      console.error("Analysis flow failed:", err);
      setAnalysisError(err.message || "Analysis failed. Please try again.");
      setStage("capture");
    } finally {
      setAnalyzing(false);
    }
  }

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const seed = file.size + file.name.length * 7;
      setImagePreview(e.target.result);
      setStage("validate");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }, [handleFile]);

  function handleCameraCapture(dataUrl) {
    setImagePreview(dataUrl);
    setStage("validate");
  }

  async function handleValidationChange(data) {
    setValidation((prev) => ({
      ...prev,
      status: data.ok ? "passed" : "warning",
      message: data.ok ? "Face validated — proceeding to analysis" : "Please adjust your photo",
      hasGlasses: data.hasGlasses || false,
    }));
    setGlassesConfirmStep(0);
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
    setProgressReview(null);
    setProgressLoading(false);
    setRoutine("");
    setPrefs({ sleep: "", sunExposure: "", diet: "", stress: "", activity: "" });
    setPlan(null);
    setPlanSource(null);
    setSaveState("idle");
    setSaveError("");
    setValidation({ status: "idle", message: "", hasGlasses: false });
    setViewingHistory(false);
    setSimulationResult(null);
    setLastSavedScanId(null);
    setConcernPage(0);
    setZoomedImage(null);
    setShowHelp(false);
    setTutorialStep(0);
  }

  async function downloadScanReport() {
    if (!analysis) return;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

    try {
      const res = await fetch("/api/download-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          simulationResult,
          recommendation,
          plan,
          routine,
          prefs,
          dateStr,
          timeStr,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Download failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skin-report-${dateStr}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Download failed. Please try again.");
    }
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

  async function deleteScan(scanId) {
    if (!user) return;
    try {
      const { error } = await supabase.from("scans").delete().eq("id", scanId).eq("user_id", user.id);
      if (error) throw error;
      setHistory((prev) => prev.filter((h) => h.id !== scanId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Could not delete this scan. Please try again.");
    }
  }

  function loadPastScan(scan) {
    const safeConcerns = scan.concern_scores && typeof scan.concern_scores === "object" ? scan.concern_scores : {};
    const safeZones = scan.zone_scores && typeof scan.zone_scores === "object" ? scan.zone_scores : {};
    setAnalysis({
      concerns: safeConcerns,
      zones: safeZones,
      masks: scan.masks || {},
      overall: typeof scan.overall_score === "number" ? scan.overall_score : null,
      skinAge: typeof scan.skin_age === "number" ? scan.skin_age : null,
      skinTypes: Array.isArray(scan.skin_types) ? scan.skin_types : [],
      mock: scan.mock ?? false,
      imageUrl: scan.image_url || null,
      resizeImage: scan.resize_image || null,
    });
    setImagePreview(scan.image_url || null);
    setRecommendation(scan.recommendation_text || null);
    setRoutine(scan.routine || "");
    setPlan(scan.qwen_plan || null);
    setPlanSource(scan.qwen_plan ? "qwen" : null);
    if (scan.preferences && typeof scan.preferences === "object") {
      setPrefs({ sleep: "", sunExposure: "", diet: "", stress: "", activity: "", ...scan.preferences });
    } else {
      setPrefs({ sleep: "", sunExposure: "", diet: "", stress: "", activity: "" });
    }
    setSimulationResult(scan.simulation && typeof scan.simulation === "object" ? scan.simulation : null);
    setLastSavedScanId(scan.id || null);
    setStage("results");
    setViewingHistory(true);
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
          masks: analysis.masks || {},
          overall_score: analysis.overall ?? null,
          skin_age: analysis.skinAge ?? null,
          skin_types: analysis.skinTypes || [],
          mock: analysis.mock ?? false,
          simulation: simulationResult && Object.keys(simulationResult).length > 0 ? simulationResult : {},
          recommendation_text: recommendation,
          routine: routine || null,
          preferences: prefs || null,
          qwen_plan: plan || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSaveState("saved");
      setLastSavedScanId(inserted.id);
      setHistory((prev) => [inserted, ...prev.filter((h) => h.id !== inserted.id)]);
    } catch (err) {
      console.error("Save failed:", err);
      const msg = err?.message || "Save failed.";
      setSaveState("error");
      setSaveError(msg);
    }
  }

  return (
    <div className="min-h-screen w-full bg-paper">
      {/* Header */}
      <header className="max-w-2xl mx-auto px-5 pt-8 pb-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {!logoError ? (
            // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/Logo.png"
                alt="OurSkinOurFuture"
                className="w-10 h-10 rounded-2xl object-cover shrink-0 border border-border"
                onError={() => setLogoError(true)}
              />
          ) : (
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-ink">
              <Sparkles size={18} color="#C9A876" />
            </div>
          )}
          <span className="text-base font-semibold tracking-tight text-ink">
            Our<span className="text-gold">Skin</span>Our<span className="text-gold">Future</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHelp((s) => !s)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors"
          >
            <HelpCircle size={13} />
            Guide
          </button>
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
        {stage === "capture" && (
          <div className="mt-6">
            {analysisError && (
              <div className="flex items-start gap-2 mb-4 rounded-2xl p-3 bg-clay/10 border border-clay/40 text-clay">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p className="text-xs leading-relaxed">{analysisError}</p>
              </div>
            )}

            <div className="rounded-3xl p-5 mb-5 bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={14} className="text-gold" />
                <div className="text-xs font-mono uppercase tracking-widest text-muted">How to use</div>
              </div>
              <p className="text-xs leading-relaxed text-muted mb-3">
                OurSkinOurFuture analyzes your skin from a single photo. For best results, use a well-lit front-facing portrait with no glasses.
                You can capture a fresh photo or upload one from your library.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="rounded-xl p-2.5 bg-paper border border-border">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">1. Capture</div>
                  <p className="text-[11px] leading-relaxed text-muted">
                    Tap <span className="font-semibold text-ink">Use Camera</span> or <span className="font-semibold text-ink">Upload Photo</span>.
                  </p>
                </div>
                <div className="rounded-xl p-2.5 bg-paper border border-border">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">2. Analyze</div>
                  <p className="text-[11px] leading-relaxed text-muted">
                    Review your diagnostic summary, concern severity, zone map, and skin profile.
                  </p>
                </div>
                <div className="rounded-xl p-2.5 bg-paper border border-border">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">3. Act</div>
                  <p className="text-[11px] leading-relaxed text-muted">
                    Save your scan, compare history, and follow your personalized routine.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 mb-5">
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

            {history.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <ScanFace size={14} className="text-gold" />
                  <div className="text-xs font-mono uppercase tracking-widest text-muted">Previous Scans</div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {history.map((scan) => {
                    const top = topConcerns(scan.concern_scores || {}, 1)[0];
                    const score = typeof scan.overall_score === "number" ? scan.overall_score : null;
                    const date = new Date(scan.created_at);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const timeStr = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
                    const dateStr = isToday ? "Today" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                    const scoreColor = score == null ? "#9CA3AF" : score >= 70 ? "#4A6355" : score >= 40 ? "#C9A876" : "#B85C4A";
                    return (
                      <div key={scan.id} className="relative group">
                        <button
                          onClick={() => loadPastScan(scan)}
                          className="w-full rounded-2xl overflow-hidden bg-paper border border-border hover:border-gold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md text-left"
                        >
                          {scan.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={scan.image_url} alt="" className="w-full aspect-[3/4] object-cover" />
                          ) : (
                            <div className="w-full aspect-[3/4] bg-border flex items-center justify-center">
                              <ScanFace size={20} className="text-faint" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute top-2 right-2">
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full text-paper" style={{ background: scoreColor }}>
                              {score != null ? score : "—"}
                            </span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2.5">
                            <div className="text-[11px] font-semibold text-paper truncate">
                              {dateStr} · {timeStr}
                            </div>
                            <div className="text-[10px] text-white/70 truncate">
                              {top ? `${top.key}: ${top.score}` : scan.mock ? "Demo scan" : "View details"}
                            </div>
                          </div>
                          {scan.mock && (
                            <div className="absolute top-2 left-2">
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-white/80 backdrop-blur">DEMO</span>
                            </div>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this scan? This cannot be undone.")) {
                              deleteScan(scan.id);
                            }
                          }}
                          className="absolute bottom-12 right-2 z-10 w-8 h-8 rounded-full bg-clay/90 text-paper flex items-center justify-center"
                          aria-label="Delete scan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {stage === "camera" && (
          <div className="mt-6">
            <CameraCapture onCapture={handleCameraCapture} onClose={() => setStage("capture")} />
          </div>
        )}

        {stage === "validate" && imagePreview && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl overflow-hidden border border-border bg-paper aspect-[3/4] max-w-xs mx-auto">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-contain cursor-zoom-in"
                style={{ background: "#FDFBF6" }}
                onClick={() => setZoomedImage(imagePreview)}
              />
            </div>

            <FaceGuide image={imagePreview} onValidate={setValidation} />

            {validation.hasGlasses && (
              <div className="rounded-2xl p-3 bg-gold/10 border border-gold/30 flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-gold" />
                <p className="text-[11px] text-gold leading-relaxed">
                  Glasses detected. For accurate skin analysis, please remove them and retake the photo.
                </p>
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setStage("camera");
                  setImagePreview(null);
                  setValidation({ status: "idle", message: "", hasGlasses: false });
                }}
                className="flex-1 rounded-2xl py-3 text-xs font-semibold bg-paper text-ink border border-border active:scale-[0.98] transition-transform"
              >
                Retake Photo
              </button>
              <button
                onClick={() => {
                  if (validation.hasGlasses) {
                    if (glassesConfirmStep === 0) {
                      setGlassesConfirmStep(1);
                      return;
                    }
                  }
                  const seed = imagePreview.length + Date.now();
                  runAnalysis(imagePreview, seed);
                }}
                disabled={analyzing || validation.status === "idle" || validation.status === "checking"}
                className={`flex-1 rounded-2xl py-3 text-xs font-semibold active:scale-[0.98] transition-transform disabled:opacity-70 ${
                  validation.hasGlasses && glassesConfirmStep === 0
                    ? "bg-gold text-paper"
                    : "bg-ink text-paper"
                }`}
              >
                {analyzing ? "Analyzing..." : validation.hasGlasses && glassesConfirmStep === 0 ? "Tap again to scan anyway" : "Continue to Analysis"}
              </button>
            </div>
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
            <p className="text-sm font-medium text-ink">Running clinical skin analysis...</p>
            <p className="text-[11px] mt-1 text-faint">Multi-concern diagnostic + zone mapping</p>
          </div>
        )}

        {stage === "results" && analysis && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {imagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Scan result"
                    className="w-11 h-11 rounded-xl object-cover border border-border cursor-zoom-in"
                    onClick={() => setZoomedImage(imagePreview)}
                  />
                )}
                <div>
                  <div className="text-sm font-semibold text-ink">Diagnostic Results</div>
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
             {!viewingHistory && (
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
                 <p className="text-xs text-clay mt-2 text-center">Couldn't save — {saveError || "check your connection and try again."}</p>
               )}
               </div>
             )}

             <button
               onClick={() => setStage("routine")}
               className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold bg-gold text-ink active:scale-[0.98] transition-transform mb-5"
             >
               <ClipboardList size={16} />
               What should I do? (Your routine + lifestyle)
               <ChevronRight size={16} />
             </button>

             {/* Analysis Summary: overall + per-concern breakdown */}
            <section className="rounded-3xl p-5 mb-4 bg-card border border-border">
              <div className="text-xs font-mono uppercase tracking-widest mb-3 text-muted">Diagnostic Summary</div>
              
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
                    const label = typeof CONCERN_LABELS[key] === "string" ? CONCERN_LABELS[key] : CONCERN_LABELS[key]?.label || key;
                    const explanation = concernExplanation(key);
                    const ingredients = INGREDIENT_MAP[key] || [];
                    const severity = score >= 61 ? "High" : score >= 31 ? "Moderate" : "Low";
                    const severityColor = score >= 61 ? "#B85C4A" : score >= 31 ? "#C9A876" : "#4A6355";
                    return (
                      <div key={key} className="group rounded-2xl p-3 bg-paper border border-border transition-all duration-200 hover:shadow-md hover:border-[#C9A876]/40 hover:-translate-y-0.5">
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

            {(() => {
              const top = topConcerns(analysis.concerns, 3);
              if (top.length === 0) return null;
              const avg = Math.round(top.reduce((s, c) => s + c.score, 0) / top.length);
              const label = avg >= 70 ? "Needs attention" : avg >= 40 ? "Moderate" : "Good";
              const gradient = avg >= 70 ? "from-[#B85C4A]/20 via-[#C9A876]/20 to-[#E8B4B8]/20" : avg >= 40 ? "from-[#C9A876]/20 via-[#E8B4B8]/20 to-[#FDFBF6]/20" : "from-[#4A6355]/20 via-[#9DC183]/20 to-[#FDFBF6]/20";
              return (
                <section className={`rounded-3xl p-6 mb-4 bg-gradient-to-br ${gradient} border border-border`}>
                  <div className="text-xs font-mono uppercase tracking-widest mb-2 text-muted">Skin Health Snapshot</div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-semibold text-ink">{avg}</div>
                      <div className="text-[11px] text-muted">Average top-concern score</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-ink">{label}</div>
                      <div className="text-[11px] text-muted">Based on your 3 biggest areas</div>
                    </div>
                  </div>
                </section>
              );
            })()}

            <section className="rounded-3xl p-6 mb-4 bg-card border border-border">
               <div className="text-xs font-mono uppercase tracking-widest mb-4 text-muted">Zone Diagnostic Map</div>
               <FaceZoneMap image={imagePreview} zones={analysis.zones} masks={analysis.masks} concerns={analysis.concerns} onImageClick={setZoomedImage} />
            </section>

            {(analysis.overall != null || analysis.skinAge != null || analysis.skinTypes?.length) && (
              <section className="rounded-3xl p-6 mb-4 bg-card border border-border">
                <div className="text-xs font-mono uppercase tracking-widest mb-5 text-muted">Your Skin Profile</div>
                <div className="flex flex-wrap gap-5">
                  {/* Skin health ring */}
                  {analysis.overall != null && (
                    <div className="flex flex-col items-center gap-1.5">
                      <svg width="80" height="80" viewBox="0 0 72 72">
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
                        <text x="36" y="36" textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold fill-ink">
                          {analysis.overall}
                        </text>
                      </svg>
                      <span className="text-[10px] text-muted">Skin health</span>
                    </div>
                  )}
                  {analysis.skinAge != null && (
                    <div className="flex flex-col justify-center">
                      <div className="text-2xl font-semibold text-ink">{analysis.skinAge}</div>
                      <div className="text-[11px] text-muted">Skin age</div>
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

                  {analysis.skinTypes?.length > 0 && (
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-sm">
                        {analysis.skinTypes[0].skinType === "Oily" ? "💧" : analysis.skinTypes[0].skinType === "Dry" ? "🏜️" : analysis.skinTypes[0].skinType === "Sensitive" ? "🌸" : "✨"}
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-ink">Skin Type</div>
                        <div className="text-[10px] text-muted">{analysis.skinTypes[0].skinType}</div>
                      </div>
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

            {(() => {
              const top = topConcerns(analysis.concerns, 3);
              if (top.length === 0) return null;
              const avg = Math.round(top.reduce((s, c) => s + c.score, 0) / top.length);
              const label = avg >= 70 ? "Needs attention" : avg >= 40 ? "Moderate" : "Good";
              const gradient = avg >= 70 ? "from-[#B85C4A]/20 to-[#C9A876]/20" : avg >= 40 ? "from-[#C9A876]/20 to-[#E8B4B8]/20" : "from-[#4A6355]/20 to-[#9DC183]/20";
              return (
                <section className={`rounded-3xl p-6 mb-4 bg-gradient-to-br ${gradient} border border-border`}>
                  <div className="text-xs font-mono uppercase tracking-widest mb-2 text-muted">Skin Health Snapshot</div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-semibold text-ink">{avg}</div>
                      <div className="text-[11px] text-muted">Average top-concern score</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-ink">{label}</div>
                      <div className="text-[11px] text-muted">Based on your 3 biggest areas</div>
                    </div>
                  </div>
                </section>
              );
            })()}

            {analysis?.concerns && (() => {
              const allConcerns = topConcerns(analysis.concerns, 50);
              const PER_PAGE = 5;
              const totalPages = Math.max(1, Math.ceil(allConcerns.length / PER_PAGE));
              const safePage = Math.min(concernPage, totalPages - 1);
              const pageConcerns = allConcerns.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

              return (
                <section className="rounded-3xl p-5 mb-4 bg-card border border-border">
                  <div className="text-xs font-mono uppercase tracking-widest mb-4 text-muted">Concern Severity</div>
                  <div className="space-y-3">
                    {pageConcerns.map((c) => {
                      const pct = Math.min(100, Math.max(0, c.score));
                      const color = pct >= 61 ? "bg-[#B85C4A]" : pct >= 31 ? "bg-[#C9A876]" : "bg-[#4A6355]";
                      return (
                        <div key={c.key}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-ink">
                              {(typeof CONCERN_LABELS[c.key] === "string" ? CONCERN_LABELS[c.key] : CONCERN_LABELS[c.key]?.label || c.key)}
                              {c.icon ? ` ${c.icon}` : ""}
                            </span>
                            <span className="text-[11px] font-mono text-muted">{pct}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#F0EBDD] overflow-hidden">
                            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {allConcerns.length > PER_PAGE && (
                    <div className="flex items-center justify-between mt-4">
                      <button
                        onClick={() => setConcernPage((p) => Math.max(0, p - 1))}
                        disabled={safePage === 0}
                        className="flex items-center gap-1 text-[11px] font-mono text-muted hover:text-ink disabled:opacity-40"
                      >
                        <ChevronLeft size={14} /> Prev
                      </button>
                      <span className="text-[10px] font-mono text-muted">
                        {safePage + 1} / {totalPages}
                      </span>
                      <button
                        onClick={() => setConcernPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={safePage >= totalPages - 1}
                        className="flex items-center gap-1 text-[11px] font-mono text-muted hover:text-ink disabled:opacity-40"
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </section>
              );
            })()}

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
              <TimelineSlider
                image={imagePreview}
                baselineConcerns={analysis.concerns}
                totalWeeks={12}
                savedSimulation={simulationResult}
                onSimulationReady={setSimulationResult}
              />
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

            <div className="flex flex-wrap gap-2.5">
              {!viewingHistory && (
                <button
                  onClick={handleSave}
                  disabled={saveState === "saving" || saveState === "saved"}
                  className="flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold bg-sage text-paper active:scale-[0.98] transition-transform disabled:opacity-70 min-w-[120px]"
                >
                  {saveState === "saving" && <Loader2 size={15} className="animate-spin" />}
                  {saveState === "idle" && (user ? "Save This Test" : "Sign In to Save")}
                  {saveState === "saving" && "Saving..."}
                  {saveState === "saved" && "Saved ✓"}
                  {saveState === "error" && "Retry Save"}
                </button>
              )}
              <button
                onClick={downloadScanReport}
                disabled={!analysis}
                className="flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold bg-card border border-border text-ink active:scale-[0.98] transition-transform disabled:opacity-50 min-w-[120px]"
              >
                <Download size={15} />
                Download Report
              </button>
              {viewingHistory && lastSavedScanId && (
                <button
                  onClick={() => {
                    if (confirm("Delete this scan? This cannot be undone.")) {
                      deleteScan(lastSavedScanId);
                    }
                  }}
                  className="flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold bg-clay text-paper active:scale-[0.98] transition-transform min-w-[120px]"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              )}
              <button
                onClick={reset}
                className="flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold bg-ink text-paper active:scale-[0.98] transition-transform min-w-[120px]"
              >
                Scan Another
                <ChevronRight size={16} />
              </button>
            </div>
            {saveState === "error" && !viewingHistory && (
              <p className="text-xs text-clay mt-2 text-center">Couldn't save — {saveError || "check your connection and try again."}</p>
            )}
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

            <div className="flex flex-wrap gap-2.5">
              {!viewingHistory && (
                <button
                  onClick={handleSave}
                  disabled={saveState === "saving" || saveState === "saved"}
                  className="flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold bg-sage text-paper active:scale-[0.98] transition-transform disabled:opacity-70 min-w-[120px]"
                >
                  {saveState === "saving" && <Loader2 size={15} className="animate-spin" />}
                  {saveState === "idle" && (user ? "Save This Test" : "Sign In to Save")}
                  {saveState === "saving" && "Saving..."}
                  {saveState === "saved" && "Saved ✓"}
                  {saveState === "error" && "Retry Save"}
                </button>
              )}
              <button
                onClick={downloadScanReport}
                disabled={!analysis}
                className="flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold bg-card border border-border text-ink active:scale-[0.98] transition-transform disabled:opacity-50 min-w-[120px]"
              >
                <Download size={15} />
                Download
              </button>
              {viewingHistory && lastSavedScanId && (
                <button
                  onClick={() => {
                    if (confirm("Delete this scan? This cannot be undone.")) {
                      deleteScan(lastSavedScanId);
                    }
                  }}
                  className="flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold bg-clay text-paper active:scale-[0.98] transition-transform min-w-[120px]"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              )}
              <button
                onClick={reset}
                className="flex-1 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold bg-ink text-paper active:scale-[0.98] transition-transform min-w-[120px]"
              >
                Scan Another
                <ChevronRight size={16} />
              </button>
            </div>
            {saveState === "error" && !viewingHistory && (
              <p className="text-xs text-clay mt-2 text-center">Couldn't save — {saveError || "check your connection and try again."}</p>
            )}
          </div>
            )}
        </main>

        {/* Zoom lightbox */}
        {zoomedImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setZoomedImage(null)}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 text-white/80 hover:text-white"
              aria-label="Close zoom"
            >
              <X size={24} />
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="max-w-full max-h-full object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Help / tutorial panel */}
        {showHelp && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-paper border border-border rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-gold" />
                  <div className="text-sm font-semibold text-ink">Guide</div>
                </div>
                <button onClick={() => { setShowHelp(false); setTutorialStep(0); }} className="text-muted hover:text-ink">
                  <X size={14} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-muted mb-2">Tutorial</div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${((tutorialStep + 1) / 3) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-muted">{tutorialStep + 1}/3</span>
                  </div>
                  {tutorialStep === 0 && (
                    <div className="rounded-2xl p-3 bg-card border border-border">
                      <div className="text-xs font-semibold text-ink mb-1">Step 1 — Start a scan</div>
                      <p className="text-[11px] leading-relaxed text-muted">
                        Use <span className="font-semibold text-ink">Use Camera</span> or <span className="font-semibold text-ink">Upload Photo</span> to provide a clear front-facing portrait. Good lighting and no glasses give the most accurate results.
                      </p>
                    </div>
                  )}
                  {tutorialStep === 1 && (
                    <div className="rounded-2xl p-3 bg-card border border-border">
                      <div className="text-xs font-semibold text-ink mb-1">Step 2 — Review results</div>
                      <p className="text-[11px] leading-relaxed text-muted">
                        After analysis, read your <span className="font-semibold text-ink">Diagnostic Summary</span>, <span className="font-semibold text-ink">Concern Severity</span>, <span className="font-semibold text-ink">Zone Diagnostic Map</span>, <span className="font-semibold text-ink">Your Skin Profile</span>, and <span className="font-semibold text-ink">Treatment Simulation</span>.
                      </p>
                    </div>
                  )}
                  {tutorialStep === 2 && (
                    <div className="rounded-2xl p-3 bg-card border border-border">
                      <div className="text-xs font-semibold text-ink mb-1">Step 3 — Save and track</div>
                      <p className="text-[11px] leading-relaxed text-muted">
                        Tap <span className="font-semibold text-ink">Save This Test</span> to store your scan. Revisit it anytime from <span className="font-semibold text-ink">Previous Scans</span>. Compare changes over time and follow your personalized routine.
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => setTutorialStep((s) => Math.max(0, s - 1))}
                      disabled={tutorialStep === 0}
                      className="text-[11px] font-mono text-muted hover:text-ink disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setTutorialStep((s) => Math.min(2, s + 1))}
                      disabled={tutorialStep === 2}
                      className="text-[11px] font-mono text-muted hover:text-ink disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-muted mb-2">Category meanings</div>
                  <div className="space-y-2">
                    <div className="rounded-xl p-2.5 bg-paper border border-border">
                      <div className="text-[11px] font-semibold text-ink mb-0.5">Concern Severity</div>
                      <p className="text-[10px] leading-relaxed text-muted">Scores how strong each skin issue is right now, from 0 to 100. Higher means more noticeable.</p>
                    </div>
                    <div className="rounded-xl p-2.5 bg-paper border border-border">
                      <div className="text-[11px] font-semibold text-ink mb-0.5">Zone Diagnostic Map</div>
                      <p className="text-[10px] leading-relaxed text-muted">Shows which facial areas are affected by each concern so you can target treatment more precisely.</p>
                    </div>
                    <div className="rounded-xl p-2.5 bg-paper border border-border">
                      <div className="text-[11px] font-semibold text-ink mb-0.5">Your Skin Profile</div>
                      <p className="text-[10px] leading-relaxed text-muted">Summarizes overall skin health, estimated skin age, skin type, and undertone.</p>
                    </div>
                    <div className="rounded-xl p-2.5 bg-paper border border-border">
                      <div className="text-[11px] font-semibold text-ink mb-0.5">Treatment Simulation</div>
                      <p className="text-[10px] leading-relaxed text-muted">Projects how your concerns could improve over time with consistent care.</p>
                    </div>
                    <div className="rounded-xl p-2.5 bg-paper border border-border">
                      <div className="text-[11px] font-semibold text-ink mb-0.5">Your Protocol</div>
                      <p className="text-[10px] leading-relaxed text-muted">Morning, evening, and weekly routine suggestions matched to your top concerns.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
