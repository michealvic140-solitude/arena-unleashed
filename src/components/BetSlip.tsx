import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Trash2, X, Receipt } from "lucide-react";
import { toast } from "sonner";
import { useBetSlip } from "@/lib/betslip";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { formatTokens } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BetSlipFab() {
  const { picks, open, setOpen } = useBetSlip();
  if (picks.length === 0) return null;
  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-bold text-accent-foreground shadow-[var(--shadow-gold)] glow-pulse"
        >
          <Receipt className="h-4 w-4" /> Bet Slip
          <span className="rounded-full bg-background/30 px-2 py-0.5 text-xs">{picks.length}</span>
        </button>
      )}
      {open && <BetSlipPanel />}
    </>
  );
}

function BetSlipPanel() {
  const { picks, setOpen, remove, clear, totalOdds } = useBetSlip();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [stake, setStake] = useState("100");
  const [placing, setPlacing] = useState(false);
  const stakeNum = parseFloat(stake) || 0;
  const payout = stakeNum * totalOdds;

  const place = async () => {
    if (!user) { navigate({ to: "/login" }); return; }
    if (picks.length === 0) return;
    if (stakeNum <= 0) { toast.error("Enter a stake"); return; }
    if ((profile?.token_balance ?? 0) < stakeNum) { toast.error("Insufficient balance"); return; }
    setPlacing(true);
    const { data, error } = await supabase.rpc("place_bet", {
      _stake: stakeNum,
      _selections: picks.map((p) => ({ match_id: p.match_id, market: p.market, selection: p.selection, odds_value: p.odds_value })),
    });
    setPlacing(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bet placed!");
    clear();
    setOpen(false);
    refreshProfile();
    navigate({ to: "/dashboard" });
    void data;
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md sm:right-5 sm:left-auto sm:bottom-5 slide-in-right">
      <div className="glass-strong rounded-t-2xl sm:rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-accent" />
            <h3 className="font-bold">Bet Slip</h3>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums">{picks.length}</span>
          </div>
          <div className="flex items-center gap-1">
            {picks.length > 0 && (
              <button onClick={clear} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Clear all">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => setOpen(false)} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-72 space-y-1.5 overflow-y-auto">
          {picks.map((p) => (
            <div key={p.match_id + p.market} className="flex items-center justify-between rounded-lg bg-secondary/60 p-2.5 text-sm rise-in">
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs text-muted-foreground">{p.match_label}</div>
                <div className="truncate font-semibold">{p.market} · <span className="text-primary">{p.selection}</span></div>
              </div>
              <div className="ml-2 flex items-center gap-2">
                <span className="font-mono font-bold tabular-nums">{p.odds_value.toFixed(2)}</span>
                <button onClick={() => remove(p.match_id, p.market)} className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground" aria-label="Remove">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total odds</span>
            <span className="font-mono font-bold text-foreground tabular-nums">{totalOdds.toFixed(2)}</span>
          </div>
          <Input type="number" min="1" step="1" value={stake} onChange={(e) => setStake(e.target.value)} placeholder="Stake" className="text-base" />
          <div className="flex items-center justify-between rounded-lg bg-gold-gradient p-3 text-accent-foreground">
            <span className="text-xs font-semibold uppercase">Potential payout</span>
            <span className="font-mono text-lg font-extrabold tabular-nums">{formatTokens(payout)}</span>
          </div>
          <Button onClick={place} disabled={placing || picks.length === 0} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
            {placing ? "Placing…" : user ? "PLACE BET" : "Login to bet"}
          </Button>
          {user && <div className="text-center text-xs text-muted-foreground">Balance: <span className="font-mono font-bold text-foreground">{formatTokens(profile?.token_balance ?? 0)}</span> · <Link to="/tokens" className="text-primary hover:underline">Get more</Link></div>}
        </div>
      </div>
    </div>
  );
}
