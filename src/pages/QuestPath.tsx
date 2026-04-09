import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import PathChallenge from "@/components/quest-paths/PathChallenge";
import { PATHS, QUEST_ID } from "@/components/quest-paths/pathData";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Trophy } from "lucide-react";
import ShareButton from "@/components/ShareButton";

interface PathResponse {
  path_number: number;
  response_data: Record<string, string>;
  completed: boolean;
}

export default function QuestPath() {
  const { user } = useAuth();
  const [activePath, setActivePath] = useState(1);
  const [responses, setResponses] = useState<PathResponse[]>([]);
  const [questStarted, setQuestStarted] = useState(false);
  const [questCompleted, setQuestCompleted] = useState(false);
  const [checkedInLocationIds, setCheckedInLocationIds] = useState<Set<string>>(new Set());
  const [questLocationMap, setQuestLocationMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Check if quest is started
    const { data: uq } = await supabase
      .from("user_quests")
      .select("*")
      .eq("user_id", user.id)
      .eq("quest_id", QUEST_ID)
      .maybeSingle();

    setQuestStarted(!!uq);
    setQuestCompleted(uq?.completed ?? false);

    // Load path responses
    const { data: pr } = await supabase
      .from("quest_path_responses")
      .select("path_number, response_data, completed")
      .eq("user_id", user.id)
      .eq("quest_id", QUEST_ID);

    if (pr) setResponses(pr as PathResponse[]);

    // Load checkins
    const { data: checkins } = await supabase
      .from("checkins")
      .select("location_id")
      .eq("user_id", user.id);
    if (checkins) setCheckedInLocationIds(new Set(checkins.map((c) => c.location_id)));

    // Load quest location mapping
    const { data: ql } = await supabase
      .from("quest_locations")
      .select("step_order, location_id")
      .eq("quest_id", QUEST_ID)
      .order("step_order");
    if (ql) {
      const map: Record<number, string> = {};
      ql.forEach((q) => { map[q.step_order] = q.location_id; });
      setQuestLocationMap(map);
    }

    // Auto-navigate to first incomplete path
    if (pr) {
      const completedPaths = new Set(pr.filter((p) => p.completed).map((p) => p.path_number));
      for (let i = 1; i <= 10; i++) {
        if (!completedPaths.has(i)) {
          setActivePath(i);
          break;
        }
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const startQuest = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("user_quests")
      .insert({ user_id: user.id, quest_id: QUEST_ID });
    if (error) {
      toast.error("Could not start quest");
      return;
    }
    toast.success("Your journey begins! 🌳");
    load();
  };

  const handleSave = () => { load(); };

  const getResponseForPath = (pathNum: number) =>
    responses.find((r) => r.path_number === pathNum);

  const isPathUnlocked = (pathNum: number) => {
    if (pathNum === 1) return true;
    const prev = getResponseForPath(pathNum - 1);
    return prev?.completed ?? false;
  };

  const completedCount = responses.filter((r) => r.completed).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground animate-pulse">Loading your journey…</p>
        </div>
      </AppLayout>
    );
  }

  // Quest intro / start screen
  if (!questStarted) {
    return (
      <AppLayout>
        <div className="p-4 space-y-6 animate-fade-in">
          <div className="text-center pt-8 space-y-4">
            <span className="text-6xl">🌳</span>
            <h1 className="font-display text-2xl font-bold">
              The 10 Paths: Malkuth to Kether
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              A transformative journey through 10 stages of self-discovery, structured thinking, and decisive action — inspired by the Tree of Life.
            </p>
            <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto pt-4">
              {PATHS.map((p) => (
                <div key={p.number} className="text-center">
                  <span className="text-2xl">{p.symbol}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.sephira}</p>
                </div>
              ))}
            </div>
            <Button onClick={startQuest} size="lg" className="mt-6 gap-2">
              <Sparkles className="w-5 h-5" /> Begin The Journey
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Quest completed screen
  if (questCompleted && completedCount === 10) {
    return (
      <AppLayout>
        <div className="p-4 space-y-6 animate-fade-in">
          <div className="text-center pt-8 space-y-4">
            <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
            <h1 className="font-display text-2xl font-bold">
              Walker of the Crown 👑
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              You have completed The 10 Paths. From self-knowledge to decisive action, you've walked the Tree of Life.
            </p>
            <ShareButton
              title="I completed The 10 Paths: Malkuth to Kether on Zartour! 🌳👑"
              text="From self-knowledge to decisive action — The Tree of Life journey."
            />
            <Button
              variant="outline"
              onClick={() => setActivePath(1)}
              className="mt-4"
            >
              Review Your Responses
            </Button>
          </div>

          {/* Path selector for review */}
          <div className="grid grid-cols-5 gap-2">
            {PATHS.map((p) => (
              <button
                key={p.number}
                onClick={() => setActivePath(p.number)}
                className={`text-center p-2 rounded-lg transition-all ${
                  activePath === p.number ? "ring-2 ring-primary bg-muted" : "bg-muted/30"
                }`}
              >
                <span className="text-xl">{p.symbol}</span>
                <p className="text-[9px] text-muted-foreground mt-0.5">{p.sephira}</p>
              </button>
            ))}
          </div>

          <PathChallenge
            path={PATHS[activePath - 1]}
            questId={QUEST_ID}
            totalPaths={10}
            isUnlocked={true}
            isCompleted={true}
            savedData={getResponseForPath(activePath)?.response_data ?? {}}
            checkedInLocationIds={checkedInLocationIds}
            locationId={questLocationMap[activePath] ?? null}
            onSave={handleSave}
            onNext={() => setActivePath((p) => Math.min(p + 1, 10))}
            onPrev={() => setActivePath((p) => Math.max(p - 1, 1))}
          />
        </div>
      </AppLayout>
    );
  }

  // Active quest
  return (
    <AppLayout>
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="pt-2">
          <h1 className="font-display text-xl font-bold">The 10 Paths</h1>
          <p className="text-muted-foreground text-xs">
            {completedCount}/10 paths completed
          </p>
        </div>

        {/* Path selector */}
        <div className="grid grid-cols-5 gap-2">
          {PATHS.map((p) => {
            const resp = getResponseForPath(p.number);
            const unlocked = isPathUnlocked(p.number);
            const completed = resp?.completed ?? false;
            return (
              <button
                key={p.number}
                onClick={() => unlocked && setActivePath(p.number)}
                className={`text-center p-2 rounded-lg transition-all ${
                  activePath === p.number
                    ? "ring-2 ring-primary bg-muted"
                    : completed
                    ? "bg-green-500/10"
                    : unlocked
                    ? "bg-muted/50 hover:bg-muted"
                    : "bg-muted/20 opacity-50"
                }`}
                disabled={!unlocked}
              >
                <span className="text-xl">{completed ? "✅" : p.symbol}</span>
                <p className="text-[9px] text-muted-foreground mt-0.5">{p.sephira}</p>
              </button>
            );
          })}
        </div>

        <PathChallenge
          path={PATHS[activePath - 1]}
          questId={QUEST_ID}
          totalPaths={10}
          isUnlocked={isPathUnlocked(activePath)}
          isCompleted={getResponseForPath(activePath)?.completed ?? false}
          savedData={getResponseForPath(activePath)?.response_data ?? {}}
          checkedInLocationIds={checkedInLocationIds}
          locationId={questLocationMap[activePath] ?? null}
          onSave={handleSave}
          onNext={() => setActivePath((p) => Math.min(p + 1, 10))}
          onPrev={() => setActivePath((p) => Math.max(p - 1, 1))}
        />
      </div>
    </AppLayout>
  );
}
