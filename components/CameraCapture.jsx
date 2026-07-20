"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, X, RefreshCw, AlertCircle } from "lucide-react";

/**
 * In-browser camera preview using getUserMedia — chosen over native
 * device-camera file input specifically so this works identically on
 * desktop and mobile without switching to a separate camera app.
 *
 * onCapture receives a data URL string, same shape as the file-upload
 * path produces, so the parent component doesn't need to know which
 * input method was used.
 */
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
    // Mirror horizontally so the captured photo matches what the user
    // saw in preview (getUserMedia video is shown mirrored by CSS below,
    // but the raw frame is not — without this the saved photo would be
    // flipped relative to what the user expected).
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
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 backdrop-blur"
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
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-square object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
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
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw size={20} className="animate-spin text-paper" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
