import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

const origins = [
  { value: "around_ga_mphahlele", label: "Around Ga-Mphahlele" },
  { value: "local_community", label: "Local Community" },
  { value: "provincial", label: "Provincial" },
  { value: "national", label: "National" },
] as const;

export default function Onboarding() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [origin, setOrigin] = useState<string>("");
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile?.onboarded) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          phone,
          origin: origin as any,
          onboarded: true,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      await refreshProfile();
      toast.success("Welcome to Zartour! 🎉");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Could not complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
            <MapPin className="w-8 h-8 text-secondary-foreground" />
          </div>
          <CardTitle className="font-display text-3xl">Almost There!</CardTitle>
          <p className="text-muted-foreground text-sm">
            Tell us a bit about yourself to complete your profile
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+27 XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Where are you from?</Label>
              <div className="grid grid-cols-2 gap-2">
                {origins.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setOrigin(o.value)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      origin === o.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/50"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !origin}>
              {loading ? "Saving..." : "Start Exploring 🚀"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
