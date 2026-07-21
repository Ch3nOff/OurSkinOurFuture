"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, X, RefreshCw, AlertCircle } from "lucide-react";

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setReady(true);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Camera access error:", err);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("Camera access was denied. Allow camera permission in your browser, or upload a photo instead.");
        } else if (err.name === "NotFoundError") {
          setError("No camera was found on this device. Try uploading a photo instead.");
        } else {
          setError("Couldn't start the camera. Try uploading a photo instead.");
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [stopStream]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopStream();
    onCapture(dataUrl);
  }

  function handleClose() {
    stopStream();
    onClose();
  }

  return (
    <div className="rounded-3xl overflow-hidden bg-ink relative">
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 backdrop-blur"
        aria-label="Close camera"
      >
        <X size={16} className="text-paper" />
      </button>

      {error ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <AlertCircle size={22} className="text-clay mb-3" />
          <p className="text-sm text-paper leading-relaxed">{error}</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-square object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {ready && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Face guide overlay */}
                <svg viewBox="0 0 300 300" className="w-full max-w-[360px] opacity-90">
                  <ellipse
                    cx="150"
                    cy="140"
                    rx="135"
                    ry="170"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray="12 6"
                  />
                  <line x1="150" y1="0" x2="150" y2="300" stroke="white" strokeWidth="1.2" opacity="0.4" />
                  <line x1="15" y1="140" x2="285" y2="140" stroke="white" strokeWidth="1.2" opacity="0.4" />
                  <circle cx="150" cy="130" r="95" fill="none" stroke="white" strokeWidth="1" opacity="0.25" />
                </svg>
              </div>
            )}
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw size={20} className="animate-spin text-paper" />
              </div>
            )}
            {/* Positioning hint */}
            {ready && (
              <div className="absolute top-3 left-0 right-0 flex justify-center">
                <span className="text-[11px] font-mono text-white/80 bg-black/30 backdrop-blur px-3 py-1 rounded-full">
                  Center your face inside the outline
                </span>
              </div>
            )}
          </div>
          {ready && (
            <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-5 pt-8 bg-gradient-to-t from-black/50 to-transparent">
              <button
                onClick={handleCapture}
                className="w-16 h-16 rounded-full bg-paper border-4 border-white/30 active:scale-95 transition-transform flex items-center justify-center"
                aria-label="Take photo"
              >
                <div className="w-12 h-12 rounded-full bg-paper border-2 border-ink" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
