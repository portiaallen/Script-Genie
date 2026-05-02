import { useState } from "react";
import { useLocation } from "wouter";
import { UserButton, useUser } from "@clerk/react";
import { useListScripts, useDeleteScript, useGetScriptStats } from "@workspace/api-client-react";
import {
  Zap,
  Plus,
  Trash2,
  Copy,
  Hash,
  TrendingUp,
  FileText,
  Calendar,
  ChevronDown,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const PLATFORMS = ["All", "TikTok", "Instagram", "YouTube"] as const;
type Platform = (typeof PLATFORMS)[number];

const platformEmoji: Record<string, string> = {
  TikTok: "🎵",
  Instagram: "📸",
  YouTube: "▶️",
};

const platformColor: Record<string, string> = {
  TikTok: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Instagram: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  YouTube: "bg-red-500/10 text-red-400 border-red-500/20",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const [platform, setPlatform] = useState<Platform>("All");
  const [search, setSearch] = useState("");
  const [selectedScript, setSelectedScript] = useState<null | {
    id: number;
    title: string;
    script: string;
    hashtags: string[];
    platform: string;
    topic: string;
    createdAt: string;
  }>(null);

  const { data, isLoading, refetch } = useListScripts(
    platform !== "All" ? { platform: platform as "TikTok" | "Instagram" | "YouTube" } : undefined
  );

  const { data: statsData } = useGetScriptStats();

  const deleteScript = useDeleteScript({
    mutation: {
      onSuccess: () => {
        refetch();
        toast({ title: "Script deleted" });
        setSelectedScript(null);
      },
      onError: () => {
        toast({ title: "Failed to delete script", variant: "destructive" });
      },
    },
  });

  const scripts = data?.scripts ?? [];
  const filtered = search
    ? scripts.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.topic.toLowerCase().includes(search.toLowerCase()),
      )
    : scripts;

  const stats = statsData ?? { total: 0, byPlatform: {}, thisWeek: 0 };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
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
            <Button size="sm" onClick={() => setLocation("/generate")} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              New Script
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and review all your generated scripts.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <FileText className="w-4 h-4" /> Total Scripts
            </div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="w-4 h-4" /> This Week
            </div>
            <div className="text-3xl font-bold">{stats.thisWeek}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <TrendingUp className="w-4 h-4" /> By Platform
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byPlatform ?? {}).map(([p, c]) => (
                <span key={p} className={`text-xs font-medium px-2 py-0.5 rounded-full border ${platformColor[p] ?? ""}`}>
                  {platformEmoji[p]} {p}: {c as number}
                </span>
              ))}
              {Object.keys(stats.byPlatform ?? {}).length === 0 && (
                <span className="text-muted-foreground text-sm">No data yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search scripts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
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

        {/* Script List */}
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
              {scripts.length === 0
                ? "Generate your first viral script to get started."
                : "Try adjusting your search or filter."}
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
                onClick={() => setSelectedScript(script as typeof selectedScript)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Badge
                    className={`text-xs font-medium border ${platformColor[script.platform] ?? ""} bg-transparent`}
                  >
                    {platformEmoji[script.platform]} {script.platform}
                  </Badge>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 -m-1 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteScript.mutate({ id: script.id });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2">
                  {script.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">Topic: {script.topic}</p>
                <div className="text-xs text-foreground/60 leading-relaxed line-clamp-2">
                  {script.script?.slice(0, 120)}...
                </div>
                <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatDate(script.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Script Detail Dialog */}
      <Dialog open={!!selectedScript} onOpenChange={(open) => !open && setSelectedScript(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg leading-snug pr-6">
              {selectedScript?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedScript && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={`text-xs font-medium border ${platformColor[selectedScript.platform] ?? ""} bg-transparent`}
                >
                  {platformEmoji[selectedScript.platform]} {selectedScript.platform}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Topic: <span className="text-foreground">{selectedScript.topic}</span>
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDate(selectedScript.createdAt)}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Script
                  </h4>
                  <button
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedScript.script);
                      toast({ title: "Script copied!" });
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
                <div className="bg-background border border-border rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono text-foreground/90 max-h-60 overflow-y-auto">
                  {selectedScript.script}
                </div>
              </div>

              {selectedScript.hashtags?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Hashtags
                    </h4>
                    <button
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                      onClick={() => {
                        const tags = selectedScript.hashtags.map((t) => `#${t}`).join(" ");
                        navigator.clipboard.writeText(tags);
                        toast({ title: "Hashtags copied!" });
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedScript.hashtags.map((tag) => (
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

              <div className="flex gap-2 pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    deleteScript.mutate({ id: selectedScript.id });
                  }}
                  disabled={deleteScript.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 ml-auto"
                  onClick={() => setLocation("/generate")}
                >
                  <Plus className="w-3.5 h-3.5" /> Generate Similar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
