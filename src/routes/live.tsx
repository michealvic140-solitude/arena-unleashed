import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/live")({
  head: () => ({ meta: [{ title: "Live matches — LomitaBet" }] }),
  component: LivePage,
});

interface M {
  id: string; league: string | null; home_score: number; away_score: number; match_minute: number | null;
  home_team: { name: string }; away_team: { name: string };
}

function LivePage() {
  const [matches, setMatches] = useState<M[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("matches")
      .select("id, league, home_score, away_score, match_minute, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)")
      .eq("status", "live")
      .order("kickoff_time", { ascending: true });
    setMatches((data ?? []) as unknown as M[]);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("live-feed").on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 flex items-center gap-2 text-2xl font-extrabold">
        <span className="live-dot inline-block h-2.5 w-2.5 rounded-full bg-live" />
        Live now
      </h1>
      {matches.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No live matches right now.</Card>
      ) : (
        <div className="grid gap-2">
          {matches.map((m) => (
            <Link key={m.id} to="/match/$id" params={{ id: m.id }}>
              <Card className="flex items-center justify-between p-4 hover:border-primary">
                <div>
                  <div className="text-xs text-muted-foreground">{m.league}</div>
                  <div className="font-medium">{m.home_team?.name} vs {m.away_team?.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold tabular-nums text-live">{m.home_score} - {m.away_score}</div>
                  <div className="text-xs text-muted-foreground">{m.match_minute ?? 0}'</div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
