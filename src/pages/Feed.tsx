import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FeedItem {
  id: string;
  caption: string | null;
  image_url: string | null;
  signed_image_url: string | null;
  created_at: string;
  points_earned: number;
  profiles: { full_name: string; avatar_url: string | null };
  locations: { name: string };
  like_count: number;
  liked_by_me: boolean;
}

export default function Feed() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    const { data: checkins } = await supabase
      .from("checkins")
      .select(`
        id, caption, image_url, created_at, points_earned,
        profiles!checkins_user_id_fkey(full_name, avatar_url),
        locations!checkins_location_id_fkey(name)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!checkins) { setLoading(false); return; }

    const feedItems: FeedItem[] = [];
    for (const c of checkins) {
      const { count } = await supabase
        .from("checkin_likes")
        .select("id", { count: "exact", head: true })
        .eq("checkin_id", c.id);

      let likedByMe = false;
      if (user) {
        const { data: myLike } = await supabase
          .from("checkin_likes")
          .select("id")
          .eq("checkin_id", c.id)
          .eq("user_id", user.id)
          .maybeSingle();
        likedByMe = !!myLike;
      }

      // Generate signed URL for private bucket images
      let signedImageUrl: string | null = null;
      if (c.image_url && !c.image_url.startsWith("http")) {
        const { data: signedData } = await supabase.storage
          .from("checkin-images")
          .createSignedUrl(c.image_url, 3600);
        signedImageUrl = signedData?.signedUrl ?? null;
      } else {
        signedImageUrl = c.image_url;
      }

      feedItems.push({
        ...c,
        profiles: c.profiles as any,
        locations: c.locations as any,
        like_count: count ?? 0,
        liked_by_me: likedByMe,
        signed_image_url: signedImageUrl,
      });
    }

    setItems(feedItems);
    setLoading(false);
  };

  useEffect(() => { loadFeed(); }, [user]);

  const toggleLike = async (checkinId: string, liked: boolean) => {
    if (!user) return;
    if (liked) {
      await supabase.from("checkin_likes").delete().eq("checkin_id", checkinId).eq("user_id", user.id);
    } else {
      await supabase.from("checkin_likes").insert({ checkin_id: checkinId, user_id: user.id });
    }
    setItems(prev => prev.map(item =>
      item.id === checkinId
        ? { ...item, liked_by_me: !liked, like_count: item.like_count + (liked ? -1 : 1) }
        : item
    ));
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="pt-2">
          <h1 className="font-display text-2xl font-bold">Your Activity</h1>
          <p className="text-muted-foreground text-sm">Your check-ins and discoveries</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-48" />
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No check-ins yet. Be the first explorer!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                {item.signed_image_url && (
                  <img src={item.signed_image_url} alt="Check-in" className="w-full h-52 object-cover" />
                )}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {item.profiles?.full_name?.[0] ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {item.locations?.name}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {item.caption && <p className="text-sm">{item.caption}</p>}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLike(item.id, item.liked_by_me)}
                      className="flex items-center gap-1 text-sm transition-colors"
                    >
                      <Heart className={`w-4 h-4 ${item.liked_by_me ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                      <span className={item.liked_by_me ? "text-destructive" : "text-muted-foreground"}>
                        {item.like_count}
                      </span>
                    </button>
                    <span className="text-xs text-secondary font-medium">+{item.points_earned} pts</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
