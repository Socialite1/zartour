import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, MapPin, Star, CheckCircle2, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface EventRow {
  id: string; title: string; event_type: string; description: string | null;
  venue: string | null; event_date: string; image_url: string | null; ticket_info: string | null;
}
interface Rating { id: string; user_id: string; rating: number; review: string | null; created_at: string; }

export default function EventDetail() {
  const { id } = useParams();
  const { user, refreshProfile } = useAuth();
  const [ev, setEv] = useState<EventRow | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [checkinCount, setCheckinCount] = useState(0);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!id) return;
    const [evRes, rRes, cCount, mine] = await Promise.all([
      supabase.from("events").select("*").eq("id", id).maybeSingle(),
      supabase.from("event_ratings").select("*").eq("event_id", id).order("created_at", { ascending: false }),
      supabase.from("event_checkins").select("id", { count: "exact", head: true }).eq("event_id", id),
      user ? supabase.from("event_checkins").select("id").eq("event_id", id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null } as any),
    ]);
    setEv(evRes.data as any);
    setRatings((rRes.data as any) ?? []);
    setCheckinCount(cCount.count ?? 0);
    setHasCheckedIn(!!mine.data);
    if (user) {
      const own = (rRes.data as Rating[] | null)?.find(r => r.user_id === user.id);
      if (own) { setMyRating(own.rating); setMyReview(own.review ?? ""); }
    }
  };

  useEffect(() => { load(); }, [id, user?.id]);

  const handleCheckIn = async () => {
    setSubmitting(true);
    const { data, error } = await supabase.rpc("checkin_to_event", { p_event_id: id });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    const res = data as any;
    if (res?.error) return toast.error(res.error);
    toast.success(`Checked in! +${res.points_earned} points 🎉`);
    refreshProfile(); load();
  };

  const submitRating = async () => {
    if (!user || !id || myRating < 1) return toast.error("Pick a rating first");
    if (myReview.length > 500) return toast.error("Review too long (max 500)");
    setSubmitting(true);
    const { error } = await supabase
      .from("event_ratings")
      .upsert({ event_id: id, user_id: user.id, rating: myRating, review: myReview.trim() || null }, { onConflict: "event_id,user_id" });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Rating saved!");
    load();
  };

  if (!ev) return <AppLayout><div className="p-4 text-center text-muted-foreground">Loading...</div></AppLayout>;

  const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;

  return (
    <AppLayout>
      <div className="p-4 space-y-4 animate-fade-in">
        <Link to="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Events
        </Link>

        {ev.image_url && <img src={ev.image_url} alt={ev.title} className="w-full h-48 object-cover rounded-lg" />}

        <div>
          <span className="text-xs uppercase font-bold text-primary">{ev.event_type}</span>
          <h1 className="font-display text-2xl font-bold">{ev.title}</h1>
          <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
            <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {format(new Date(ev.event_date), "PPpp")}</div>
            {ev.venue && <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {ev.venue}</div>}
          </div>
        </div>

        {ev.description && <p className="text-sm">{ev.description}</p>}
        {ev.ticket_info && (
          <Card><CardContent className="p-3 text-sm"><strong>Tickets:</strong> {ev.ticket_info}</CardContent></Card>
        )}

        <div className="flex gap-3 text-sm">
          <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {checkinCount} attending</span>
          <span className="flex items-center gap-1"><Star className="w-4 h-4 text-gold fill-gold" /> {avg.toFixed(1)} ({ratings.length})</span>
        </div>

        {user && (
          hasCheckedIn ? (
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-green-600">
              <CheckCircle2 className="w-4 h-4" /> Checked in (+25 pts earned)
            </div>
          ) : (
            <Button onClick={handleCheckIn} disabled={submitting} className="w-full">
              Check in (+25 pts)
            </Button>
          )
        )}

        {/* Rate */}
        {user && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="font-bold text-sm">Rate this event</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setMyRating(n)} aria-label={`${n} stars`}>
                    <Star className={`w-7 h-7 ${n <= myRating ? "text-gold fill-gold" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              <Textarea value={myReview} onChange={e => setMyReview(e.target.value)} maxLength={500} placeholder="Optional review..." rows={3} />
              <Button onClick={submitRating} disabled={submitting || myRating < 1} size="sm">Save rating</Button>
            </CardContent>
          </Card>
        )}

        {ratings.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-display text-lg font-bold">Reviews</h2>
            {ratings.map(r => (
              <Card key={r.id}><CardContent className="p-3">
                <div className="flex gap-0.5 mb-1">
                  {[1,2,3,4,5].map(n => <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? "text-gold fill-gold" : "text-muted-foreground"}`} />)}
                </div>
                {r.review && <p className="text-sm">{r.review}</p>}
              </CardContent></Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
