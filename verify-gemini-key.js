#!/usr/bin/env node

/**
 * Test script to verify Gemini API key validity
 * Run: node verify-gemini-key.js
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
console.log("\n📡 Testing Gemini API connection...\n");

const https = require("https");

const postData = JSON.stringify({
  contents: [
    {
      parts: [
        {
          text: "Say hello",
        },
      ],
    },
  ],
});

const options = {
  hostname: "generativelanguage.googleapis.com",
  path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
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
      console.log("\nResponse:");
      console.log(JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log("Response:", data);
    }

    if (res.statusCode === 200) {
      console.log("\n✅ API Key is VALID!");
    } else if (res.statusCode === 400) {
      console.log("\n❌ API Key is INVALID or malformed");
      console.log("   → Check if key has correct format (starts with AIza)");
      console.log("   → Check if 'Generative Language API' is enabled");
    } else if (res.statusCode === 403) {
      console.log("\n❌ Forbidden (insufficient permissions)");
      console.log(
        "   → Enable 'Generative Language API' in Google Cloud Console",
      );
    }
  });
});

req.on("error", (e) => {
  console.error("❌ Request failed:", e.message);
});

req.write(postData);
req.end();
