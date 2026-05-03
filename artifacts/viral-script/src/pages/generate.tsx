import { useState, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { UserButton } from "@clerk/react";
import { useGenerateScript, useGetUserProfile, useListScripts } from "@workspace/api-client-react";
import {
  Zap, ArrowLeft, Copy, Hash, Sparkles, LayoutDashboard,
  CheckCircle2, Download, Mic, BookOpen, MousePointerClick,
  Loader2, AlertCircle, Crown, FlaskConical, Brain, ChevronDown,
  ChevronUp, Clock, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UpgradeModal } from "@/components/upgrade-modal";

const PLATFORMS = [
  { id: "TikTok",    label: "TikTok",    emoji: "🎵", desc: "60-90s · hook-first",  color: "border-pink-500/30 bg-pink-500/5",   active: "border-pink-500 bg-pink-500/15 shadow-[0_0_16px_rgba(236,72,153,0.2)]" },
  { id: "Instagram", label: "Instagram", emoji: "📸", desc: "30-60s · Reels",        color: "border-purple-500/30 bg-purple-500/5", active: "border-purple-500 bg-purple-500/15 shadow-[0_0_16px_rgba(168,85,247,0.2)]" },
  { id: "YouTube",   label: "YouTube",   emoji: "▶️", desc: "5-10 min · SEO",        color: "border-red-500/30 bg-red-500/5",      active: "border-red-500 bg-red-500/15 shadow-[0_0_16px_rgba(239,68,68,0.2)]" },
] as const;

type Platform = "TikTok" | "Instagram" | "YouTube";

const TONES = [
  { id: "Hype",          emoji: "⚡", label: "Hype" },
  { id: "Funny",         emoji: "😂", label: "Funny" },
  { id: "Professional",  emoji: "💼", label: "Professional" },
  { id: "Aggressive",    emoji: "🔥", label: "Aggressive" },
  { id: "Inspirational", emoji: "🌟", label: "Inspirational" },
  { id: "Educational",   emoji: "📚", label: "Educational" },
  { id: "Storytelling",  emoji: "📖", label: "Storytelling" },
] as const;

type Tone = (typeof TONES)[number]["id"];

const TOPIC_SUGGESTIONS: Record<Platform, string[]> = {
  TikTok:    ["3 life hacks nobody talks about", "How I made $1000 in a week", "Morning routine that changed my life"],
  Instagram: ["My minimal home office setup",    "5-minute healthy breakfast",  "How to look great on camera"],
  YouTube:   ["Complete guide to passive income", "I tested every AI tool for 30 days", "How to start with $0"],
};

type GeneratedScript = {
  id: number; title: string; hook: string; body: string;
  callToAction: string; script: string; hookLab: string[];
  aiReasoning: string; hashtags: string[];
  platform: string; topic: string; targetAudience: string; tone: string; createdAt: string;
};

type HistoryScript = {
  id: number; title: string; platform: string; topic: string;
  hook: string; body: string; callToAction: string; script: string;
  hookLab: string[]; aiReasoning: string; hashtags: string[];
  targetAudience: string; tone: string; createdAt: string;
};

function copyText(text: string, label: string, toast: (o: any) => void) {
  navigator.clipboard.writeText(text);
  toast({ title: `✓ ${label} copied to clipboard` });
}

async function downloadAsPdf(script: GeneratedScript | HistoryScript) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48, pageW = doc.internal.pageSize.getWidth(), usable = pageW - margin * 2;
  let y = margin;
  const addSection = (heading: string, text: string) => {
    if (!text) return;
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(90, 50, 200);
    doc.text(heading, margin, y); y += 16;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(text, usable);
    if (y + lines.length * 14 > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
    doc.text(lines, margin, y); y += lines.length * 14 + 18;
  };
  doc.setFillColor(124, 58, 237); doc.rect(0, 0, pageW, 56, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(255, 255, 255);
  doc.text("ViralScript AI", margin, 36); y = 80;
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(script.title, usable);
  doc.text(titleLines, margin, y); y += titleLines.length * 20 + 4;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100, 100, 100);
  doc.text(`${script.platform} · ${script.topic} · ${new Date(script.createdAt).toLocaleDateString()}`, margin, y); y += 24;
  doc.setDrawColor(220, 220, 220); doc.line(margin, y, pageW - margin, y); y += 20;
  addSection("HOOK", script.hook);
  addSection("BODY", script.body);
  addSection("CALL TO ACTION", script.callToAction);
  if (script.hashtags?.length) addSection("HASHTAGS", script.hashtags.map((h) => `#${h}`).join("  "));
  doc.save(`viralscript-${script.platform.toLowerCase()}-${Date.now()}.pdf`);
}

const platformEmoji: Record<string, string> = { TikTok: "🎵", Instagram: "📸", YouTube: "▶️" };

export default function Generate() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();

  const [platform, setPlatform] = useState<Platform>("TikTok");
  const [topic, setTopic]       = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone]         = useState<Tone>("Hype");
  const [showUpgrade, setShowUpgrade]   = useState(false);
  const [limitError, setLimitError]     = useState<string | null>(null);
  const [showHookLab, setShowHookLab]   = useState(true);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showHistory, setShowHistory]   = useState(false);

  const { data: profile, refetch: refetchProfile } = useGetUserProfile();
  const { data: historyData } = useListScripts({ limit: 8 });
  const recentScripts = (historyData?.scripts ?? []) as HistoryScript[];

  const generateScript = useGenerateScript({
    mutation: {
      onError: (err: any) => {
        const code = err?.response?.data?.code;
        if (err?.response?.status === 402 || code === "LIMIT_REACHED") {
          setLimitError(err?.response?.data?.error ?? "Free limit reached.");
          setShowUpgrade(true); refetchProfile();
        } else {
          toast({ title: "Generation failed", description: err?.response?.data?.error ?? "Please try again.", variant: "destructive" });
        }
      },
    },
  });

  const result = generateScript.data as GeneratedScript | undefined;
  const isPending = generateScript.isPending;
  const isPro = profile?.isPro ?? false;
  const scriptsRemaining = profile?.scriptsRemaining ?? 3;
  const upgraded = new URLSearchParams(search).get("upgraded") === "1";

  const handleGenerate = () => {
    if (!topic.trim()) { toast({ title: "Please enter a topic", variant: "destructive" }); return; }
    setLimitError(null); setShowHookLab(true); setShowReasoning(false);
    generateScript.mutate({ data: { topic: topic.trim(), platform, targetAudience: audience.trim() || undefined, tone } });
  };

  const loadHistoryScript = (s: HistoryScript) => {
    setTopic(s.topic);
    setAudience(s.targetAudience ?? "");
    setTone((s.tone as Tone) ?? "Hype");
    setPlatform(s.platform as Platform);
    (generateScript as any).data = s;
    generateScript.reset();
    // Force-set by triggering a manual overwrite via mutate's cached result trick
    // Just navigate with id param so we can load it
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownloadPdf = useCallback(async () => {
    if (!result) return;
    try { await downloadAsPdf(result); toast({ title: "PDF downloaded!" }); }
    catch { toast({ title: "PDF download failed", variant: "destructive" }); }
  }, [result, toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-purple-500/6 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-white/8 sticky top-0 z-40 glass">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.5)]">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">ViralScript AI</span>
          </div>
          <div className="flex items-center gap-3">
            {isPro && (
              <span className="flex items-center gap-1 text-xs bg-primary/15 text-primary border border-primary/25 rounded-full px-2.5 py-1 font-semibold">
                <Crown className="w-3 h-3" /> Pro
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => setLocation("/guide")} className="gap-1.5 hidden sm:flex">
              <BookOpen className="w-4 h-4" /> Guide
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="gap-1.5">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 py-8">
        {upgraded && (
          <div className="mb-6 flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-xl p-4 text-sm font-medium text-primary glass">
            <CheckCircle2 className="w-4 h-4" /> Welcome to Pro! Unlimited scripts, now activated.
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-2 transition-colors" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
            <h1 className="text-2xl font-bold">Viral Strategy Studio</h1>
            <p className="text-muted-foreground text-sm mt-0.5">AI-powered scripts with Hook Lab + Strategy Reasoning</p>
          </div>
          <div className="flex items-center gap-3">
            {!isPro && (
              <div className="text-right text-sm">
                <span className="text-muted-foreground">Free scripts: </span>
                <span className={`font-bold ${scriptsRemaining === 0 ? "text-destructive" : scriptsRemaining === 1 ? "text-yellow-400" : "text-foreground"}`}>
                  {scriptsRemaining} / 3
                </span>
              </div>
            )}
            <Button variant="outline" size="sm" className="gap-1.5 glass-card border-white/10" onClick={() => setShowHistory(!showHistory)}>
              <History className="w-3.5 h-3.5" /> Recent
            </Button>
          </div>
        </div>

        {/* Recent history panel */}
        {showHistory && recentScripts.length > 0 && (
          <div className="mb-6 glass rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">Recent Scripts — click to reload</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {recentScripts.slice(0, 8).map((s) => (
                <button key={s.id} onClick={() => {
                  setTopic(s.topic); setAudience(s.targetAudience ?? "");
                  setTone((s.tone as Tone) ?? "Hype"); setPlatform(s.platform as Platform);
                  setShowHistory(false);
                  toast({ title: "Script loaded into form" });
                }}
                  className="hook-card text-left glass-card rounded-lg p-3 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base">{platformEmoji[s.platform]}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">{s.platform}</span>
                  </div>
                  <p className="text-xs font-medium line-clamp-2 leading-snug">{s.title}</p>
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6">
          {/* ── LEFT: Form ── */}
          <div className="space-y-5">
            {/* Platform */}
            <div className="glass rounded-xl p-5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">Platform</Label>
              <div className="grid grid-cols-3 gap-2.5">
                {PLATFORMS.map((p) => (
                  <button key={p.id} onClick={() => setPlatform(p.id)}
                    className={`rounded-xl p-3.5 border-2 transition-all text-left ${platform === p.id ? p.active : p.color}`}>
                    <div className="text-xl mb-1">{p.emoji}</div>
                    <div className="font-semibold text-sm">{p.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic + Audience + Tone */}
            <div className="glass rounded-xl p-5 space-y-4">
              <div>
                <Label htmlFor="topic" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Topic *</Label>
                <Input id="topic" placeholder="e.g. How I built a 100K following in 6 months"
                  value={topic} onChange={(e) => setTopic(e.target.value)}
                  className="bg-white/5 border-white/10 h-10 placeholder:text-muted-foreground/50"
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()} />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {TOPIC_SUGGESTIONS[platform].map((s) => (
                    <button key={s} onClick={() => setTopic(s)}
                      className="text-xs bg-white/5 border border-white/8 hover:border-primary/40 rounded-full px-2.5 py-1 transition-colors text-muted-foreground hover:text-foreground">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="audience" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Target Audience</Label>
                <Input id="audience" placeholder="e.g. Entrepreneurs aged 25-35, beginners to investing"
                  value={audience} onChange={(e) => setAudience(e.target.value)}
                  className="bg-white/5 border-white/10 h-10 placeholder:text-muted-foreground/50" />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 block">Tone & Style</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TONES.map((t) => (
                    <button key={t.id} onClick={() => setTone(t.id)}
                      className={`rounded-lg py-2 px-1.5 text-center border transition-all ${tone === t.id
                        ? "border-primary/60 bg-primary/15 text-foreground shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                        : "border-white/8 bg-white/3 text-muted-foreground hover:border-white/15 hover:text-foreground"}`}>
                      <div className="text-base leading-none mb-1">{t.emoji}</div>
                      <div className="text-[10px] font-medium">{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {limitError && (
              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive glass">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Free limit reached</p>
                  <p className="mt-0.5 text-destructive/80">{limitError}</p>
                  <button className="mt-2 underline font-medium" onClick={() => setShowUpgrade(true)}>Upgrade to Pro →</button>
                </div>
              </div>
            )}

            <Button
              className={`w-full h-12 text-base gap-2 ${!isPending && topic.trim() && (isPro || scriptsRemaining > 0) ? "btn-glow" : ""}`}
              onClick={handleGenerate}
              disabled={isPending || !topic.trim() || (!isPro && scriptsRemaining <= 0)}
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Crafting your strategy...</>
                : (!isPro && scriptsRemaining <= 0)
                  ? <><Crown className="w-4 h-4" /> Upgrade to Generate More</>
                  : <><Sparkles className="w-4 h-4" /> Generate Script + Hook Lab</>}
            </Button>

            {!isPro && scriptsRemaining <= 0 && !limitError && (
              <Button variant="outline" className="w-full gap-2 glass-card border-primary/30 text-primary" onClick={() => setShowUpgrade(true)}>
                <Crown className="w-4 h-4" /> Upgrade to Pro — from $9.99/mo
              </Button>
            )}
          </div>

          {/* ── RIGHT: Result ── */}
          <div>
            {!result && !isPending && (
              <div className="h-full flex items-center justify-center min-h-[420px]">
                <div className="text-center p-8 glass rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(139,92,246,0.2)]">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Your Viral Strategy Appears Here</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">Hook, Body, CTA, 5 Hook Lab variations, AI Reasoning + Hashtags</p>
                  <div className="flex gap-2 justify-center mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><FlaskConical className="w-3 h-3 text-cyan-400" /> Hook Lab</span>
                    <span className="flex items-center gap-1"><Brain className="w-3 h-3 text-violet-400" /> AI Reasoning</span>
                    <span className="flex items-center gap-1"><Download className="w-3 h-3 text-green-400" /> PDF Export</span>
                  </div>
                </div>
              </div>
            )}

            {isPending && (
              <div className="h-full flex items-center justify-center min-h-[420px]">
                <div className="text-center p-8 glass rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <h3 className="font-semibold mb-1">Building your viral strategy...</h3>
                  <p className="text-sm text-muted-foreground mb-4">GPT-4o-mini is analyzing your audience and crafting 5 hook variations</p>
                  <div className="flex justify-center gap-1.5">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {result && !isPending && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Strategy generated for {result.platform}
                </div>

                {/* Title */}
                <div className="glass-card rounded-xl p-4 border-primary/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Title</span>
                    <CopyBtn onClick={() => copyText(result.title, "Title", toast)} />
                  </div>
                  <p className="font-bold text-base leading-snug">{result.title}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Pill color="pink">{result.platform}</Pill>
                    {result.tone && <Pill color="violet">{result.tone}</Pill>}
                    {result.targetAudience && <Pill color="slate">{result.targetAudience}</Pill>}
                  </div>
                </div>

                {/* Hook */}
                <ScriptSection icon={<Mic className="w-4 h-4 text-pink-400" />} label="HOOK" accent="pink" text={result.hook} onCopy={() => copyText(result.hook, "Hook", toast)} />

                {/* Body */}
                <ScriptSection icon={<BookOpen className="w-4 h-4 text-blue-400" />} label="BODY" accent="blue" text={result.body} onCopy={() => copyText(result.body, "Body", toast)} scrollable />

                {/* CTA */}
                <ScriptSection icon={<MousePointerClick className="w-4 h-4 text-emerald-400" />} label="CALL TO ACTION" accent="green" text={result.callToAction} onCopy={() => copyText(result.callToAction, "CTA", toast)} />

                {/* Hook Lab */}
                {result.hookLab?.length > 0 && (
                  <div className="glass-card rounded-xl border-cyan-500/20 overflow-hidden">
                    <button className="w-full flex items-center justify-between p-4" onClick={() => setShowHookLab(!showHookLab)}>
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Hook Lab</span>
                        <span className="text-xs text-muted-foreground">— 5 alternate openings</span>
                      </div>
                      {showHookLab ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    {showHookLab && (
                      <div className="px-4 pb-4 space-y-2">
                        {result.hookLab.map((h, i) => (
                          <div key={i} className="hook-card flex items-start gap-3 bg-cyan-500/5 border border-cyan-500/15 rounded-lg p-3 group hover:border-cyan-500/30 transition-colors cursor-pointer"
                            onClick={() => copyText(h, `Hook ${i + 1}`, toast)}>
                            <span className="text-[10px] font-bold text-cyan-400/60 mt-0.5 w-4 flex-shrink-0">#{i + 1}</span>
                            <p className="text-sm flex-1 leading-relaxed">{h}</p>
                            <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                          </div>
                        ))}
                        <p className="text-[10px] text-muted-foreground text-center pt-1">Click any hook to copy it</p>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Reasoning */}
                {result.aiReasoning && (
                  <div className="glass-card rounded-xl border-violet-500/20 overflow-hidden">
                    <button className="w-full flex items-center justify-between p-4" onClick={() => setShowReasoning(!showReasoning)}>
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-violet-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">AI Strategy Reasoning</span>
                        <span className="text-xs text-muted-foreground">— why this will perform</span>
                      </div>
                      {showReasoning ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    {showReasoning && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-violet-500/40 pl-3">{result.aiReasoning}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Hashtags */}
                {result.hashtags?.length > 0 && (
                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-4 h-4 text-yellow-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">Hashtags</span>
                      </div>
                      <button onClick={() => copyText(result.hashtags.map((h) => `#${h}`).join(" "), "Hashtags", toast)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <Copy className="w-3.5 h-3.5" /> Copy all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.hashtags.map((tag) => (
                        <button key={tag} onClick={() => copyText(`#${tag}`, `#${tag}`, toast)}
                          className="text-xs bg-yellow-400/8 text-yellow-400 border border-yellow-400/20 rounded-full px-2.5 py-1 hover:bg-yellow-400/15 transition-colors">
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 flex-1 glass-card border-white/10" onClick={handleDownloadPdf}>
                    <Download className="w-3.5 h-3.5" /> PDF
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 flex-1 glass-card border-white/10"
                    onClick={() => copyText([
                      result.title, "",
                      "HOOK:", result.hook, "",
                      "BODY:", result.body, "",
                      "CALL TO ACTION:", result.callToAction, "",
                      "HASHTAGS:", result.hashtags.map((h) => `#${h}`).join(" "),
                    ].join("\n"), "Full script", toast)}>
                    <Copy className="w-3.5 h-3.5" /> Copy All
                  </Button>
                  <Button size="sm" className="gap-1.5 flex-1"
                    onClick={() => { generateScript.reset(); setTopic(""); setLimitError(null); }}>
                    <Sparkles className="w-3.5 h-3.5" /> New
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

function CopyBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1 rounded-md hover:bg-white/5">
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}

const accentMap: Record<string, { border: string; label: string; bg: string }> = {
  pink:  { border: "border-pink-500/20",   label: "text-pink-400",   bg: "bg-pink-500/5" },
  blue:  { border: "border-blue-500/20",   label: "text-blue-400",   bg: "bg-blue-500/5" },
  green: { border: "border-emerald-500/20", label: "text-emerald-400", bg: "bg-emerald-500/5" },
};

function ScriptSection({ icon, label, accent, text, onCopy, scrollable }: {
  icon: React.ReactNode; label: string; accent: string; text: string; onCopy: () => void; scrollable?: boolean;
}) {
  const c = accentMap[accent] ?? accentMap.blue;
  return (
    <div className={`glass-card rounded-xl p-4 ${c.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">{icon}<span className={`text-[10px] font-bold uppercase tracking-widest ${c.label}`}>{label}</span></div>
        <CopyBtn onClick={onCopy} />
      </div>
      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${scrollable ? "max-h-52 overflow-y-auto" : ""}`}>{text}</p>
    </div>
  );
}

const pillColors: Record<string, string> = {
  pink:   "bg-pink-500/10 text-pink-400 border-pink-500/20",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  slate:  "bg-white/5 text-muted-foreground border-white/10",
};

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${pillColors[color] ?? pillColors.slate}`}>
      {children}
    </span>
  );
}
