/**
 * EXAMPLE: Updated FontLightbox Component with Gemini + Chroma Key Integration
 *
 * This shows how to modify app/components/FontLightbox.tsx to use:
 * 1. Gemini Flash API for AI image generation
 * 2. Chroma key for green background removal
 */

// ═══════════════════════════════════════════
// IMPORTS TO ADD
// ═══════════════════════════════════════════

import { generateTitle, imageUrlToBase64 } from "@/lib/api-client";
import { chromaKeyImage } from "@/lib/chroma-key";

// ═══════════════════════════════════════════
// NEW STATES TO ADD
// ═══════════════════════════════════════════

// Add to useState section:
const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
const [generationError, setGenerationError] = useState<string | null>(null);

// ═══════════════════════════════════════════
// REPLACE handleGenerate FUNCTION
// ═══════════════════════════════════════════

const handleGenerate = async () => {
  if (!userText.trim()) {
    alert("Please enter text for the title");
    return;
  }
  if (!userImage) {
    alert("Please upload or select a background image");
    return;
  }

  setGenerationError(null);

  try {
    setIsGenerating(true);
    setStep(2);

    // Convert images to base64 if needed
    let userImageBase64 = userImage;
    if (!userImage.startsWith("data:")) {
      // If it's a URL, convert to base64
      userImageBase64 = await imageUrlToBase64(userImage);
    }

    // Convert reference title image to base64
    const referenceImageBase64 = await imageUrlToBase64(font.titleImageUrl);

    // Call Gemini Flash API to generate title with movie's font style
    const result = await generateTitle(
      userText.toUpperCase(),
      userImageBase64,
      referenceImageBase64,
      font.movieName,
    );

    console.log("Generation successful, applying chroma key...");

    // Apply chroma key to remove green background
    const chromaKeyedImage = await chromaKeyImage(result.generatedImage);

    // Store for rendering on canvas
    setAiGeneratedImage(chromaKeyedImage);

    setIsGenerating(false);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Generation failed";
    console.error("Generation error:", error);
    setGenerationError(errorMessage);
    setIsGenerating(false);
    setStep(1); // Go back to step 1

    alert(`Failed to generate title: ${errorMessage}`);
  }
};

// ═══════════════════════════════════════════
// UPDATE drawCanvas FUNCTION
// ═══════════════════════════════════════════

const drawCanvas = useCallback(() => {
  const canvas = canvasRef.current;
  if (!canvas || step !== 2 || isGenerating) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Draw user's background image
  const bgImg = new window.Image();
  bgImg.crossOrigin = "anonymous";

  bgImg.onload = () => {
    canvas.width = bgImg.width;
    canvas.height = bgImg.height;

    // Draw background
    ctx.drawImage(bgImg, 0, 0);

    // Draw AI-generated text on top if available
    if (aiGeneratedImage) {
      const textImg = new window.Image();
      textImg.crossOrigin = "anonymous";

      textImg.onload = () => {
        // Calculate position
        const x = (posX / 100) * canvas.width;
        const y = (posY / 100) * canvas.height;

        // Calculate size based on titleSize slider
        // titleSize is 20-150, scale to image width
        const fontSize = Math.round((titleSize / 100) * (canvas.width * 0.12));
        const imgWidth = (fontSize / 50) * textImg.width;
        const imgHeight = (imgWidth / textImg.width) * textImg.height;

        // Draw AI-generated image centered at position
        ctx.globalAlpha = 1;
        ctx.drawImage(
          textImg,
          x - imgWidth / 2,
          y - imgHeight / 2,
          imgWidth,
          imgHeight,
        );
      };

      textImg.onerror = () => {
        console.error("Failed to load AI-generated image");
      };

      textImg.src = aiGeneratedImage;
    }
  };

  bgImg.onerror = () => {
    console.error("Failed to load background image");
  };

  bgImg.src = userImage;
}, [step, userImage, aiGeneratedImage, titleSize, posX, posY, isGenerating]);

// ═══════════════════════════════════════════
// UPDATE UI IN STEP 2 LOADING STATE
// ═══════════════════════════════════════════

{
  isGenerating ? (
    <div className="ai-loader-overlay">
      <div className="ai-spinner" />
      <span className="ai-loader-text">AI FontGen Engine</span>
      <span className="ai-loader-sub">
        Generating text with {font.movieName}'s authentic movie font...
      </span>
      <span className="ai-loader-sub" style={{ fontSize: "12px" }}>
        Step 1: Analyzing reference style
      </span>
      <span className="ai-loader-sub" style={{ fontSize: "12px" }}>
        Step 2: Generating text with AI
      </span>
      <span className="ai-loader-sub" style={{ fontSize: "12px" }}>
        Step 3: Removing green background
      </span>
    </div>
  ) : null;
}

