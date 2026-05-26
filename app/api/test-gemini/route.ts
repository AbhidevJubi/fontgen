import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

/**
 * Test endpoint to verify Gemini API is working
 * GET /api/test-gemini
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY not configured in environment",
          hint: "Add GEMINI_API_KEY to .env.local file",
        },
        { status: 500 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Try each model in order
    const models = [
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-pro-vision",
    ];

    const results: { model: string; status: string; error?: string }[] = [];

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const response = await model.generateContent("Say 'Hello' in one word");
        const text =
          response.response.candidates?.[0]?.content.parts?.[0]?.text;

        results.push({
          model: modelName,
          status: "✅ Working",
        });
        console.log(`✓ ${modelName} is available`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        results.push({
          model: modelName,
          status: "❌ Not available",
          error: errorMsg,
        });
        console.log(`✗ ${modelName} failed: ${errorMsg}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Gemini API connection test completed",
        results,
        activeModel:
          results.find((r) => r.status.includes("✅"))?.model || "None",
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Test error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
