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
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Generate Solidity smart contract
    const reactResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        // NOTE: Replace LOVABLE_API_KEY with your OPENAI_API_KEY
        Authorization: `Bearer ${OPENAI_API_KEY}`, 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // MODIFIED: Changed model to a current, high-performing OpenAI model
        model: "gpt-4o", 
        messages: [
          {
            role: "system",
            content: "You are an expert Solidity developer for the Avalanche C-Chain. Your task is to generate a secure and gas-efficient smart contract based on the user's request. Use Solidity version 0.8.20 or newer. Return ONLY the Solidity code without any markdown formatting or explanations."
          },
          {
            role: "user",
            content: `Generate a Solidity smart contract for the following request: ${prompt}`
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
    const reactResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
       messages: [
          {
            role: "system",
            content: "You are an expert React and Web3 developer. Generate a modern React component using TypeScript, hooks, and ethers.js v6 that interacts with a given smart contract on the Avalanche C-Chain. Use Tailwind CSS for styling. Return ONLY the React/TypeScript code without any markdown formatting or explanations. Ensure the contract address is a placeholder variable."
          },
          {
            role: "user",
            content: `Generate a React frontend component for the Avalanche blockchain that interacts with this smart contract:\n\n${solidityCode}\n\nOriginal request: ${prompt}`
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
