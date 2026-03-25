import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, CheckCircle2 } from "lucide-react";

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

export default function Quests() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);

  const load = async () => {
    const { data: q } = await supabase.from("quests").select("*");
    if (q) setQuests(q);
    if (user) {
      const { data: uq } = await supabase.from("user_quests").select("quest_id, progress, completed").eq("user_id", user.id);
      if (uq) setUserQuests(uq);
    }
  };

  useEffect(() => { load(); }, [user]);

  const startQuest = async (questId: string) => {
    if (!user) return;
    const { error } = await supabase.from("user_quests").insert({ user_id: user.id, quest_id: questId });
    if (error) { toast.error("Could not start quest"); return; }
    toast.success("Quest started! 🚀");
    load();
  };

  const advanceQuest = async (questId: string) => {
    if (!user) return;
    const uq = userQuests.find(q => q.quest_id === questId);
    if (!uq) return;
    const quest = quests.find(q => q.id === questId)!;
    const newProgress = uq.progress + 1;
    const completed = newProgress >= quest.total_steps;

    const { error } = await supabase
      .from("user_quests")
      .update({
        progress: newProgress,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("user_id", user.id)
      .eq("quest_id", questId);

    if (error) { toast.error("Could not update quest"); return; }
    toast.success(completed ? "Quest completed! 🎉" : `Step ${newProgress} complete!`);
    load();
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="pt-2">
          <h1 className="font-display text-2xl font-bold">Quests</h1>
          <p className="text-muted-foreground text-sm">Embark on self-discovery journeys</p>
        </div>

        <div className="space-y-4">
          {quests.map((quest) => {
            const uq = userQuests.find(q => q.quest_id === quest.id);
            const progress = uq ? (uq.progress / quest.total_steps) * 100 : 0;
            const started = !!uq;
            const completed = uq?.completed ?? false;

            return (
              <Card key={quest.id} className={completed ? "ring-2 ring-success" : ""}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{quest.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold">{quest.title}</h3>
                        {completed && <CheckCircle2 className="w-4 h-4 text-success" />}
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

                  {!started ? (
                    <Button onClick={() => startQuest(quest.id)} className="w-full" size="sm">
                      <Sparkles className="w-4 h-4 mr-2" /> Begin Quest
                    </Button>
                  ) : !completed ? (
                    <Button onClick={() => advanceQuest(quest.id)} variant="outline" className="w-full" size="sm">
                      Complete Next Step
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
