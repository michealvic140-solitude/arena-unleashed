import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Coins, ListChecks, Receipt, TicketCheck, Pencil, ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatTokens } from "@/lib/format";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SHOOTERS BET" }] }),
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: DashboardPage,
});

interface Bet {
  id: string; stake: number; total_odds: number; potential_payout: number;
  status: string; payout: number | null; cashout_amount: number | null; created_at: string;
}
interface Selection { id: string; bet_id: string; match_id: string; market: string; selection: string; odds_value: number; status: string }
interface Tx { id: string; type: string; amount: number; balance_after: number; created_at: string; note: string | null }

function DashboardPage() {
  const { profile, roles, refreshProfile } = useAuth();
  const [openBets, setOpenBets] = useState<Bet[]>([]);
  const [recentBets, setRecentBets] = useState<Bet[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [editing, setEditing] = useState<Bet | null>(null);
  const [cashing, setCashing] = useState<Bet | null>(null);

  const load = async () => {
    if (!profile?.id) return;
    const [{ data: ob }, { data: rb }, { data: tx }] = await Promise.all([
      supabase.from("bets").select("*").eq("user_id", profile.id).eq("status", "open").order("created_at", { ascending: false }),
      supabase.from("bets").select("*").eq("user_id", profile.id).neq("status", "open").order("created_at", { ascending: false }).limit(10),
      supabase.from("transactions").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(10),
    ]);
    setOpenBets((ob ?? []) as Bet[]);
    setRecentBets((rb ?? []) as Bet[]);
    setTxs((tx ?? []) as Tx[]);
    const allBetIds = [...(ob ?? []), ...(rb ?? [])].map((b: { id: string }) => b.id);
    if (allBetIds.length) {
      const { data: sels } = await supabase.from("bet_selections").select("*").in("bet_id", allBetIds);
      setSelections((sels ?? []) as Selection[]);
    } else { setSelections([]); }
  };

  useEffect(() => { load(); }, [profile?.id]);

  // Realtime: bet status changes (settled, cashed out)
  useEffect(() => {
    if (!profile?.id) return;
    const ch = supabase.channel(`bets:${profile.id}`).on("postgres_changes",
      { event: "*", schema: "public", table: "bets", filter: `user_id=eq.${profile.id}` },
      () => { load(); refreshProfile(); }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile?.id]);

  if (!profile) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black brand">Hi, {profile.full_name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <span>{profile.email}</span>
            {roles.map((r) => <RoleBadge key={r} role={r} />)}
          </div>
        </div>
        <Link to="/tokens" className="inline-flex items-center gap-3 rounded-xl glass-gold px-5 py-3 transition hover:scale-[1.02]">
          <Coins className="h-6 w-6 text-accent" />
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Balance</div>
            <div className="text-xl font-black tabular-nums text-gold">{formatTokens(profile.token_balance)}</div>
          </div>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat icon={<ListChecks className="h-5 w-5" />} label="Open bets" value={openBets.length} />
        <Stat icon={<Receipt className="h-5 w-5" />} label="Recent settled" value={recentBets.length} />
        <Stat icon={<TicketCheck className="h-5 w-5" />} label="Transactions" value={txs.length} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-xl p-4">
          <h2 className="mb-3 font-bold">Open bets</h2>
          {openBets.length === 0 ? <Empty msg="No open bets — pick a match to bet on." />
            : <div className="space-y-2">{openBets.map((b) => (
                <BetRow key={b.id} b={b} sels={selections.filter((s) => s.bet_id === b.id)}
                  onEdit={() => setEditing(b)}
                  onCashout={() => setCashing(b)} />
              ))}</div>}
        </div>
        <div className="glass rounded-xl p-4">
          <h2 className="mb-3 font-bold">Bet history</h2>
          {recentBets.length === 0 ? <Empty msg="No settled bets yet." />
            : <div className="space-y-2">{recentBets.map((b) => (
                <BetRow key={b.id} b={b} sels={selections.filter((s) => s.bet_id === b.id)} />
              ))}</div>}
        </div>
      </div>

      <div className="mt-4 glass rounded-xl p-4">
        <h2 className="mb-3 font-bold">Recent transactions</h2>
        {txs.length === 0 ? <Empty msg="No transactions yet." />
          : <div className="divide-y divide-white/5">{txs.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-semibold capitalize">{t.type.replace(/_/g, " ")}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                </div>
                <div className={`font-mono font-extrabold tabular-nums ${Number(t.amount) >= 0 ? "text-success" : "text-primary"}`}>
                  {Number(t.amount) >= 0 ? "+" : ""}{formatTokens(t.amount)}
                </div>
              </div>
            ))}</div>}
      </div>

      {editing && <EditBetDialog bet={editing} sels={selections.filter((s) => s.bet_id === editing.id)} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); refreshProfile(); }} />}
      {cashing && <CashoutDialog bet={cashing} onClose={() => setCashing(null)} onDone={() => { setCashing(null); load(); refreshProfile(); }} />}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass flex items-center gap-3 rounded-xl p-4">
      <div className="rounded-lg bg-primary/15 p-2.5 text-primary">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-2xl font-black tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function BetRow({ b, sels, onEdit, onCashout }: { b: Bet; sels: Selection[]; onEdit?: () => void; onCashout?: () => void }) {
  const color = b.status === "won" ? "text-success" : b.status === "lost" ? "text-primary" : b.status === "cashed_out" ? "text-accent" : "text-foreground";
  return (
    <div className="rounded-lg bg-secondary/40 p-2.5 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Stake {formatTokens(b.stake)} · @ {Number(b.total_odds).toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className={`text-xs uppercase font-bold ${color}`}>{b.status.replace(/_/g, " ")}</div>
          <div className="font-mono font-extrabold tabular-nums">{formatTokens(b.payout ?? b.potential_payout)}</div>
        </div>
      </div>
      {sels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {sels.map((s) => (
            <span key={s.id} className="rounded bg-background/60 px-1.5 py-0.5 text-[11px]">
              {s.market}·<span className="font-bold text-primary">{s.selection}</span>·<span className="font-mono">{Number(s.odds_value).toFixed(2)}</span>
            </span>
          ))}
        </div>
      )}
      {b.status === "open" && (onEdit || onCashout) && (
        <div className="mt-2 flex gap-2">
          {onEdit && <Button size="sm" variant="outline" onClick={onEdit} className="gap-1 h-7"><Pencil className="h-3 w-3" /> Edit</Button>}
          {onCashout && <Button size="sm" onClick={onCashout} className="gap-1 h-7 bg-gold-gradient text-accent-foreground hover:opacity-90"><ArrowDownToLine className="h-3 w-3" /> Cash out</Button>}
        </div>
      )}
    </div>
  );
}

