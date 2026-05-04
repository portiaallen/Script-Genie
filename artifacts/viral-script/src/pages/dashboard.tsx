import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { UserButton, useUser } from "@clerk/react";
import { useListScripts, useDeleteScript, useGetScriptStats, useGetUserProfile } from "@workspace/api-client-react";
import {
  Zap, Plus, Trash2, Copy, Hash, TrendingUp, FileText,
  Calendar, ChevronDown, Search, Mic, BookOpen, MousePointerClick,
  Crown, CheckCircle2, Download, FlaskConical, Brain, ChevronUp, Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UpgradeModal } from "@/components/upgrade-modal";

const PLATFORMS = ["All", "TikTok", "Instagram", "YouTube"] as const;
type Platform = (typeof PLATFORMS)[number];

const platformEmoji: Record<string, string> = { TikTok: "🎵", Instagram: "📸", YouTube: "▶️" };
const platformColor: Record<string, string> = {
  TikTok:    "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Instagram: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  YouTube:   "bg-red-500/10 text-red-400 border-red-500/20",
};
const toneEmoji: Record<string, string> = {
  Hype: "⚡", Funny: "😂", Professional: "💼", Aggressive: "🔥",
  Inspirational: "🌟", Educational: "📚", Storytelling: "📖",
};

const TRENDING_TOPICS = [
  "🔥 AI Productivity 2026", "💰 Side Hustles That Actually Work", "⚡ No-Code Tools",
  "🚀 Passive Income Secrets", "🎯 Morning Routines for Success", "🌍 Budget Travel Hacks",
  "🤖 AI Art Revolution", "💪 Fitness Shortcuts", "📈 Crypto Comeback",
  "🛒 Dropshipping Secrets", "🎵 TikTok Algorithm Exposed", "💡 Business Ideas 2026",
  "🧠 Brain Hacks for Focus", "📱 Social Media Growth", "🎬 YouTube Shorts Strategy",
];

