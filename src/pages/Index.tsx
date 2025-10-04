import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CodeDisplay } from "@/components/CodeDisplay";
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

  return (
    <div className="min-h-screen ">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">AI-Powered Development Platform</span>
          </div>
          
          <h1 className="text-5xl bg-gradient-to-r bg-clip-text md:text-7xl font-bold text-transparent from-primary to-accent">
            Build dApps with
            <br />
            Simple Prompts
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            VibeCoding transforms natural language into production-ready decentralized applications. 
            Get gasless dApps on Avalanche with 0xGasless integration.
          </p>
        </div>

        {/* Input Section */}
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

        {/* Code Display Section */}
        {hasGenerated && (
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CodeDisplay solidityCode={solidityCode} reactCode={reactCode} />
          </div>
        )}

        {/* Features Section */}
        {!hasGenerated && (
          <div className="max-w-5xl mx-auto mt-20 grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Contracts</h3>
              <p className="text-muted-foreground">
                AI-generated Solidity with 0xGasless & ERC-4337 on Avalanche
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Gasless Frontend</h3>
              <p className="text-muted-foreground">
                0xGasless SDK integrated UI for seamless user experience
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Deploy to Avalanche</h3>
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
