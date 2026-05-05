import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Flame, Trophy, Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Countdown } from "@/components/Countdown";
import { useBetSlip } from "@/lib/betslip";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SHOOTERS BET — Luxury Virtual Sports Betting" },
      { name: "description", content: "Browse upcoming and live matches. Bet using virtual tokens. Cashout anytime." },
    ],
  }),
  component: HomePage,
});

interface Category { id: string; name: string; slug: string }
interface Match {
  id: string;
  league: string | null;
  kickoff_time: string;
  status: "upcoming" | "live" | "ended" | "cancelled";
  home_score: number;
  away_score: number;
  match_minute: number | null;
  home_team: { name: string; short_name: string | null };
  away_team: { name: string; short_name: string | null };
}
interface Odd { match_id: string; market: string; selection: string; value: number }

function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string>("popular");
  const [matches, setMatches] = useState<Match[]>([]);
  const [odds, setOdds] = useState<Odd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => {
      setCategories((data ?? []) as Category[]);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const cat = categories.find((c) => c.slug === activeCat);
      let q = supabase
        .from("matches")
        .select("id, league, kickoff_time, status, home_score, away_score, match_minute, home_team:teams!matches_home_team_id_fkey(name,short_name), away_team:teams!matches_away_team_id_fkey(name,short_name), match_categories!inner(category_id)")
        .order("kickoff_time", { ascending: true })
        .in("status", ["upcoming", "live"]);
      if (cat) q = q.eq("match_categories.category_id", cat.id);
      const { data: ms } = await q;
      const list = (ms ?? []) as unknown as Match[];
      setMatches(list);
      if (list.length) {
        const ids = list.map((m) => m.id);
        const { data: os } = await supabase.from("odds").select("match_id, market, selection, value").in("match_id", ids).eq("is_active", true);
        setOdds((os ?? []) as Odd[]);
      } else {
        setOdds([]);
      }
      setLoading(false);
    })();
  }, [activeCat, categories]);

  useEffect(() => {
    const ch = supabase.channel("odds-feed").on("postgres_changes", { event: "*", schema: "public", table: "odds" }, () => {
      const ids = matches.map((m) => m.id);
      if (!ids.length) return;
      supabase.from("odds").select("match_id, market, selection, value").in("match_id", ids).eq("is_active", true).then(({ data }) => setOdds((data ?? []) as Odd[]));
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [matches]);

  const oddsByMatch = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const o of odds) {
      if (o.market !== "1X2") continue;
      map[o.match_id] = map[o.match_id] || {};
      map[o.match_id][o.selection] = Number(o.value);
    }
    return map;
  }, [odds]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Hero */}
      <section className="mb-8 overflow-hidden rounded-2xl glass-strong relative">
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl float-y" />
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl float-y" style={{ animationDelay: "1.5s" }} />
        <div className="relative grid gap-4 px-6 py-8 sm:grid-cols-[1fr_auto] sm:items-center sm:px-10 sm:py-12">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full glass-gold px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
              <Sparkles className="h-3 w-3" /> Luxury edition
            </div>
            <h1 className="text-3xl font-black leading-tight sm:text-5xl">
              <span className="brand">Bet smart.</span> <span className="text-primary">Win bigger.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
              Live odds, instant cashout, AI-powered support — all powered by virtual tokens. No real money, just the thrill.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/tokens" className="rounded-lg bg-gold-gradient px-5 py-2.5 text-sm font-bold text-accent-foreground shadow-[var(--shadow-gold)] transition hover:scale-[1.03]">
                Get tokens
              </Link>
              <Link to="/live" className="rounded-lg glass px-5 py-2.5 text-sm font-bold transition hover:bg-white/10">
                <span className="live-dot mr-2 inline-block h-2 w-2 rounded-full bg-live align-middle" />
                Live now
              </Link>
            </div>
          </div>
          <Trophy className="hidden h-32 w-32 text-accent/40 sm:block float-y" />
        </div>
      </section>

      {/* Category tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button key={c.id} onClick={() => setActiveCat(c.slug)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              activeCat === c.slug
                ? "bg-gold-gradient text-accent-foreground shadow-[var(--shadow-gold)]"
                : "glass text-muted-foreground hover:text-foreground"
            }`}>
            {c.slug === "popular" && <Flame className="mr-1 inline h-3.5 w-3.5" />}
            {c.name}
          </button>
        ))}
      </div>

      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        <TrendingUp className="h-4 w-4 text-primary" /> Today's matches
      </h2>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-24 animate-pulse rounded-xl glass" />))}</div>
      ) : matches.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">No matches in this category yet.</div>
      ) : (
        <div className="space-y-2">
          {matches.map((m, i) => <MatchRow key={m.id} m={m} odds={oddsByMatch[m.id] ?? {}} delay={i * 30} />)}
        </div>
      )}
    </div>
  );
}

function MatchRow({ m, odds, delay }: { m: Match; odds: Record<string, number>; delay: number }) {
  const isLive = m.status === "live";
  const matchLabel = `${m.home_team?.name ?? "Home"} vs ${m.away_team?.name ?? "Away"}`;
  return (
    <div className="rise-in glass rounded-xl p-3 transition hover:border-primary/40 hover:shadow-[var(--shadow-elegant)]" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link to="/match/$id" params={{ id: m.id }} className="flex min-w-0 flex-1 items-center gap-3">
          <div className="w-20 shrink-0 text-xs text-muted-foreground">
            {m.league && <div className="truncate font-semibold text-foreground/80">{m.league}</div>}
            {isLive ? (
              <div className="mt-0.5 flex items-center gap-1">
                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-live" />
                <span className="font-bold text-live">{m.match_minute ?? 0}'</span>
              </div>
            ) : (
              <Countdown to={m.kickoff_time} compact />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Row label={m.home_team?.name ?? "Home"} score={isLive ? m.home_score : undefined} />
            <Row label={m.away_team?.name ?? "Away"} score={isLive ? m.away_score : undefined} />
          </div>
        </Link>
        <div className="grid grid-cols-3 gap-1.5 sm:w-72">
          <OddBox match_id={m.id} match_label={matchLabel} market="1X2" selection="1" value={odds["1"]} />
          <OddBox match_id={m.id} match_label={matchLabel} market="1X2" selection="X" value={odds["X"]} />
          <OddBox match_id={m.id} match_label={matchLabel} market="1X2" selection="2" value={odds["2"]} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, score }: { label: string; score?: number }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5 text-sm">
      <span className="truncate font-semibold">{label}</span>
      {typeof score === "number" && <span className="font-mono font-extrabold tabular-nums text-live">{score}</span>}
    </div>
  );
}

function OddBox({ match_id, match_label, market, selection, value }: { match_id: string; match_label: string; market: string; selection: string; value?: number }) {
  const { add, has, remove } = useBetSlip();
  const active = value != null && has(match_id, market, selection);
  const onClick = () => {
    if (value == null) return;
    if (active) remove(match_id, market);
    else add({ match_id, match_label, market, selection, odds_value: value });
  };
  return (
    <button
      onClick={onClick}
      disabled={value == null}
      className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition disabled:opacity-50 ${
        active ? "bg-gold-gradient text-accent-foreground shadow-[var(--shadow-gold)]" : "glass hover:bg-primary/10 hover:border-primary/40"
      }`}
    >
      <span className={active ? "font-bold" : "text-muted-foreground"}>{selection}</span>
      <span className="font-mono font-bold tabular-nums">{value?.toFixed(2) ?? "—"}</span>
    </button>
  );
}
