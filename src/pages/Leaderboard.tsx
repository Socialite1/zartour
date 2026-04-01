import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import ShareButton from "@/components/ShareButton";

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  points: number;
  avatar_url: string | null;
}

const medals = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

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
  }, []);

  const myEntry = entries.find(e => e.user_id === user?.id);
  const myRank = myEntry ? entries.indexOf(myEntry) + 1 : null;

  return (
    <AppLayout>
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="pt-2 text-center">
          <Trophy className="w-10 h-10 mx-auto text-yellow-500 mb-2" />
          <h1 className="font-display text-2xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground text-sm">Top explorers of Zartour</p>
        </div>

        {myEntry && myRank && (
          <div className="flex justify-center">
            <ShareButton
              title="My Zartour Ranking"
              text={`I'm ranked #${myRank} on Zartour with ${myEntry.points} points! 🏆 Can you beat me?`}
              url={window.location.origin}
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
      </div>
    </AppLayout>
  );
}