function TrendingTicker() {
  const doubled = [...TRENDING_TOPICS, ...TRENDING_TOPICS];
  return (
    <div className="glass border-b border-white/8 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Trending</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-track">
            {doubled.map((topic, i) => (
              <span key={i} className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground cursor-default transition-colors px-4 border-r border-white/8 last:border-0">
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type Script = {
  id: number; title: string; hook: string; body: string;
  callToAction: string; script: string; hookLab: string[];
  aiReasoning: string; hashtags: string[];
  platform: string; topic: string; targetAudience: string; tone: string; createdAt: string;
};

function copyText(text: string, label: string, toast: (o: any) => void) {
  navigator.clipboard.writeText(text);
  toast({ title: `✓ ${label} copied to clipboard` });
}

async function downloadAsPdf(script: Script) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48, pageW = doc.internal.pageSize.getWidth(), usable = pageW - margin * 2;
  let y = margin;
  const addSect = (h: string, t: string) => {
    if (!t) return;
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(90, 50, 200);
    doc.text(h, margin, y); y += 16;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(t, usable);
    if (y + lines.length * 14 > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
    doc.text(lines, margin, y); y += lines.length * 14 + 18;
  };
  doc.setFillColor(124, 58, 237); doc.rect(0, 0, pageW, 56, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(255, 255, 255);
  doc.text("ViralScript AI", margin, 36); y = 80;
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(20, 20, 20);
  const tl = doc.splitTextToSize(script.title, usable); doc.text(tl, margin, y); y += tl.length * 20 + 4;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100, 100, 100);
  doc.text(`${script.platform} · ${script.topic} · ${new Date(script.createdAt).toLocaleDateString()}`, margin, y); y += 24;
  doc.setDrawColor(220, 220, 220); doc.line(margin, y, pageW - margin, y); y += 20;
  addSect("HOOK", script.hook); addSect("BODY", script.body); addSect("CALL TO ACTION", script.callToAction);
  if (script.hashtags?.length) addSect("HASHTAGS", script.hashtags.map((h) => `#${h}`).join("  "));
  doc.save(`viralscript-${script.platform.toLowerCase()}-${Date.now()}.pdf`);
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { user } = useUser();
  const { toast } = useToast();
  const [platform, setPlatform]         = useState<Platform>("All");
  const [searchQ, setSearchQ]           = useState("");
  const [selected, setSelected]         = useState<Script | null>(null);
  const [showUpgrade, setShowUpgrade]   = useState(false);
  const [showHookLab, setShowHookLab]   = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  const { data: profile } = useGetUserProfile();
  const { data, isLoading, refetch } = useListScripts(
    platform !== "All" ? { platform: platform as "TikTok" | "Instagram" | "YouTube" } : undefined,
  );
  const { data: statsData } = useGetScriptStats();

  const deleteScript = useDeleteScript({
    mutation: {
      onSuccess: () => { refetch(); toast({ title: "Script deleted" }); setSelected(null); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    },
  });

  // Reset hook lab / reasoning when selected script changes
  useEffect(() => { setShowHookLab(false); setShowReasoning(false); }, [selected?.id]);

  const scripts = (data?.scripts ?? []) as Script[];
  const filtered = searchQ
    ? scripts.filter((s) => s.title.toLowerCase().includes(searchQ.toLowerCase()) || s.topic.toLowerCase().includes(searchQ.toLowerCase()))
    : scripts;

  const stats = statsData ?? { total: 0, byPlatform: { TikTok: 0, Instagram: 0, YouTube: 0 }, thisWeek: 0 };
  const isPro = profile?.isPro ?? false;
  const scriptsRemaining = profile?.scriptsRemaining ?? 3;
  const upgraded = new URLSearchParams(search).get("upgraded") === "1";

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -right-60 w-[500px] h-[500px] bg-primary/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/4 rounded-full blur-3xl" />
      </div>

      {/* Trending ticker */}
      <TrendingTicker />

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
            {isPro ? (
              <span className="flex items-center gap-1 text-xs bg-primary/15 text-primary border border-primary/25 rounded-full px-2.5 py-1 font-semibold">
                <Crown className="w-3 h-3" /> Pro
              </span>
            ) : (
              <Button variant="outline" size="sm" className="gap-1.5 text-primary border-primary/30 glass-card" onClick={() => setShowUpgrade(true)}>
                <Crown className="w-3.5 h-3.5" /> Upgrade
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setLocation("/guide")} className="gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Guide
            </Button>
            <Button size="sm" onClick={() => setLocation("/generate")} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Script
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 py-8">
        {upgraded && (
          <div className="mb-6 flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-xl p-4 text-sm font-medium text-primary glass">
            <CheckCircle2 className="w-4 h-4" /> Welcome to Pro! Unlimited scripts now activated.
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold">Welcome back{user?.firstName ? `, ${user.firstName}` : ""}! 👋</h1>
          <p className="text-muted-foreground mt-1 text-sm">Your viral content command center.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2 uppercase tracking-wider font-semibold">
              <FileText className="w-3.5 h-3.5" /> Total Scripts
            </div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2 uppercase tracking-wider font-semibold">
              <Calendar className="w-3.5 h-3.5" /> This Week
            </div>
            <div className="text-3xl font-bold">{stats.thisWeek}</div>
          </div>
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2 uppercase tracking-wider font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> By Platform
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {Object.entries(stats.byPlatform ?? {}).map(([p, c]) => (
                <span key={p} className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${platformColor[p] ?? ""}`}>
                  {platformEmoji[p]} {c as number}
                </span>
              ))}
            </div>
          </div>
          <div className={`glass-card rounded-xl p-5 ${isPro ? "border-primary/25" : ""}`}>
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2 uppercase tracking-wider font-semibold">
              <Crown className="w-3.5 h-3.5" /> Plan
            </div>
            {isPro ? (
              <div className="text-sm font-bold text-primary">Pro — Unlimited ✓</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{scriptsRemaining}<span className="text-base text-muted-foreground font-normal"> / 3 free</span></div>
                <button onClick={() => setShowUpgrade(true)} className="text-xs text-primary underline mt-1 font-medium">Upgrade →</button>
              </>
            )}
          </div>
        </div>

        {/* Guide banner */}
        <div className="mb-8 flex items-center justify-between gap-4 bg-gradient-to-r from-primary/10 to-purple-600/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold">Creator Guide</div>
              <div className="text-xs text-muted-foreground">How to film, deliver, and post your scripts — plus recommended tools.</div>
            </div>
          </div>
          <Button size="sm" variant="outline" className="border-primary/30 text-primary flex-shrink-0 gap-1.5" onClick={() => setLocation("/guide")}>
            <BookOpen className="w-3.5 h-3.5" /> Read Guide
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search scripts..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="pl-9 glass-card border-white/10 bg-transparent" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-9 glass-card border-white/10">
                {platform === "All" ? "All Platforms" : `${platformEmoji[platform]} ${platform}`}
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {PLATFORMS.map((p) => (
                <DropdownMenuItem key={p} onClick={() => setPlatform(p)}>
                  {p === "All" ? "All Platforms" : `${platformEmoji[p]} ${p}`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => setLocation("/generate")} className="gap-1.5 h-9 sm:ml-auto">
            <Plus className="w-3.5 h-3.5" /> Generate New
          </Button>
        </div>

        {/* Script grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
                <div className="h-3 bg-white/8 rounded mb-3 w-1/3" />
                <div className="h-4 bg-white/8 rounded mb-2 w-3/4" />
                <div className="h-3 bg-white/5 rounded w-full mb-1" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(139,92,246,0.15)]">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{scripts.length === 0 ? "No scripts yet" : "No results"}</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {scripts.length === 0 ? "Generate your first viral script to get started." : "Try a different search or platform."}
            </p>
            {scripts.length === 0 && (
              <Button onClick={() => setLocation("/generate")} className="gap-1.5">
                <Plus className="w-4 h-4" /> Generate Your First Script
              </Button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((script) => (
              <div key={script.id}
                className="glass-card rounded-xl p-5 cursor-pointer group relative"
                onClick={() => setSelected(script)}>
                {/* Platform + tone badges */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`text-xs font-semibold border bg-transparent ${platformColor[script.platform] ?? ""}`}>
                    {platformEmoji[script.platform]} {script.platform}
                  </Badge>
                  {script.tone && (
                    <span className="text-[10px] text-muted-foreground">
                      {toneEmoji[script.tone] ?? ""} {script.tone}
                    </span>
                  )}
                  <button
                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 -m-1 rounded"
                    onClick={(e) => { e.stopPropagation(); deleteScript.mutate({ id: script.id }); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-semibold text-sm leading-snug mb-1.5 line-clamp-2">{script.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">📌 {script.topic}</p>

                {script.hook && (
                  <p className="text-xs text-foreground/55 leading-relaxed line-clamp-2 italic mb-3">"{script.hook}"</p>
                )}

                {/* Indicators */}
                <div className="flex items-center gap-2 mt-auto">
                  {script.hookLab?.length > 0 && (
                    <span className="text-[10px] flex items-center gap-0.5 text-cyan-400/70">
                      <FlaskConical className="w-2.5 h-2.5" /> Hook Lab
                    </span>
                  )}
                  {script.aiReasoning && (
                    <span className="text-[10px] flex items-center gap-0.5 text-violet-400/70">
                      <Brain className="w-2.5 h-2.5" /> AI Insight
                    </span>
                  )}
                  <div className="flex items-center gap-1 ml-auto text-[10px] text-muted-foreground">
                    <Calendar className="w-2.5 h-2.5" /> {formatDate(script.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto glass-strong border-white/12">
          <DialogHeader>
            <DialogTitle className="text-lg leading-snug pr-6">{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-xs font-semibold border bg-transparent ${platformColor[selected.platform] ?? ""}`}>
                  {platformEmoji[selected.platform]} {selected.platform}
                </Badge>
                {selected.tone && <span className="text-xs text-muted-foreground">{toneEmoji[selected.tone]} {selected.tone}</span>}
                {selected.targetAudience && <span className="text-xs text-muted-foreground">👥 {selected.targetAudience}</span>}
                <span className="text-xs text-muted-foreground ml-auto">{formatDate(selected.createdAt)}</span>
              </div>
              <p className="text-xs text-muted-foreground">📌 {selected.topic}</p>

              {selected.hook && <SectionBlock icon={<Mic className="w-3.5 h-3.5 text-pink-400" />} label="HOOK" color="text-pink-400" text={selected.hook} onCopy={() => copyText(selected.hook, "Hook", toast)} />}
              {selected.body && <SectionBlock icon={<BookOpen className="w-3.5 h-3.5 text-blue-400" />} label="BODY" color="text-blue-400" text={selected.body} onCopy={() => copyText(selected.body, "Body", toast)} scrollable />}
              {selected.callToAction && <SectionBlock icon={<MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />} label="CALL TO ACTION" color="text-emerald-400" text={selected.callToAction} onCopy={() => copyText(selected.callToAction, "CTA", toast)} />}
              {(!selected.hook && !selected.body && !selected.callToAction && selected.script) && (
                <SectionBlock icon={<FileText className="w-3.5 h-3.5 text-muted-foreground" />} label="SCRIPT" color="text-muted-foreground" text={selected.script} onCopy={() => copyText(selected.script, "Script", toast)} scrollable />
              )}

              {/* Hook Lab */}
              {selected.hookLab?.length > 0 && (
                <div className="glass-card rounded-xl border-cyan-500/20 overflow-hidden">
                  <button className="w-full flex items-center justify-between p-3" onClick={() => setShowHookLab(!showHookLab)}>
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Hook Lab</span>
                      <span className="text-xs text-muted-foreground">({selected.hookLab.length} hooks)</span>
                    </div>
                    {showHookLab ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {showHookLab && (
                    <div className="px-3 pb-3 space-y-1.5">
                      {selected.hookLab.map((h, i) => (
                        <div key={i} className="hook-card flex items-start gap-2 bg-cyan-500/5 border border-cyan-500/15 rounded-lg p-2.5 cursor-pointer hover:border-cyan-500/30"
                          onClick={() => copyText(h, `Hook ${i + 1}`, toast)}>
                          <span className="text-[10px] text-cyan-400/60 font-bold mt-0.5">#{i + 1}</span>
                          <p className="text-xs flex-1">{h}</p>
                          <Copy className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AI Reasoning */}
              {selected.aiReasoning && (
                <div className="glass-card rounded-xl border-violet-500/20 overflow-hidden">
                  <button className="w-full flex items-center justify-between p-3" onClick={() => setShowReasoning(!showReasoning)}>
                    <div className="flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">AI Strategy Reasoning</span>
                    </div>
                    {showReasoning ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {showReasoning && (
                    <div className="px-3 pb-3">
                      <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-violet-500/40 pl-3">{selected.aiReasoning}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Hashtags */}
              {selected.hashtags?.length > 0 && (
                <div className="glass-card rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-2">
                    <Hash className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">Hashtags</span>
                    <button onClick={() => copyText(selected.hashtags.map((t) => `#${t}`).join(" "), "Hashtags", toast)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-auto">
                      <Copy className="w-3 h-3" /> Copy all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.hashtags.map((tag) => (
                      <span key={tag} onClick={() => copyText(`#${tag}`, `#${tag}`, toast)}
                        className="text-xs bg-primary/8 text-primary border border-primary/20 rounded-full px-2 py-0.5 cursor-pointer hover:bg-primary/15 transition-colors">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="destructive" size="sm" className="gap-1.5"
                  onClick={() => deleteScript.mutate({ id: selected.id })} disabled={deleteScript.isPending}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 glass-card border-white/10"
                  onClick={async () => { await downloadAsPdf(selected); toast({ title: "PDF downloaded!" }); }}>
                  <Download className="w-3.5 h-3.5" /> PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 glass-card border-white/10"
                  onClick={() => copyText([
                    selected.title, "",
                    selected.hook ? `HOOK:\n${selected.hook}` : "",
                    selected.body ? `\nBODY:\n${selected.body}` : "",
                    selected.callToAction ? `\nCALL TO ACTION:\n${selected.callToAction}` : "",
                    selected.hashtags?.length ? `\nHASHTAGS:\n${selected.hashtags.map((h) => `#${h}`).join(" ")}` : "",
                  ].filter(Boolean).join("\n"), "Script", toast)}>
                  <Copy className="w-3.5 h-3.5" /> Copy All
                </Button>
                <Button size="sm" className="gap-1.5 ml-auto" onClick={() => setLocation("/generate")}>
                  <Plus className="w-3.5 h-3.5" /> New Script
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}

function SectionBlock({ icon, label, color, text, onCopy, scrollable }: {
  icon: React.ReactNode; label: string; color: string; text: string; onCopy: () => void; scrollable?: boolean;
}) {
  return (
    <div className="glass-card rounded-lg p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">{icon}<span className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>{label}</span></div>
        <button onClick={onCopy} className="text-muted-foreground hover:text-foreground transition-colors"><Copy className="w-3.5 h-3.5" /></button>
      </div>
      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${scrollable ? "max-h-40 overflow-y-auto" : ""}`}>{text}</p>
    </div>
  );
}
