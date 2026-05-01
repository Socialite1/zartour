import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft, Flame } from "lucide-react";

interface Row {
  id: string;
  name: string;
  vote_count: number;
}

export default function VoteLeaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("team_vote_counts" as never)
      .select("id, name, vote_count")
      .order("vote_count", { ascending: false }) as { data: Row[] | null };
    if (data) setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 7000);
    const channel = supabase
      .channel("votes-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => load())
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const total = rows.reduce((s, r) => s + r.vote_count, 0);
  const max = Math.max(1, ...rows.map(r => r.vote_count));

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground py-5 px-4 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10">
            <Link to="/vote"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-secondary" />
              Live Leaderboard
            </h1>
            <p className="text-xs opacity-90">{total.toLocaleString()} total votes • updates every 7s</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading…</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r, i) => {
              const pct = total > 0 ? (r.vote_count / total) * 100 : 0;
              const barPct = (r.vote_count / max) * 100;
              const isTop5 = i < 5;
              const medal = ["🥇", "🥈", "🥉"][i];
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
          </div>
        )}
      </main>
    </div>
  );
}
