import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ClaimResult {
  claimed?: boolean;
  already_claimed_today?: boolean;
  points_awarded?: number;
  total_points?: number;
  error?: string;
}

export default function DailyLoginBanner() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [claimedToday, setClaimedToday] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const claim = async () => {
      const { data, error } = await supabase.rpc("claim_daily_login_bonus");
      if (cancelled) return;
      setLoading(false);

      if (error) {
        console.error("Daily login claim failed:", error);
        return;
      }

      const result = data as ClaimResult;
      if (result?.claimed) {
        setJustClaimed(true);
        setClaimedToday(true);
        await refreshProfile();
        toast({
          title: "🎉 Daily login bonus!",
          description: `+${result.points_awarded ?? 3} points added to your total.`,
        });
      } else if (result?.already_claimed_today) {
        setClaimedToday(true);
      }
    };

    claim();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user || loading) return null;

  return (
    <Card
      className={
        justClaimed
          ? "bg-gradient-to-r from-secondary to-gold text-secondary-foreground border-0 animate-fade-in"
          : "bg-muted/50 border-dashed"
      }
    >
      <CardContent className="p-3 flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            justClaimed ? "bg-secondary-foreground/20" : "bg-muted"
          }`}
        >
          {claimedToday && !justClaimed ? (
            <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
          ) : justClaimed ? (
            <Sparkles className="w-5 h-5" />
          ) : (
            <Gift className="w-5 h-5 text-secondary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {justClaimed ? (
            <>
              <p className="text-sm font-display font-bold">+3 points claimed today!</p>
              <p className="text-xs opacity-80">Come back tomorrow for more 🎁</p>
            </>
          ) : claimedToday ? (
            <>
              <p className="text-sm font-medium">Daily bonus already claimed</p>
              <p className="text-xs text-muted-foreground">See you tomorrow for +3 more points</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Daily login bonus</p>
              <p className="text-xs text-muted-foreground">Earn +3 points every day you visit</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
