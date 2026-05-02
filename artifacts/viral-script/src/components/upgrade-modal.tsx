import { useCreateCheckout } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Star, Check, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

const PRO_FEATURES = [
  "Unlimited script generation",
  "GPT-4o-mini powered (best quality)",
  "All 3 platforms: TikTok, Instagram, YouTube",
  "Full structured output: Hook, Body, CTA",
  "PDF download for every script",
  "Priority AI processing",
  "Script history forever",
];

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const [stripeError, setStripeError] = useState<string | null>(null);

  const createCheckout = useCreateCheckout({
    mutation: {
      onSuccess: (data) => {
        if (data.url) {
          window.location.href = data.url;
        }
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.code === "STRIPE_NOT_CONFIGURED"
            ? "Stripe payments are not yet configured. Add your Stripe API keys to enable upgrades."
            : "Failed to start checkout. Please try again.";
        setStripeError(msg);
      },
    },
  });

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

        <div className="mt-2 mb-4 bg-background border border-border rounded-xl p-4">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-bold">$19</span>
            <span className="text-muted-foreground text-sm">/month</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Cancel anytime</p>
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

        {stripeError && (
          <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive mb-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{stripeError}</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            className="w-full gap-2 h-11"
            onClick={() => {
              setStripeError(null);
              createCheckout.mutate({});
            }}
            disabled={createCheckout.isPending}
          >
            {createCheckout.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to checkout...</>
            ) : (
              <><Zap className="w-4 h-4" /> Upgrade to Pro — $19/mo</>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
