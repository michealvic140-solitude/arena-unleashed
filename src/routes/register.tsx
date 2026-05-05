import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — LOMITA SHOOTERS LEAGUE" }] }),
  component: RegisterPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your in-game name").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  discord_username: z.string().trim().max(60).optional().or(z.literal("")),
  country: z.string().trim().min(2, "Country required").max(60),
  server: z.string().trim().min(2, "Server required").max(60),
  gang_faction: z.string().trim().min(2, "Gang/Faction name required").max(60),
  gang_type: z.enum(["gang", "faction"], { message: "Pick gang or faction" }),
  accept_terms: z.literal(true, { message: "You must accept the Terms" }),
  password: z.string().min(8, "Min 8 characters").max(72),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", discord_username: "", country: "", server: "LOMITA AFR", gang_faction: "", gang_type: "gang" as "gang" | "faction", password: "", confirm: "", accept_terms: false });
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value as never });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          discord_username: form.discord_username.trim() || null,
          server: form.server.trim(),
          country: form.country.trim(),
          gang_faction: form.gang_faction.trim(),
          gang_type: form.gang_type,
        },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">You'll start as a Viewer. Roles are assigned by admin.</p>
      </div>
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-3.5">
          <Field label="Preferred / In-game full name *">
            <Input value={form.full_name} onChange={set("full_name")} required maxLength={80} />
          </Field>
          <Field label="Email *">
            <Input type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
          </Field>
          <Field label="Phone number (optional)">
            <Input type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" />
          </Field>
          <Field label="Discord username">
            <Input value={form.discord_username} onChange={set("discord_username")} placeholder="yourname" />
          </Field>
          <Field label="Country *">
            <Input value={form.country} onChange={set("country")} placeholder="Nigeria" required />
          </Field>
          <Field label="Server *">
            <Input value={form.server} onChange={set("server")} placeholder="LOMITA AFR" required />
          </Field>
          <Field label="Gang / Faction name *">
            <Input value={form.gang_faction} onChange={set("gang_faction")} placeholder="e.g. Rich Dynasty" required />
          </Field>
          <div className="space-y-1.5">
            <Label className="text-sm">Type *</Label>
            <div className="flex gap-2">
              {(["gang", "faction"] as const).map((t) => (
                <button type="button" key={t} onClick={() => setForm({ ...form, gang_type: t })}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold uppercase transition ${form.gang_type === t ? "bg-gold-gradient text-accent-foreground" : "glass text-muted-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Field label="Password *">
            <div className="relative">
              <Input type={show1 ? "text" : "password"} value={form.password} onChange={set("password")} required autoComplete="new-password" />
              <button type="button" onClick={() => setShow1((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                {show1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirm password *">
            <div className="relative">
              <Input type={show2 ? "text" : "password"} value={form.confirm} onChange={set("confirm")} required autoComplete="new-password" />
              <button type="button" onClick={() => setShow2((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                {show2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={form.accept_terms} onChange={(e) => setForm({ ...form, accept_terms: e.target.checked })} className="mt-0.5" />
            <span>I have read and accept the <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link>, including the 60M token max payout cap and no-refund policy after a match starts.</span>
          </label>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
