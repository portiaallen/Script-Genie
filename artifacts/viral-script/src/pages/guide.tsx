import { useLocation } from "wouter";
import {
  Zap, ArrowLeft, BookOpen, FlaskConical, Brain, Megaphone,
  Video, Music, BarChart2, Scissors, CalendarDays, ExternalLink, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AFFILIATE_TOOLS = [
  {
    name: "CapCut",
    icon: Scissors,
    category: "Video Editing",
    description: "The #1 free video editor for TikTok and Reels. Auto-captions, trending templates, and AI tools built specifically for short-form. Most viral creators use it daily.",
    cta: "Get CapCut Free",
    href: "https://www.capcut.com/",
    badge: "Free",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
  {
    name: "TubeBuddy",
    icon: BarChart2,
    category: "YouTube Growth",
    description: "Browser extension that shows you the exact tags, titles, and thumbnails that rank on YouTube. Essential for turning your ViralScript scripts into searchable content.",
    cta: "Try TubeBuddy",
    href: "https://www.tubebuddy.com/",
    badge: "Free plan",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
  {
    name: "VidIQ",
    icon: BarChart2,
    category: "YouTube Analytics",
    description: "Real-time YouTube analytics and keyword research. Pairs perfectly with your AI scripts — find trending topics, then generate a script for them in seconds.",
    cta: "Try VidIQ",
    href: "https://vidiq.com/ViralScript",
    badge: "Free plan",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
  {
    name: "Epidemic Sound",
    icon: Music,
    category: "Royalty-Free Music",
    description: "Background music that won't get your videos muted or monetization stripped. One subscription covers TikTok, Instagram, and YouTube. A must-have for professional-looking content.",
    cta: "Start Free Trial",
    href: "https://share.epidemicsound.com/yjnr6h",
    badge: "30-day trial",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  },
  {
    name: "Descript",
    icon: Video,
    category: "AI Video Editor",
    description: "Edit video by editing text — cut filler words, remove silences, add captions automatically. Paste your ViralScript script in, record, and Descript cleans it up instantly.",
    cta: "Try Descript",
    href: "https://www.descript.com/",
    badge: "Free plan",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
  {
    name: "Later",
    icon: CalendarDays,
    category: "Social Scheduling",
    description: "Schedule and auto-publish to TikTok, Instagram, and YouTube from one dashboard. Batch-create 10 scripts in ViralScript, then schedule them all out for the week.",
    cta: "Try Later",
    href: "https://later.com/",
    badge: "Free plan",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
];

const SCRIPT_SECTIONS = [
  {
    label: "Title",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    dot: "bg-yellow-400",
    tip: "Your title is your SEO engine. Use it for YouTube search and your video file name. Include the main keyword your audience is searching for — the AI writes it to be both click-worthy and searchable.",
  },
  {
    label: "Hook",
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
    dot: "bg-pink-400",
    tip: "The first 1–3 seconds decide everything. Deliver this line before you move the camera, before you smile, before anything. Look directly into the lens, say it fast, and let a natural pause follow. Urgency and curiosity are the two emotions that stop the scroll.",
  },
  {
    label: "Body",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    dot: "bg-purple-400",
    tip: "Break the body into 3-second chunks on camera — one idea per cut. Use jump cuts to keep pace high. If a line feels long, split it into two shots. The AI structures this for retention, so trust the order.",
  },
  {
    label: "CTA",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-400",
    tip: "Say it clearly and ask for ONE thing only — follow, comment, or link in bio. Never stack multiple CTAs in the same video. The AI picks the CTA most likely to convert for your specific topic and platform.",
  },
];

export default function Guide() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-border/60">|</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-sm">ViralScript AI</span>
            </div>
          </div>
          <Button size="sm" onClick={() => setLocation("/generate")} className="gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Generate a Script
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-xs text-primary font-medium mb-4">
            <BookOpen className="w-3 h-3" /> Creator Guide
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            How to Use Your Scripts<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-pink-400">
              to Actually Go Viral
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            A great script is only half the battle. Here's how to deliver, film, and post it for maximum reach — plus the tools top creators use every day.
          </p>
        </div>

        {/* Section 1: Script Anatomy */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Understanding Your Script
          </h2>
          <p className="text-muted-foreground mb-8">
            Every ViralScript script has four sections. Each one has a specific job — here's how to use them on camera.
          </p>
          <div className="space-y-4">
            {SCRIPT_SECTIONS.map((s) => (
              <div key={s.label} className={`rounded-xl border p-5 ${s.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                  <span className={`font-bold text-sm uppercase tracking-wide ${s.color}`}>{s.label}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{s.tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Hook Lab */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" /> Getting the Most from Hook Lab
          </h2>
          <p className="text-muted-foreground mb-6">
            Hook Lab gives you 5 different opening lines for every script — each with a different psychological angle. Here's how to pick the right one.
          </p>
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            {[
              { title: "Test, don't guess", body: "If you post consistently, film the same video twice with different hooks and post them a few days apart. The one with better watch time in the first 24 hours is your winner — use that style going forward." },
              { title: "Match hook energy to your platform", body: "TikTok rewards bold, provocative hooks. Instagram Reels respond better to aspirational or curiosity-based openers. YouTube favours clear value statements like 'In this video you'll learn exactly how to...'." },
              { title: "Shock value is a short game", body: "The Aggressive/Controversial hooks in Hook Lab get clicks — but only work long-term if your content delivers on the promise. Use them when you have a genuinely strong take, not just for shock." },
              { title: "Read all 5 before you pick", body: "The first hook you see isn't always the best. Read through all 5 and notice which one makes you feel something. That gut reaction is usually right." },
            ].map((item) => (
              <div key={item.title}>
                <div className="font-semibold text-sm mb-1">{item.title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: AI Reasoning */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> Reading the AI Strategy Reasoning
          </h2>
          <p className="text-muted-foreground mb-6">
            The AI Reasoning panel isn't just explanation — it's a content strategy lesson in every script.
          </p>
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            {[
              { title: "Use it to understand WHY it works", body: "The reasoning explains the psychological trigger behind your script — curiosity gap, fear of missing out, social proof, authority, etc. Once you recognise these patterns, you'll start spotting them in every viral video you watch." },
              { title: "Steal the formula, not just the script", body: "If the AI says 'this works because it opens a curiosity gap in the first line' — note that pattern. Apply it when you write captions, email subject lines, and even your username bio." },
              { title: "Use it to brief your editor", body: "Copy the AI Reasoning and send it to your video editor along with the script. It tells them the emotional arc of the video so they can cut, add music, and pace it to match the intent." },
            ].map((item) => (
              <div key={item.title}>
                <div className="font-semibold text-sm mb-1">{item.title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Platform Tips */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" /> Platform Delivery Tips
          </h2>
          <p className="text-muted-foreground mb-6">
            The same script performs differently depending on how you deliver it. Here's what works on each platform.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                platform: "TikTok 🎵",
                tips: [
                  "Film vertically, fill the whole frame with your face",
                  "Hook delivery: fast, no hesitation, straight to camera",
                  "Cut out every silence over 0.5 seconds",
                  "Post between 6–10am or 7–9pm local time",
                  "Use 3–5 hashtags max — mix 1 broad, 2 niche",
                ],
              },
              {
                platform: "Instagram Reels 📸",
                tips: [
                  "First frame should be visually striking — no black screen",
                  "Captions are essential — 85% watch on mute",
                  "Smoother pacing than TikTok — fewer jump cuts",
                  "Add a cover image that works as a standalone photo",
                  "Share to Stories immediately after posting",
                ],
              },
              {
                platform: "YouTube Shorts ▶️",
                tips: [
                  "Say the video title or topic in the first 5 seconds",
                  "Loop-friendly endings perform best (end where you started)",
                  "Use your 10 hashtags — YouTube search is real here",
                  "Post at least 3x per week to signal to the algorithm",
                  "Promote Shorts in your long-form video descriptions",
                ],
              },
            ].map((p) => (
              <div key={p.platform} className="bg-card border border-border rounded-xl p-5">
                <div className="font-bold mb-3 text-sm">{p.platform}</div>
                <ul className="space-y-2">
                  {p.tips.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Recommended Tools */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2">Creator Tools We Recommend</h2>
          <p className="text-muted-foreground mb-2">
            These are the tools used by the fastest-growing creators. Some links below are affiliate links — we earn a small commission if you sign up, at no extra cost to you.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 mb-8 bg-card/50 border border-border/50 rounded-lg px-3 py-2 w-fit">
            <Info className="w-3 h-3 flex-shrink-0" />
            Affiliate disclosure: We may earn a commission from links on this page.
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {AFFILIATE_TOOLS.map((tool) => (
              <div key={tool.name} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm">{tool.name}</span>
                      <span className={`text-xs border rounded-full px-2 py-0.5 ${tool.badgeColor}`}>
                        {tool.badge}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">{tool.category}</div>
                  </div>
                  <tool.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{tool.description}</p>
                <a
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {tool.cta} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary/20 to-purple-600/10 border border-primary/20 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to put this into action?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm leading-relaxed">
            Generate your next script in seconds — with Hook Lab, AI Reasoning, and your platform and tone already dialled in.
          </p>
          <Button size="lg" className="gap-2" onClick={() => setLocation("/generate")}>
            <Zap className="w-4 h-4" /> Generate a Script Now
          </Button>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-foreground">ViralScript AI</span>
          </div>
          <p>© {new Date().getFullYear()} ViralScript AI. Affiliate disclosure: some links earn us a commission.</p>
        </div>
      </footer>
    </div>
  );
}
