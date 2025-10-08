// backend/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 5000);

/**
 * Dynamic AgentKit loader & safe creator
 */
async function getAgent() {
  try {
    const pkg = await import("@0xgasless/agentkit");
    const createAgent =
      (pkg as any)?.createAgent ||
      (pkg as any)?.default?.createAgent ||
      (pkg as any);
    if (!createAgent || typeof createAgent !== "function") {
      throw new Error("createAgent not found in @0xgasless/agentkit (check installed version)");
    }

    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;
    const chainId = Number(process.env.CHAIN_ID || 80001);

    if (!privateKey || !rpcUrl) {
      throw new Error("Missing PRIVATE_KEY or RPC_URL in environment for AgentKit");
    }

    const agent = await (createAgent as any)({
      privateKey,
      rpcUrl,
      chainId,
    });

    return agent;
  } catch (err: any) {
    console.error("Error creating AgentKit agent:", err?.message || err);
    throw err;
  }
}

/* ------------------- Fallback ERC20 generator ------------------- */
function generateTemplateERC20(prompt: string) {
  const guessed = /([A-Za-z][A-Za-z0-9_-]{1,20})/.exec(prompt || "");
  const name = (guessed && guessed[1]) || "VibeCoin";
  const symbol = (name.match(/[A-Z]/g) || [name[0].toUpperCase()]).slice(0, 3).join("").toUpperCase();

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title ${name} (${symbol}) - fallback ERC20
contract ${name} {
    string public name = "${name}";
    string public symbol = "${symbol}";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    constructor(uint256 initialSupply) {
        totalSupply = initialSupply * (10 ** uint256(decimals));
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "insufficient balance");
        require(allowance[from][msg.sender] >= value, "allowance exceeded");
        allowance[from][msg.sender] -= value;
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }
}
`;
}

/* ------------------- Groq AI Integration ------------------- */
async function generateSolidityFromPrompt(prompt: string): Promise<{ source: string; code: string }> {
    const apiKey = process.env.GROQ_API_KEY;
  
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set in the environment variables.");
    }
  
    const groq = new Groq({ apiKey });
  
    try {
      const masterPrompt = `
      You are an expert-level, security-audited Solidity smart contract developer.
      Your sole task is to take a user's request and write a complete, secure, and well-commented Solidity smart contract that fulfills that request.
  
      CRITICAL INSTRUCTIONS:
      1.  Your output MUST be ONLY the Solidity code. Do not include any explanation, greeting, or any text before or after the code block.
      2.  The code must be complete and immediately deployable.
      3.  It MUST start with "// SPDX-License-Identifier: MIT" and include a recent pragma line (e.g., "pragma solidity ^0.8.20;").
  
      User's Request: "${prompt}"
      `;
  
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: masterPrompt }],
        model: 'llama3-8b-8192',
      });
  
      const text = chatCompletion.choices[0]?.message?.content || "";
  
      if (!text) {
        throw new Error("Received an empty response from the Groq API.");
      }
  
      return { source: "groq-llama3", code: text.trim() };
  
    } catch (err: any) {
      console.error("Groq API call failed:", err);
      return { source: "fallback", code: generateTemplateERC20(prompt) };
    }
}


/* ----------------------- Express endpoints ------------------------ */
app.post("/build", async (req, res) => {
  try {
    const prompt = (req.body?.prompt || "").toString().trim();
    if (!prompt) return res.status(400).json({ success: false, error: "Prompt is required" });

    const result = await generateSolidityFromPrompt(prompt);
    return res.json({ success: true, source: result.source, code: result.code });
  } catch (err: any) {
    console.error("/build error:", err);
    return res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

app.post("/deploy", async (req, res) => {
  const { code, constructorArgs } = req.body;
  if (!code || typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ success: false, error: "Contract code is required" });
  }

  try {
    const agent = await getAgent();

    if (agent && typeof (agent as any).deployContract === "function") {
      const tx = await (agent as any).deployContract(code, constructorArgs || []);
      return res.json({ success: true, info: "deployed via agent.deployContract", result: tx });
    }

    if (agent && (agent as any).utils && typeof (agent as any).utils.deployContract === "function") {
      const tx = await (agent as any).utils.deployContract(code, constructorArgs || []);
      return res.json({ success: true, info: "deployed via agent.utils.deployContract", result: tx });
    }

    return res.status(501).json({
      success: false,
      error: "AgentKit present but no known deploy method. Inspect agent object.",
      agentMethods: Object.keys(agent || {}),
    });
  } catch (err: any) {
    console.error("/deploy error:", err);
    return res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

app.get("/", (_, res) => res.json({ success: true, message: "Backend alive" }));

app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));