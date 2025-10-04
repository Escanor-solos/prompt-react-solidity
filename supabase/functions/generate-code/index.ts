import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Generate Solidity smart contract
    const solidityResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert Solidity developer specializing in Avalanche blockchain and ERC-4337 Account Abstraction. Generate clean, secure, well-documented Solidity smart contracts that integrate 0xGasless SDK for gasless transactions. Include SPDX license, pragma version, and comprehensive comments. Implement ERC-4337 smart wallet patterns where appropriate. Follow best practices for security and gas optimization on Avalanche C-Chain. Return ONLY the Solidity code without any markdown formatting or explanations."
          },
          {
            role: "user",
            content: `Generate a Solidity smart contract for Avalanche blockchain with 0xGasless integration for: ${prompt}. Include gasless transaction support using ERC-4337 Account Abstraction where applicable.`
          }
        ],
      }),
    });

    if (!solidityResponse.ok) {
      const errorText = await solidityResponse.text();
      console.error("Solidity AI error:", solidityResponse.status, errorText);
      throw new Error(`Solidity generation failed: ${solidityResponse.status}`);
    }

    const solidityData = await solidityResponse.json();
    const solidityCode = solidityData.choices[0].message.content;

    // Generate React frontend
    const reactResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert React and Web3 developer specializing in Avalanche blockchain and 0xGasless SDK integration. Generate modern React components using TypeScript, hooks, ethers.js v6, and 0xGasless SDK for gasless transactions. Create a clean, functional interface that interacts with the smart contract on Avalanche C-Chain. Implement Account Abstraction (ERC-4337) features using 0xGasless SDK to enable gasless transactions. Use Tailwind CSS for styling. Return ONLY the React/TypeScript code without any markdown formatting or explanations. Include necessary imports, 0xGasless SDK initialization, and proper TypeScript types. Configure for Avalanche C-Chain RPC."
          },
          {
            role: "user",
            content: `Generate a React frontend component for Avalanche blockchain that interacts with this smart contract using 0xGasless SDK for gasless transactions:\n\n${solidityCode}\n\nOriginal request: ${prompt}\n\nInclude: 0xGasless SDK setup, smart wallet creation, gasless transaction handling, and Avalanche C-Chain configuration.`
          }
        ],
      }),
    });

    if (!reactResponse.ok) {
      const errorText = await reactResponse.text();
      console.error("React AI error:", reactResponse.status, errorText);
      throw new Error(`React generation failed: ${reactResponse.status}`);
    }

    const reactData = await reactResponse.json();
    const reactCode = reactData.choices[0].message.content;

    return new Response(
      JSON.stringify({
        solidityCode,
        reactCode
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
