import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

(async () => {
  try {
    console.log("⏳ Sending test request to Gemini...");
    const resp = await ai.models.generateContent({
      model,
      contents: "Say hi and return a one-line Solidity pragma like: // test",
    });
    console.log("✅ Gemini response.text (if available):", resp?.text);
    console.log("Full response candidates (for debugging):", resp?.candidates?.[0]);
  } catch (e) {
    console.error("❌ Error from Gemini:", e);
  }
})();
