import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Ticket, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTokens } from "@/lib/format";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Redeem Booking Code — LOMITA SHOOTERS LEAGUE" },
      { name: "description", content: "Redeem a shared booking code to copy a friend's bet selections." },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [stake, setStake] = useState("2000000");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ stake: number; total_odds: number; legs: number } | null>(null);

  const lookup = async () => {
    if (!code.trim()) return;
    setPreview(null);
    const { data, error } = await supabase
      .from("bets")
      .select("stake, total_odds, bet_selections(id)")
      .eq("booking_code", code.trim().toUpperCase())
      .maybeSingle();
    if (error || !data) { toast.error("Invalid booking code"); return; }
    setPreview({ stake: Number(data.stake), total_odds: Number(data.total_odds), legs: (data.bet_selections as { id: string }[])?.length ?? 0 });
  };

  const submit = async () => {
    if (!user) { navigate({ to: "/login" }); return; }
    if (!code.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("book_by_code", { _code: code.trim().toUpperCase(), _stake: Number(stake) });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bet placed from booking code");
    await refreshProfile();
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="glass-strong rounded-2xl p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient shadow-[var(--shadow-gold)]">
            <Ticket className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-black brand">Booking code</h1>
            <p className="text-sm text-muted-foreground">Copy any shared bet with one tap</p>
          </div>
        </div>

        {user && (
          <div className="mb-4 rounded-lg glass-gold p-3 text-sm">
            Balance: <span className="font-bold text-gold tabular-nums">{formatTokens(profile?.token_balance ?? 0)}</span> tokens
          </div>
        )}

        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Booking code</label>
        <div className="mt-1.5 flex gap-2">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="LSL-XXXXXX" className="uppercase" />
          <Button variant="outline" onClick={lookup}><Search className="h-4 w-4" /></Button>
        </div>

        {preview && (
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg glass p-3 text-center text-sm">
            <div><div className="text-xs text-muted-foreground">Legs</div><div className="font-bold">{preview.legs}</div></div>
            <div><div className="text-xs text-muted-foreground">Total odds</div><div className="font-bold tabular-nums">{preview.total_odds.toFixed(2)}</div></div>
            <div><div className="text-xs text-muted-foreground">Original stake</div><div className="font-bold tabular-nums">{formatTokens(preview.stake)}</div></div>
          </div>
        )}

        <label className="mt-5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Your stake (tokens)</label>
        <Input type="number" value={stake} onChange={(e) => setStake(e.target.value)} className="mt-1.5 tabular-nums" />

        <Button onClick={submit} disabled={busy || !code} className="mt-6 w-full bg-gold-gradient text-accent-foreground font-bold">
          {busy ? "Placing..." : "Place bet"}
        </Button>

        {!user && <p className="mt-3 text-center text-xs text-muted-foreground">You must be logged in to redeem.</p>}
      </div>
    </div>
  );
}