function EditBetDialog({ bet, sels, onClose, onSaved }: { bet: Bet; sels: Selection[]; onClose: () => void; onSaved: () => void }) {
  const [stake, setStake] = useState(String(bet.stake));
  const [removeIds, setRemoveIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const remaining = sels.filter((s) => !removeIds.includes(s.id));
  const newOdds = remaining.reduce((a, s) => a * Number(s.odds_value), 1);
  const stakeNum = parseFloat(stake) || 0;
  const newPayout = stakeNum * newOdds;

  const save = async () => {
    if (remaining.length === 0) { toast.error("Keep at least one selection"); return; }
    setSaving(true);
    const { error } = await supabase.rpc("edit_bet", {
      _bet_id: bet.id,
      _new_stake: stakeNum,
      _add_selections: [],
      _remove_selection_ids: removeIds,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bet updated");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-strong">
        <DialogHeader><DialogTitle>Edit bet</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Stake</label>
            <Input type="number" min="1" value={stake} onChange={(e) => setStake(e.target.value)} />
          </div>
          <div>
            <div className="mb-1.5 text-sm font-semibold">Selections</div>
            <div className="space-y-1.5">
              {sels.map((s) => {
                const removed = removeIds.includes(s.id);
                return (
                  <div key={s.id} className={`flex items-center justify-between rounded-lg p-2 text-sm ${removed ? "bg-destructive/10 line-through opacity-60" : "bg-secondary/60"}`}>
                    <span>{s.market} · <span className="font-bold text-primary">{s.selection}</span> · <span className="font-mono">{Number(s.odds_value).toFixed(2)}</span></span>
                    <button onClick={() => setRemoveIds((p) => removed ? p.filter((x) => x !== s.id) : [...p, s.id])} className="text-xs text-muted-foreground hover:text-foreground">
                      {removed ? "Undo" : "Remove"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-lg bg-gold-gradient p-3 text-accent-foreground">
            <div className="flex justify-between text-xs"><span>Total odds</span><span className="font-mono font-bold">{newOdds.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm font-bold"><span>Potential payout</span><span className="font-mono">{formatTokens(newPayout)}</span></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CashoutDialog({ bet, onClose, onDone }: { bet: Bet; onClose: () => void; onDone: () => void }) {
  const [pct, setPct] = useState(100);
  const [busy, setBusy] = useState(false);
  const fullCashout = bet.stake + (bet.potential_payout - bet.stake) * 0.5;
  const amount = (fullCashout * pct) / 100;

  const doCashout = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("cashout_bet", { _bet_id: bet.id, _fraction: pct / 100 });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Cashed out ${formatTokens(amount)} tokens`);
    onDone();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-strong">
        <DialogHeader><DialogTitle>Cash out bet</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-secondary/60 p-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Stake</span><span className="font-mono font-bold">{formatTokens(bet.stake)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Potential</span><span className="font-mono font-bold">{formatTokens(bet.potential_payout)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Full cashout value</span><span className="font-mono font-bold text-accent">{formatTokens(fullCashout)}</span></div>
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-sm"><span className="font-semibold">Cash out</span><span className="font-mono font-bold">{pct}%</span></div>
            <input type="range" min="10" max="100" step="5" value={pct} onChange={(e) => setPct(parseInt(e.target.value))} className="w-full accent-[var(--color-primary)]" />
            <div className="mt-1 flex gap-1">
              {[25, 50, 75, 100].map((v) => (
                <button key={v} onClick={() => setPct(v)} className={`flex-1 rounded px-2 py-1 text-xs font-semibold ${pct === v ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{v}%</button>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-gold-gradient p-3 text-accent-foreground">
            <div className="flex justify-between text-sm font-bold"><span>You receive</span><span className="font-mono text-lg">{formatTokens(amount)}</span></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={doCashout} disabled={busy} className="bg-gold-gradient text-accent-foreground hover:opacity-90">{busy ? "Cashing out…" : "Confirm cashout"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="py-6 text-center text-sm text-muted-foreground">{msg}</div>;
}
