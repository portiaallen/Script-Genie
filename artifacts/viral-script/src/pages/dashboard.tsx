import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { UserButton, useUser } from "@clerk/react";
import { useListScripts, useDeleteScript, useGetScriptStats, useGetUserProfile } from "@workspace/api-client-react";
import {
  Zap, Plus, Trash2, Copy, Hash, TrendingUp, FileText,
  Calendar, ChevronDown, Search, Mic, BookOpen, MousePointerClick,
  Crown, CheckCircle2, Download,
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
  TikTok: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Instagram: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  YouTube: "bg-red-500/10 text-red-400 border-red-500/20",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type Script = {
  id: number; title: string; hook: string; body: string;
  callToAction: string; script: string; hashtags: string[];
  platform: string; topic: string; createdAt: string;
};

function copyText(text: string, label: string, toast: (opts: any) => void) {
  navigator.clipboard.writeText(text);
  toast({ title: `${label} copied!` });
}

async function downloadAsPdf(script: Script) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const usable = pageW - margin * 2;
  let y = margin;

  const addSection = (heading: string, text: string) => {
    if (!text) return;
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
      doc.addPage(); y = margin;
    }
    doc.text(lines, margin, y);
    y += lines.length * 14 + 18;
  };

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

  addSection("HOOK", script.hook);
  addSection("BODY", script.body);
  addSection("CALL TO ACTION", script.callToAction);
  if (script.hashtags?.length) addSection("HASHTAGS", script.hashtags.map((h) => `#${h}`).join("  "));

  doc.save(`viralscript-${script.platform.toLowerCase()}-${Date.now()}.pdf`);
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { user } = useUser();
  const { toast } = useToast();
  const [platform, setPlatform] = useState<Platform>("All");
  const [searchQ, setSearchQ] = useState("");
  const [selected, setSelected] = useState<Script | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

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

  const scripts = (data?.scripts ?? []) as Script[];
  const filtered = searchQ
    ? scripts.filter((s) =>
        s.title.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.topic.toLowerCase().includes(searchQ.toLowerCase()),
      )
    : scripts;

  const stats = statsData ?? { total: 0, byPlatform: { TikTok: 0, Instagram: 0, YouTube: 0 }, thisWeek: 0 };
  const isPro = profile?.isPro ?? false;
  const scriptsRemaining = profile?.scriptsRemaining ?? 3;
  const upgraded = new URLSearchParams(search).get("upgraded") === "1";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">ViralScript AI</span>
          </div>
          <div className="flex items-center gap-3">
            {isPro ? (
              <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 font-medium">
                <Crown className="w-3 h-3" /> Pro
              </span>
            ) : (
              <Button variant="outline" size="sm" className="gap-1.5 text-primary border-primary/30" onClick={() => setShowUpgrade(true)}>
                <Crown className="w-3.5 h-3.5" /> Upgrade
              </Button>
            )}
            <Button size="sm" onClick={() => setLocation("/generate")} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Script
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {upgraded && (
          <div className="mb-6 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm font-medium text-primary">
            <CheckCircle2 className="w-4 h-4" />
            Welcome to Pro! You now have unlimited script generation.
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold">Welcome back{user?.firstName ? `, ${user.firstName}` : ""}! 👋</h1>
          <p className="text-muted-foreground mt-1">Manage and review all your generated scripts.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><FileText className="w-4 h-4" /> Total</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Calendar className="w-4 h-4" /> This Week</div>
            <div className="text-3xl font-bold">{stats.thisWeek}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><TrendingUp className="w-4 h-4" /> By Platform</div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {Object.entries(stats.byPlatform ?? {}).map(([p, c]) => (
                <span key={p} className={`text-xs font-medium px-2 py-0.5 rounded-full border ${platformColor[p] ?? ""}`}>
                  {platformEmoji[p]} {c as number}
                </span>
              ))}
            </div>
          </div>
          <div className={`border rounded-xl p-5 ${isPro ? "bg-primary/5 border-primary/20" : "bg-card border-border"}`}>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Crown className="w-4 h-4" /> Plan</div>
            {isPro ? (
              <div className="text-sm font-semibold text-primary">Pro — Unlimited</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{scriptsRemaining}<span className="text-base text-muted-foreground font-normal"> / 3</span></div>
                <button onClick={() => setShowUpgrade(true)} className="text-xs text-primary underline mt-1">Upgrade →</button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search scripts..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="pl-9 bg-card" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-9">
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
              <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-muted rounded mb-3 w-3/4" />
                <div className="h-3 bg-muted rounded mb-2 w-1/2" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {scripts.length === 0 ? "No scripts yet" : "No results found"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {scripts.length === 0 ? "Generate your first viral script to get started." : "Try adjusting your search or filter."}
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
              <div
                key={script.id}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer group"
                onClick={() => setSelected(script)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Badge className={`text-xs font-medium border bg-transparent ${platformColor[script.platform] ?? ""}`}>
                    {platformEmoji[script.platform]} {script.platform}
                  </Badge>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 -m-1 rounded"
                    onClick={(e) => { e.stopPropagation(); deleteScript.mutate({ id: script.id }); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2">{script.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">Topic: {script.topic}</p>
                {script.hook && (
                  <p className="text-xs text-foreground/60 leading-relaxed line-clamp-2 italic">"{script.hook}"</p>
                )}
                <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatDate(script.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg leading-snug pr-6">{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-xs font-medium border bg-transparent ${platformColor[selected.platform] ?? ""}`}>
                  {platformEmoji[selected.platform]} {selected.platform}
                </Badge>
                <span className="text-xs text-muted-foreground">Topic: <span className="text-foreground">{selected.topic}</span></span>
                <span className="text-xs text-muted-foreground ml-auto">{formatDate(selected.createdAt)}</span>
              </div>

              {selected.hook && (
                <SectionBlock icon={<Mic className="w-3.5 h-3.5 text-pink-400" />} label="HOOK" color="text-pink-400" text={selected.hook}
                  onCopy={() => copyText(selected.hook, "Hook", toast)} />
              )}
              {selected.body && (
                <SectionBlock icon={<BookOpen className="w-3.5 h-3.5 text-blue-400" />} label="BODY" color="text-blue-400" text={selected.body}
                  onCopy={() => copyText(selected.body, "Body", toast)} scrollable />
              )}
              {selected.callToAction && (
                <SectionBlock icon={<MousePointerClick className="w-3.5 h-3.5 text-green-400" />} label="CALL TO ACTION" color="text-green-400"
                  text={selected.callToAction} onCopy={() => copyText(selected.callToAction, "CTA", toast)} />
              )}
              {(!selected.hook && !selected.body && !selected.callToAction && selected.script) && (
                <SectionBlock icon={<FileText className="w-3.5 h-3.5 text-muted-foreground" />} label="SCRIPT" color="text-muted-foreground"
                  text={selected.script} onCopy={() => copyText(selected.script, "Script", toast)} scrollable />
              )}

              {selected.hashtags?.length > 0 && (
                <div className="bg-background border border-border rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-2">
                    <Hash className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">Hashtags</span>
                    <button onClick={() => copyText(selected.hashtags.map((t) => `#${t}`).join(" "), "Hashtags", toast)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-auto">
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.hashtags.map((tag) => (
                      <span key={tag} className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="destructive" size="sm" className="gap-1.5"
                  onClick={() => deleteScript.mutate({ id: selected.id })}
                  disabled={deleteScript.isPending}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5"
                  onClick={async () => { await downloadAsPdf(selected); toast({ title: "PDF downloaded!" }); }}>
                  <Download className="w-3.5 h-3.5" /> PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5"
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
  icon: React.ReactNode; label: string; color: string; text: string;
  onCopy: () => void; scrollable?: boolean;
}) {
  return (
    <div className="bg-background border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">{icon}<span className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>{label}</span></div>
        <button onClick={onCopy} className="text-muted-foreground hover:text-foreground transition-colors"><Copy className="w-3.5 h-3.5" /></button>
      </div>
      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${scrollable ? "max-h-40 overflow-y-auto" : ""}`}>{text}</p>
    </div>
  );
}
