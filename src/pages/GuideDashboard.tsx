import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, MapPin, Calendar, Users, Building2, CheckCircle2, Clock, Bed } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GuideProfile {
  id: string;
  business_name: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_approved: boolean;
}

interface Quest {
  id: string;
  title: string;
  description: string | null;
  type: string;
  total_steps: number;
  icon: string;
}

interface Booking {
  id: string;
  booking_date: string;
  party_size: number;
  status: string;
  notes: string | null;
  created_at: string;
  quest_id: string;
  user_id: string;
}

interface Location {
  id: string;
  name: string;
}

interface AccommodationForm {
  name: string;
  description: string;
  type: string;
  price_range: string;
  address: string;
  contact_phone: string;
  contact_email: string;
}

const QUEST_TYPES = ["astrology", "ikigai", "human_design", "economical", "religious", "political"];
const ACCOM_TYPES = ["lodge", "hotel", "guesthouse", "bnb", "cultural_stay"];

export default function GuideDashboard() {
  const { user } = useAuth();
  const [guideProfile, setGuideProfile] = useState<GuideProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [myQuests, setMyQuests] = useState<Quest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [questDialogOpen, setQuestDialogOpen] = useState(false);
  const [accomDialogOpen, setAccomDialogOpen] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [myAccommodations, setMyAccommodations] = useState<any[]>([]);

  // Form state for guide profile
  const [businessName, setBusinessName] = useState("");
  const [bizDescription, setBizDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Form state for quest creation
  const [questTitle, setQuestTitle] = useState("");
  const [questDescription, setQuestDescription] = useState("");
  const [questType, setQuestType] = useState("economical");
  const [questIcon, setQuestIcon] = useState("🗺️");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { data: gp } = await supabase
      .from("guide_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (gp) {
      setGuideProfile(gp);
      
      const [questsRes, bookingsRes] = await Promise.all([
        supabase.from("quests").select("*").eq("guide_id", gp.id),
        supabase.from("tour_bookings").select("*").eq("guide_id", gp.id).order("created_at", { ascending: false }),
      ]);
      
      if (questsRes.data) setMyQuests(questsRes.data);
      if (bookingsRes.data) setBookings(bookingsRes.data as any);
    } else {
      setSetupMode(true);
    }

    const { data: locs } = await supabase.from("locations").select("id, name").order("name");
    if (locs) setLocations(locs);

    setLoading(false);
  };

  const handleSetupProfile = async () => {
    if (!user || !businessName.trim()) {
      toast.error("Business name is required");
      return;
    }

    const { data, error } = await supabase.from("guide_profiles").insert({
      user_id: user.id,
      business_name: businessName.trim(),
      description: bizDescription.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_phone: contactPhone.trim() || null,
    }).select().single();

    if (error) {
      toast.error("Failed to create profile");
      return;
    }

    setGuideProfile(data);
    setSetupMode(false);
    toast.success("Guide profile created! Pending admin approval.");
  };

  const handleCreateQuest = async () => {
    if (!guideProfile || !questTitle.trim()) {
      toast.error("Quest title is required");
      return;
    }

    if (selectedLocations.length === 0) {
      toast.error("Select at least one location");
      return;
    }

    const { data: quest, error } = await supabase.from("quests").insert({
      title: questTitle.trim(),
      description: questDescription.trim() || null,
      type: questType as any,
      icon: questIcon,
      total_steps: selectedLocations.length,
      guide_id: guideProfile.id,
    }).select().single();

    if (error) {
      toast.error("Failed to create quest");
      return;
    }

    // Link locations to quest
    for (let i = 0; i < selectedLocations.length; i++) {
      await supabase.from("quest_locations").insert({
        quest_id: quest.id,
        location_id: selectedLocations[i],
        step_order: i + 1,
      });
    }

    toast.success("Quest created!");
    setQuestDialogOpen(false);
    setQuestTitle("");
    setQuestDescription("");
    setSelectedLocations([]);
    loadData();
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    await supabase.from("tour_bookings").update({ status }).eq("id", bookingId);
    toast.success(`Booking ${status}`);
    loadData();
  };

  const toggleLocation = (locId: string) => {
    setSelectedLocations(prev =>
      prev.includes(locId) ? prev.filter(id => id !== locId) : [...prev, locId]
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  // Setup mode - create guide profile
  if (setupMode || !guideProfile) {
    return (
      <AppLayout>
        <div className="p-4 space-y-6 animate-fade-in">
          <div className="pt-2 text-center">
            <Building2 className="w-12 h-12 mx-auto text-primary mb-3" />
            <h1 className="font-display text-2xl font-bold">Become a Guide</h1>
            <p className="text-muted-foreground text-sm">Register your tourism establishment</p>
          </div>

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Business Name *</Label>
                <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Limpopo Heritage Tours" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={bizDescription} onChange={e => setBizDescription(e.target.value)} placeholder="Tell visitors about your establishment..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="tours@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+27..." />
              </div>
              <Button onClick={handleSetupProfile} className="w-full">Register as Guide</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Pending approval
  if (!guideProfile.is_approved) {
    return (
      <AppLayout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
          <Clock className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold">Pending Approval</h1>
          <p className="text-muted-foreground text-center max-w-xs mt-2">
            Your guide profile for <strong>{guideProfile.business_name}</strong> is pending admin approval. You'll be able to create quests once approved.
          </p>
        </div>
      </AppLayout>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600",
    confirmed: "bg-green-500/10 text-green-600",
    cancelled: "bg-destructive/10 text-destructive",
    completed: "bg-primary/10 text-primary",
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="pt-2">
          <p className="text-muted-foreground text-sm">Guide Dashboard</p>
          <h1 className="font-display text-2xl font-bold">{guideProfile.business_name}</h1>
        </div>

        <Tabs defaultValue="quests">
          <TabsList className="w-full">
            <TabsTrigger value="quests" className="flex-1 gap-1.5">
              <MapPin className="w-4 h-4" /> My Quests
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex-1 gap-1.5">
              <Calendar className="w-4 h-4" /> Bookings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quests" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={() => setQuestDialogOpen(true)} size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> Create Quest
              </Button>
            </div>

            {myQuests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No quests yet. Create your first one!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myQuests.map(quest => (
                  <Card key={quest.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{quest.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-display font-semibold">{quest.title}</h3>
                          <p className="text-xs text-muted-foreground">{quest.total_steps} steps • {quest.type.replace("_", " ")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4 mt-4">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No bookings yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {bookings.map(booking => (
                  <Card key={booking.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Booking for {booking.booking_date}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" /> {booking.party_size} guest(s)
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status] ?? ""}`}>
                          {booking.status}
                        </span>
                      </div>
                      {booking.notes && <p className="text-sm text-muted-foreground">{booking.notes}</p>}
                      {booking.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateBookingStatus(booking.id, "confirmed")} className="flex-1">Confirm</Button>
                          <Button size="sm" variant="outline" onClick={() => updateBookingStatus(booking.id, "cancelled")} className="flex-1">Decline</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Quest Dialog */}
      <Dialog open={questDialogOpen} onOpenChange={setQuestDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Create Quest</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quest Title *</Label>
              <Input value={questTitle} onChange={e => setQuestTitle(e.target.value)} placeholder="e.g. Heritage Walking Tour" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={questDescription} onChange={e => setQuestDescription(e.target.value)} placeholder="Describe the journey..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={questType} onValueChange={setQuestType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUEST_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Input value={questIcon} onChange={e => setQuestIcon(e.target.value)} maxLength={4} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Select Locations (in order)</Label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {locations.map(loc => {
                  const selected = selectedLocations.includes(loc.id);
                  const order = selectedLocations.indexOf(loc.id) + 1;
                  return (
                    <button
                      key={loc.id}
                      onClick={() => toggleLocation(loc.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                        selected ? "bg-primary/10 text-primary" : "bg-muted/50 text-foreground hover:bg-muted"
                      }`}
                    >
                      {selected ? (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{order}</span>
                      ) : (
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                      )}
                      {loc.name}
                    </button>
                  );
                })}
              </div>
              {selectedLocations.length > 0 && (
                <p className="text-xs text-muted-foreground">{selectedLocations.length} location(s) selected</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateQuest}>Create Quest</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
