import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Trophy, MapPin, Sparkles, Shield, Building2, Search } from "lucide-react";

interface Quest {
  id: string;
  title: string;
  icon: string;
  total_steps: number;
}

interface UserQuest {
  quest_id: string;
  progress: number;
  completed: boolean;
  quests: Quest;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { isAdmin } = useAdmin();
  const [checkinCount, setCheckinCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);

  useEffect(() => {
    if (!profile) return;

    const load = async () => {
      const [checkinsRes, badgesRes, rankRes, questsRes, uqRes] = await Promise.all([
        supabase.from("checkins").select("id", { count: "exact", head: true }).eq("user_id", profile.user_id),
        supabase.from("user_badges").select("id", { count: "exact", head: true }).eq("user_id", profile.user_id),
        supabase.from("profiles").select("user_id").order("points", { ascending: false }),
        supabase.from("quests").select("*"),
        supabase.from("user_quests").select("*, quests(*)").eq("user_id", profile.user_id),
      ]);

      setCheckinCount(checkinsRes.count ?? 0);
      setBadgeCount(badgesRes.count ?? 0);
      if (rankRes.data) {
        const idx = rankRes.data.findIndex(p => p.user_id === profile.user_id);
        setRank(idx >= 0 ? idx + 1 : null);
      }
      if (questsRes.data) setQuests(questsRes.data);
      if (uqRes.data) setUserQuests(uqRes.data as any);
    };
    load();
  }, [profile]);

  const firstName = profile?.full_name?.split(" ")[0] || "Explorer";

  return (
    <AppLayout>
      <div className="p-4 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Welcome back,</p>
            <h1 className="font-display text-3xl font-bold">{firstName} 👋</h1>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Shield className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            )}
            <Link to="/guide">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Building2 className="w-4 h-4" />
                Guide
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-4 text-center">
              <Sparkles className="w-5 h-5 mx-auto mb-1" />
              <p className="text-2xl font-display font-bold">{profile?.points ?? 0}</p>
              <p className="text-xs opacity-80">Points</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MapPin className="w-5 h-5 mx-auto mb-1 text-secondary" />
              <p className="text-2xl font-display font-bold">{checkinCount}</p>
              <p className="text-xs text-muted-foreground">Visited</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-5 h-5 mx-auto mb-1 text-gold" />
              <p className="text-2xl font-display font-bold">#{rank ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Rank</p>
            </CardContent>
          </Card>
        </div>

        {/* Check-in CTA */}
        <Link to="/checkin">
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-95 transition-opacity cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-lg">Scan & Check In</p>
                <p className="text-sm opacity-80">Visit a location to earn points</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Badges */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">Badges</h2>
            <span className="text-sm text-muted-foreground">{badgeCount} earned</span>
          </div>
          <Link to="/profile">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex -space-x-1">
                  {["👣", "🧭", "🗺️", "🌍", "👑"].map((icon, i) => (
                    <span key={i} className={`text-2xl ${i >= badgeCount ? "opacity-30 grayscale" : ""}`}>
                      {icon}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground ml-2">View all badges →</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quests */}
        <div>
          <h2 className="font-display text-lg font-bold mb-3">Quests</h2>
          <div className="space-y-2">
            {quests.map((quest) => {
              const uq = userQuests.find(q => q.quest_id === quest.id);
              const progress = uq ? (uq.progress / quest.total_steps) * 100 : 0;
              return (
                <Link key={quest.id} to="/quests">
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <span className="text-2xl">{quest.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{quest.title}</p>
                        <div className="mt-1.5 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-secondary rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {uq?.progress ?? 0}/{quest.total_steps}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
