"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import type { MovieFont } from "../data/fonts";
import { generateTitle, imageUrlToBase64 } from "@/lib/api-client";
import { chromaKeyImage } from "@/lib/chroma-key";
import "./FontLightbox.css";

interface FontLightboxProps {
  font: MovieFont;
  onClose: () => void;
}

export default function FontLightbox({ font, onClose }: FontLightboxProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [userText, setUserText] = useState("");
  const [userImage, setUserImage] = useState<string | null>(null);
  const [userImageFile, setUserImageFile] = useState<File | null>(null);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [aiModel, setAiModel] = useState<string | null>(null);

  // Step 2 controls
  const [titleSize, setTitleSize] = useState(60);
  const [posX, setPosX] = useState(50); // percent
  const [posY, setPosY] = useState(80); // percent
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const step2FileInputRef = useRef<HTMLInputElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent background scrolling while lightbox is active
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setUserImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (src: string) => {
    setUserImage(src);
    setUserImageFile(null);
  };

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

      console.log("🎬 Starting AI generation for:", userText);

      // Convert images to base64
      let userImageBase64 = userImage;
      if (!userImage.startsWith("data:")) {
        userImageBase64 = await imageUrlToBase64(userImage);
      }

      console.log("📸 Converting reference image...");
      const referenceImageBase64 = await imageUrlToBase64(font.titleImage);

      // Call Gemini API
      console.log("🤖 Calling Gemini Flash API...");
      const result = await generateTitle(
        userText.toUpperCase(),
        userImageBase64,
        referenceImageBase64,
        font.movieName,
      );

      // If model returned an actual image use it, otherwise try client-side rendering
      if (result.generatedImage) {
        console.log("✨ Generation completed, applying chroma key...");
        const chromaKeyedImage = await chromaKeyImage(
          result.generatedImage,
          150,
        );
        console.log("🎨 Chroma key applied successfully");
        setAiGeneratedImage(chromaKeyedImage);
        setAiModel(result.model || "Gemini Flash");
        setIsGenerating(false);
      } else if (result.fallback && result.styleAnalysis) {
        console.log(
          "ℹ️ Gemini returned style analysis text; rendering locally...",
        );

        // Draw text on green background according to styleAnalysis (best-effort)
        const renderTextOnGreen = (text: string, analysis: any) => {
          // Use larger canvas for better quality text rendering
          const width = 3200;
          const height = 800;
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return null;

          // Green background
          ctx.fillStyle = "#00FF00";
          ctx.fillRect(0, 0, width, height);

          // Best-effort font parsing from analysis
          let fontSize = 300; // Much larger default
          let fontFamily = "Arial, sans-serif";
          let fontWeight = "700";
          let fillStyle = "#FFFFFF";
          let strokeStyle: string | null = null;
          let strokeWidth = 0;
          let shadowColor: string | null = null;
          let shadowBlur = 0;
          let shadowOffsetX = 0;
          let shadowOffsetY = 0;

          if (analysis && typeof analysis === "object") {
            if (analysis.fontSize) {
              const n = parseInt(
                String(analysis.fontSize).replace(/[^0-9]/g, ""),
                10,
              );
              if (!Number.isNaN(n)) fontSize = Math.max(100, Math.min(600, n));
            }
            if (analysis.fontFamily) fontFamily = analysis.fontFamily;
            if (analysis.fontWeight)
              fontWeight = analysis.fontWeight.includes("bold") ? "700" : "400";
            if (analysis.textColor) fillStyle = analysis.textColor;
            if (analysis.strokeColor) {
              strokeStyle = analysis.strokeColor;
              strokeWidth = analysis.textStroke
                ? Number(analysis.textStroke) || 3
                : 3;
            }
            if (analysis.shadowColor) shadowColor = analysis.shadowColor;
            if (analysis.shadowBlur)
              shadowBlur = Number(analysis.shadowBlur) || 0;
            if (analysis.shadowOffsetX)
              shadowOffsetX = Number(analysis.shadowOffsetX) || 0;
            if (analysis.shadowOffsetY)
              shadowOffsetY = Number(analysis.shadowOffsetY) || 0;
          } else if (typeof analysis === "string") {
            // Try to parse simple hex color occurrences
            const hexMatch = analysis.match(/#([0-9a-fA-F]{6})/);
            if (hexMatch) fillStyle = `#${hexMatch[1]}`;
          }

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

          if (shadowColor) {
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = shadowBlur;
            ctx.shadowOffsetX = shadowOffsetX;
            ctx.shadowOffsetY = shadowOffsetY;
          }

          // Draw stroke if present
          if (strokeStyle && strokeWidth > 0) {
            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = strokeStyle;
            ctx.strokeText(text, width / 2, height / 2);
          }

          // Fill text
          ctx.fillStyle = fillStyle;
          ctx.fillText(text, width / 2, height / 2);

          return canvas.toDataURL("image/png");
        };

        // styleAnalysis may be object or raw string
        const analysis = result.styleAnalysis || {};
        const textImageDataUrl = renderTextOnGreen(
          userText.toUpperCase(),
          analysis,
        );
        if (!textImageDataUrl) {
          console.warn("Failed to render fallback image");
          setIsGenerating(false);
          return; // Silently fail
        }

        // Apply chroma key to the locally rendered green image
        const chromaKeyedImage = await chromaKeyImage(textImageDataUrl, 150);
        setAiGeneratedImage(chromaKeyedImage);
        setIsGenerating(false);
      } else {
        console.warn("Generation did not return image or style analysis");
        setIsGenerating(false);
        // Silently fail - don't show error to user
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Generation error:", error);
      setGenerationError(errorMessage);
      setIsGenerating(false);
      // Stay on step 2 to show error, but don't alert user
    }
  };

  // Drag and drop text on canvas
  const handleCanvasInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setPosX(Math.max(0, Math.min(100, Math.round(x))));
    setPosY(Math.max(0, Math.min(100, Math.round(y))));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    handleCanvasInteraction(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    handleCanvasInteraction(e.clientX, e.clientY);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    if (e.touches.length > 0) {
      handleCanvasInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    if (e.touches.length > 0) {
      handleCanvasInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Draw canvas whenever controls change
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || step !== 2 || !userImage) return;

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

      // Draw AI-generated text image on top if available
      if (aiGeneratedImage && !isGenerating) {
        const textImg = new window.Image();
        textImg.crossOrigin = "anonymous";

        textImg.onload = () => {
          // Calculate position and size
          const x = (posX / 100) * canvas.width;
          const y = (posY / 100) * canvas.height;

          // Scale based on titleSize slider (20-150%)
          // Calculate proportional width based on canvas
          const baseWidth = canvas.width * 0.3; // 30% of canvas width as base
          const scaledWidth = (titleSize / 100) * baseWidth;
          const scaledHeight = (textImg.height / textImg.width) * scaledWidth;

          // Draw the AI-generated image centered at the position
          ctx.globalAlpha = 1;
          ctx.drawImage(
            textImg,
            x - scaledWidth / 2,
            y - scaledHeight / 2,
            scaledWidth,
            scaledHeight,
          );
        };

        textImg.onerror = () => {
          console.error("❌ Failed to load AI-generated image");
        };

        textImg.src = aiGeneratedImage;
      }
    };

    bgImg.onerror = () => {
      console.error("❌ Failed to load background image");
    };

    bgImg.src = userImage;
  }, [step, userImage, aiGeneratedImage, titleSize, posX, posY, isGenerating]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${font.movieName}-${userText.trim().replace(/\s+/g, "-") || "title"}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  };

  const triggerChangeImage = () => {
    step2FileInputRef.current?.click();
  };

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div
        className={`lightbox-container ${step === 2 && !isGenerating ? "expanded" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="lightbox-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div
          className={`lightbox-body ${step === 2 && !isGenerating ? "two-panel" : ""}`}
        >
          {/* ─── STEP 1 ─── */}
          {/* Always display or keep on the left for live adjustment in split panel */}
          <div className="lightbox-step step-1">
            <div className="step-header">
              <span className="step-badge">Step 1</span>
              <h3 className="step-heading">{font.movieName} — Title Creator</h3>
            </div>

            <div className="form-group">
              <label className="form-label">Enter Your Text</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. DILWALE"
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                maxLength={25}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Upload Your Background Image (PNG/JPG)
              </label>
              <div
                className="upload-zone"
                onClick={() => fileInputRef.current?.click()}
              >
                {userImage ? (
                  <div className="upload-preview-wrap">
                    <img
                      src={userImage}
                      alt="Background Preview"
                      className="upload-preview"
                    />
                    <span className="upload-change">
                      Click to change background
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="upload-icon">🖼️</span>
                    <span className="upload-text">Upload your image here</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Or use one of these presets</label>
              <div className="sample-images">
                {font.sampleImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Sample ${idx + 1}`}
                    className={`sample-img ${userImage === img ? "selected" : ""}`}
                    onClick={() => handleSelectSample(img)}
                  />
                ))}
              </div>
            </div>

            <div className="form-notes">
              <p className="note-item">🚫 Don&apos;t use special characters.</p>
              <p className="note-item">
                ⚡ AI will match the exact font style from {font.movieName}.
              </p>
              <p className="note-item">
                💾 You can adjust size &amp; position after generation.
              </p>
            </div>

            {step === 1 && (
              <button
                className="generate-btn"
                onClick={handleGenerate}
                disabled={!userText.trim() || !userImage}
              >
                Generate Title Font
              </button>
            )}
          </div>

          {/* ─── STEP 2 (EDITOR & CONTROLS) ─── */}
          {step === 2 && (
            <div className="lightbox-step step-2">
              {isGenerating ? (
                <div className="ai-loader-overlay">
                  <div className="ai-spinner" />
                  <span className="ai-loader-text">AI FontGen Engine</span>
                  <span className="ai-loader-sub">
                    Analyzing {font.movieName}'s font style...
                  </span>
                  <span
                    className="ai-loader-sub"
                    style={{ fontSize: "12px", marginTop: "8px" }}
                  >
                    Generating text with authentic typography
                  </span>
                </div>
              ) : null}

              <div className="step-header">
                <span className="step-badge">Step 2</span>
                {aiModel && (
                  <span className="ai-model-badge">
                    {aiModel === "pollinations-flux" ? "Flux AI" : aiModel}
                  </span>
                )}
                <h3 className="step-heading">Adjust &amp; Download</h3>
              </div>

              {generationError && (
                <div
                  style={{
                    padding: "12px",
                    marginBottom: "16px",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid #ef4444",
                    borderRadius: "6px",
                    color: "#fca5a5",
                    fontSize: "13px",
                  }}
                >
                  ⚠️ Error: {generationError}
                </div>
              )}

              {/* Canvas Wrapper */}
              <div className="canvas-container-wrap">
                <div className="canvas-wrapper">
                  <canvas
                    ref={canvasRef}
                    className="result-canvas"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUpOrLeave}
                  />
                </div>
              </div>

              <span className="drag-tip">
                💡 Pro-tip: You can click and drag the text on the image to
                position it!
              </span>

              {/* Control Sliders */}
              <div className="controls-grid">
                <div className="control-item">
                  <div className="control-header">
                    <span className="control-label">Title Size</span>
                    <span className="control-val">{titleSize}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={1000}
                    value={titleSize}
                    onChange={(e) => setTitleSize(Number(e.target.value))}
                    className="control-slider"
                  />
                </div>

                <div className="control-item">
                  <div className="control-header">
                    <span className="control-label">
                      Horizontal Position (X)
                    </span>
                    <span className="control-val">{posX}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={posX}
                    onChange={(e) => setPosX(Number(e.target.value))}
                    className="control-slider"
                  />
                </div>

                <div className="control-item">
                  <div className="control-header">
                    <span className="control-label">Vertical Position (Y)</span>
                    <span className="control-val">{posY}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={posY}
                    onChange={(e) => setPosY(Number(e.target.value))}
                    className="control-slider"
                  />
                </div>
              </div>

              {/* Step 2 Actions */}
              <div className="step2-actions">
                <button className="change-img-btn" onClick={triggerChangeImage}>
                  🔄 Change Image
                </button>
                <button className="download-btn" onClick={handleDownload}>
                  💾 Download JPG
                </button>
                <input
                  ref={step2FileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
