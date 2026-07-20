"use client";

import { useRef, useState } from "react";

interface UploadStepProps {
  onImage: (image: { name: string; size: number; dataUrl: string }) => void;
  disabled?: boolean;
}

const MAX_BYTES = 12 * 1024 * 1024; // 12MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function UploadStep({ onImage, disabled }: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is over 12MB. Please use a smaller file.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    onImage({ name: file.name, size: file.size, dataUrl });
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a selfie"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled)
            inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-16 text-center transition ${
          dragging
            ? "border-[var(--accent)] bg-[var(--panel-2)]"
            : "border-[var(--line)] hover:border-[var(--accent)] hover:bg-[var(--panel)]"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--panel-2)] text-3xl">
          📷
        </div>
        <p className="text-lg font-semibold">Drop a selfie, or tap to upload</p>
        <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
          One clear, front-facing photo in good light. We analyze it on-device
          framing only — your image isn&apos;t stored.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p className="mt-3 text-center text-sm text-[var(--bad)]">{error}</p>
      )}
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
