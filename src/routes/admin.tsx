import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Coins, Users, Layers, Trophy, Calculator, ScrollText, Check, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatTokens } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — SHOOTERS BET" }] }),
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (!isAdmin) return <div className="p-10 text-center text-muted-foreground">Admin access only.</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient shadow-[var(--shadow-gold)]">
          <Shield className="h-6 w-6 text-accent-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-black brand">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Full manual control over SHOOTERS BET.</p>
        </div>
      </div>

      <Tabs defaultValue="tokens">
        <TabsList className="glass mb-4 flex w-full flex-wrap gap-1 bg-transparent">
          <Tab value="tokens" icon={<Coins className="h-4 w-4" />}>Tokens</Tab>
          <Tab value="roles" icon={<Users className="h-4 w-4" />}>Roles</Tab>
          <Tab value="categories" icon={<Layers className="h-4 w-4" />}>Categories</Tab>
          <Tab value="matches" icon={<Trophy className="h-4 w-4" />}>Matches</Tab>
          <Tab value="calc" icon={<Calculator className="h-4 w-4" />}>Odds Calc</Tab>
          <Tab value="audit" icon={<ScrollText className="h-4 w-4" />}>Audit</Tab>
        </TabsList>
        <TabsContent value="tokens"><TokenRequestsAdmin /></TabsContent>
        <TabsContent value="roles"><RolesAdmin /></TabsContent>
        <TabsContent value="categories"><CategoriesAdmin /></TabsContent>
        <TabsContent value="matches"><MatchesAdmin /></TabsContent>
        <TabsContent value="calc"><OddsCalculator /></TabsContent>
        <TabsContent value="audit"><AuditAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

function Tab({ value, icon, children }: { value: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <TabsTrigger value={value} className="gap-1.5 data-[state=active]:bg-gold-gradient data-[state=active]:text-accent-foreground data-[state=active]:font-bold">
      {icon}{children}
    </TabsTrigger>
  );
}

// ---- Token Requests ----
interface TR { id: string; user_id: string; amount: number; note: string | null; image_url: string | null; status: string; created_at: string; admin_note: string | null; profiles?: { full_name: string; email: string | null } }

