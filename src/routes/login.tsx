import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Ban } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — LOMITA SHOOTERS LEAGUE" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    banned: s.banned === "1" || s.banned === 1,
    reason: typeof s.reason === "string" ? s.reason : "",
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banned, setBanned] = useState<{ reason: string } | null>(search.banned ? { reason: search.reason } : null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const isEmail = identifier.includes("@");
    const { data: signInData, error } = isEmail
      ? await supabase.auth.signInWithPassword({ email: identifier.trim(), password })
      : await supabase.auth.signInWithPassword({ phone: identifier.trim(), password });
    if (error) { setLoading(false); toast.error(error.message); return; }
    // Block banned users immediately
    if (signInData.user) {
      const { data: prof } = await supabase.from("profiles").select("is_banned, ban_reason").eq("id", signInData.user.id).maybeSingle();
      if (prof?.is_banned) {
        await supabase.auth.signOut();
        setLoading(false);
        setBanned({ reason: prof.ban_reason ?? "Your account has been suspended." });
        return;
      }
    }
    setLoading(false);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
      {banned && (
        <div className="glass-strong rounded-2xl border-destructive/40 p-6 text-center rise-in">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/20">
            <Ban className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-xl font-black text-destructive">Account banned</h2>
          <p className="mt-2 text-sm text-muted-foreground">{banned.reason || "Your account has been banned by an administrator."}</p>
          <Link to="/support" className="mt-4 inline-flex rounded-lg bg-gold-gradient px-4 py-2 text-sm font-bold text-accent-foreground">Submit an appeal</Link>
        </div>
      )}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use your email or phone to continue</p>
      </div>
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="identifier">Email or phone</Label>
            <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
        </form>
        <p className="mt-3 text-center text-xs">
          <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground hover:underline">Forgot password?</Link>
        </p>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          New here? <Link to="/register" className="font-medium text-primary hover:underline">Create an account</Link>
        </p>
      </Card>
    </div>
  );
}
