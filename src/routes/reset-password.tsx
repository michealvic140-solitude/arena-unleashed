import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — LOMITA SHOOTERS LEAGUE" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts recovery tokens in the URL hash; the client picks them up automatically.
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const isRecovery = hash.includes("type=recovery") || hash.includes("access_token=");
    if (!isRecovery) {
      // Still allow if user has an active session (e.g. signed-in change password).
      supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    } else {
      setReady(true);
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated. Please sign in.");
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-gradient">
          <KeyRound className="h-6 w-6 text-accent-foreground" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Set a new password</h1>
      </div>
      <Card className="p-6">
        {!ready ? (
          <div className="text-center text-sm text-muted-foreground">
            Open the password reset link from your email to continue.
            <div className="mt-4"><Link to="/forgot-password" className="text-primary hover:underline">Request a new link</Link></div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>New password</Label>
              <div className="relative">
                <Input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Confirm new password</Label>
              <Input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
            </div>
            <Button type="submit" className="w-full bg-gold-gradient text-accent-foreground" disabled={loading}>{loading ? "Updating…" : "Update password"}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
