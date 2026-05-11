import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Star, PartyPopper } from "lucide-react";
import { Link } from "react-router-dom";
import ShareButton from "@/components/ShareButton";

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  points: number;
  avatar_url: string | null;
}

interface TeamRow {
  id: string;
  name: string;
  vote_count: number;
}

interface TopEvent {
  id: string; title: string; event_type: string; venue: string | null;
  event_date: string; checkin_count: number; rating_count: number; avg_rating: number;
}

const medals = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, points, avatar_url")
        .order("points", { ascending: false })
        .limit(50);
      if (data) setEntries(data);
    };
    load();

    supabase
      .from("top_events" as never)
      .select("*")
      .order("checkin_count", { ascending: false })
      .order("avg_rating", { ascending: false })
      .limit(20)
      .then(({ data }: any) => data && setTopEvents(data));
  }, []);

  const loadTeams = async () => {
    const { data } = await supabase
      .from("team_vote_counts" as never)
      .select("id, name, vote_count")
      .order("vote_count", { ascending: false }) as { data: TeamRow[] | null };
    if (data) setTeams(data);
  };

  useEffect(() => {
    loadTeams();
    const interval = setInterval(loadTeams, 7000);
    const channel = supabase
      .channel("votes-live-lb")
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => loadTeams())
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const myEntry = entries.find(e => e.user_id === user?.id);
  const myRank = myEntry ? entries.indexOf(myEntry) + 1 : null;
  const totalVotes = teams.reduce((s, r) => s + r.vote_count, 0);
  const maxVotes = Math.max(1, ...teams.map(r => r.vote_count));

  return (
    <AppLayout>
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="pt-2 text-center">
          <Trophy className="w-10 h-10 mx-auto text-yellow-500 mb-2" />
          <h1 className="font-display text-2xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground text-sm">Top explorers & team standings</p>
        </div>

        <Tabs defaultValue="explorers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="explorers">Explorers</TabsTrigger>
            <TabsTrigger value="teams">Keep Seleteng Alive</TabsTrigger>
          </TabsList>

          <TabsContent value="explorers" className="space-y-3 mt-4">
            {myEntry && myRank && (
              <div className="flex justify-center">
                <ShareButton
                  title="My Zartour Ranking"
                  text={`I'm ranked #${myRank} on Zartour with ${myEntry.points} points! 🏆 Join me and earn points too:`}
                  url={`${window.location.origin}/auth?ref=${user?.id}`}
                />
              </div>
            )}
            <div className="space-y-2">
              {entries.map((entry, i) => {
                const isMe = entry.user_id === user?.id;
                return (
                  <Card key={entry.user_id} className={isMe ? "ring-2 ring-primary" : ""}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <span className="text-lg font-display font-bold w-8 text-center">
                        {i < 3 ? medals[i] : `${i + 1}`}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {entry.full_name?.[0] ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {entry.full_name || "Explorer"}
                          {isMe && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
                        </p>
                      </div>
                      <span className="font-display font-bold text-secondary">{entry.points}</span>
                      <span className="text-xs text-muted-foreground">pts</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="teams" className="space-y-2 mt-4">
            <p className="text-xs text-center text-muted-foreground">
              {totalVotes.toLocaleString()} total votes • live updates
            </p>
            {teams.length > 0 && (
              <div className="flex justify-center pb-1">
                <ShareButton
                  title="Keep Seleteng Alive — Standings"
                  text={`🏆 Keep Seleteng Alive (Kgomumg) standings:\n${teams.slice(0, 5).map((t, i) => `${medals[i] ?? `#${i + 1}`} ${t.name} — ${t.vote_count} votes`).join("\n")}\n\nVote for your team:`}
                  url={`${window.location.origin}/vote${user ? `?ref=${user.id}` : ""}`}
                />
              </div>
            )}
            {teams.map((r, i) => {
              const pct = totalVotes > 0 ? (r.vote_count / totalVotes) * 100 : 0;
              const barPct = (r.vote_count / maxVotes) * 100;
              const isTop5 = i < 5;
              const medal = medals[i];
              return (
                <Card key={r.id} className={isTop5 ? "border-secondary/50 shadow-md" : ""}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="font-display font-bold w-8 text-center text-lg">
                        {medal ?? `#${i + 1}`}
                      </span>
                      <span className="flex-1 font-semibold text-sm flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{r.name}</span>
                        {i === 0 && r.vote_count > 0 && <Flame className="w-3.5 h-3.5 text-secondary shrink-0" />}
                      </span>
                      <span className="font-display font-bold text-secondary tabular-nums">{r.vote_count}</span>
                      <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${isTop5 ? "bg-gradient-to-r from-secondary to-primary" : "bg-primary/60"}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
