import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { MapPin, CheckCircle2, ScanLine } from "lucide-react";

interface Location {
  id: string;
  name: string;
  description: string | null;
  points_reward: number;
}

export default function CheckIn() {
  const { user, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const qrId = searchParams.get("qr");

  const [location, setLocation] = useState<Location | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!qrId) return;
    const lookupLocation = async () => {
      const { data } = await supabase.rpc("get_location_by_qr", { p_qr_code_id: qrId });
      if (data) {
        const loc = data as any;
        setLocation({ id: loc.id, name: loc.name, description: loc.description, points_reward: loc.points_reward });
      } else {
        setError("Invalid QR code. Please scan a valid location QR code.");
      }
    };
    lookupLocation();
  }, [qrId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !location) return;
    setLoading(true);

    try {
      // Check for duplicate
      const { data: existing } = await supabase
        .from("checkins")
        .select("id")
        .eq("user_id", user.id)
        .eq("location_id", location.id)
        .maybeSingle();

      if (existing) {
        toast.error("You've already checked in at this location!");
        setLoading(false);
        return;
      }

      // Create check-in
      const { error: checkinError } = await supabase.from("checkins").insert({
        user_id: user.id,
        location_id: location.id,
        caption: caption || null,
        points_earned: location.points_reward,
      });
      if (checkinError) throw checkinError;

      // Update points
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("points")
        .eq("user_id", user.id)
        .single();

      await supabase
        .from("profiles")
        .update({ points: (currentProfile?.points ?? 0) + location.points_reward })
        .eq("user_id", user.id);

      // Auto-advance any quests linked to this location
      const { data: questResults } = await supabase.rpc("advance_quests_for_checkin", { p_location_id: location.id });
      if (questResults && Array.isArray(questResults) && questResults.length > 0) {
        for (const qr of questResults as any[]) {
          if (qr.completed) {
            toast.success("Quest completed! 🎉");
          } else {
            toast.success(`Quest progress: step ${qr.progress}!`);
          }
        }
      }

      // Check badge eligibility
      const { count } = await supabase
        .from("checkins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { data: badges } = await supabase
        .from("badges")
        .select("*")
        .lte("required_checkins", count ?? 0);

      if (badges) {
        for (const badge of badges) {
          await supabase.rpc("award_badge_if_eligible", { p_badge_id: badge.id });
        }
      }

      setPointsEarned(location.points_reward);
      setSuccess(true);
      await refreshProfile();
      toast.success(`+${location.points_reward} points! 🎉`);
    } catch (err: any) {
      toast.error(err.message || "Failed to check in");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AppLayout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h1 className="font-display text-3xl font-bold">Check-in Complete!</h1>
            <div className="animate-points-pop">
              <span className="text-5xl font-display font-bold text-secondary">+{pointsEarned}</span>
              <p className="text-muted-foreground mt-1">points earned</p>
            </div>
            <Button onClick={() => { setSuccess(false); setCaption(""); setLocation(null); }} variant="outline" className="mt-6">
              Scan another location
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // No QR code scanned — prompt user to scan
  if (!qrId) {
    return (
      <AppLayout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <ScanLine className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold">Scan a QR Code</h1>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Find a QR code at one of our locations and scan it with your phone camera to check in and earn points!
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <MapPin className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-bold">Invalid QR Code</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!location) {
    return (
      <AppLayout>
        <div className="p-4 flex items-center justify-center min-h-[80vh]">
          <p className="text-muted-foreground animate-pulse">Looking up location...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="pt-2">
          <h1 className="font-display text-2xl font-bold">Check In</h1>
          <p className="text-muted-foreground text-sm">You're at a location — confirm to earn points!</p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{location.name}</p>
                {location.description && <p className="text-xs text-muted-foreground">{location.description}</p>}
              </div>
            </div>
            <div className="bg-secondary/10 rounded-lg p-3 text-center">
              <span className="text-2xl font-bold text-secondary">+{location.points_reward}</span>
              <p className="text-xs text-muted-foreground">points you'll earn</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="caption">Say something (optional)</Label>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Share your experience..."
                  maxLength={280}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {loading ? "Checking in..." : "Confirm Check-In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
