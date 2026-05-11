import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Sparkles, Zap, Ticket, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Membership {
  id: string;
  started_at: string;
  expires_at: string;
  total_points_spent: number;
  renewal_count: number;
}

const COST = 100;

export default function Club() {
  const { profile, refreshProfile } = useAuth();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("club_memberships")
      .select("*")
      .eq("user_id", profile.user_id)
      .maybeSingle();
    setMembership(data as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, [profile?.user_id]);

  const isActive = !!membership && new Date(membership.expires_at) > new Date();
  const canAfford = (profile?.points ?? 0) >= COST;

  const handleJoin = async () => {
    setJoining(true);
    const { data, error } = await supabase.rpc("join_zartour_club");
    setJoining(false);
    if (error) { toast.error(error.message); return; }
    const res = data as any;
    if (res?.error) { toast.error(res.error); return; }
    toast.success(res.renewal ? "Membership renewed! +30 days" : "Welcome to Zartour Club! 👑");
    refreshProfile();
    load();
  };

  const perks = [
    { icon: Ticket, title: "Exclusive discounts", desc: "Member-only deals on tours, stays & guides" },
    { icon: Zap, title: "2x points multiplier", desc: "Earn double points on every check-in & vote" },
    { icon: Sparkles, title: "Early access", desc: "Be first to join new quests & events" },
  ];

  return (
    <AppLayout>
      <div className="p-4 space-y-6 animate-fade-in">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Hero */}
        <Card className="bg-gradient-to-br from-gold via-amber-500 to-amber-600 text-black border-0 overflow-hidden relative">
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Members Only</span>
            </div>
            <h1 className="font-display text-3xl font-bold">Zartour Club</h1>
            <p className="text-sm opacity-90">Unlock exclusive perks across the Ga-Mphahlele tourism platform.</p>
            {isActive && membership && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/15 px-3 py-1.5 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active until {new Date(membership.expires_at).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Perks */}
        <div className="space-y-2">
          <h2 className="font-display text-lg font-bold">Member perks</h2>
          {perks.map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Join / Renew */}
        <Card className="border-2 border-gold">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="font-display font-bold">
                {isActive ? "Extend membership" : "Join the Club"}
              </p>
              <p className="text-xs text-muted-foreground">30 days</p>
            </div>
            <div className="flex items-end gap-1">
              <span className="font-display text-4xl font-bold text-gold">{COST}</span>
              <span className="text-sm text-muted-foreground mb-1">points / month</span>
            </div>
            <p className="text-xs text-muted-foreground">
              You have <span className="font-bold text-foreground">{profile?.points ?? 0}</span> points.
            </p>
            <Button
              className="w-full bg-gold text-black hover:bg-gold/90"
              disabled={!canAfford || joining || !profile}
              onClick={handleJoin}
            >
              {joining ? "Processing..." :
                !canAfford ? `Need ${COST - (profile?.points ?? 0)} more points` :
                isActive ? `Renew for ${COST} pts` : `Join for ${COST} pts`}
            </Button>
            {membership && membership.renewal_count > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                Renewed {membership.renewal_count}× • {membership.total_points_spent} pts invested
              </p>
            )}
          </CardContent>
        </Card>

        {loading && <p className="text-center text-xs text-muted-foreground">Loading membership...</p>}
      </div>
    </AppLayout>
  );
}
