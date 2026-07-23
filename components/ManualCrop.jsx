"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export default function ManualCrop({ image, onConfirm, onCancel }) {
  const containerRef = useRef(null);
  const [crop, setCrop] = useState({ x: 0.3, y: 0.1, size: 0.45 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [preview, setPreview] = useState(null);
  const [imageInfo, setImageInfo] = useState({ width: 0, height: 0 });

  const getImageRect = useCallback(() => {
    const container = containerRef.current;
    if (!container || !imageInfo.width) return null;

    const rect = container.getBoundingClientRect();
    const containerAspect = rect.width / rect.height;
    const imageAspect = imageInfo.width / imageInfo.height;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (imageAspect > containerAspect) {
      displayWidth = rect.width;
      displayHeight = rect.width / imageAspect;
      offsetX = 0;
      offsetY = (rect.height - displayHeight) / 2;
    } else {
      displayHeight = rect.height;
      displayWidth = rect.height * imageAspect;
      offsetX = (rect.width - displayWidth) / 2;
      offsetY = 0;
    }

    return { displayWidth, displayHeight, offsetX, offsetY, containerWidth: rect.width, containerHeight: rect.height };
  }, [imageInfo]);

  function generatePreview(img, c) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const size = 1024;
    canvas.width = size;
    canvas.height = size;

    const sx = c.x * img.naturalWidth;
    const sy = c.y * img.naturalHeight;
    const sw = c.size * img.naturalWidth;
    const sh = c.size * img.naturalHeight;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
    setPreview(canvas.toDataURL("image/jpeg", 0.95));
  }

  useEffect(() => {
    if (!image) return;
    const img = new Image();
    img.onload = () => {
      setImageInfo({ width: img.naturalWidth, height: img.naturalHeight });
      generatePreview(img, crop);
    };
    img.src = image;
  }, [image]);

  useEffect(() => {
    if (!imageInfo.width || !image) return;
    const img = new Image();
    img.onload = () => generatePreview(img, crop);
    img.src = image;
  }, [image, imageInfo.width, crop]);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragging(true);
    setDragStart({ x: clientX, y: clientY });
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const imgRect = getImageRect();
      if (!imgRect) return;

      const dx = (clientX - dragStart.x) / imgRect.displayWidth;
      const dy = (clientY - dragStart.y) / imgRect.displayHeight;

      setCrop((prev) => {
        const newX = Math.max(0, Math.min(1 - prev.size, prev.x + dx));
        const newY = Math.max(0, Math.min(1 - prev.size, prev.y + dy));
        return { ...prev, x: newX, y: newY };
      });
      setDragStart({ x: clientX, y: clientY });
    },
    [dragging, dragStart, getImageRect]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const zoomIn = () => {
    setCrop((prev) => {
      const newSize = Math.max(0.2, prev.size - 0.08);
      const maxX = 1 - newSize;
      const maxY = 1 - newSize;
      const newX = Math.min(maxX, Math.max(0, prev.x - (newSize - prev.size) / 2));
      const newY = Math.min(maxY, Math.max(0, prev.y - (newSize - prev.size) / 2));
      return { ...prev, size: newSize, x: newX, y: newY };
    });
  };

  const zoomOut = () => {
    setCrop((prev) => {
      const newSize = Math.min(0.9, prev.size + 0.08);
      const maxX = 1 - newSize;
      const maxY = 1 - newSize;
      const newX = Math.min(maxX, Math.max(0, prev.x - (newSize - prev.size) / 2));
      const newY = Math.min(maxY, Math.max(0, prev.y - (newSize - prev.size) / 2));
      return { ...prev, size: newSize, x: newX, y: newY };
    });
  };

  const imgRect = getImageRect();

  const cropLeft = imgRect ? imgRect.offsetX + crop.x * imgRect.displayWidth : 0;
  const cropTop = imgRect ? imgRect.offsetY + crop.y * imgRect.displayHeight : 0;
  const cropWidth = imgRect ? crop.size * imgRect.displayWidth : 0;
  const cropHeight = imgRect ? crop.size * imgRect.displayHeight : 0;

  return (
    <div className="space-y-4">
      <div className="text-xs font-mono uppercase tracking-widest text-muted mb-2">
        Crop to full face region
      </div>
      <p className="text-[11px] text-muted -mt-2">
        Drag the box to include your entire face. Use zoom to adjust.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden border border-border bg-paper select-none"
          style={{ aspectRatio: "1 / 1" }}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
        >
          {image && (
            <img
              src={image}
              alt="Upload"
              className="w-full h-full object-contain"
              style={{ background: "#FDFBF6", pointerEvents: "none" }}
              draggable={false}
            />
          )}
          <div
            className="absolute border-2 border-gold bg-black/20"
            style={{
              left: cropLeft,
              top: cropTop,
              width: cropWidth,
              height: cropHeight,
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gold/60" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gold/60" />
            <div className="absolute inset-y-0 left-0 w-px bg-gold/60" />
            <div className="absolute inset-y-0 right-0 w-px bg-gold/60" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted">
            Preview
          </div>
          <div className="rounded-2xl overflow-hidden border border-border bg-paper aspect-square">
            {preview ? (
              <img
                src={preview}
                alt="Cropped preview"
                className="w-full h-full object-cover"
                style={{ background: "#FDFBF6" }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[11px] text-faint">
                Preview will appear here
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={zoomOut}
              className="flex-1 rounded-2xl py-2 text-xs font-semibold bg-paper text-ink border border-border active:scale-[0.98] transition-transform"
            >
              Zoom out
            </button>
            <button
              onClick={zoomIn}
              className="flex-1 rounded-2xl py-2 text-xs font-semibold bg-paper text-ink border border-border active:scale-[0.98] transition-transform"
            >
              Zoom in
            </button>
          </div>

          <div className="text-[10px] text-muted text-center">
            Drag the box to reposition · Use zoom to adjust
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-2xl py-3 text-xs font-semibold bg-paper text-ink border border-border active:scale-[0.98] transition-transform"
        >
          Start over
        </button>
        <button
          onClick={() => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              const size = 1024;
              canvas.width = size;
              canvas.height = size;

              const sx = crop.x * img.naturalWidth;
              const sy = crop.y * img.naturalHeight;
              const sw = crop.size * img.naturalWidth;
              const sh = crop.size * img.naturalHeight;

              ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
              const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
              onConfirm(dataUrl);
            };
            img.src = image;
          }}
          className="flex-1 rounded-2xl py-3 text-xs font-semibold bg-ink text-paper active:scale-[0.98] transition-transform"
        >
          Confirm crop
        </button>
      </div>
    </div>
  );
}
