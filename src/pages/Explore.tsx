import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MapPin, Bed, Calendar, Users, Navigation, Star, Phone, Mail } from "lucide-react";

interface GuideTour {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  total_steps: number;
  type: string;
  guide_id: string;
  guide_name?: string;
}

interface Accommodation {
  id: string;
  name: string;
  description: string | null;
  type: string;
  price_range: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default function Explore() {
  const { user } = useAuth();
  const [tours, setTours] = useState<GuideTour[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);

  // Tour booking dialog
  const [bookingTour, setBookingTour] = useState<GuideTour | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [partySize, setPartySize] = useState("1");
  const [bookingNotes, setBookingNotes] = useState("");

  // Accommodation booking dialog
  const [bookingAccom, setBookingAccom] = useState<Accommodation | null>(null);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState("1");
  const [accomNotes, setAccomNotes] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [toursRes, accomRes] = await Promise.all([
      supabase.from("quests").select("*, guide_profiles(business_name)").order("created_at"),
      supabase.from("accommodations").select("*").order("name"),
    ]);

    if (toursRes.data) {
      setTours(
        toursRes.data.map((q: any) => ({
          ...q,
          guide_name: q.guide_profiles?.business_name ?? null,
        }))
      );
    }
    if (accomRes.data) setAccommodations(accomRes.data);
    setLoading(false);
  };

  const handleBookTour = async () => {
    if (!user || !bookingTour || !bookingDate) {
      toast.error("Please select a date");
      return;
    }
    if (!bookingTour.guide_id) {
      toast.error("This quest doesn't have a guide to book with");
      return;
    }

    const { error } = await supabase.from("tour_bookings").insert({
      user_id: user.id,
      quest_id: bookingTour.id,
      guide_id: bookingTour.guide_id,
      booking_date: bookingDate,
      party_size: parseInt(partySize),
      notes: bookingNotes || null,
    });

    if (error) {
      toast.error("Failed to book tour");
      return;
    }

    toast.success("Tour booked! The guide will confirm shortly.");
    setBookingTour(null);
    setBookingDate("");
    setPartySize("1");
    setBookingNotes("");
  };

  const handleBookAccom = async () => {
    if (!user || !bookingAccom || !checkInDate || !checkOutDate) {
      toast.error("Please fill in check-in and check-out dates");
      return;
    }

    const { error } = await supabase.from("accommodation_bookings").insert({
      user_id: user.id,
      accommodation_id: bookingAccom.id,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      guests: parseInt(guests),
      notes: accomNotes || null,
    });

    if (error) {
      toast.error("Failed to book accommodation");
      return;
    }

    toast.success("Accommodation booked!");
    setBookingAccom(null);
    setCheckInDate("");
    setCheckOutDate("");
    setGuests("1");
    setAccomNotes("");
  };

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, "_blank");
  };

  const typeLabels: Record<string, string> = {
    lodge: "🏨 Lodge",
    hotel: "🏩 Hotel",
    guesthouse: "🏠 Guest House",
    bnb: "☕ B&B",
    cultural_stay: "🏛️ Cultural Stay",
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

  return (
    <AppLayout>
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="pt-2">
          <h1 className="font-display text-2xl font-bold">Explore Ga-Mphahlele</h1>
          <p className="text-muted-foreground text-sm">Book tours & find accommodation</p>
        </div>

        <Tabs defaultValue="tours">
          <TabsList className="w-full">
            <TabsTrigger value="tours" className="flex-1 gap-1.5">
              <MapPin className="w-4 h-4" /> Tours & Quests
            </TabsTrigger>
            <TabsTrigger value="stay" className="flex-1 gap-1.5">
              <Bed className="w-4 h-4" /> Stay
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tours" className="space-y-3 mt-4">
            {tours.map((tour) => (
              <Card key={tour.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{tour.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold">{tour.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tour.total_steps} stops • {tour.type.replace("_", " ")}
                      </p>
                      {tour.guide_name && (
                        <p className="text-xs text-primary mt-1">by {tour.guide_name}</p>
                      )}
                    </div>
                  </div>
                  {tour.description && (
                    <p className="text-sm text-muted-foreground">{tour.description}</p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => setBookingTour(tour)}>
                      <Calendar className="w-4 h-4 mr-1.5" /> Book Tour
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="stay" className="space-y-3 mt-4">
            {accommodations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bed className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No accommodations listed yet.</p>
                </CardContent>
              </Card>
            ) : (
              accommodations.map((accom) => (
                <Card key={accom.id}>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-semibold">{accom.name}</h3>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {typeLabels[accom.type] ?? accom.type}
                        </span>
                      </div>
                      {accom.description && (
                        <p className="text-sm text-muted-foreground mt-1">{accom.description}</p>
                      )}
                    </div>

                    {accom.price_range && (
                      <p className="text-sm font-medium text-primary">{accom.price_range}</p>
                    )}

                    {accom.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {accom.address}
                      </p>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {accom.contact_phone && (
                        <a href={`tel:${accom.contact_phone}`} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary">
                          <Phone className="w-3 h-3" /> {accom.contact_phone}
                        </a>
                      )}
                      {accom.contact_email && (
                        <a href={`mailto:${accom.contact_email}`} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary">
                          <Mail className="w-3 h-3" /> {accom.contact_email}
                        </a>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => setBookingAccom(accom)}>
                        <Bed className="w-4 h-4 mr-1.5" /> Book Stay
                      </Button>
                      {accom.latitude && accom.longitude && (
                        <Button size="sm" variant="outline" onClick={() => openInMaps(accom.latitude!, accom.longitude!)}>
                          <Navigation className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Tour Booking Dialog */}
      <Dialog open={!!bookingTour} onOpenChange={() => setBookingTour(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Book Tour</DialogTitle>
          </DialogHeader>
          {bookingTour && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {bookingTour.icon} {bookingTour.title}
                {bookingTour.guide_name && <span className="block text-primary">by {bookingTour.guide_name}</span>}
              </p>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <Label>Party Size</Label>
                <Input type="number" min="1" max="50" value={partySize} onChange={e => setPartySize(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} placeholder="Any special requests..." rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingTour(null)}>Cancel</Button>
            <Button onClick={handleBookTour}>Confirm Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accommodation Booking Dialog */}
      <Dialog open={!!bookingAccom} onOpenChange={() => setBookingAccom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Book Accommodation</DialogTitle>
          </DialogHeader>
          {bookingAccom && (
            <div className="space-y-4">
              <p className="text-sm font-medium">{bookingAccom.name}</p>
              {bookingAccom.price_range && <p className="text-sm text-primary">{bookingAccom.price_range}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Check-in *</Label>
                  <Input type="date" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-2">
                  <Label>Check-out *</Label>
                  <Input type="date" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} min={checkInDate || new Date().toISOString().split("T")[0]} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Guests</Label>
                <Input type="number" min="1" max="20" value={guests} onChange={e => setGuests(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={accomNotes} onChange={e => setAccomNotes(e.target.value)} placeholder="Any special requests..." rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingAccom(null)}>Cancel</Button>
            <Button onClick={handleBookAccom}>Confirm Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
