import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, ShoppingCart, Beer, BedDouble, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PointReward {
  id: string;
  points_threshold: number;
  reward_name: string;
  reward_description: string | null;
}

const REWARD_OPTIONS = [
  { key: "groceries", label: "Groceries worth R300", icon: ShoppingCart },
  { key: "beer", label: "12-Pack Beer Cans", icon: Beer },
  { key: "bnb", label: "Bread & Breakfast Trip", icon: BedDouble },
];

export default function RewardClaimBanner() {
  const { profile, user } = useAuth();
  const [reward, setReward] = useState<PointReward | null>(null);
  const [claimed, setClaimed] = useState<string | null>(null);
  const [claimPending, setClaimPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) { setLoading(false); return; }

    const load = async () => {
      // Find rewards the user qualifies for
      const { data: rewards } = await supabase
        .from("point_rewards")
        .select("*")
        .lte("points_threshold", profile.points)
        .order("points_threshold", { ascending: false })
        .limit(1);

      if (!rewards || rewards.length === 0) { setLoading(false); return; }

      const topReward = rewards[0] as unknown as PointReward;

      // Check if already claimed
      const { data: existingClaim } = await supabase
        .from("user_reward_claims")
        .select("reward_choice, status")
        .eq("user_id", user.id)
        .eq("reward_id", topReward.id)
        .maybeSingle();

      if (existingClaim) {
        setClaimed((existingClaim as any).reward_choice);
        setClaimPending((existingClaim as any).status === "pending");
      }

      setReward(topReward);
      setLoading(false);
    };
    load();
  }, [user, profile]);

  const handleClaim = async (choice: string) => {
    if (!user || !reward) return;

    const { error } = await supabase.from("user_reward_claims").insert({
      user_id: user.id,
      reward_id: reward.id,
      reward_choice: choice,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You've already claimed this reward!");
      } else {
        toast.error("Failed to claim reward");
      }
      return;
    }

    setClaimed(choice);
    setClaimPending(true);
    toast.success("🎉 Reward claimed! We'll be in touch soon.");
  };

  if (loading || !reward) return null;

  if (claimed) {
    const chosenOption = REWARD_OPTIONS.find(o => o.key === claimed);
    return (
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              🎁 You claimed: <span className="font-bold">{chosenOption?.label ?? claimed}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {claimPending ? "Status: Pending — we'll contact you soon!" : "Reward fulfilled ✅"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-secondary/50 bg-gradient-to-r from-secondary/10 to-primary/10">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-secondary" />
          <p className="font-display font-bold text-sm">🎉 You've unlocked a reward!</p>
        </div>
        <p className="text-xs text-muted-foreground">
          You reached {reward.points_threshold} points! Choose your reward:
        </p>
        <div className="grid grid-cols-1 gap-2">
          {REWARD_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.key}
                variant="outline"
                className="justify-start gap-2 h-auto py-3"
                onClick={() => handleClaim(option.key)}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm">{option.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
