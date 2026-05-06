import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Coins, Users, Layers, Trophy, Calculator, ScrollText, Check, X, Ticket, Ban, MicOff, Lock, BarChart3, Megaphone, Settings as SettingsIcon } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatTokens } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { confirmDialog, promptDialog } from "@/components/ConfirmDialog";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — LOMITA SHOOTERS LEAGUE" }] }),
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
          <p className="text-sm text-muted-foreground">Full manual control over LOMITA SHOOTERS LEAGUE.</p>
        </div>
      </div>

      <Tabs defaultValue="tokens">
        <TabsList className="glass mb-4 flex w-full flex-wrap gap-1 bg-transparent">
          <Tab value="tokens" icon={<Coins className="h-4 w-4" />}>Tokens</Tab>
          <Tab value="users" icon={<Users className="h-4 w-4" />}>Users</Tab>
          <Tab value="promos" icon={<Ticket className="h-4 w-4" />}>Promo Codes</Tab>
          <Tab value="roles" icon={<Users className="h-4 w-4" />}>Roles</Tab>
          <Tab value="categories" icon={<Layers className="h-4 w-4" />}>Categories</Tab>
          <Tab value="matches" icon={<Trophy className="h-4 w-4" />}>Matches</Tab>
          <Tab value="calc" icon={<Calculator className="h-4 w-4" />}>Odds Calc</Tab>
          <Tab value="broadcast" icon={<Megaphone className="h-4 w-4" />}>Broadcast</Tab>
          <Tab value="settings" icon={<SettingsIcon className="h-4 w-4" />}>Settings</Tab>
          <Tab value="analytics" icon={<BarChart3 className="h-4 w-4" />}>Analytics</Tab>
          <Tab value="audit" icon={<ScrollText className="h-4 w-4" />}>Audit</Tab>
        </TabsList>
        <TabsContent value="tokens"><TokenRequestsAdmin /></TabsContent>
        <TabsContent value="users"><UsersAdmin /></TabsContent>
        <TabsContent value="promos"><PromoCodesAdmin /></TabsContent>
        <TabsContent value="roles"><RolesAdmin /></TabsContent>
        <TabsContent value="categories"><CategoriesAdmin /></TabsContent>
        <TabsContent value="matches"><MatchesAdmin /></TabsContent>
        <TabsContent value="calc"><OddsCalculator /></TabsContent>
        <TabsContent value="broadcast"><BroadcastAdmin /></TabsContent>
        <TabsContent value="settings"><SettingsAdmin /></TabsContent>
        <TabsContent value="analytics"><AnalyticsAdmin /></TabsContent>
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
    const note = await promptDialog({
      title: approve ? "Approve token request" : "Deny token request",
      description: approve ? "Optional note for the user:" : "Reason (shown to the user):",
      placeholder: approve ? "e.g. Verified payment" : "e.g. Could not verify",
      confirmText: approve ? "Approve" : "Deny",
      destructive: !approve,
    }) ?? "";
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
    if (!(await confirmDialog({ title: "Delete category?", destructive: true, confirmText: "Delete" }))) return;
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
    if (!(await confirmDialog({ title: `End match — winner: ${winner.toUpperCase()}?`, description: "This will settle all open bets on this match.", confirmText: "End & Settle" }))) return;
    const { error } = await supabase.rpc("settle_match", { _match_id: m.id, _winner: winner });
    if (error) toast.error(error.message); else { toast.success(`Match ended — winner: ${winner}`); load(); }
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

// ---- Users Management ----
interface FullProfile {
  id: string; full_name: string; email: string | null; phone: string | null;
  token_balance: number; is_banned: boolean; is_muted: boolean; is_restricted: boolean;
  ban_reason: string | null; mute_reason: string | null; restrict_reason: string | null;
  country: string | null; gang_faction: string | null; gang_type: string | null; server: string;
}

