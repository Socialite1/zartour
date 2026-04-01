import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, MapPin, Navigation, ExternalLink } from "lucide-react";

interface Quest {
  id: string;
  title: string;
  description: string | null;
  type: string;
  total_steps: number;
  icon: string;
}

interface UserQuest {
  quest_id: string;
  progress: number;
  completed: boolean;
}

interface QuestLocation {
  quest_id: string;
  location_id: string;
  step_order: number;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
}

export default function Quests() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);
  const [questLocations, setQuestLocations] = useState<QuestLocation[]>([]);
  const [checkedInLocationIds, setCheckedInLocationIds] = useState<Set<string>>(new Set());

  const load = async () => {
    const { data: q } = await supabase.from("quests").select("*");
    if (q) setQuests(q);

    const { data: ql } = await supabase
      .from("quest_locations")
      .select("quest_id, location_id, step_order, locations(name, latitude, longitude)")
      .order("step_order");
    if (ql) {
      setQuestLocations(
        ql.map((item: any) => ({
          quest_id: item.quest_id,
          location_id: item.location_id,
          step_order: item.step_order,
          location_name: item.locations?.name ?? "Unknown",
          latitude: item.locations?.latitude ?? null,
          longitude: item.locations?.longitude ?? null,
        }))
      );
    }

    if (user) {
      const { data: uq } = await supabase
        .from("user_quests")
        .select("quest_id, progress, completed")
        .eq("user_id", user.id);
      if (uq) setUserQuests(uq);

      const { data: checkins } = await supabase
        .from("checkins")
        .select("location_id")
        .eq("user_id", user.id);
      if (checkins) {
        setCheckedInLocationIds(new Set(checkins.map((c) => c.location_id)));
      }
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const startQuest = async (questId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_quests")
      .insert({ user_id: user.id, quest_id: questId });
    if (error) {
      toast.error("Could not start quest");
      return;
    }
    toast.success("Quest started! 🚀");
    load();
  };

  const openInMaps = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=walking`;
    window.open(url, "_blank");
  };

  const getNextLocation = (questId: string): QuestLocation | null => {
    const locations = questLocations.filter(ql => ql.quest_id === questId);
    return locations.find(loc => !checkedInLocationIds.has(loc.location_id)) ?? null;
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="pt-2">
          <h1 className="font-display text-2xl font-bold">Quests</h1>
          <p className="text-muted-foreground text-sm">
            Visit linked locations to advance your quests
          </p>
        </div>

        <div className="space-y-4">
          {quests.map((quest) => {
            const uq = userQuests.find((q) => q.quest_id === quest.id);
            const progress = uq ? (uq.progress / quest.total_steps) * 100 : 0;
            const started = !!uq;
            const completed = uq?.completed ?? false;
            const locations = questLocations.filter(ql => ql.quest_id === quest.id);
            const nextLoc = started && !completed ? getNextLocation(quest.id) : null;

            return (
              <Card key={quest.id} className={completed ? "ring-2 ring-green-500" : ""}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{quest.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold">{quest.title}</h3>
                        {completed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{quest.description}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-muted rounded-full text-[10px] uppercase font-medium text-muted-foreground tracking-wide">
                        {quest.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {started && (
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{uq!.progress}/{quest.total_steps}</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Location checklist */}
                  {locations.length > 0 && started && !completed && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Locations to visit:</p>
                      {locations.map((loc) => {
                        const visited = checkedInLocationIds.has(loc.location_id);
                        return (
                          <div
                            key={loc.location_id}
                            className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg ${
                              visited ? "bg-green-500/10 text-green-600" : "bg-muted/50 text-muted-foreground"
                            }`}
                          >
                            {visited ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className={`flex-1 ${visited ? "line-through" : ""}`}>
                              {loc.location_name}
                            </span>
                            {!visited && loc.latitude && loc.longitude && (
                              <button
                                onClick={() => openInMaps(loc.latitude!, loc.longitude!, loc.location_name)}
                                className="text-primary hover:text-primary/80"
                                title="Get directions"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Next step CTA */}
                  {nextLoc && nextLoc.latitude && nextLoc.longitude && (
                    <Button
                      onClick={() => openInMaps(nextLoc.latitude!, nextLoc.longitude!, nextLoc.location_name)}
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      Navigate to {nextLoc.location_name}
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}

                  {!started ? (
                    <Button onClick={() => startQuest(quest.id)} className="w-full" size="sm">
                      <Sparkles className="w-4 h-4 mr-2" /> Begin Quest
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
