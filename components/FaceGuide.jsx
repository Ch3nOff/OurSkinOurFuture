"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export default function FaceGuide({ image, onValidate }) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("Waiting for photo...");
  const [glassesDetected, setGlassesDetected] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!image) return;
    validateImage(image);
  }, [image]);

  async function validateImage(dataUrl) {
    setStatus("checking");
    setGlassesDetected(false);
    setMessage("Checking face position and quality...");

    try {
      const img = await loadImage(dataUrl);

      if (img.width < 200 || img.height < 200) {
        setStatus("error");
        setMessage("Photo is too small. Please use a higher resolution image.");
        return;
      }

      const aspect = img.width / img.height;
      if (aspect < 0.6 || aspect > 1.8) {
        setStatus("error");
        setMessage("Please use a portrait or square photo facing the camera directly.");
        return;
      }

      const brightness = await estimateBrightness(img);
      if (brightness < 40) {
        setStatus("warning");
        setMessage("Image is quite dark. Better lighting will improve accuracy.");
      } else if (brightness > 220) {
        setStatus("warning");
        setMessage("Image is very bright. Try reducing direct light.");
      } else {
        setStatus("good");
        setMessage("Good lighting detected.");
      }

      const hasGlasses = await detectGlasses(img);
      if (hasGlasses) {
        setGlassesDetected(true);
        setMessage((prev) => prev + " Glasses detected — please remove them for accurate skin analysis.");
        setStatus("warning");
      } else {
        setMessage((prev) => prev + " No glasses detected.");
      }

      if (onValidate) {
        onValidate({ ok: status !== "error", glassesDetected: hasGlasses, brightness });
      }
    } catch {
      setStatus("error");
      setMessage("Could not process this image. Please try another.");
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
    const canvas = canvasRef.current || document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const w = img.width;
    const h = img.height;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0);

    try {
      const response = await fetch("/api/glasses-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const data = await response.json();
        return data.hasGlasses === true;
      }
    } catch {}

    const centerY = Math.floor(h * 0.36);
    const sampleWidth = Math.floor(w * 0.65);
    const startX = Math.floor((w - sampleWidth) / 2);
    const sampleHeight = Math.floor(h * 0.14);
    const startY = centerY - Math.floor(sampleHeight / 2);

    const imageData = ctx.getImageData(startX, startY, sampleWidth, sampleHeight);
    const data = imageData.data;
    let darkPixels = 0;
    let totalPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      totalPixels++;
      if (brightness < 70 && Math.abs(r - g) < 28 && Math.abs(g - b) < 28 && Math.abs(r - b) < 35) {
        darkPixels++;
      }
    }

    const ratio = totalPixels > 0 ? darkPixels / totalPixels : 0;
    return ratio > 0.22;
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
