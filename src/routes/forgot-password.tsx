import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — LOMITA SHOOTERS LEAGUE" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Reset email sent");
  };
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Forgot password</h1>
        <p className="mt-1 text-sm text-muted-foreground">We'll email you a reset link</p>
      </div>
      <Card className="p-6">
        {sent ? (
          <div className="text-center text-sm">
            <p>Check your inbox for the reset link.</p>
            <Link to="/login" className="mt-4 inline-block font-medium text-primary hover:underline">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</Button>
            <p className="text-center text-sm"><Link to="/login" className="text-muted-foreground hover:underline">Back to sign in</Link></p>
          </form>
        )}
      </Card>
    </div>
  );
}