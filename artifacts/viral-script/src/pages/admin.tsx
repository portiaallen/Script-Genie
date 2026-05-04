import { useState } from "react";
import { Zap, Crown, UserX, Users, CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserRow {
  id: string;
  email: string | null;
  isPro: boolean;
  scriptsRemaining: number;
}

export default function Admin() {
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"upgrade" | "downgrade" | "list" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [users, setUsers] = useState<UserRow[] | null>(null);

  const headers = {
    "Content-Type": "application/json",
    "x-admin-secret": secret,
  };

  async function handleUpgrade() {
    if (!email || !secret) return;
    setLoading("upgrade");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/upgrade", {
        method: "POST",
        headers,
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage({ type: "success", text: data.message });
      setEmail("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(null);
    }
  }

  async function handleDowngrade() {
    if (!email || !secret) return;
    setLoading("downgrade");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/downgrade", {
        method: "POST",
        headers,
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage({ type: "success", text: data.message });
      setEmail("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(null);
    }
  }

  async function handleListUsers() {
    if (!secret) return;
    setLoading("list");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users", { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setUsers(data.users);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold">ViralScript AI</span>
          <span className="text-muted-foreground text-sm ml-2">— Admin</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* Auth */}
        <div className="bg-card border border-border rounded-xl p-6">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-3 block">Admin Secret</Label>
          <div className="relative">
            <Input
              type={showSecret ? "text" : "password"}
              placeholder="Enter your ADMIN_SECRET"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowSecret((v) => !v)}
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Upgrade / Downgrade */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-lg">Manage User Plan</h2>
          <p className="text-sm text-muted-foreground">Enter the email address from the customer's Stripe payment receipt.</p>

          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Customer Email</Label>
            <Input
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUpgrade()}
            />
          </div>

          {message && (
            <div className={`flex items-center gap-2 rounded-lg p-3 text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}>
              {message.type === "success"
                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                : <XCircle className="w-4 h-4 flex-shrink-0" />}
              {message.text}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              className="flex-1 gap-2"
              onClick={handleUpgrade}
              disabled={!email || !secret || loading !== null}
            >
              {loading === "upgrade" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
              Upgrade to Pro
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleDowngrade}
              disabled={!email || !secret || loading !== null}
            >
              {loading === "downgrade" ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
              Downgrade to Free
            </Button>
          </div>
        </div>

        {/* User List */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">All Users</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={handleListUsers}
              disabled={!secret || loading === "list"}
              className="gap-1.5"
            >
              {loading === "list" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
              Load Users
            </Button>
          </div>

          {users && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No users yet.</p>
              )}
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between text-sm bg-background border border-border rounded-lg px-3 py-2.5"
                >
                  <div>
                    <div className="font-medium">{u.email ?? <span className="text-muted-foreground italic">no email</span>}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {u.isPro ? "Pro — Unlimited" : `Free — ${u.scriptsRemaining} scripts left`}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    u.isPro
                      ? "bg-primary/15 text-primary border-primary/25"
                      : "bg-muted text-muted-foreground border-border"
                  }`}>
                    {u.isPro ? "Pro" : "Free"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
