import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";
import { createAgent } from "@0xgasless/agentkit";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// === Initialize OpenAI ===
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// === Initialize AgentKit ===
async function getAgent() {
  try {
    const agent = await createAgent({
      privateKey: process.env.PRIVATE_KEY!,
      rpcUrl: process.env.RPC_URL!,
      chainId: Number(process.env.CHAIN_ID) || 137, // Polygon by default
    });
    return agent;
  } catch (err) {
    console.error("Error creating Agent:", err);
    throw err;
  }
}

// === Health check route ===
app.get("/", (_, res) => {
  res.json({ message: "✅ Backend running successfully" });
});

// === Main AI + Blockchain route ===
app.post("/build", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // === Step 1: Use OpenAI to interpret the user's prompt ===
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that helps generate Solidity smart contracts from natural language prompts.",
        },
        {
          role: "user",
          content: `Generate a Solidity smart contract based on this idea: ${prompt}`,
        },
      ],
    });

    const contractCode = aiResponse.choices[0].message?.content?.trim();
    if (!contractCode) {
      return res
        .status(500)
        .json({ error: "AI could not generate contract code." });
    }

    // === Step 2: Initialize AgentKit ===
    const agent = await getAgent();

    // === Step 3: (Optional) Simulate or deploy contract ===
    // You can deploy, simulate, or verify using agent functions.
    // For now, we’ll just simulate a deployment.
    const summary = await agent.utils.analyzeContract(contractCode);

    // === Step 4: Send result back to frontend ===
    res.json({
      success: true,
      prompt,
      contract: contractCode,
      analysis: summary,
    });
  } catch (err: any) {
    console.error("Error in /build route:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Internal Server Error",
    });
  }
});

// === Start server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
