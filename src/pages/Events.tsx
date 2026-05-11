import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Star, Users, PartyPopper } from "lucide-react";
import { format } from "date-fns";

interface EventRow {
  id: string;
  title: string;
  event_type: string;
  venue: string | null;
  event_date: string;
  image_url: string | null;
  checkin_count: number;
  rating_count: number;
  avg_rating: number;
}

export default function Events() {
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    supabase
      .from("top_events" as never)
      .select("*")
      .order("event_date", { ascending: true })
      .then(({ data }: any) => data && setEvents(data));
  }, []);

  return (
    <AppLayout>
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="pt-2 text-center">
          <PartyPopper className="w-10 h-10 mx-auto text-secondary mb-2" />
          <h1 className="font-display text-2xl font-bold">Events</h1>
          <p className="text-muted-foreground text-sm">Parties, weddings & bashes — earn 25 pts per check-in</p>
        </div>

        {events.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No events yet.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {events.map(e => (
              <Link key={e.id} to={`/events/${e.id}`}>
                <Card className="hover:bg-muted/30 transition-colors overflow-hidden">
                  {e.image_url && <img src={e.image_url} alt={e.title} className="w-full h-32 object-cover" />}
                  <CardContent className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-bold">{e.title}</h3>
                      <span className="text-xs uppercase font-bold text-secondary">{e.event_type}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(e.event_date), "PPp")}
                    </div>
                    {e.venue && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" /> {e.venue}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs pt-1">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {e.checkin_count}</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                        {e.rating_count > 0 ? `${e.avg_rating} (${e.rating_count})` : "No ratings"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
