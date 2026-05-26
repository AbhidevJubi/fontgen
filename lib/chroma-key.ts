/**
 * Chroma Key Utility - Removes green background from images
 * Uses canvas-based approach to create transparency where green color exists
 */

export async function chromaKeyImage(
  imageUrl: string,
  greenThreshold: number = 99999, // slightly lower default threshold for higher sensitivity
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");

      // CROP CONFIGURATION: 10% from top and 10% from bottom
      const cropPercentage = 0.40;
      const cropPixelsY = Math.floor(img.height * cropPercentage);

      canvas.width = img.width;
      canvas.height = img.height - (cropPixelsY * 2); // subtract 10% top and 10% bottom

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw the image cropped (middle 80% height)
      ctx.drawImage(
        img,
        0, // sx
        cropPixelsY, // sy (start 10% down)
        img.width, // sWidth
        img.height - (cropPixelsY * 2), // sHeight
        0, // dx
        0, // dy
        canvas.width, // dWidth
        canvas.height // dHeight
      );

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Process each pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]; // Red
        const g = data[i + 1]; // Green
        const b = data[i + 2]; // Blue

        // Generous green chroma keying:
        // 1. Check if green is the dominant channel by at least 1.18x compared to red/blue
        // 2. OR check if green channel is highly dominant over both red and blue
        // 3. Keep white and non-green pixels completely solid
        const isGreenDominant = g > r * 1.18 && g > b * 1.18 && g > 60;
        const isStrongGreen = g > 130 && r < 150 && b < 150 && g > r * 1.1 && g > b * 1.1;

        if (isGreenDominant || isStrongGreen) {
          data[i + 3] = 0; // Set alpha to 0 (completely transparent)
        }
      }

      // Put the modified image data back
      ctx.putImageData(imageData, 0, 0);

      // Convert canvas to blob and return as data URL
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.readAsDataURL(blob);
        } else {
          reject(new Error("Could not create blob from canvas"));
        }
      }, "image/png");
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image from URL: ${imageUrl}`));
    };

    img.src = imageUrl;
  });
}

/**
 * Advanced chroma key with color range detection
 * More sophisticated approach using HSL color space
 */
export async function chromaKeyImageAdvanced(
  imageUrl: string,
  targetColor: { r: number; g: number; b: number } = { r: 0, g: 255, b: 0 },
  tolerance: number = 99999,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate color difference (Euclidean distance in RGB space)
        const dr = r - targetColor.r;
        const dg = g - targetColor.g;
        const db = b - targetColor.b;
        const distance = Math.sqrt(dr * dr + dg * dg + db * db);

        // If color is within tolerance, make it transparent
        if (distance < tolerance) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.readAsDataURL(blob);
        } else {
          reject(new Error("Could not create blob from canvas"));
        }
      }, "image/png");
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image from URL: ${imageUrl}`));
    };

    img.src = imageUrl;
  });
}
