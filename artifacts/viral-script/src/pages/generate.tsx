import { useState, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { UserButton } from "@clerk/react";
import { useGenerateScript, useGetUserProfile } from "@workspace/api-client-react";
import {
  Zap, ArrowLeft, Copy, Hash, Sparkles, LayoutDashboard,
  CheckCircle2, Download, Mic, BookOpen, MousePointerClick,
  Loader2, AlertCircle, Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UpgradeModal } from "@/components/upgrade-modal";

const PLATFORMS = [
  { id: "TikTok", label: "TikTok", emoji: "🎵", desc: "60-90s, hook-first, high energy",
    color: "border-pink-500/40 bg-pink-500/5", activeColor: "border-pink-500 bg-pink-500/15" },
  { id: "Instagram", label: "Instagram", emoji: "📸", desc: "30-60s, polished Reels",
    color: "border-purple-500/40 bg-purple-500/5", activeColor: "border-purple-500 bg-purple-500/15" },
  { id: "YouTube", label: "YouTube", emoji: "▶️", desc: "5-10 min, SEO-friendly",
    color: "border-red-500/40 bg-red-500/5", activeColor: "border-red-500 bg-red-500/15" },
] as const;

type Platform = "TikTok" | "Instagram" | "YouTube";

const TOPIC_SUGGESTIONS: Record<Platform, string[]> = {
  TikTok: ["3 life hacks nobody talks about", "How I made $1000 in a week",
    "Foods you should never eat", "Morning routine that changed my life"],
  Instagram: ["My minimal home office setup", "5-minute healthy breakfast ideas",
    "How to look good on camera", "Travel hacks for 2026"],
  YouTube: ["The complete guide to passive income", "I tried every productivity app for 30 days",
    "How to start a business with $0", "The truth about intermittent fasting"],
};

type GeneratedScript = {
  id: number; title: string; hook: string; body: string;
  callToAction: string; script: string; hashtags: string[];
  platform: string; topic: string; createdAt: string;
};

function copyText(text: string, label: string, toast: (opts: any) => void) {
  navigator.clipboard.writeText(text);
  toast({ title: `${label} copied!` });
}

async function downloadAsPdf(script: GeneratedScript) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const usable = pageW - margin * 2;
  let y = margin;

  const addSection = (heading: string, text: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(90, 50, 200);
    doc.text(heading, margin, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(text, usable);
    if (y + lines.length * 14 > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin, y);
    y += lines.length * 14 + 18;
  };

  // Title bar
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, pageW, 56, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("ViralScript AI", margin, 36);
  y = 80;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(script.title, usable);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 20 + 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Platform: ${script.platform}  |  Topic: ${script.topic}  |  ${new Date(script.createdAt).toLocaleDateString()}`, margin, y);
  y += 24;

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 20;

  if (script.hook) addSection("HOOK", script.hook);
  if (script.body) addSection("BODY", script.body);
  if (script.callToAction) addSection("CALL TO ACTION", script.callToAction);
  if (script.hashtags?.length) {
    addSection("HASHTAGS", script.hashtags.map((h) => `#${h}`).join("  "));
  }

  doc.save(`viralscript-${script.platform.toLowerCase()}-${Date.now()}.pdf`);
}

