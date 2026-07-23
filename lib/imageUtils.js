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

      const aspect = img.width / img.height;
      const isPortrait = aspect < 0.8;

      let sx, sy, sw, sh;
      if (isPortrait) {
        sw = img.width * 0.85;
        sh = img.height * 0.7;
        sx = (img.width - sw) / 2;
        sy = img.height * 0.05;
      } else {
        sw = img.width * 0.8;
        sh = img.height * 0.8;
        sx = (img.width - sw) / 2;
        sy = (img.height - sh) / 2;
      }

      const targetSize = Math.max(1, Math.min(sw, sh));
      canvas.width = targetSize;
      canvas.height = targetSize;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetSize, targetSize);
      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
}
