"use client";

import { useState, useRef, useEffect } from "react";

const TM_MODEL_URL = "https://teachablemachine.withgoogle.com/models/8zyLL8Q0X/";

export default function FaceGuide({ image, onValidate }) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("Waiting for photo...");
  const [glassesDetected, setGlassesDetected] = useState(false);
  const canvasRef = useRef(null);
  const validatingRef = useRef(false);

  useEffect(() => {
    if (!image) return;
    validateImage(image);
  }, [image]);

  async function validateImage(dataUrl) {
    if (validatingRef.current) return;
    validatingRef.current = true;
    let currentStatus = "checking";
    let currentMessage = "Checking face position and quality...";
    setStatus(currentStatus);
    setGlassesDetected(false);
    setMessage(currentMessage);

    try {
      const img = await loadImage(dataUrl);

      if (img.width < 200 || img.height < 200) {
        currentStatus = "error";
        currentMessage = "Photo is too small. Please use a higher resolution image.";
        setStatus(currentStatus);
        setMessage(currentMessage);
        if (onValidate) onValidate({ status: currentStatus, message: currentMessage, hasGlasses: false });
        return;
      }

      const aspect = img.width / img.height;
      if (aspect < 0.6 || aspect > 1.8) {
        currentStatus = "error";
        currentMessage = "Please use a portrait or square photo facing the camera directly.";
        setStatus(currentStatus);
        setMessage(currentMessage);
        if (onValidate) onValidate({ status: currentStatus, message: currentMessage, hasGlasses: false });
        return;
      }

      const brightness = await estimateBrightness(img);
      if (brightness < 40) {
        currentStatus = "warning";
        currentMessage = "Image is quite dark. Better lighting will improve accuracy.";
      } else if (brightness > 220) {
        currentStatus = "warning";
        currentMessage = "Image is very bright. Try reducing direct light.";
      } else {
        currentStatus = "good";
        currentMessage = "Good lighting detected.";
      }
      setStatus(currentStatus);
      setMessage(currentMessage);

      const hasGlasses = await detectGlasses(img);
      if (hasGlasses) {
        setGlassesDetected(true);
        currentMessage = currentMessage + " Glasses detected — please remove them for accurate skin analysis.";
        currentStatus = "warning";
        setMessage(currentMessage);
        setStatus(currentStatus);
      } else {
        currentMessage = currentMessage + " No glasses detected.";
        setMessage(currentMessage);
      }

      if (onValidate) {
        onValidate({ ok: true, status: currentStatus, message: currentMessage, hasGlasses });
      }
    } catch {
      currentStatus = "error";
      currentMessage = "Could not process this image. Please try another.";
      setStatus(currentStatus);
      setMessage(currentMessage);
      if (onValidate) {
        onValidate({ status: currentStatus, message: currentMessage, hasGlasses: false });
      }
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function estimateBrightness(img) {
    const canvas = canvasRef.current || document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 64;
    canvas.height = 64;
    ctx.drawImage(img, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    return sum / (data.length / 4);
  }

  async function detectGlasses(img) {
    try {
      const response = await fetch("/api/glasses-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.hasGlasses === true) return true;
      }
    } catch {}

    try {
      const hasGlasses = await detectGlassesWithTM(img);
      if (hasGlasses) return true;
    } catch {}

    const w = img.width;
    const h = img.height;
    const canvas = canvasRef.current || document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0);

    const eyeCenterY = Math.floor(h * 0.38);
    const eyeH = Math.max(12, Math.floor(h * 0.16));
    const band = sampleBand(ctx, w, h, 0.25, 0.75, eyeCenterY - Math.floor(eyeH / 2), eyeH);
    const darkRatio = band.dark;
    const shapeScore = band.shape;
    const centerLift = band.centerLift;

    const strongBand = darkRatio > 0.28 || (darkRatio > 0.18 && centerLift > 0.04);
    const shapeyBand = shapeScore > 0.12;

    const leftEyeBox = sampleBox(ctx, Math.floor(w * 0.12), Math.floor(h * 0.30), Math.floor(w * 0.30), Math.floor(h * 0.22));
    const rightEyeBox = sampleBox(ctx, Math.floor(w * 0.58), Math.floor(h * 0.30), Math.floor(w * 0.30), Math.floor(h * 0.22));
    const bridgeBox = sampleBox(ctx, Math.floor(w * 0.38), Math.floor(h * 0.34), Math.floor(w * 0.24), Math.floor(h * 0.14));

    const symScore = 1 - Math.abs(leftEyeBox.dark - rightEyeBox.dark);
    const bridgeLight = Math.max(0, 1 - bridgeBox.dark);

    const eyeHasDarkPatches = leftEyeBox.dark > 0.22 || rightEyeBox.dark > 0.22;
    const symmetricDark = symScore > 0.65;

    const score =
      (strongBand ? 1.2 : 0) +
      (shapeyBand ? 0.6 : 0) +
      (centerLift * 1.5) +
      (symmetricDark ? 0.35 : 0) +
      (bridgeLight > 0.08 ? 0.25 : 0) +
      (eyeHasDarkPatches ? 0.2 : 0) +
      (darkRatio > 0.12 ? 0.15 : 0);

    return score > 1.1;
  }

  function sampleBand(ctx, w, h, startXFrac, endXFrac, startY, height) {
    const startX = Math.max(0, Math.floor(w * startXFrac));
    const endX = Math.min(w, Math.floor(w * endXFrac));
    const data = ctx.getImageData(startX, startY, endX - startX, height).data;
    const cols = endX - startX;
    const rows = height;
    let total = 0;
    let dark = 0;
    let bright = 0;
    const columnDark = new Array(cols).fill(0);
    const columnBright = new Array(cols).fill(0);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = (y * cols + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const brightness = (r + g + b) / 3;
        total++;
        if (brightness < 85 && Math.abs(r - g) < 35 && Math.abs(g - b) < 35 && Math.abs(r - b) < 42) {
          dark++;
          columnDark[x]++;
        }
        if (brightness > 170) {
          bright++;
          columnBright[x]++;
        }
      }
    }

    const leftDark = columnDark.slice(0, Math.max(1, Math.floor(cols / 4))).reduce((a, b) => a + b, 0);
    const rightDark = columnDark.slice(-Math.max(1, Math.floor(cols / 4))).reduce((a, b) => a + b, 0);
    const midDark = columnDark.slice(Math.floor(cols / 4), Math.floor((3 * cols) / 4)).reduce((a, b) => a + b, 0);
    const centerLift = (leftDark + rightDark) > 0 ? (midDark - (leftDark + rightDark) * 0.55) / ((leftDark + rightDark) * 0.55 + 1) : 0;

    const leftAvg = colAvg(columnDark, 0, Math.floor(cols / 2));
    const rightAvg = colAvg(columnDark, Math.floor(cols / 2), cols);
    const shape = cols > 10 && (leftAvg + rightAvg) > 0 ? Math.abs(leftAvg - rightAvg) / (leftAvg + rightAvg) : 0;

    return {
      dark: total > 0 ? dark / total : 0,
      shape,
      centerLift,
    };
  }

  function sampleBox(ctx, x, y, width, height) {
    const data = ctx.getImageData(x, y, width, height).data;
    let total = 0;
    let dark = 0;
    let minBright = 255;
    let maxBright = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      total++;
      if (brightness < minBright) minBright = brightness;
      if (brightness > maxBright) maxBright = brightness;
      if (brightness < 95 && Math.abs(r - g) < 38 && Math.abs(g - b) < 38 && Math.abs(r - b) < 48) {
        dark++;
      }
    }
    return {
      dark: total > 0 ? dark / total : 0,
      contrast: maxBright - minBright,
    };
  }

  function colAvg(values, start, end) {
    let sum = 0;
    const slice = values.slice(start, end);
    for (let i = 0; i < slice.length; i++) sum += slice[i];
    return slice.length ? sum / slice.length : 0;
  }

  let tmModelCache = null;
  let tmLoading = false;

  async function detectGlassesWithTM(img) {
    if (typeof window === "undefined") return false;

      if (!tmModelCache && !tmLoading) {
        tmLoading = true;
        try {
          const [{ load }] = await Promise.all([
            import("@teachablemachine/image"),
            import("@tensorflow/tfjs"),
          ]);
          tmModelCache = await load(TM_MODEL_URL + "model.json", TM_MODEL_URL + "metadata.json");
        } catch (e) {
          console.warn("TM load failed:", e);
          tmLoading = false;
          validatingRef.current = false;
          return false;
        }
        tmLoading = false;
        validatingRef.current = false;
      }

    if (!tmModelCache) return false;

    const prediction = await tmModelCache.predict(img);
    const glassesClass = prediction.find((p) => /glass/i.test(p.className));
    if (glassesClass && glassesClass.probability > 0.5) return true;
    const best = prediction.reduce((a, b) => (a.probability > b.probability ? a : b));
    return best.probability > 0.5;
  }

  useEffect(() => {
    return () => {
      if (canvasRef.current && canvasRef.current.tagName === "CANVAS") {
        canvasRef.current = null;
      }
    };
  }, []);

  const statusColor =
    status === "error" ? "text-clay" : status === "warning" ? "text-gold" : status === "good" ? "text-sage" : "text-muted";

  return (
    <div className="mt-3 space-y-2">
      <div className={`flex items-center gap-1.5 text-[11px] ${statusColor}`}>
        {status === "checking" && <span className="animate-pulse">●</span>}
        {status === "error" && "●"}
        {status === "warning" && "●"}
        {status === "good" && "●"}
        <span>{message}</span>
      </div>
      {glassesDetected && (
        <div className="rounded-xl p-2.5 bg-gold/10 border border-gold/30 text-[11px] text-gold">
          For accurate skin analysis, please remove glasses and retake the photo.
        </div>
      )}
      {status === "error" && (
        <button
          onClick={() => setStatus("idle")}
          className="text-[11px] text-clay underline underline-offset-2"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