export default function Generate() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [platform, setPlatform] = useState<Platform>("TikTok");
  const [topic, setTopic] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  const { data: profile, refetch: refetchProfile } = useGetUserProfile();

  const generateScript = useGenerateScript({
    mutation: {
      onError: (err: any) => {
        const status = err?.response?.status;
        const code = err?.response?.data?.code;
        if (status === 402 || code === "LIMIT_REACHED") {
          setLimitError(err?.response?.data?.error ?? "Free limit reached.");
          setShowUpgrade(true);
          refetchProfile();
        } else {
          toast({
            title: "Generation failed",
            description: err?.response?.data?.error ?? "Please try again.",
            variant: "destructive",
          });
        }
      },
    },
  });

  const result = generateScript.data as GeneratedScript | undefined;
  const isPending = generateScript.isPending;
  const isPro = profile?.isPro ?? false;
  const scriptsRemaining = profile?.scriptsRemaining ?? 3;

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast({ title: "Please enter a topic", variant: "destructive" });
      return;
    }
    setLimitError(null);
    generateScript.mutate({ data: { topic: topic.trim(), platform } });
  };

  const handleDownloadPdf = useCallback(async () => {
    if (!result) return;
    try {
      await downloadAsPdf(result);
      toast({ title: "PDF downloaded!" });
    } catch {
      toast({ title: "PDF download failed", variant: "destructive" });
    }
  }, [result, toast]);

  // Check for ?upgraded=1 in URL
  const upgraded = new URLSearchParams(search).get("upgraded") === "1";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">ViralScript AI</span>
          </div>
          <div className="flex items-center gap-3">
            {isPro && (
              <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 font-medium">
                <Crown className="w-3 h-3" /> Pro
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="gap-1.5">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {upgraded && (
          <div className="mb-6 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm font-medium text-primary">
            <CheckCircle2 className="w-4 h-4" />
            Welcome to Pro! You now have unlimited script generation.
          </div>
        )}

        <div className="mb-8">
          <button
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm mb-4"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Generate a Viral Script</h1>
              <p className="text-muted-foreground">Pick a platform, enter a topic, and let AI do the work.</p>
            </div>
            {!isPro && (
              <div className="text-right text-sm">
                <span className="text-muted-foreground">Free scripts left: </span>
                <span className={`font-bold ${scriptsRemaining === 0 ? "text-destructive" : scriptsRemaining === 1 ? "text-yellow-400" : "text-foreground"}`}>
                  {scriptsRemaining} / 3
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-7">
            <div>
              <Label className="text-sm font-semibold mb-3 block">Choose Platform</Label>
              <div className="grid grid-cols-3 gap-3">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`rounded-xl p-4 border-2 transition-all text-left ${platform === p.id ? p.activeColor : p.color}`}
                  >
                    <div className="text-2xl mb-1">{p.emoji}</div>
                    <div className="font-semibold text-sm">{p.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

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
              <div className="flex flex-wrap gap-2 mt-3">
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

            {limitError && (
              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Free limit reached</p>
                  <p className="mt-0.5">{limitError}</p>
                  <button
                    className="mt-2 underline font-medium"
                    onClick={() => setShowUpgrade(true)}
                  >
                    Upgrade to Pro →
                  </button>
                </div>
              </div>
            )}

            <Button
              className="w-full h-12 text-base gap-2"
              onClick={handleGenerate}
              disabled={isPending || !topic.trim() || (!isPro && scriptsRemaining <= 0)}
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating your script...</>
              ) : (!isPro && scriptsRemaining <= 0) ? (
                <><Crown className="w-4 h-4" /> Upgrade to Generate More</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Script</>
              )}
            </Button>

            {!isPro && scriptsRemaining <= 0 && !limitError && (
              <Button variant="outline" className="w-full gap-2" onClick={() => setShowUpgrade(true)}>
                <Crown className="w-4 h-4 text-primary" /> Upgrade to Pro — from $9.99/mo
              </Button>
            )}
          </div>

          {/* Result */}
          <div>
            {!result && !isPending && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Your structured script will appear here</h3>
                  <p className="text-sm text-muted-foreground">Hook, Body, Call to Action, and Hashtags — all separated for easy editing.</p>
                </div>
              </div>
            )}

            {isPending && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <h3 className="font-semibold mb-2">Crafting your script...</h3>
                  <p className="text-sm text-muted-foreground">Acting as your viral content strategist.</p>
                  <div className="flex justify-center gap-1 mt-4">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {result && !isPending && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                  <CheckCircle2 className="w-4 h-4" /> Script generated!
                </div>

                {/* Title */}
                <div className="bg-card border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Title</span>
                    <button onClick={() => copyText(result.title, "Title", toast)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="font-bold text-base leading-snug">{result.title}</p>
                </div>

                {/* Hook */}
                <ScriptSection icon={<Mic className="w-4 h-4 text-pink-400" />} label="HOOK" color="pink" text={result.hook} onCopy={() => copyText(result.hook, "Hook", toast)} />

                {/* Body */}
                <ScriptSection icon={<BookOpen className="w-4 h-4 text-blue-400" />} label="BODY" color="blue" text={result.body} onCopy={() => copyText(result.body, "Body", toast)} scrollable />

                {/* CTA */}
                <ScriptSection icon={<MousePointerClick className="w-4 h-4 text-green-400" />} label="CALL TO ACTION" color="green" text={result.callToAction} onCopy={() => copyText(result.callToAction, "Call to action", toast)} />

                {/* Hashtags */}
                {result.hashtags?.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-4 h-4 text-yellow-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">Hashtags</span>
                      </div>
                      <button
                        onClick={() => copyText(result.hashtags.map((h) => `#${h}`).join(" "), "Hashtags", toast)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.hashtags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => copyText(`#${tag}`, `#${tag}`, toast)}
                          className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-full px-2.5 py-1 hover:bg-yellow-400/20 transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={handleDownloadPdf}>
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 flex-1"
                    onClick={() => copyText([
                      result.title, "",
                      "HOOK:", result.hook, "",
                      "BODY:", result.body, "",
                      "CALL TO ACTION:", result.callToAction, "",
                      "HASHTAGS:", result.hashtags.map((h) => `#${h}`).join(" "),
                    ].join("\n"), "Full script", toast)}
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy All
                  </Button>
                  <Button size="sm" className="gap-1.5 flex-1"
                    onClick={() => { generateScript.reset(); setTopic(""); setLimitError(null); }}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> New Script
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}

const colorMap: Record<string, { border: string; label: string; bg: string }> = {
  pink: { border: "border-pink-500/20", label: "text-pink-400", bg: "bg-pink-500/5" },
  blue: { border: "border-blue-500/20", label: "text-blue-400", bg: "bg-blue-500/5" },
  green: { border: "border-green-500/20", label: "text-green-400", bg: "bg-green-500/5" },
};

function ScriptSection({
  icon, label, color, text, onCopy, scrollable,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  text: string;
  onCopy: () => void;
  scrollable?: boolean;
}) {
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <div className={`bg-card border ${c.border} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className={`text-[10px] font-bold uppercase tracking-widest ${c.label}`}>{label}</span>
        </div>
        <button onClick={onCopy} className="text-muted-foreground hover:text-foreground transition-colors">
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${scrollable ? "max-h-48 overflow-y-auto" : ""}`}>
        {text}
      </p>
    </div>
  );
}
