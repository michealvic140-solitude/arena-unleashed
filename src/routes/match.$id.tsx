import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Countdown } from "@/components/Countdown";
import { useBetSlip } from "@/lib/betslip";

export const Route = createFileRoute("/match/$id")({
  head: () => ({ meta: [{ title: "Match — SHOOTERS BET" }] }),
  component: MatchPage,
});

interface MatchData {
  id: string; league: string | null; kickoff_time: string; status: string;
  home_score: number; away_score: number; match_minute: number | null;
  home_team_id: string; away_team_id: string;
  home_team: { id: string; name: string; logo_url: string | null };
  away_team: { id: string; name: string; logo_url: string | null };
}
interface Player { id: string; name: string; jersey_number: number | null; position: string | null; team_id: string; squad_type: "main" | "sub" }
interface Odd { market: string; selection: string; value: number }

function MatchPage() {
  const { id } = Route.useParams();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [odds, setOdds] = useState<Odd[]>([]);
  const { add, has, remove } = useBetSlip();

  const load = async () => {
    const { data: m } = await supabase
      .from("matches")
      .select("*, home_team:teams!matches_home_team_id_fkey(id,name,logo_url), away_team:teams!matches_away_team_id_fkey(id,name,logo_url)")
      .eq("id", id).maybeSingle();
    setMatch(m as unknown as MatchData);
    const [{ data: ps }, { data: os }] = await Promise.all([
      supabase.from("players").select("*").eq("match_id", id),
      supabase.from("odds").select("market, selection, value").eq("match_id", id).eq("is_active", true),
    ]);
    setPlayers((ps ?? []) as Player[]);
    setOdds((os ?? []) as Odd[]);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel(`match:${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches", filter: `id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "odds", filter: `match_id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `match_id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const oddsByMarket = useMemo(() => {
    const map: Record<string, Odd[]> = {};
    for (const o of odds) (map[o.market] ||= []).push(o);
    return map;
  }, [odds]);

  if (!match) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  const homeMain = players.filter((p) => p.team_id === match.home_team_id && p.squad_type === "main");
  const homeSub = players.filter((p) => p.team_id === match.home_team_id && p.squad_type === "sub");
  const awayMain = players.filter((p) => p.team_id === match.away_team_id && p.squad_type === "main");
  const awaySub = players.filter((p) => p.team_id === match.away_team_id && p.squad_type === "sub");
  const isLive = match.status === "live";
  const isUpcoming = match.status === "upcoming";
  const matchLabel = `${match.home_team.name} vs ${match.away_team.name}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>

      <div className="mt-3 glass-strong rounded-2xl p-6">
        <div className="text-center text-xs font-semibold uppercase tracking-wider text-gold">{match.league}</div>
        <div className="mt-3 grid grid-cols-3 items-center gap-4">
          <TeamBlock name={match.home_team.name} logo={match.home_team.logo_url} />
          <div className="text-center">
            {isLive ? (
              <>
                <div className="font-mono text-5xl font-black tabular-nums text-live">{match.home_score} - {match.away_score}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-wider text-live">{match.match_minute ?? 0}' Live</div>
              </>
            ) : isUpcoming ? (
              <Countdown to={match.kickoff_time} />
            ) : match.status === "ended" ? (
              <>
                <div className="font-mono text-5xl font-black tabular-nums">{match.home_score} - {match.away_score}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Time</div>
              </>
            ) : (
              <div className="text-sm uppercase text-muted-foreground">{match.status}</div>
            )}
          </div>
          <TeamBlock name={match.away_team.name} logo={match.away_team.logo_url} />
        </div>
      </div>

      <h2 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Markets</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {Object.entries(oddsByMarket).map(([market, list]) => (
          <div key={market} className="glass rounded-xl p-4">
            <div className="mb-2 text-sm font-bold">{market}</div>
            <div className="grid grid-cols-3 gap-2">
              {list.map((o) => {
                const active = has(match.id, market, o.selection);
                return (
                  <button
                    key={o.selection}
                    onClick={() => active ? remove(match.id, market) : add({ match_id: match.id, match_label: matchLabel, market, selection: o.selection, odds_value: Number(o.value) })}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                      active ? "bg-gold-gradient text-accent-foreground shadow-[var(--shadow-gold)]" : "bg-secondary/60 hover:bg-primary/10"
                    }`}
                  >
                    <span className={active ? "font-bold" : "text-muted-foreground"}>{o.selection}</span>
                    <span className="font-mono font-bold tabular-nums">{Number(o.value).toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {odds.length === 0 && <div className="glass rounded-xl p-6 text-center text-sm text-muted-foreground md:col-span-2">No odds posted yet.</div>}
      </div>

      <h2 className="mt-6 mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        <Users className="h-4 w-4" /> Squads
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        <SquadCard team={match.home_team.name} main={homeMain} sub={homeSub} />
        <SquadCard team={match.away_team.name} main={awayMain} sub={awaySub} />
      </div>
    </div>
  );
}

function TeamBlock({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-20 w-20 items-center justify-center rounded-full glass-gold shadow-[var(--shadow-gold)]">
        {logo ? <img src={logo} alt={name} className="h-14 w-14 object-contain" /> : <span className="text-2xl font-black text-gold">{name.slice(0, 2).toUpperCase()}</span>}
      </div>
      <div className="text-center text-sm font-bold">{name}</div>
    </div>
  );
}

function SquadCard({ team, main, sub }: { team: string; main: Player[]; sub: Player[] }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="mb-2 text-sm font-bold">{team}</div>
      <div className="text-xs font-bold uppercase tracking-wider text-gold">Starting XI</div>
      <ul className="mt-1 mb-3 space-y-0.5 text-sm">
        {main.length === 0 ? <li className="text-muted-foreground italic">Not yet posted</li> :
          main.map((p) => <PlayerRow key={p.id} p={p} />)}
      </ul>
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Substitutes</div>
      <ul className="mt-1 space-y-0.5 text-sm">
        {sub.length === 0 ? <li className="text-muted-foreground italic">—</li> :
          sub.map((p) => <PlayerRow key={p.id} p={p} />)}
      </ul>
    </div>
  );
}

function PlayerRow({ p }: { p: Player }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2">
        {p.jersey_number != null && <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-secondary text-[10px] font-bold tabular-nums">{p.jersey_number}</span>}
        <span>{p.name}</span>
      </span>
      {p.position && <span className="text-xs text-muted-foreground">{p.position}</span>}
    </li>
  );
}