function TokenRequestsAdmin() {
  const [reqs, setReqs] = useState<TR[]>([]);
  const [tab, setTab] = useState<"pending" | "all">("pending");

  const load = async () => {
    let q = supabase.from("token_requests").select("*, profiles(full_name,email)").order("created_at", { ascending: false }).limit(100);
    if (tab === "pending") q = q.eq("status", "pending");
    const { data } = await q;
    setReqs((data ?? []) as unknown as TR[]);
  };
  useEffect(() => { load(); }, [tab]);
  useEffect(() => {
    const ch = supabase.channel("admin-tr").on("postgres_changes", { event: "*", schema: "public", table: "token_requests" }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tab]);

  const action = async (r: TR, approve: boolean) => {
    const note = window.prompt(approve ? "Optional note:" : "Reason (optional):") ?? "";
    const args = { _req_id: r.id, _admin_note: note || undefined };
    const { error } = approve
      ? await supabase.rpc("approve_token_request", args)
      : await supabase.rpc("deny_token_request", args);
    if (error) toast.error(error.message); else toast.success(approve ? "Approved" : "Denied");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["pending", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1 text-sm font-semibold ${tab === t ? "bg-primary text-primary-foreground" : "glass"}`}>{t}</button>
        ))}
      </div>
      {reqs.length === 0 ? <div className="glass rounded-xl p-8 text-center text-muted-foreground">No requests.</div> :
        <div className="space-y-2">
          {reqs.map((r) => (
            <div key={r.id} className="glass rounded-xl p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                {r.image_url ? (
                  <a href={r.image_url} target="_blank" rel="noreferrer" className="shrink-0">
                    <img src={r.image_url} alt="proof" className="h-24 w-24 rounded-lg object-cover ring-1 ring-white/10" />
                  </a>
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs text-muted-foreground">No proof</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-lg font-extrabold text-gold">{formatTokens(r.amount)}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${r.status === "pending" ? "bg-warning/20 text-warning" : r.status === "approved" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>{r.status}</span>
                  </div>
                  <div className="text-sm font-semibold">{r.profiles?.full_name} <span className="text-xs text-muted-foreground">{r.profiles?.email}</span></div>
                  {r.note && <div className="mt-1 text-xs text-muted-foreground">"{r.note}"</div>}
                  {r.admin_note && <div className="mt-1 text-xs italic text-accent">Admin: {r.admin_note}</div>}
                  <div className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => action(r, true)} className="gap-1 bg-success text-success-foreground hover:bg-success/90"><Check className="h-3.5 w-3.5" /> Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => action(r, false)} className="gap-1"><X className="h-3.5 w-3.5" /> Deny</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>}
    </div>
  );
}

// ---- Roles ----
interface ProfileRow { id: string; full_name: string; email: string | null; phone: string | null; token_balance: number }
const ROLE_OPTIONS = ["admin", "moderator", "gang_leader", "shooter", "registered", "viewer"] as const;

function RolesAdmin() {
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [rolesByUser, setRolesByUser] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState("");

  const load = async () => {
    const [{ data: ps }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone, token_balance").order("created_at", { ascending: false }).limit(100),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setUsers((ps ?? []) as ProfileRow[]);
    const map: Record<string, string[]> = {};
    for (const r of (rs ?? []) as { user_id: string; role: string }[]) (map[r.user_id] ||= []).push(r.role);
    setRolesByUser(map);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (uid: string, role: string, has: boolean) => {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role as "admin");
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: role as "admin" | "moderator" | "gang_leader" | "shooter" | "registered" | "viewer" });
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Role updated");
    load();
  };

  const filtered = users.filter((u) => !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-3">
      <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="glass rounded-xl divide-y divide-white/5">
        {filtered.map((u) => (
          <div key={u.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{u.full_name}</div>
              <div className="text-xs text-muted-foreground">{u.email ?? u.phone} · <span className="font-mono">{formatTokens(u.token_balance)}</span> tokens</div>
            </div>
            <div className="flex flex-wrap gap-1">
              {ROLE_OPTIONS.map((r) => {
                const has = rolesByUser[u.id]?.includes(r);
                return (
                  <button key={r} onClick={() => toggle(u.id, r, !!has)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider transition ${has ? `role-${r}` : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Categories ----
interface Cat { id: string; name: string; slug: string; sort_order: number; icon: string | null }

function CategoriesAdmin() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [name, setName] = useState(""); const [slug, setSlug] = useState("");

  const load = async () => { const { data } = await supabase.from("categories").select("*").order("sort_order"); setCats((data ?? []) as Cat[]); };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name || !slug) return;
    const { error } = await supabase.from("categories").insert({ name, slug, sort_order: cats.length });
    if (error) toast.error(error.message); else { toast.success("Added"); setName(""); setSlug(""); load(); }
  };
  const del = async (id: string) => {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="space-y-3">
      <div className="glass rounded-xl p-4">
        <h3 className="mb-2 font-bold">Add category</h3>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Name (e.g. Football)" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Slug (e.g. football)" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} />
          <Button onClick={add}>Add</Button>
        </div>
      </div>
      <div className="glass rounded-xl divide-y divide-white/5">
        {cats.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3">
            <div><div className="font-semibold">{c.name}</div><div className="text-xs text-muted-foreground">/{c.slug}</div></div>
            <Button size="sm" variant="destructive" onClick={() => del(c.id)}>Delete</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Matches ----
interface Team { id: string; name: string }
interface Mtch { id: string; league: string | null; kickoff_time: string; status: string; home_score: number; away_score: number; match_minute: number | null; winner: string | null; home_team_id: string; away_team_id: string; home_team: { name: string }; away_team: { name: string } }

function MatchesAdmin() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Mtch[]>([]);
  const [home, setHome] = useState(""); const [away, setAway] = useState(""); const [league, setLeague] = useState("");
  const [kickoff, setKickoff] = useState("");

  const load = async () => {
    const [{ data: ts }, { data: ms }] = await Promise.all([
      supabase.from("teams").select("id,name").order("name"),
      supabase.from("matches").select("*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)").order("kickoff_time", { ascending: false }).limit(50),
    ]);
    setTeams((ts ?? []) as Team[]);
    setMatches((ms ?? []) as unknown as Mtch[]);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!home || !away || home === away) { toast.error("Pick two different teams"); return; }
    const ko = kickoff ? new Date(kickoff).toISOString() : new Date(Date.now() + 3600_000).toISOString();
    const { error } = await supabase.from("matches").insert({ home_team_id: home, away_team_id: away, league: league || null, kickoff_time: ko });
    if (error) toast.error(error.message); else { toast.success("Match created"); load(); }
  };

  const update = async (m: Mtch, patch: Record<string, unknown>) => {
    const { error } = await supabase.from("matches").update(patch as never).eq("id", m.id);
    if (error) toast.error(error.message); else load();
  };

  const endMatch = async (m: Mtch) => {
    const winner = m.home_score > m.away_score ? "home" : m.home_score < m.away_score ? "away" : "draw";
    if (!confirm(`End match? Winner: ${winner.toUpperCase()}`)) return;
    await update(m, { status: "ended", winner, ended_at: new Date().toISOString() });
    toast.success(`Match ended — winner: ${winner}`);
  };

  return (
    <div className="space-y-3">
      <div className="glass rounded-xl p-4">
        <h3 className="mb-2 font-bold">Create match</h3>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <select value={home} onChange={(e) => setHome(e.target.value)} className="rounded-md bg-input px-2 py-1.5 text-sm">
            <option value="">Home team…</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={away} onChange={(e) => setAway(e.target.value)} className="rounded-md bg-input px-2 py-1.5 text-sm">
            <option value="">Away team…</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <Input placeholder="League" value={league} onChange={(e) => setLeague(e.target.value)} />
          <Input type="datetime-local" value={kickoff} onChange={(e) => setKickoff(e.target.value)} />
          <Button onClick={create}>Create</Button>
        </div>
      </div>

      <div className="glass rounded-xl divide-y divide-white/5">
        {matches.map((m) => (
          <div key={m.id} className="space-y-2 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold">{m.home_team?.name} vs {m.away_team?.name}</div>
                <div className="text-xs text-muted-foreground">{m.league} · {new Date(m.kickoff_time).toLocaleString()}</div>
              </div>
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${m.status === "live" ? "bg-live/20 text-live" : m.status === "ended" ? "bg-muted text-muted-foreground" : "bg-warning/20 text-warning"}`}>{m.status}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Label className="text-xs">Score</Label>
              <Input type="number" min="0" className="h-8 w-16" value={m.home_score} onChange={(e) => update(m, { home_score: parseInt(e.target.value) || 0 })} />
              <span>–</span>
              <Input type="number" min="0" className="h-8 w-16" value={m.away_score} onChange={(e) => update(m, { away_score: parseInt(e.target.value) || 0 })} />
              <Label className="ml-2 text-xs">Min</Label>
              <Input type="number" min="0" className="h-8 w-16" value={m.match_minute ?? 0} onChange={(e) => update(m, { match_minute: parseInt(e.target.value) || 0 })} />
              <select value={m.status} onChange={(e) => update(m, { status: e.target.value as Mtch["status"] })} className="rounded-md bg-input px-2 py-1 text-xs">
                <option value="upcoming">upcoming</option>
                <option value="live">live</option>
                <option value="ended">ended</option>
                <option value="cancelled">cancelled</option>
              </select>
              {m.status !== "ended" && <Button size="sm" onClick={() => endMatch(m)} className="bg-gold-gradient text-accent-foreground">End match</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Odds Calculator ----
function OddsCalculator() {
  const [legs, setLegs] = useState<{ odds: string }[]>([{ odds: "2.00" }, { odds: "1.80" }]);
  const [stake, setStake] = useState("100");
  const total = legs.reduce((a, l) => a * (parseFloat(l.odds) || 1), 1);
  const stakeNum = parseFloat(stake) || 0;
  const payout = stakeNum * total;
  const profit = payout - stakeNum;
  const cashoutFull = stakeNum + (payout - stakeNum) * 0.5;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass rounded-xl p-4">
        <h3 className="mb-3 font-bold">Inputs</h3>
        <Label>Stake</Label>
        <Input type="number" value={stake} onChange={(e) => setStake(e.target.value)} className="mb-3" />
        <Label>Selections (odds)</Label>
        <div className="space-y-2">
          {legs.map((l, i) => (
            <div key={i} className="flex gap-2">
              <Input type="number" step="0.01" min="1.01" value={l.odds} onChange={(e) => setLegs((p) => p.map((x, j) => j === i ? { odds: e.target.value } : x))} />
              {legs.length > 1 && <Button variant="ghost" size="sm" onClick={() => setLegs((p) => p.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => setLegs((p) => [...p, { odds: "1.50" }])}>+ Add leg</Button>
      </div>
      <div className="space-y-3">
        <CalcStat label="Total odds" value={total.toFixed(2)} />
        <CalcStat label="Potential payout" value={formatTokens(payout)} highlight />
        <CalcStat label="Profit" value={formatTokens(profit)} />
        <CalcStat label="Cashout (full)" value={formatTokens(cashoutFull)} />
        <CalcStat label="Cashout 50%" value={formatTokens(cashoutFull * 0.5)} />
        <CalcStat label="Cashout 25%" value={formatTokens(cashoutFull * 0.25)} />
      </div>
    </div>
  );
}
function CalcStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? "bg-gold-gradient text-accent-foreground" : "glass"}`}>
      <div className={`text-xs uppercase tracking-wider ${highlight ? "" : "text-muted-foreground"}`}>{label}</div>
      <div className="font-mono text-2xl font-black tabular-nums">{value}</div>
    </div>
  );
}

// ---- Audit ----
interface Audit { id: string; admin_id: string; action: string; target_type: string | null; target_id: string | null; metadata: unknown; created_at: string }
function AuditAdmin() {
  const [logs, setLogs] = useState<Audit[]>([]);
  useEffect(() => {
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => setLogs((data ?? []) as Audit[]));
  }, []);
  return (
    <div className="glass rounded-xl divide-y divide-white/5">
      {logs.length === 0 ? <div className="p-8 text-center text-muted-foreground">No logs yet.</div> :
        logs.map((l) => (
          <div key={l.id} className="p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-primary">{l.action}</span>
              <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
            </div>
            <div className="text-xs text-muted-foreground">{l.target_type} · {l.target_id}</div>
            {l.metadata ? <pre className="mt-1 overflow-auto rounded bg-background/40 p-2 text-[11px]">{JSON.stringify(l.metadata, null, 2)}</pre> : null}
          </div>
        ))}
    </div>
  );
}
