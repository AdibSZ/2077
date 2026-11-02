/**
 * SYS.2077 // CYBERPUNK PHOTO PROCESSOR
 * Automatically optimizes, center-crops, and applies Cyberpunk 2077 
 * neon color-grading (deep cyan shadows, neon-magenta punch, S-curve contrast)
 */

export async function processCyberpunkPhoto(
  fileOrDataUrl: File | string,
  targetSize = 256
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        // 1. Center crop to square
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);

        // 2. Pixel-level Cyberpunk color-grading
        const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          let r = d[i];
          let g = d[i + 1];
          let b = d[i + 2];

          // Normalized luminance [0..1]
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

          // S-Curve high-tech contrast enhancement
          const contrast = 1.22;
          r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
          g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
          b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

          // Cyberpunk Color Grading (Teal/Mint shadows, Neon Magenta midtones & highlights)
          if (lum < 0.45) {
            // Shadows: cool cyan-mint tint (#5DF8D8)
            g += 10;
            b += 18;
            r -= 6;
          } else if (lum > 0.55) {
            // Highlights: vivid neon magenta punch (#F62477)
            r += 16;
            g -= 4;
            b += 10;
          } else {
            // Midtones: high saturation boost
            r = r * 1.05;
            b = b * 1.08;
          }

          // Clamp [0..255]
          d[i] = Math.max(0, Math.min(255, Math.round(r)));
          d[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
          d[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
        }

        ctx.putImageData(imgData, 0, 0);

        // 3. Subtle overlay of Cyberpunk dual-tone gradient
        const grad = ctx.createLinearGradient(0, 0, targetSize, targetSize);
        grad.addColorStop(0, 'rgba(246, 36, 119, 0.12)'); // Neon Magenta
        grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, 'rgba(93, 248, 216, 0.15)'); // Neon Mint
        ctx.fillStyle = grad;
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillRect(0, 0, targetSize, targetSize);

        // 4. Subtle holographic scanlines baked-in for ultra-realism
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        for (let y = 0; y < targetSize; y += 4) {
          ctx.fillRect(0, y, targetSize, 1.5);
        }

        // 5. Output optimized WebP/JPEG dataUrl (lightweight ~15-25KB)
        const finalDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(finalDataUrl);
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = (err) => reject(err);

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          img.src = reader.result;
        } else {
          reject(new Error('FileReader failed'));
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