function UsersAdmin() {
  const [users, setUsers] = useState<FullProfile[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "banned" | "muted" | "restricted">("all");

  const load = async () => {
    const { data } = await supabase.from("profiles")
      .select("id, full_name, email, phone, token_balance, is_banned, is_muted, is_restricted, ban_reason, mute_reason, restrict_reason, country, gang_faction, gang_type, server")
      .order("created_at", { ascending: false }).limit(200);
    setUsers((data ?? []) as FullProfile[]);
  };
  useEffect(() => { load(); }, []);

  const grant = async (u: FullProfile) => {
    const amtStr = await promptDialog({ title: `Grant tokens to ${u.full_name}`, description: "Use a negative number to remove.", placeholder: "e.g. 1000000" });
    if (!amtStr) return;
    const amt = parseFloat(amtStr);
    if (!amt) { toast.error("Invalid amount"); return; }
    const note = await promptDialog({ title: "Reason (optional)", placeholder: "e.g. Promo grant" }) ?? "";
    const { error } = await supabase.rpc("admin_grant_tokens", { _user_id: u.id, _amount: amt, _note: note || undefined });
    if (error) toast.error(error.message); else { toast.success("Updated"); load(); }
  };
  const ban = async (u: FullProfile) => {
    const next = !u.is_banned;
    const reason = next ? (await promptDialog({ title: "Ban reason", multiline: true, destructive: true, confirmText: "Ban user" })) : null;
    if (next && !reason) return;
    const { error } = await supabase.rpc("admin_ban_user", { _user_id: u.id, _ban: next, _reason: reason ?? undefined });
    if (error) toast.error(error.message); else { toast.success(next ? "Banned" : "Unbanned"); load(); }
  };
  const mute = async (u: FullProfile) => {
    const next = !u.is_muted;
    const reason = next ? (await promptDialog({ title: "Mute reason", placeholder: "Why?" })) : null;
    if (next && reason === null) return;
    const { error } = await supabase.rpc("admin_mute_user", { _user_id: u.id, _mute: next, _reason: reason ?? undefined });
    if (error) toast.error(error.message); else { toast.success(next ? "Muted" : "Unmuted"); load(); }
  };
  const restrict = async (u: FullProfile) => {
    const next = !u.is_restricted;
    const reason = next ? (await promptDialog({ title: "Restrict betting reason", placeholder: "Why?" })) : null;
    if (next && reason === null) return;
    const { error } = await supabase.rpc("admin_restrict_user", { _user_id: u.id, _restrict: next, _reason: reason ?? undefined });
    if (error) toast.error(error.message); else { toast.success(next ? "Restricted" : "Unrestricted"); load(); }
  };

  const filtered = users.filter((u) => {
    if (filter === "banned" && !u.is_banned) return false;
    if (filter === "muted" && !u.is_muted) return false;
    if (filter === "restricted" && !u.is_restricted) return false;
    if (search) {
      const s = search.toLowerCase();
      return u.full_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.gang_faction?.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search name, email or faction…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        {(["all", "banned", "muted", "restricted"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${filter === f ? "bg-primary text-primary-foreground" : "glass"}`}>{f}</button>
        ))}
      </div>
      <div className="glass rounded-xl divide-y divide-white/5">
        {filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">No users.</div> :
          filtered.map((u) => (
            <div key={u.id} className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{u.full_name}</span>
                  {u.is_banned && <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-destructive">BANNED</span>}
                  {u.is_muted && <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-warning">MUTED</span>}
                  {u.is_restricted && <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">RESTRICTED</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {u.email ?? u.phone ?? "—"} · {u.gang_faction ?? "no faction"} ({u.gang_type ?? "?"}) · {u.country ?? "—"} · <span className="font-mono text-gold">{formatTokens(u.token_balance)}</span>
                </div>
                {u.ban_reason && <div className="mt-0.5 text-[11px] italic text-destructive">Ban: {u.ban_reason}</div>}
                {u.mute_reason && <div className="mt-0.5 text-[11px] italic text-warning">Mute: {u.mute_reason}</div>}
                {u.restrict_reason && <div className="mt-0.5 text-[11px] italic text-primary">Restrict: {u.restrict_reason}</div>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={() => grant(u)} className="gap-1"><Coins className="h-3.5 w-3.5" />Tokens</Button>
                <Button size="sm" variant={u.is_muted ? "secondary" : "outline"} onClick={() => mute(u)} className="gap-1"><MicOff className="h-3.5 w-3.5" />{u.is_muted ? "Unmute" : "Mute"}</Button>
                <Button size="sm" variant={u.is_restricted ? "secondary" : "outline"} onClick={() => restrict(u)} className="gap-1"><Lock className="h-3.5 w-3.5" />{u.is_restricted ? "Unrestrict" : "Restrict"}</Button>
                <Button size="sm" variant={u.is_banned ? "secondary" : "destructive"} onClick={() => ban(u)} className="gap-1"><Ban className="h-3.5 w-3.5" />{u.is_banned ? "Unban" : "Ban"}</Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ---- Promo Codes ----
interface Promo { id: string; code: string; amount: number; uses: number; max_uses: number; expires_at: string | null; is_active: boolean; note: string | null; created_at: string }

function PromoCodesAdmin() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [code, setCode] = useState(""); const [amount, setAmount] = useState("");
  const [maxUses, setMaxUses] = useState("1"); const [expires, setExpires] = useState(""); const [note, setNote] = useState("");

  const load = async () => { const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false }).limit(100); setPromos((data ?? []) as Promo[]); };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const amt = parseFloat(amount); const mu = parseInt(maxUses) || 1;
    if (!code || !amt) { toast.error("Code and amount required"); return; }
    const { error } = await supabase.from("promo_codes").insert({
      code: code.toUpperCase(), amount: amt, max_uses: mu,
      expires_at: expires ? new Date(expires).toISOString() : null,
      note: note || null,
    });
    if (error) toast.error(error.message); else {
      toast.success("Promo created");
      setCode(""); setAmount(""); setMaxUses("1"); setExpires(""); setNote(""); load();
    }
  };
  const toggle = async (p: Promo) => {
    const { error } = await supabase.from("promo_codes").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) toast.error(error.message); else load();
  };
  const del = async (p: Promo) => {
    if (!(await confirmDialog({ title: `Delete code ${p.code}?`, destructive: true, confirmText: "Delete" }))) return;
    const { error } = await supabase.from("promo_codes").delete().eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <div className="space-y-3">
      <div className="glass rounded-xl p-4">
        <h3 className="mb-3 font-bold">Generate promo code</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Input placeholder="CODE (e.g. WELCOME)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <Input type="number" placeholder="Token amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input type="number" min="1" placeholder="Max uses" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
          <Input type="datetime-local" placeholder="Expires" value={expires} onChange={(e) => setExpires(e.target.value)} />
          <Button onClick={create} className="bg-gold-gradient text-accent-foreground">Create</Button>
        </div>
        <Textarea className="mt-2" placeholder="Internal note (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </div>
      <div className="glass rounded-xl divide-y divide-white/5">
        {promos.length === 0 ? <div className="p-8 text-center text-muted-foreground">No promo codes yet.</div> :
          promos.map((p) => (
            <div key={p.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-black text-gold">{p.code}</span>
                  <span className="font-mono font-bold">{formatTokens(p.amount)}</span>
                  {!p.is_active && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase">disabled</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.uses}/{p.max_uses} used · {p.expires_at ? `expires ${new Date(p.expires_at).toLocaleString()}` : "no expiry"}
                </div>
                {p.note && <div className="text-[11px] italic text-muted-foreground">{p.note}</div>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggle(p)}>{p.is_active ? "Disable" : "Enable"}</Button>
                <Button size="sm" variant="destructive" onClick={() => del(p)}>Delete</Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ---- Broadcast Notifications ----
function BroadcastAdmin() {
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [link, setLink] = useState("");
  const [scope, setScope] = useState<"all" | "shooters" | "gang_leaders">("all");
  const [sending, setSending] = useState(false);
  const [recent, setRecent] = useState<Array<{ id: string; title: string; body: string | null; created_at: string }>>([]);

  const loadRecent = async () => {
    const { data } = await supabase.from("notifications").select("id,title,body,created_at").order("created_at", { ascending: false }).limit(20);
    setRecent((data ?? []) as typeof recent);
  };
  useEffect(() => { loadRecent(); }, []);

  const send = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setSending(true);
    try {
      let userIds: string[] = [];
      if (scope === "all") {
        const { data } = await supabase.from("profiles").select("id").eq("is_banned", false);
        userIds = (data ?? []).map((p) => p.id);
      } else {
        const role = scope === "shooters" ? "shooter" : "gang_leader";
        const { data } = await supabase.from("user_roles").select("user_id").eq("role", role);
        userIds = (data ?? []).map((r) => r.user_id);
      }
      if (!userIds.length) { toast.error("No recipients"); return; }
      const rows = userIds.map((uid) => ({ user_id: uid, title: title.trim(), body: body.trim() || null, link: link.trim() || null }));
      // chunk to avoid payload size limits
      for (let i = 0; i < rows.length; i += 500) {
        const { error } = await supabase.from("notifications").insert(rows.slice(i, i + 500));
        if (error) throw error;
      }
      toast.success(`Sent to ${userIds.length} users`);
      setTitle(""); setBody(""); setLink(""); loadRecent();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-3">
      <div className="glass rounded-xl p-4">
        <h3 className="mb-3 font-bold">Broadcast notification</h3>
        <div className="grid gap-2">
          <Input placeholder="Title (e.g. New event tonight!)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Body / message" value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
          <Input placeholder="Link (optional, e.g. /live)" value={link} onChange={(e) => setLink(e.target.value)} />
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-xs">Audience:</Label>
            {(["all", "shooters", "gang_leaders"] as const).map((s) => (
              <button key={s} onClick={() => setScope(s)} className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${scope === s ? "bg-primary text-primary-foreground" : "glass"}`}>{s.replace("_", " ")}</button>
            ))}
            <Button onClick={send} disabled={sending} className="ml-auto bg-gold-gradient text-accent-foreground">{sending ? "Sending…" : "Send"}</Button>
          </div>
        </div>
      </div>
      <div className="glass rounded-xl divide-y divide-white/5">
        <div className="p-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent notifications</div>
        {recent.length === 0 ? <div className="p-6 text-center text-muted-foreground text-sm">No notifications yet.</div> :
          recent.map((n) => (
            <div key={n.id} className="p-3 text-sm">
              <div className="font-semibold">{n.title}</div>
              {n.body && <div className="text-xs text-muted-foreground">{n.body}</div>}
              <div className="text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ---- Platform Settings ----
function SettingsAdmin() {
  const [s, setS] = useState<{ maintenance_mode: boolean; maintenance_message: string | null; max_payout: number; min_stake: number; max_stake: number; contact_email: string | null; contact_phone: string | null; contact_whatsapp: string | null; contact_sms: string | null; about_us: string | null; why_trust_us: string | null } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => setS(data as typeof s));
  }, []);

  const save = async () => {
    if (!s) return;
    setSaving(true);
    const { error } = await supabase.from("platform_settings").update({
      maintenance_mode: s.maintenance_mode,
      maintenance_message: s.maintenance_message,
      max_payout: s.max_payout, min_stake: s.min_stake, max_stake: s.max_stake,
      contact_email: s.contact_email, contact_phone: s.contact_phone,
      contact_whatsapp: s.contact_whatsapp, contact_sms: s.contact_sms,
      about_us: s.about_us, why_trust_us: s.why_trust_us,
    }).eq("id", 1);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Settings saved");
  };

  if (!s) return <div className="glass rounded-xl p-8 text-center text-muted-foreground">Loading…</div>;
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS({ ...s, [k]: v });

  return (
    <div className="space-y-3">
      <div className="glass-strong rounded-xl p-4">
        <h3 className="mb-3 font-bold">Maintenance mode</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={s.maintenance_mode} onChange={(e) => set("maintenance_mode", e.target.checked)} />
          <span>Block all user actions and show maintenance notice</span>
        </label>
        <Textarea className="mt-2" placeholder="Maintenance message" value={s.maintenance_message ?? ""} onChange={(e) => set("maintenance_message", e.target.value)} rows={2} />
      </div>
      <div className="glass rounded-xl p-4">
        <h3 className="mb-3 font-bold">Bet limits</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <div><Label>Min stake</Label><Input type="number" value={s.min_stake} onChange={(e) => set("min_stake", parseFloat(e.target.value) || 0)} /></div>
          <div><Label>Max stake</Label><Input type="number" value={s.max_stake} onChange={(e) => set("max_stake", parseFloat(e.target.value) || 0)} /></div>
          <div><Label>Max payout</Label><Input type="number" value={s.max_payout} onChange={(e) => set("max_payout", parseFloat(e.target.value) || 0)} /></div>
        </div>
      </div>
      <div className="glass rounded-xl p-4">
        <h3 className="mb-3 font-bold">Contact info (footer)</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <div><Label>Email</Label><Input value={s.contact_email ?? ""} onChange={(e) => set("contact_email", e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={s.contact_phone ?? ""} onChange={(e) => set("contact_phone", e.target.value)} /></div>
          <div><Label>WhatsApp</Label><Input value={s.contact_whatsapp ?? ""} onChange={(e) => set("contact_whatsapp", e.target.value)} /></div>
          <div><Label>SMS</Label><Input value={s.contact_sms ?? ""} onChange={(e) => set("contact_sms", e.target.value)} /></div>
        </div>
      </div>
      <div className="glass rounded-xl p-4">
        <h3 className="mb-3 font-bold">About / Why trust us</h3>
        <div className="grid gap-2">
          <div><Label>About Us</Label><Textarea rows={3} value={s.about_us ?? ""} onChange={(e) => set("about_us", e.target.value)} /></div>
          <div><Label>Why Trust Us</Label><Textarea rows={3} value={s.why_trust_us ?? ""} onChange={(e) => set("why_trust_us", e.target.value)} /></div>
        </div>
      </div>
      <Button onClick={save} disabled={saving} className="bg-gold-gradient text-accent-foreground">{saving ? "Saving…" : "Save settings"}</Button>
    </div>
  );
}

// ---- Analytics ----
function AnalyticsAdmin() {
  const [stats, setStats] = useState<{ users: number; openBets: number; wonBets: number; lostBets: number; revenue: number; payouts: number } | null>(null);
  const [daily, setDaily] = useState<Array<{ day: string; staked: number; payout: number; net: number }>>([]);
  const [outcome, setOutcome] = useState<Array<{ name: string; value: number; color: string }>>([]);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 86400_000).toISOString();
      const [{ count: users }, { data: bets }, { data: tx }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("bets").select("status, stake, payout, created_at").gte("created_at", since).limit(5000),
        supabase.from("transactions").select("type, amount, created_at").gte("created_at", since).limit(5000),
      ]);
      const open = (bets ?? []).filter((b) => b.status === "open").length;
      const won = (bets ?? []).filter((b) => b.status === "won").length;
      const lost = (bets ?? []).filter((b) => b.status === "lost").length;
      const totalStaked = (tx ?? []).filter((t) => t.type === "bet_stake").reduce((a, t) => a + Math.abs(Number(t.amount)), 0);
      const totalPayouts = (tx ?? []).filter((t) => t.type === "bet_payout" || t.type === "cashout").reduce((a, t) => a + Number(t.amount), 0);
      setStats({ users: users ?? 0, openBets: open, wonBets: won, lostBets: lost, revenue: totalStaked - totalPayouts, payouts: totalPayouts });

      const byDay: Record<string, { staked: number; payout: number }> = {};
      for (const b of bets ?? []) {
        const d = (b.created_at as string).slice(0, 10);
        byDay[d] = byDay[d] || { staked: 0, payout: 0 };
        byDay[d].staked += Number(b.stake);
        if (b.status === "won") byDay[d].payout += Number(b.payout ?? 0);
      }
      const daysArr = Object.entries(byDay)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([day, v]) => ({ day: day.slice(5), staked: Math.round(v.staked), payout: Math.round(v.payout), net: Math.round(v.staked - v.payout) }));
      setDaily(daysArr);

      setOutcome([
        { name: "Won", value: won, color: "oklch(0.78 0.18 150)" },
        { name: "Lost", value: lost, color: "oklch(0.62 0.22 27)" },
        { name: "Open", value: open, color: "oklch(0.83 0.16 88)" },
      ]);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total users" value={String(stats?.users ?? "…")} />
        <Stat label="Open bets" value={String(stats?.openBets ?? "…")} />
        <Stat label="Won / Lost" value={`${stats?.wonBets ?? 0} / ${stats?.lostBets ?? 0}`} />
        <Stat label="Net revenue (30d)" value={stats ? formatTokens(stats.revenue) : "…"} highlight />
      </div>

      <div className="glass-strong rounded-2xl p-4">
        <h3 className="mb-3 font-bold">Daily revenue (last 30 days)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.97 0.005 100 / 0.1)" />
              <XAxis dataKey="day" stroke="oklch(0.72 0.015 260)" fontSize={11} />
              <YAxis stroke="oklch(0.72 0.015 260)" fontSize={11} />
              <Tooltip contentStyle={{ background: "oklch(0.13 0.015 260)", border: "1px solid oklch(0.97 0.005 100 / 0.1)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="staked" stroke="oklch(0.83 0.16 88)" strokeWidth={2} dot={false} name="Staked" />
              <Line type="monotone" dataKey="payout" stroke="oklch(0.62 0.22 27)" strokeWidth={2} dot={false} name="Payouts" />
              <Line type="monotone" dataKey="net" stroke="oklch(0.72 0.18 155)" strokeWidth={2.5} dot={false} name="Net" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-strong rounded-2xl p-4">
          <h3 className="mb-3 font-bold">Bets staked per day</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.97 0.005 100 / 0.1)" />
                <XAxis dataKey="day" stroke="oklch(0.72 0.015 260)" fontSize={11} />
                <YAxis stroke="oklch(0.72 0.015 260)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.13 0.015 260)", border: "1px solid oklch(0.97 0.005 100 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="staked" fill="oklch(0.72 0.18 155)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-strong rounded-2xl p-4">
          <h3 className="mb-3 font-bold">Won vs Lost vs Open</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={outcome} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {outcome.map((o, i) => <Cell key={i} fill={o.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.13 0.015 260)", border: "1px solid oklch(0.97 0.005 100 / 0.1)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            {outcome.map((o) => (
              <span key={o.name} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: o.color }} /> {o.name}: <b>{o.value}</b></span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${highlight ? "bg-gold-gradient text-accent-foreground" : "glass-strong"}`}>
      <div className={`text-[11px] uppercase tracking-widest ${highlight ? "" : "text-muted-foreground"}`}>{label}</div>
      <div className="mt-1 font-mono text-2xl font-black tabular-nums">{value}</div>
    </div>
  );
}
