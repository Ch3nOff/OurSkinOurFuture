export function detectPhotoType(imageDataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const aspect = img.width / img.height;
      if (aspect < 0.7) {
        resolve({ mode: "face", confidence: 0.8, reason: "Tall portrait — face likely fills frame" });
      } else if (aspect > 0.85) {
        resolve({ mode: "full", confidence: 0.75, reason: "Wide frame — likely includes shoulders/torso" });
      } else {
        resolve({ mode: "face", confidence: 0.6, reason: "Defaulting to face-optimized analysis" });
      }
    };
    img.onerror = () => resolve({ mode: "face", confidence: 0.5, reason: "Could not inspect image, defaulting to face mode" });
    img.src = imageDataUrl;
  });
}

export function cropToFaceZone(imageDataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const targetSize = Math.min(img.width, img.height);
      canvas.width = targetSize;
      canvas.height = targetSize;
      ctx.drawImage(img, 0, 0, targetSize, targetSize);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
}
