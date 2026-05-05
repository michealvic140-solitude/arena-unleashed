import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Coins, Image as ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatTokens } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/tokens")({
  head: () => ({ meta: [{ title: "Request Tokens — LomitaBet" }] }),
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: TokensPage,
});

interface TR { id: string; amount: number; note: string | null; image_url: string | null; status: string; created_at: string; admin_note: string | null }

function TokensPage() {
  const { profile, user } = useAuth();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<TR[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("token_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setRequests((data ?? []) as TR[]);
  };
  useEffect(() => { load(); }, [user?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setSubmitting(true);
    try {
      let image_url: string | null = null;
      if (file) {
        const path = `${user.id}/token-requests/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("uploads").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        image_url = supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("token_requests").insert({ user_id: user.id, amount: amt, note: note || null, image_url });
      if (error) throw error;
      toast.success("Request submitted!");
      setAmount(""); setNote(""); setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Coins className="h-7 w-7 text-accent" />
        <div>
          <h1 className="text-2xl font-extrabold">Tokens</h1>
          <p className="text-sm text-muted-foreground">Balance: <span className="font-mono font-bold text-foreground">{formatTokens(profile?.token_balance ?? 0)}</span></p>
        </div>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Request tokens</h2>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount *</Label>
              <Input id="amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Proof / screenshot (optional)</Label>
              <div className="flex items-center gap-2">
                <Input ref={fileRef} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file && <ImageIcon className="h-4 w-4 text-success" />}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} />
          </div>
          <Button type="submit" disabled={submitting} className="gap-2">
            <Upload className="h-4 w-4" />
            {submitting ? "Submitting…" : "Submit request"}
          </Button>
        </form>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="mb-3 font-semibold">Your recent requests</h2>
        {requests.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">No requests yet.</div>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-start gap-3 rounded-md bg-secondary/40 p-3">
                {r.image_url && <a href={r.image_url} target="_blank" rel="noreferrer"><img src={r.image_url} alt="proof" className="h-14 w-14 rounded object-cover" /></a>}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{formatTokens(r.amount)}</span>
                    <StatusPill s={r.status} />
                  </div>
                  {r.note && <div className="mt-0.5 text-xs text-muted-foreground">{r.note}</div>}
                  {r.admin_note && <div className="mt-0.5 text-xs italic text-accent">Admin: {r.admin_note}</div>}
                  <div className="mt-0.5 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusPill({ s }: { s: string }) {
  const cls = s === "approved" ? "bg-success/20 text-success" : s === "denied" ? "bg-primary/20 text-primary" : "bg-warning/20 text-warning";
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>{s}</span>;
}
