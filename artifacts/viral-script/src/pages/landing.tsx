import { useLocation } from "wouter";
import { Zap, TrendingUp, Clock, Shield, Star, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "AI-Powered Scripts",
    description: "GPT-powered engine crafts high-retention scripts tailored to each platform's algorithm.",
  },
  {
    icon: TrendingUp,
    title: "Platform Optimized",
    description: "Different scripts for TikTok, Instagram Reels, and YouTube — each with platform-specific hooks.",
  },
  {
    icon: Clock,
    title: "Scripts in Seconds",
    description: "Stop spending hours writing. Get a complete, viral-ready script in under 10 seconds.",
  },
  {
    icon: Shield,
    title: "Hashtag Strategy",
    description: "Every script includes 10 SEO-optimized hashtags mixing trending and niche tags.",
  },
];

const testimonials = [
  {
    name: "Sarah K.",
    handle: "@sarahcreates",
    avatar: "SK",
    text: "My TikTok views went from 2K to 200K after using ViralScript. The hooks are insane.",
    platform: "TikTok",
  },
  {
    name: "Marcus T.",
    handle: "@marcustv",
    avatar: "MT",
    text: "I went from 0 to 50K subscribers in 3 months. The YouTube scripts are gold.",
    platform: "YouTube",
  },
  {
    name: "Priya M.",
    handle: "@priyalifestyle",
    avatar: "PM",
    text: "Every Reels script hits differently. My engagement rate tripled.",
    platform: "Instagram",
  },
];

const platforms = [
  { name: "TikTok", emoji: "🎵", color: "from-pink-500 to-red-500" },
  { name: "Instagram", emoji: "📸", color: "from-purple-500 to-pink-500" },
  { name: "YouTube", emoji: "▶️", color: "from-red-500 to-orange-500" },
];

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">ViralScript AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/sign-in")}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => setLocation("/sign-up")} className="gap-1">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(262_83%_65%_/_0.15),_transparent_60%)]" />
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-24 text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-8">
            <Star className="w-3.5 h-3.5 fill-primary" />
            Trusted by 10,000+ creators
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
            Write Scripts That
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-pink-400">
              Actually Go Viral
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-generated video scripts optimized for TikTok, Instagram, and YouTube.
            Hook your audience in 3 seconds and keep them watching.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              className="text-base px-8 h-12 gap-2"
              onClick={() => setLocation("/sign-up")}
            >
              <Zap className="w-4 h-4" />
              Start Generating Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-12 gap-2"
              onClick={() => setLocation("/sign-in")}
            >
              <Play className="w-4 h-4" />
              See It In Action
            </Button>
          </div>

          {/* Platform pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {platforms.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 text-sm font-medium"
              >
                <span>{p.emoji}</span>
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to go viral
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Stop guessing what works. Let AI analyze what makes content viral and write it for you.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-colors group"
              >
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Creators love ViralScript
            </h2>
            <p className="text-muted-foreground text-lg">
              Real results from real creators.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-muted-foreground text-xs">{t.handle}</div>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs bg-secondary border border-border rounded-full px-2 py-0.5">
                      {t.platform}
                    </span>
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

      {/* Pricing teaser */}
      <section className="py-20 bg-card/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple pricing</h2>
            <p className="text-muted-foreground text-lg">Start free, upgrade when you're ready to scale.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="text-sm font-medium text-muted-foreground mb-2">Free</div>
              <div className="text-4xl font-bold mb-1">$0</div>
              <div className="text-muted-foreground text-sm mb-6">Forever</div>
              <ul className="space-y-2 text-sm mb-8">
                {["10 scripts / month", "3 platforms", "Basic hashtags", "Script history"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => setLocation("/sign-up")}>
                Get Started Free
              </Button>
            </div>
            {/* Pro */}
            <div className="bg-card border-2 border-primary rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                  COMING SOON
                </span>
              </div>
              <div className="text-sm font-medium text-primary mb-2">Pro</div>
              <div className="text-4xl font-bold mb-1">$19</div>
              <div className="text-muted-foreground text-sm mb-6">per month</div>
              <ul className="space-y-2 text-sm mb-8">
                {["Unlimited scripts", "All platforms", "Advanced hashtags", "Bulk generation", "Priority AI", "Analytics"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-primary/20 to-purple-600/10 border border-primary/20 rounded-2xl p-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to go viral?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              Join thousands of creators who use ViralScript to create content that gets views.
            </p>
            <Button
              size="lg"
              className="text-base px-10 h-12 gap-2"
              onClick={() => setLocation("/sign-up")}
            >
              <Zap className="w-4 h-4" />
              Start for Free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span>ViralScript AI</span>
          </div>
          <span>© 2026 ViralScript AI. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
