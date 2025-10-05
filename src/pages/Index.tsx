// Your main page file (e.g., src/pages/index.tsx)

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CodeDisplay } from "@/components/CodeDisplay";
import { WalletConnect } from "@/components/WalletConnect"; // Import the component
import { Loader2, Sparkles, Code2, Rocket } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [solidityCode, setSolidityCode] = useState("");
  const [reactCode, setReactCode] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description for your dApp");
      return;
    }

    setLoading(true);
    setSolidityCode("");
    setReactCode("");
    setHasGenerated(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate code");
      }

      const data = await response.json();
      setSolidityCode(data.solidityCode);
      setReactCode(data.reactCode);
      setHasGenerated(true);
      toast.success("Code generated successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!solidityCode || !reactCode) {
        throw new Error("No code has been generated to deploy.");
    }
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deploy-code`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ solidityCode, reactCode }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Deployment failed. Check the server logs.');
    }

    const result = await response.json();
    
    toast.success("Deployment Complete!", {
        description: `Contract deployed to: ${result.contractAddress.slice(0, 6)}...${result.contractAddress.slice(-4)}`,
        action: {
            label: "View on Snowtrace",
            onClick: () => window.open(result.explorerUrl, '_blank'),
        },
    });
  };

  return (
    <div className="min-h-screen ">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="text-xl font-bold text-white">
          <span className="text-primary">Vibe</span>Coding
        </div>
        <WalletConnect 
            hasGeneratedCode={hasGenerated}
            onDeploy={handleDeploy}
        />
      </header>
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-4"
            style={{ 
              border: '1px solid currentColor',
              borderRadius: '9999px',
              borderColor: 'hsl(var(--muted-foreground)/0.5)',
            }}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">AI-Powered Development Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            <span className="text-white">Build dApps with </span>
            <span style={{ color: '#ff9933' }}>Simple</span>
            <br />
            <span style={{ 
              backgroundImage: 'linear-gradient(to bottom, #ff9933, #66ccff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
            }}>Prompts</span>
          </h1>
          
          <div className="p-4 rounded-xl bg-black/20 backdrop-blur-sm mx-auto max-w-2xl">
            <p className="text-xl text-muted-foreground font-semibold">
              VibeCoding transforms natural language into production-ready decentralized applications. 
              Get gasless dApps on Avalanche with 0xGasless integration.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <Textarea
              placeholder="Describe your dApp... (e.g., 'Create an NFT marketplace with royalty payments on Avalanche')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-32 text-lg bg-background border-input resize-none"
              disabled={loading}
            />
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Powered by AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-accent" />
                  <span>Deploy in seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  <span>Full-stack code</span>
                </div>
              </div>
              
              <Button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {hasGenerated && (
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CodeDisplay solidityCode={solidityCode} reactCode={reactCode} />
          </div>
        )}

        {!hasGenerated && (
          <div className="max-w-5xl mx-auto mt-20 grid md:grid-cols-3 gap-8">
            <div className="group text-center p-6 rounded-xl bg-black/20 backdrop-blur-sm transition-all duration-300 hover:bg-black/30 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/50 cursor-pointer">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Smart Contracts</h3>
              <p className="text-muted-foreground">
                AI-generated Solidity with 0xGasless & ERC-4337 on Avalanche
              </p>
            </div>

            <div className="group text-center p-6 rounded-xl bg-black/20 backdrop-blur-sm transition-all duration-300 hover:bg-black/30 hover:scale-[1.03] hover:shadow-2xl hover:shadow-accent/50 cursor-pointer">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Gasless Frontend</h3>
              <p className="text-muted-foreground">
                0xGasless SDK integrated UI for seamless user experience
              </p>
            </div>

            <div className="group text-center p-6 rounded-xl bg-black/20 backdrop-blur-sm transition-all duration-300 hover:bg-black/30 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/50 cursor-pointer">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Deploy to Avalanche</h3>
              <p className="text-muted-foreground">
                Production-ready code for Avalanche C-Chain deployment
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
