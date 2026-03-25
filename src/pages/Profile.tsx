import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, MapPin, Sparkles, Trophy } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string | null;
}

interface CheckinItem {
  id: string;
  created_at: string;
  locations: { name: string };
}

export default function Profile() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [checkins, setCheckins] = useState<CheckinItem[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [ubRes, abRes, cRes] = await Promise.all([
        supabase.from("user_badges").select("badges(*)").eq("user_id", user.id),
        supabase.from("badges").select("*").order("required_checkins"),
        supabase.from("checkins").select("id, created_at, locations(name)").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (ubRes.data) setBadges(ubRes.data.map((d: any) => d.badges));
      if (abRes.data) setAllBadges(abRes.data);
      if (cRes.data) setCheckins(cRes.data as any);
    };
    load();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const earnedBadgeIds = new Set(badges.map(b => b.id));

  return (
    <AppLayout>
      <div className="p-4 space-y-6 animate-fade-in">
        {/* Profile Header */}
        <div className="pt-2 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary mx-auto mb-3">
            {profile?.full_name?.[0] ?? "?"}
          </div>
          <h1 className="font-display text-2xl font-bold">{profile?.full_name || "Explorer"}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="font-display font-bold">{profile?.points ?? 0}</span>
              <span className="text-xs text-muted-foreground">pts</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-display font-bold">{checkins.length}</span>
              <span className="text-xs text-muted-foreground">visited</span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div>
          <h2 className="font-display text-lg font-bold mb-3">Badges</h2>
          <div className="grid grid-cols-5 gap-3">
            {allBadges.map((badge) => {
              const earned = earnedBadgeIds.has(badge.id);
              return (
                <div key={badge.id} className="text-center">
                  <div className={`text-3xl transition-all ${earned ? "" : "opacity-25 grayscale"}`}>
                    {badge.icon}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{badge.name}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Places Visited */}
        <div>
          <h2 className="font-display text-lg font-bold mb-3">Places Visited</h2>
          {checkins.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No places visited yet. Start exploring!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {checkins.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">{(c.locations as any)?.name}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSignOut} variant="outline" className="w-full">
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>
    </AppLayout>
  );
}
