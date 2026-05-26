#!/usr/bin/env node

/**
 * List available Gemini models
 * Run: node list-models.js
 */

const fs = require("fs");
const path = require("path");

// Read .env.local manually
const envPath = path.join(__dirname, ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY not found in .env.local");
  process.exit(1);
}

console.log("🔑 API Key found:", apiKey.substring(0, 10) + "...");
console.log("\n📡 Fetching available models...\n");

const https = require("https");

const options = {
  hostname: "generativelanguage.googleapis.com",
  path: `/v1/models?key=${apiKey}`,
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};

const req = https.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Response Status:", res.statusCode);

    try {
      const responseData = JSON.parse(data);

      if (res.statusCode === 200 && responseData.models) {
        console.log("\n✅ Available Models:\n");
        responseData.models.forEach((model) => {
          console.log(`📦 ${model.name}`);
          console.log(`   Display Name: ${model.displayName}`);
          console.log(
            `   Supported Methods: ${model.supportedGenerationMethods?.join(", ") || "N/A"}`,
          );
          console.log();
        });
      } else {
        console.log("\nResponse:");
        console.log(JSON.stringify(responseData, null, 2));
      }
    } catch (e) {
      console.log("Response:", data);
    }
  });
});

req.on("error", (e) => {
  console.error("❌ Request failed:", e.message);
});

req.end();
