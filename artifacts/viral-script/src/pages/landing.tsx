import { useLocation } from "wouter";
import { Zap, TrendingUp, Clock, Shield, Star, ArrowRight, Play, FlaskConical, Brain, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTHLY_LINK = "https://buy.stripe.com/7sY3cv4n8aKA19z57n5gc00";
const ANNUAL_LINK = "https://buy.stripe.com/14A5kD2f06ukbOdgQ55gc01";

const features = [
  {
    icon: Zap,
    title: "Structured Script Engine",
    description: "Every script ships with a separate Hook, Body, and Call to Action — fully formatted and ready to film.",
  },
  {
    icon: FlaskConical,
    title: "Hook Lab",
    description: "Get 5 alternate opening lines per script — different angles, formats, and styles — so you always have options.",
  },
  {
    icon: Brain,
    title: "AI Strategy Reasoning",
    description: "Understand WHY your script will perform. Each script includes the psychological trigger and virality logic behind it.",
  },
  {
    icon: TrendingUp,
    title: "Platform + Tone Targeting",
    description: "Choose your platform, your audience, and your tone (Hype, Funny, Aggressive, Professional, and more).",
  },
  {
    icon: Clock,
    title: "Scripts in Seconds",
    description: "Stop spending hours writing. Get a complete viral strategy — hook variations, body, CTA, 10 hashtags — in seconds.",
  },
  {
    icon: Shield,
    title: "PDF Export & Copy Tools",
    description: "Download any script as a branded PDF or copy individual sections with one click. Built for creators on the go.",
  },
];

const testimonials = [
  {
    name: "Sarah K.",
    handle: "@sarahcreates",
    avatar: "SK",
    text: "My TikTok views went from 2K to 200K after using ViralScript. The Hook Lab alone is worth it — I always pick the boldest one.",
    platform: "TikTok",
  },
  {
    name: "Marcus T.",
    handle: "@marcustv",
    avatar: "MT",
    text: "I went from 0 to 50K YouTube subscribers in 3 months. The AI Reasoning panel taught me more about content strategy than any course.",
    platform: "YouTube",
  },
  {
    name: "Priya M.",
    handle: "@priyalifestyle",
    avatar: "PM",
    text: "Every Reels script hits differently. Setting the tone to 'Inspirational' completely changed how my audience connects with my content.",
    platform: "Instagram",
  },
];

const platforms = [
  { name: "TikTok",    emoji: "🎵" },
  { name: "Instagram", emoji: "📸" },
  { name: "YouTube",   emoji: "▶️" },
];

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.4)]">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">ViralScript AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/sign-in")}>Sign In</Button>
            <Button size="sm" onClick={() => setLocation("/sign-up")} className="gap-1">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(262_83%_65%_/_0.15),_transparent_60%)]" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-40 w-72 h-72 bg-pink-500/6 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 pt-20 pb-24 text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-8">
            <Star className="w-3.5 h-3.5 fill-primary" />
            Hook Lab · AI Reasoning · PDF Export
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
            Write Scripts That
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-pink-400">
              Actually Go Viral
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered viral scripts for TikTok, Instagram, and YouTube — with 5 alternate hooks, AI strategy reasoning, and your exact tone and audience baked in.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="text-base px-8 h-12 gap-2" onClick={() => setLocation("/sign-up")}>
              <Zap className="w-4 h-4" /> Start Generating Free
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 h-12 gap-2" onClick={() => setLocation("/sign-in")}>
              <Play className="w-4 h-4" /> Sign In
            </Button>
          </div>

          {/* Platform pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {platforms.map((p) => (
              <div key={p.name} className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 text-sm font-medium">
                <span>{p.emoji}</span><span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">More than a script writer — a Viral Strategist</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Stop guessing what works. Get the strategy, the hooks, and the reasoning — all in one place.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Creators love ViralScript</h2>
            <p className="text-muted-foreground text-lg">Real results from real creators.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">{t.avatar}</div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-muted-foreground text-xs">{t.handle}</div>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs bg-secondary border border-border rounded-full px-2 py-0.5">{t.platform}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">"{t.text}"</p>
                <div className="flex gap-0.5 mt-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-card/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple pricing</h2>
            <p className="text-muted-foreground text-lg">Start free. Upgrade when you're ready to scale.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Free</div>
              <div className="text-4xl font-bold mb-1">$0</div>
              <div className="text-muted-foreground text-sm mb-6">Forever</div>
              <ul className="space-y-2.5 text-sm mb-8">
                {[
                  "3 scripts to try the platform",
                  "Hook Lab (5 alternate hooks)",
                  "AI Strategy Reasoning",
                  "TikTok, Instagram & YouTube",
                  "PDF download & copy tools",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => setLocation("/sign-up")}>Get Started Free</Button>
            </div>

            {/* Pro */}
            <div className="bg-card border-2 border-primary rounded-xl p-8 relative shadow-[0_0_32px_rgba(139,92,246,0.15)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" /> MOST POPULAR
                </span>
              </div>
              <div className="text-sm font-semibold text-primary mb-2 uppercase tracking-wide">Pro</div>
              <div className="flex items-baseline gap-1 mb-0.5">
                <div className="text-4xl font-bold">$9.99</div>
                <div className="text-muted-foreground text-sm">/month</div>
              </div>
              <div className="text-xs text-primary font-medium mb-6">or $79/year — save $40</div>
              <ul className="space-y-2.5 text-sm mb-8">
                {[
                  "Unlimited script generation",
                  "Everything in Free, unlimited",
                  "GPT-4o-mini — best quality AI",
                  "Full script history forever",
                  "Priority AI processing",
                  "Cancel anytime",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2">
                <Button className="w-full gap-1.5" onClick={() => window.open(MONTHLY_LINK, "_blank")}>
                  <Zap className="w-3.5 h-3.5" /> Get Pro — $9.99/mo
                </Button>
                <button
                  className="text-xs text-primary/70 hover:text-primary transition-colors text-center"
                  onClick={() => window.open(ANNUAL_LINK, "_blank")}
                >
                  Or save $40 — pay $79/year →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-primary/20 to-purple-600/10 border border-primary/20 rounded-2xl p-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to go viral?</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              Get your first 3 scripts free — Hook Lab, AI Reasoning, and PDF export included.
            </p>
            <Button size="lg" className="text-base px-10 h-12 gap-2" onClick={() => setLocation("/sign-up")}>
              <Zap className="w-4 h-4" /> Start for Free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-foreground">ViralScript AI</span>
          </div>
          <p>© {new Date().getFullYear()} ViralScript AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
