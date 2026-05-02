import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Star, Check, Crown } from "lucide-react";
import { useState } from "react";

const MONTHLY_LINK = "https://buy.stripe.com/7sY3cv4n8aKA19z57n5gc00";
const ANNUAL_LINK = "https://buy.stripe.com/14A5kD2f06ukbOdgQ55gc01";

const PRO_FEATURES = [
  "Unlimited script generation",
  "GPT-4o-mini powered (best quality)",
  "All 3 platforms: TikTok, Instagram, YouTube",
  "Structured output: Hook, Body & Call to Action",
  "PDF download for every script",
  "Script history forever",
];

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  const isAnnual = billing === "annual";
  const price = isAnnual ? "$79" : "$9.99";
  const period = isAnnual ? "/year" : "/month";
  const savings = isAnnual ? "Save $40 vs monthly" : null;
  const link = isAnnual ? ANNUAL_LINK : MONTHLY_LINK;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <DialogTitle className="text-xl">Upgrade to Pro</DialogTitle>
          </div>
          <p className="text-muted-foreground text-sm">
            You've used all 3 free scripts. Upgrade to keep creating viral content.
          </p>
        </DialogHeader>

        {/* Billing toggle */}
        <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1 mt-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${
              !isAnnual ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              isAnnual ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annual
            {isAnnual && (
              <span className="text-[10px] bg-primary/20 text-primary rounded-full px-1.5 py-0.5 font-semibold">
                Best value
              </span>
            )}
          </button>
        </div>

        {/* Price card */}
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="flex items-baseline gap-1 mb-0.5">
            <span className="text-3xl font-bold">{price}</span>
            <span className="text-muted-foreground text-sm">{period}</span>
          </div>
          {savings ? (
            <p className="text-xs text-primary font-medium mb-4">{savings}</p>
          ) : (
            <p className="text-xs text-muted-foreground mb-4">Cancel anytime</p>
          )}
          <ul className="space-y-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-primary" />
                </div>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            className="w-full gap-2 h-11 text-base"
            onClick={() => window.open(link, "_blank")}
          >
            <Zap className="w-4 h-4" />
            {isAnnual ? "Get Pro — $79/year" : "Get Pro — $9.99/mo"}
          </Button>
          {isAnnual && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
              onClick={() => setBilling("monthly")}
            >
              Or pay $9.99/month instead
            </button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