// ═══════════════════════════════════════════
// SHOW ERROR MESSAGE IF GENERATION FAILED
// ═══════════════════════════════════════════

{
  generationError && (
    <div
      style={{
        padding: "12px",
        marginBottom: "16px",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        border: "1px solid #ef4444",
        borderRadius: "6px",
        color: "#fca5a5",
        fontSize: "14px",
      }}
    >
      ⚠️ Generation Error: {generationError}
    </div>
  );
}

// ═══════════════════════════════════════════
// REMOVE OLD PRESET STYLES (NO LONGER NEEDED)
// ═══════════════════════════════════════════

// Delete or comment out the old styles-presets-wrap section
// The AI now handles all styling based on reference image

// ═══════════════════════════════════════════
// SIMPLIFY STEP 2 CONTROLS (OPTIONAL)
// ═══════════════════════════════════════════

// The controls can stay the same (size, position)
// But you can remove the textStyle dropdown since AI generates it

// ═══════════════════════════════════════════
// UPDATE CANVAS RENDERING EFFECT
// ═══════════════════════════════════════════

// Make sure this is in the useEffect that calls drawCanvas:
useEffect(() => {
  drawCanvas();
}, [drawCanvas]);

// ═══════════════════════════════════════════
// UPDATE RESET LOGIC
// ═══════════════════════════════════════════

// When user closes lightbox or resets, clear generated image:
const handleClose = () => {
  setAiGeneratedImage(null);
  setGenerationError(null);
  onClose();
};

// ═══════════════════════════════════════════
// EXAMPLE: COMPLETE handleGenerate REPLACEMENT
// ═══════════════════════════════════════════

/**
 * Complete example with all error handling and logging
 */
const handleGenerateComplete = async () => {
  // Validation
  if (!userText.trim()) {
    alert("Please enter text for the title");
    return;
  }
  if (!userImage) {
    alert("Please upload or select a background image");
    return;
  }
  if (!font.titleImageUrl) {
    alert("Movie reference image not available");
    return;
  }

  setGenerationError(null);

  try {
    console.log("Starting generation for:", userText);
    setIsGenerating(true);
    setStep(2);

    // Step 1: Prepare images
    console.log("Converting images to base64...");
    let userImageBase64 = userImage;
    if (!userImage.startsWith("data:")) {
      userImageBase64 = await imageUrlToBase64(userImage);
    }

    const referenceImageBase64 = await imageUrlToBase64(font.titleImageUrl);

    // Step 2: Call Gemini API
    console.log("Calling Gemini Flash API...");
    const generationResult = await generateTitle(
      userText.toUpperCase(),
      userImageBase64,
      referenceImageBase64,
      font.movieName,
    );

    if (!generationResult.generatedImage) {
      throw new Error("No image returned from generation");
    }

    console.log("Gemini generation completed, applying chroma key...");

    // Step 3: Apply chroma key
    const chromaKeyedImage = await chromaKeyImage(
      generationResult.generatedImage,
      150, // green threshold
    );

    console.log("Chroma key applied successfully");

    setAiGeneratedImage(chromaKeyedImage);
    setIsGenerating(false);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Complete generation error:", error);
    setGenerationError(errorMessage);
    setIsGenerating(false);
    setStep(1);

    // Show user-friendly error
    alert(
      `Failed to generate title:\n\n${errorMessage}\n\nPlease try again with different text or image.`,
    );
  }
};

// ═══════════════════════════════════════════
// KEY DIFFERENCES FROM OLD VERSION
// ═══════════════════════════════════════════

/**
 * OLD FLOW (Simulated):
 * 1. User enters text
 * 2. Timeout simulates generation
 * 3. Manual canvas drawing with presets
 * 4. No real AI involved
 *
 * NEW FLOW (With Gemini + Chroma):
 * 1. User enters text + uploads image
 * 2. Send to Gemini Flash API
 * 3. Gemini creates text with reference font style
 * 4. Chroma key removes green background
 * 5. Canvas displays AI-generated transparent text
 * 6. User adjusts position/size
 * 7. Download final composite
 *
 * BENEFITS:
 * - Authentic movie font styles
 * - No manual font selection needed
 * - Professional quality output
 * - Accurate text matching reference
 * - Green screen technique ensures clean isolation
 */
