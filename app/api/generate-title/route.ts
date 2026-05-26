import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

/**
 * Gemini Image Generation API for Movie Titles
 * POST /api/generate-title
 *
 * Two-phase approach:
 * 1. Analyze reference image style
 * 2. Generate new title image with extracted style applied to user text
 *
 * Request body:
 * {
 *   userText: string,
 *   userImageBase64: string,
 *   referenceImageBase64: string,
 *   movieName: string
 * }
 */

// Available Gemini models - prioritize vision-capable models
const GEMINI_MODELS = [
  "gemini-2.5-flash-image", // Best for image generation
  "gemini-2.5-flash", // Good fallback
  "gemini-3.5-flash", // Text fallback if image-only models fail
  "gemini-2.0-flash", // Last resort
] as const;

async function getAvailableModel(
  genAI: GoogleGenerativeAI,
): Promise<string | null> {
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      await model.generateContent("test");
      console.log(`✓ Model available: ${modelName}`);
      return modelName;
    } catch (err) {
      console.log(`✗ Model not available: ${modelName}`);
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userText, userImageBase64, referenceImageBase64, movieName } = body;

    if (!userText || !referenceImageBase64) {
      return NextResponse.json(
        { error: "userText and referenceImageBase64 are required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 },
      );
    }

    // Validate and extract reference image data
    let referenceImageData = referenceImageBase64;
    if (referenceImageBase64.includes(",")) {
      referenceImageData = referenceImageBase64.split(",")[1];
    }

    console.log("📊 Reference image size:", referenceImageData.length, "bytes");
    console.log("📝 User text:", userText.toUpperCase());

    // ===================================================================
    // PHASE 1: Analyze the reference image to extract style details
    // ===================================================================
    let styleInfo: any = {};
    try {
      console.log("\n🔍 PHASE 1: Analyzing reference image style...");
      const genAI = new GoogleGenerativeAI(apiKey);
      let modelName = await getAvailableModel(genAI);
      if (!modelName) {
        modelName = "gemini-2.5-flash";
      }
      const model = genAI.getGenerativeModel({ model: modelName });

      const analysisPrompt = `You are analyzing a movie title image design. Please examine this reference image CAREFULLY and describe the exact text styling in JSON format.

IMPORTANT: IGNORE ANY SHADOWS in the reference image. Even if the title has drop shadows, set hasShadow to false and leave shadow fields empty. Focus only on the core text styling: font, colors, strokes, glows, gradients, and special effects.

Return ONLY valid JSON (no markdown, no code blocks, no explanations):

{
  "fontDescription": "Describe the font: serif/sans-serif, weight (bold/regular/light), style (italic/normal)",
  "textColor": "Describe the main text color (hex code if possible, or color description)",
  "hasStroke": true/false,
  "strokeColor": "Color of text stroke/outline if present",
  "strokeWidth": "Estimated thickness in pixels",
  "hasShadow": false,
  "shadowColor": "",
  "shadowOffsetX": "",
  "shadowOffsetY": "", 
  "shadowBlur": "",
  "hasGlow": true/false,
  "glowColor": "Glow color if present",
  "glowIntensity": "Low/Medium/High",
  "hasGradient": true/false,
  "gradientColors": "Colors in gradient if present",
  "hasSpecialEffects": true/false,
  "specialEffects": "3D, metallic, glass, chrome, etc.",
  "overallStyle": "Brief description of the overall visual style",
  "colorHex": "Primary text color in hex format if determinable"
}`;

      const analysisResponse = await model.generateContent([
        analysisPrompt,
        {
          inlineData: {
            mimeType: "image/png",
            data: referenceImageData,
          },
        },
      ]);

      const analysisText =
        analysisResponse.response.candidates?.[0]?.content.parts?.[0]?.text ||
        "";

      console.log(
        "Analysis response (preview):",
        analysisText.substring(0, 150) + "...",
      );

      // Extract JSON from response (might have markdown formatting)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        styleInfo = JSON.parse(jsonMatch[0]);
        console.log("✅ Parsed style info successfully!");
      } else {
        styleInfo = { raw: analysisText };
      }
    } catch (e) {
      console.warn(
        "⚠️ Phase 1 Gemini Style Analysis threw error (using fallback defaults):",
        e,
      );
      styleInfo = {
        fontDescription: "serif, bold, normal style, cinematic structure",
        textColor: "Metallic golden bronze/copper with highlights",
        hasStroke: true,
        strokeColor: "#000000",
        strokeWidth: "2",
        hasShadow: false,
        shadowColor: "",
        shadowOffsetX: "",
        shadowOffsetY: "",
        shadowBlur: "",
        hasGlow: true,
        glowColor: "#FF8C00",
        glowIntensity: "medium",
        hasGradient: true,
        gradientColors: "gold, copper, reddish-brown",
        hasSpecialEffects: true,
        specialEffects:
          "3D volumetric text with depth, scratched weathered metallic texture, and rustic highlights",
        overallStyle: "Ancient, powerful, sculpted metallic epic text.",
        colorHex: "#FFD700",
      };
    }

    // ===================================================================
    // PHASE 2: Generate new image with extracted style applied to user text
    // ===================================================================
    let generatedImage: any = null;
    let geminiModelUsed = "gemini-2.5-flash";

    try {
      console.log("\n🎨 PHASE 2: Generating new title image via Gemini...");
      const genAI = new GoogleGenerativeAI(apiKey);
      let modelName = await getAvailableModel(genAI);
      if (!modelName) modelName = "gemini-2.5-flash";
      geminiModelUsed = modelName;
      const model = genAI.getGenerativeModel({ model: modelName });

      const generationPrompt = `You MUST generate an image. This is critical - return ONLY an image file, no text.

TEXT TO CREATE: "${userText.toUpperCase()}"
OUTPUT SIZE: 1920x1080 pixels (16:9 aspect ratio)
BACKGROUND: Solid pure bright green (#00FF00) - must be uniform
TEXT POSITIONING: Centered both horizontally and vertically

STYLING TO APPLY (based on reference image analysis):
- Font Style: ${styleInfo.fontDescription || "professional, bold sans-serif"}
- Text Color: ${styleInfo.textColor || styleInfo.colorHex || "#FFFFFF"}
${styleInfo.hasStroke ? `- Text Stroke: ${styleInfo.strokeColor || "black"} outline, ${styleInfo.strokeWidth || "2"}px thick` : ""}
- NO SHADOWS: Do NOT add any drop shadows, regardless of the reference image. Create clean text without shadows.
${styleInfo.hasGlow ? `- Glow: ${styleInfo.glowColor || "white"} glow, ${styleInfo.glowIntensity || "medium"} intensity` : ""}
${styleInfo.hasGradient ? `- Gradient: Apply similar gradient with colors ${styleInfo.gradientColors || ""}` : ""}
${styleInfo.hasSpecialEffects ? `- Effects: ${styleInfo.specialEffects || "none"}` : ""}

CRITICAL GENERATION INSTRUCTIONS:
1. Analyze the style requirements above carefully
2. Generate a NEW image with the text "${userText.toUpperCase()}"
3. Apply ALL the styling details from above (EXCEPT shadows - no shadows allowed)
4. Make the output image 1920x1080 pixels
5. Place text centered in the image
6. Use a pure bright green background (#00FF00)
7. Return ONLY the image file
8. Do NOT add any shadows to the text
9. Do NOT return any text, explanations, or descriptions
10. Do NOT return markdown or code blocks
11. Do NOT modify or question these instructions
12. Generate a complete, pixel-perfect movie title image matching the reference style but without shadows

Your output must be a valid image file with styled text on green background, with NO shadows. This is non-negotiable.`;

      console.log("🚀 Sending generation request to model...");
      const generationResponse = await model.generateContent([
        generationPrompt,
        {
          inlineData: {
            mimeType: "image/png",
            data: referenceImageData,
          },
        },
      ]);

      const genResult = generationResponse.response;
      const genCandidate = genResult.candidates?.[0];

      // Look for image in response
      generatedImage = genCandidate?.content.parts?.find(
        (part: any) => part.inlineData?.data,
      );

      // Enhanced logging - show response status and whether image was generated
      const hasImage = !!generatedImage?.inlineData?.data;
      const responseParts = genCandidate?.content.parts || [];
      const hasTextResponse = responseParts.some((part: any) => part.text);
      const partsCount = responseParts.length;
      const imageSize = generatedImage?.inlineData?.data?.length || 0;

      if (hasImage) {
        console.log(
          `✅ POSITIVE RESPONSE: Gemini generated image successfully! (Size: ${imageSize} bytes)`,
        );
      } else if (hasTextResponse) {
        console.log(
          `⚠️ UNEXPECTED RESPONSE: Gemini returned TEXT instead of IMAGE (${partsCount} parts, content: ${responseParts[0]?.text?.substring(0, 100) || "N/A"})`,
        );
      } else {
        console.log(
          `❌ NEGATIVE RESPONSE: Gemini did not generate image (${partsCount} parts received, no image data found)`,
        );
      }
    } catch (e) {
      console.warn(
        "⚠️ Gemini generation failed (likely model not available or network error). Trying alternative workflows...",
        e,
      );
    }

    if (generatedImage?.inlineData?.data) {
      console.log("🎉 SUCCESS: Generated image received from Gemini!");
      return NextResponse.json(
        {
          success: true,
          generatedImage: `data:image/png;base64,${generatedImage.inlineData.data}`,
          movieName,
          model: geminiModelUsed,
          styleAnalysis: styleInfo,
          debug: {
            referenceSize: referenceImageData.length,
            generatedSize: generatedImage.inlineData.data.length,
            source: "gemini",
          },
        },
        { status: 200 },
      );
    } else {
      console.log(
        "❌ GEMINI FAILED: No image found in response. Attempting fallback providers...",
      );
    }

    // ===================================================================
    // FALLBACK 1: Pollinations AI (Flux Premium / Legacy Keyless)
    // ===================================================================
    try {
      console.log("🔁 Trying Pollinations AI fallback...");
      const pollinationsPrompt = `A premium cinematic movie title logo showing only the text "${userText.toUpperCase()}".
Typography design details:
- Font style: ${styleInfo.fontDescription || "bold modern sans-serif"}
- Text color: ${styleInfo.textColor || styleInfo.colorHex || "#FFFFFF"}
${styleInfo.hasStroke ? `- Outline stroke: ${styleInfo.strokeColor || "black"} outline` : ""}
- NO SHADOWS: Do NOT add any drop shadows or shadow effects
${styleInfo.hasGlow ? `- Glow effect: ${styleInfo.glowColor || "white"} glow` : ""}
${styleInfo.hasGradient ? `- Color gradient: ${styleInfo.gradientColors || ""}` : ""}
${styleInfo.hasSpecialEffects ? `- 3D/Metallic/Special effects: ${styleInfo.specialEffects || ""}` : ""}
- Overall visual theme: ${styleInfo.overallStyle || "authentic movie title"} inspired by the style of ${movieName}.

CRITICAL REQUIREMENTS:
1. The background MUST be a flat, solid, uniform pure bright green (#00FF00) color suitable for green screen chroma keying.
2. Only the text "${userText.toUpperCase()}" should be visible, perfectly centered horizontally and vertically. No other background elements, textures, objects, or borders.
3. The letters must be sharp, high resolution, and correctly spelled.
4. DO NOT add any shadows, drop shadows, or shadow effects. Generate clean text without shadows.`;

      const encodedPrompt = encodeURIComponent(pollinationsPrompt);
      const pollinationsApiKey = process.env.POLLINATIONS_API_KEY;

      let pollinationsRes: Response;
      let usedModel = "Flux AI";

      if (pollinationsApiKey) {
        const url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=1920&height=1080&model=flux&nologo=true`;
        console.log("🚀 Calling Authenticated Pollinations API:", url);
        pollinationsRes = await fetch(url, {
          headers: {
            Authorization: `Bearer ${pollinationsApiKey}`,
          },
        });
      } else {
        // Fall back directly to the legacy keyless prompt endpoint which bypasses 401 rate limitations
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1920&height=1080&nologo=true`;
        console.log("🚀 Calling Keyless Pollinations API:", url);
        pollinationsRes = await fetch(url);
        usedModel = "Pollinations (Keyless)";
      }

      // If key-based request returned 401, retry keyless legacy fallback!
      if (!pollinationsRes.ok && pollinationsRes.status === 401) {
        console.warn(
          "⚠️ Premium Pollinations API returned 401. Retrying with legacy keyless endpoint...",
        );
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1920&height=1080&nologo=true`;
        pollinationsRes = await fetch(url);
        usedModel = "Pollinations (Legacy Keyless)";
      }

      if (pollinationsRes.ok) {
        const buffer = await pollinationsRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        console.log(
          `✅ POSITIVE RESPONSE: Pollinations AI generated image successfully! Model: ${usedModel} (Size: ${base64.length} bytes)`,
        );
        return NextResponse.json({
          success: true,
          generatedImage: `data:image/png;base64,${base64}`,
          movieName,
          model: usedModel,
          styleAnalysis: styleInfo,
          debug: {
            provider: "pollinations",
            success: true,
            source: "fallback",
          },
        });
      } else {
        console.warn(
          `❌ NEGATIVE RESPONSE: Pollinations API returned non-ok status: ${pollinationsRes.status} - ${pollinationsRes.statusText}`,
        );
      }
    } catch (e) {
      console.error(
        `❌ NEGATIVE RESPONSE: Pollinations AI fallback failed with error: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // ===================================================================
    // FALLBACK 2: Hugging Face Inference API (Flux Schnell)
    // ===================================================================
    const hfToken =
      process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN;
    if (hfToken) {
      try {
        console.log("🔁 Trying Hugging Face Inference API...");
        const hfPrompt = `A premium cinematic movie title logo showing only the text "${userText.toUpperCase()}".
Typography design details:
- Font style: ${styleInfo.fontDescription || "bold modern sans-serif"}
- Text color: ${styleInfo.textColor || styleInfo.colorHex || "#FFFFFF"}
${styleInfo.hasStroke ? `- Outline stroke: ${styleInfo.strokeColor || "black"} outline` : ""}
- NO SHADOWS: Do NOT add any drop shadows or shadow effects
${styleInfo.hasGlow ? `- Glow effect: ${styleInfo.glowColor || "white"} glow` : ""}
${styleInfo.hasGradient ? `- Color gradient: ${styleInfo.gradientColors || ""}` : ""}
${styleInfo.hasSpecialEffects ? `- 3D/Metallic/Special effects: ${styleInfo.specialEffects || ""}` : ""}
- Overall visual theme: ${styleInfo.overallStyle || "authentic movie title"} inspired by the style of ${movieName}.

CRITICAL REQUIREMENTS:
1. The background MUST be a flat, solid, uniform pure bright green (#00FF00) color suitable for green screen chroma keying.
2. Only the text "${userText.toUpperCase()}" should be visible, perfectly centered horizontally and vertically. No other background elements, textures, objects, or borders.
3. The letters must be sharp, high resolution, and correctly spelled.
4. DO NOT add any shadows, drop shadows, or shadow effects. Generate clean text without shadows.
3. The letters must be sharp, high resolution, and correctly spelled.`;

        const hfUrl =
          "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";
        console.log("🚀 Calling Hugging Face Inference API...");
        const hfRes = await fetch(hfUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: hfPrompt }),
        });

        if (hfRes.ok) {
          const buffer = await hfRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          console.log(
            `✅ POSITIVE RESPONSE: Hugging Face FLUX generated image successfully! (Size: ${base64.length} bytes)`,
          );
          return NextResponse.json({
            success: true,
            generatedImage: `data:image/png;base64,${base64}`,
            movieName,
            model: "Hugging Face (Flux)",
            styleAnalysis: styleInfo,
            debug: {
              provider: "huggingface",
              success: true,
              source: "fallback",
            },
          });
        } else {
          console.warn(
            `❌ NEGATIVE RESPONSE: Hugging Face returned status: ${hfRes.status} - ${hfRes.statusText}`,
          );
        }
      } catch (e) {
        console.error(
          `❌ NEGATIVE RESPONSE: Hugging Face fallback failed with error: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    // ===================================================================
    // FALLBACK 3: Old Imagen REST Fallback
    // ===================================================================
    try {
      console.log("🔁 Trying old Imagen REST fallback...");
      if (apiKey) {
        const predictUrl = `https://generativelanguage.googleapis.com/v1/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
        const predictBody = {
          prompt: `Generate a PNG image (1920x1080) with the text: "${userText.toUpperCase()}" using the exact visual styling of the provided reference image. 
IMPORTANT: Do NOT add any shadows, drop shadows, or shadow effects - generate clean text without shadows.
Render text centered on pure green background #00FF00. Return PNG image bytes.`,
          input_image: {
            mime_type: "image/png",
            data: referenceImageData,
          },
          output: { format: "png", size: "1920x1080" },
        } as any;

        const fallbackRes = await fetch(predictUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(predictBody),
        });

        if (fallbackRes.ok) {
          const fallbackJson = await fallbackRes.json();
          const findBase64 = (obj: any): string | null => {
            if (!obj) return null;
            if (typeof obj === "string") {
              if (/^[A-Za-z0-9+/=\r\n]+$/.test(obj) && obj.length > 1000)
                return obj.replace(/\r|\n/g, "");
            }
            if (Array.isArray(obj)) {
              for (const v of obj) {
                const f = findBase64(v);
                if (f) return f;
              }
            } else if (typeof obj === "object") {
              for (const k of Object.keys(obj)) {
                const f = findBase64(obj[k]);
                if (f) return f;
              }
            }
            return null;
          };

          const maybeBase64 = findBase64(fallbackJson);
          if (maybeBase64) {
            console.log(
              `✅ POSITIVE RESPONSE: Imagen generated image successfully! (Size: ${maybeBase64.length} bytes)`,
            );
            return NextResponse.json(
              {
                success: true,
                generatedImage: `data:image/png;base64,${maybeBase64}`,
                movieName,
                model: "imagen-4.0-generate-001",
                styleAnalysis: styleInfo,
                debug: {
                  fallbackProvider: "imagen",
                  fallbackFound: true,
                  source: "fallback",
                },
              },
              { status: 200 },
            );
          } else {
            console.warn(
              `❌ NEGATIVE RESPONSE: Imagen API returned OK but no image data found in response`,
            );
          }
        } else {
          console.warn(
            `❌ NEGATIVE RESPONSE: Imagen API returned status: ${fallbackRes.status}`,
          );
        }
      }
    } catch (e) {
      console.warn(
        `❌ NEGATIVE RESPONSE: Imagen fallback failed with error: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // ===================================================================
    // FALLBACK 4: Return style analysis so client renders locally (last resort)
    // ===================================================================
    console.log(
      `❌ FINAL STATUS: All image generation APIs failed (Gemini, Pollinations, HuggingFace, Imagen). No image was generated by any provider. Falling back to client-side local rendering.`,
    );
    return NextResponse.json(
      {
        success: false,
        fallback: true,
        error:
          "All image generation APIs failed. Falling back to client-side local rendering.",
        styleAnalysis: styleInfo,
        movieName,
        model: "Client-side Local Canvas Rendering (Fallback)",
      },
      { status: 200 },
    );
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Internal server error";
    console.error(
      `❌ CRITICAL ERROR: Generation request failed with error: ${errorMsg}`,
      err,
    );
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/generate-title
 * Alternative endpoint for style analysis only
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { referenceImageBase64, userText, movieName } = body;

    if (!referenceImageBase64) {
      return NextResponse.json(
        { error: "referenceImageBase64 required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let referenceImageData = referenceImageBase64;
    if (referenceImageBase64.includes(",")) {
      referenceImageData = referenceImageBase64.split(",")[1];
    }

    const analysisPrompt = `Analyze this movie title image and extract the text styling details as JSON:

{
  "fontDescription": "Font family and weight",
  "textColor": "Main text color",
  "hasStroke": boolean,
  "strokeColor": "Stroke color if present",
  "hasShadow": boolean,
  "shadowDetails": "Shadow description",
  "hasGlow": boolean,
  "hasGradient": boolean,
  "specialEffects": "Any special effects",
  "overallStyle": "Overall style description"
}`;

    const response = await model.generateContent([
      analysisPrompt,
      {
        inlineData: {
          mimeType: "image/png",
          data: referenceImageData,
        },
      },
    ]);

    const textResponse =
      response.response.candidates?.[0]?.content.parts?.[0]?.text || "";

    let styleAnalysis = {};
    try {
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        styleAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      styleAnalysis = { raw: textResponse };
    }

    return NextResponse.json(
      {
        success: true,
        styleAnalysis,
        movieName,
        userText: userText?.toUpperCase() || "",
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
