import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { MapPin, CheckCircle2, Upload } from "lucide-react";

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

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  useEffect(() => {
    const loadLocations = async () => {
      // Load locations without qr_code_id (uses authenticated SELECT)
      const { data } = await supabase
        .from("locations")
        .select("id, name, description, points_reward");
      if (data) setLocations(data);

      // If QR code provided, look up location server-side
      if (qrId) {
        const { data: locData } = await supabase.rpc("get_location_by_qr", { p_qr_code_id: qrId });
        if (locData) {
          const loc = locData as any;
          setSelectedLocation(loc.id);
        }
      }
    };
    loadLocations();
  }, [qrId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedLocation) return;
    setLoading(true);

    try {
      // Check for duplicate
      const { data: existing } = await supabase
        .from("checkins")
        .select("id")
        .eq("user_id", user.id)
        .eq("location_id", selectedLocation)
        .maybeSingle();

      if (existing) {
        toast.error("You've already checked in at this location!");
        setLoading(false);
        return;
      }

      const location = locations.find(l => l.id === selectedLocation)!;
      let storagePath: string | null = null;

      // Upload image to private bucket
      if (image) {
        const ext = image.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("checkin-images")
          .upload(path, image);
        if (uploadError) throw uploadError;
        storagePath = path;
      }

      // Create check-in (store path, not public URL)
      const { error: checkinError } = await supabase.from("checkins").insert({
        user_id: user.id,
        location_id: selectedLocation,
        image_url: storagePath,
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
      const { data: questResults } = await supabase.rpc("advance_quests_for_checkin", { p_location_id: selectedLocation });
      if (questResults && Array.isArray(questResults) && questResults.length > 0) {
        for (const qr of questResults as any[]) {
          if (qr.completed) {
            toast.success("Quest completed! 🎉");
          } else {
            toast.success(`Quest progress: step ${qr.progress}!`);
          }
        }
      }

      // Check badge eligibility via server-side RPC
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
            <Button onClick={() => { setSuccess(false); setCaption(""); setImage(null); setImagePreview(null); }} variant="outline" className="mt-6">
              Check in somewhere else
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="pt-2">
          <h1 className="font-display text-2xl font-bold">Check In</h1>
          <p className="text-muted-foreground text-sm">Visit a location and earn points</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm"
                >
                  <option value="">Select a location...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} (+{loc.points_reward} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Photo Proof</Label>
                <label className="block cursor-pointer">
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-foreground/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-primary-foreground text-sm font-medium bg-foreground/50 px-3 py-1 rounded-full">Change photo</p>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Tap to upload a photo</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Caption (optional)</Label>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Share your experience..."
                  maxLength={280}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !selectedLocation}>
                <MapPin className="w-4 h-4 mr-2" />
                {loading ? "Checking in..." : "Check In & Earn Points"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
