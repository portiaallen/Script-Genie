import { useState } from "react";
import { useLocation } from "wouter";
import { UserButton } from "@clerk/react";
import { useGenerateScript } from "@workspace/api-client-react";
import {
  Zap,
  ArrowLeft,
  Copy,
  Hash,
  Sparkles,
  LayoutDashboard,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const PLATFORMS = [
  {
    id: "TikTok",
    label: "TikTok",
    emoji: "🎵",
    desc: "60-90s, hook-first, high energy",
    color: "border-pink-500/40 bg-pink-500/5",
    activeColor: "border-pink-500 bg-pink-500/15",
  },
  {
    id: "Instagram",
    label: "Instagram",
    emoji: "📸",
    desc: "30-60s, polished Reels",
    color: "border-purple-500/40 bg-purple-500/5",
    activeColor: "border-purple-500 bg-purple-500/15",
  },
  {
    id: "YouTube",
    label: "YouTube",
    emoji: "▶️",
    desc: "5-10 min, SEO-friendly",
    color: "border-red-500/40 bg-red-500/5",
    activeColor: "border-red-500 bg-red-500/15",
  },
] as const;

type Platform = "TikTok" | "Instagram" | "YouTube";

const TOPIC_SUGGESTIONS: Record<Platform, string[]> = {
  TikTok: [
    "3 life hacks nobody talks about",
    "How I made $1000 in a week",
    "Foods you should never eat",
    "Morning routine that changed my life",
  ],
  Instagram: [
    "My minimal home office setup",
    "5-minute healthy breakfast ideas",
    "How to look good on camera",
    "Travel hacks for 2026",
  ],
  YouTube: [
    "The complete guide to passive income",
    "I tried every productivity app for 30 days",
    "How to start a business with $0",
    "The truth about intermittent fasting",
  ],
};

export default function Generate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [platform, setPlatform] = useState<Platform>("TikTok");
  const [topic, setTopic] = useState("");

  const generateScript = useGenerateScript({
    mutation: {
      onError: () => {
        toast({
          title: "Generation failed",
          description: "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const result = generateScript.data;
  const isPending = generateScript.isPending;

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast({ title: "Please enter a topic", variant: "destructive" });
      return;
    }
    generateScript.mutate({ data: { topic: topic.trim(), platform } });
  };

  const copyScript = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.script);
    toast({ title: "Script copied to clipboard!" });
  };

  const copyHashtags = () => {
    if (!result) return;
    const tags = result.hashtags.map((t) => `#${t}`).join(" ");
    navigator.clipboard.writeText(tags);
    toast({ title: "Hashtags copied!" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setLocation("/")}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">ViralScript AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/dashboard")}
              className="gap-1.5"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <button
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm mb-4"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold mb-2">Generate a Viral Script</h1>
          <p className="text-muted-foreground">
            Pick a platform, describe your topic, and let AI do the heavy lifting.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-7">
            {/* Platform */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Choose Platform</Label>
              <div className="grid grid-cols-3 gap-3">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`rounded-xl p-4 border-2 transition-all text-left ${
                      platform === p.id ? p.activeColor : p.color
                    }`}
                  >
                    <div className="text-2xl mb-1">{p.emoji}</div>
                    <div className="font-semibold text-sm">{p.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div>
              <Label htmlFor="topic" className="text-sm font-semibold mb-2 block">
                What's your script about?
              </Label>
              <Input
                id="topic"
                placeholder="e.g. How I built a 100K following in 6 months"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-card h-11"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Be specific for better results
              </p>

              {/* Suggestions */}
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2 font-medium">
                  Try these ideas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {TOPIC_SUGGESTIONS[platform].map((s) => (
                    <button
                      key={s}
                      onClick={() => setTopic(s)}
                      className="text-xs bg-card border border-border hover:border-primary/40 rounded-full px-3 py-1.5 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              className="w-full h-12 text-base gap-2"
              onClick={handleGenerate}
              disabled={isPending || !topic.trim()}
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating your script...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Script
                </>
              )}
            </Button>
          </div>

          {/* Result */}
          <div>
            {!result && !isPending && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Your script will appear here</h3>
                  <p className="text-sm text-muted-foreground">
                    Fill in a topic and hit Generate to create your viral script.
                  </p>
                </div>
              </div>
            )}

            {isPending && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 relative">
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <h3 className="font-semibold mb-2">Crafting your script...</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI is analyzing what makes {platform} content go viral.
                  </p>
                  <div className="flex justify-center gap-1 mt-4">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: `${d}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {result && !isPending && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Script generated successfully!
                </div>

                {/* Title */}
                <div className="bg-card border border-primary/20 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Title
                  </h3>
                  <p className="font-semibold text-base leading-snug">{result.title}</p>
                </div>

                {/* Script */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Script
                    </h3>
                    <button
                      onClick={copyScript}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono text-foreground/90 max-h-52 overflow-y-auto">
                    {result.script}
                  </div>
                </div>

                {/* Hashtags */}
                {result.hashtags?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Hashtags
                      </h3>
                      <button
                        onClick={copyHashtags}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 flex-1"
                    onClick={() => setLocation("/dashboard")}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" /> View All Scripts
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 flex-1"
                    onClick={() => {
                      generateScript.reset();
                      setTopic("");
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generate Another
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
