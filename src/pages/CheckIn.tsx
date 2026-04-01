import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { MapPin, CheckCircle2, ScanLine, Sparkles } from "lucide-react";
import QrScanner from "@/components/QrScanner";
import LocationStory from "@/components/checkin/LocationStory";
import LocationQuiz from "@/components/checkin/LocationQuiz";
import LocationFeedback from "@/components/checkin/LocationFeedback";
import ShareButton from "@/components/ShareButton";

interface Location {
  id: string;
  name: string;
  description: string | null;
  points_reward: number;
}

interface Story {
  story_text: string;
  fun_fact: string | null;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: string;
  question_order: number;
}

type Step = "idle" | "scanning" | "story" | "quiz" | "feedback" | "success";

export default function CheckIn() {
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const qrId = searchParams.get("qr");

  const [step, setStep] = useState<Step>(qrId ? "idle" : "idle");
  const [location, setLocation] = useState<Location | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const lookupLocation = useCallback(async (qrCode: string) => {
    setError(null);
    const { data } = await supabase.rpc("get_location_by_qr", { p_qr_code_id: qrCode });
    if (data) {
      const loc = data as any;
      const locObj: Location = { id: loc.id, name: loc.name, description: loc.description, points_reward: loc.points_reward };
      setLocation(locObj);

      // Load story and quiz in parallel
      const [storyRes, quizRes] = await Promise.all([
        supabase.from("location_stories").select("story_text, fun_fact").eq("location_id", loc.id).maybeSingle(),
        supabase.from("location_quiz_questions").select("*").eq("location_id", loc.id).order("question_order"),
      ]);

      if (storyRes.data) {
        setStory(storyRes.data);
        setStep("story");
      } else if (quizRes.data && quizRes.data.length > 0) {
        setQuestions(quizRes.data as QuizQuestion[]);
        setStep("quiz");
      } else {
        setStep("feedback");
      }

      if (quizRes.data && quizRes.data.length > 0) {
        setQuestions(quizRes.data as QuizQuestion[]);
      }
    } else {
      setError("Invalid QR code. Please scan a valid location QR code.");
    }
  }, []);

  useEffect(() => {
    if (qrId) lookupLocation(qrId);
  }, [qrId, lookupLocation]);

  const handleScan = useCallback((qrCode: string) => {
    setShowScanner(false);
    setSearchParams({ qr: qrCode });
  }, [setSearchParams]);

  const handleStoryComplete = () => {
    if (questions.length > 0) {
      setStep("quiz");
    } else {
      setStep("feedback");
    }
  };

  const handleQuizComplete = async (answers: { questionId: string; selected: string; correct: boolean }[]) => {
    const score = answers.filter(a => a.correct).length;
    setQuizScore(score);

    // Save answers
    if (user) {
      for (const ans of answers) {
        await supabase.from("user_quiz_answers").insert({
          user_id: user.id,
          question_id: ans.questionId,
          selected_option: ans.selected,
          is_correct: ans.correct,
        }).then(() => {}); // ignore duplicate errors
      }
    }

    setStep("feedback");
  };

  const handleFeedbackSubmit = async (rating: number, feedbackText: string) => {
    if (!user || !location) return;
    setLoading(true);

    try {
      // Check for duplicate checkin
      const { data: existing } = await supabase
        .from("checkins")
        .select("id")
        .eq("user_id", user.id)
        .eq("location_id", location.id)
        .maybeSingle();

      if (existing) {
        toast.error("You've already checked in at this location!");
        setLoading(false);
        return;
      }

      // Bonus points for quiz performance
      const bonusPoints = quizScore * 5;
      const totalPoints = location.points_reward + bonusPoints;

      // Create check-in
      await supabase.from("checkins").insert({
        user_id: user.id,
        location_id: location.id,
        caption: feedbackText || null,
        points_earned: totalPoints,
      });

      // Save feedback
      await supabase.from("location_feedback").insert({
        user_id: user.id,
        location_id: location.id,
        rating,
        feedback_text: feedbackText || null,
      }).then(() => {}); // ignore duplicate

      // Update points
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("points")
        .eq("user_id", user.id)
        .single();

      await supabase
        .from("profiles")
        .update({ points: (currentProfile?.points ?? 0) + totalPoints })
        .eq("user_id", user.id);

      // Auto-advance quests
      const { data: questResults } = await supabase.rpc("advance_quests_for_checkin", { p_location_id: location.id });
      if (questResults && Array.isArray(questResults) && questResults.length > 0) {
        for (const qr of questResults as any[]) {
          if (qr.completed) {
            toast.success("Quest completed! 🎉");
          } else {
            toast.success(`Quest progress: step ${qr.progress}!`);
          }
        }
      }

      // Badge check
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

      setPointsEarned(totalPoints);
      setStep("success");
      await refreshProfile();
      toast.success(`+${totalPoints} points! 🎉`);
    } catch (err: any) {
      toast.error(err.message || "Failed to check in");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep("idle");
    setLocation(null);
    setStory(null);
    setQuestions([]);
    setQuizScore(0);
    setError(null);
    setSearchParams({});
  };

  // QR Scanner overlay
  if (showScanner) {
    return <QrScanner onScan={handleScan} onClose={() => setShowScanner(false)} />;
  }

  // Success screen
  if (step === "success" && location) {
    return (
      <AppLayout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="font-display text-3xl font-bold">Check-in Complete!</h1>
            <div>
              <span className="text-5xl font-display font-bold text-secondary">+{pointsEarned}</span>
              <p className="text-muted-foreground mt-1">points earned</p>
              {quizScore > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Includes +{quizScore * 5} quiz bonus ({quizScore}/3 correct)
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-center pt-4">
              <Button onClick={resetFlow} variant="outline">Scan Another</Button>
              <ShareButton
                title={`I checked in at ${location.name}!`}
                text={`Just earned ${pointsEarned} points at ${location.name} on Zartour! 🗺️`}
                url={window.location.origin}
              />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Story step
  if (step === "story" && story && location) {
    return (
      <AppLayout>
        <LocationStory
          locationName={location.name}
          storyText={story.story_text}
          funFact={story.fun_fact}
          onContinue={handleStoryComplete}
        />
      </AppLayout>
    );
  }

  // Quiz step
  if (step === "quiz" && questions.length > 0) {
    return (
      <AppLayout>
        <LocationQuiz questions={questions} onComplete={handleQuizComplete} />
      </AppLayout>
    );
  }

  // Feedback step
  if (step === "feedback" && location) {
    return (
      <AppLayout>
        <LocationFeedback
          locationName={location.name}
          onSubmit={handleFeedbackSubmit}
          loading={loading}
        />
      </AppLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <div className="p-4 flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <MapPin className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-bold">Invalid QR Code</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={resetFlow} variant="outline">Try Again</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Loading location
  if (qrId && !location && !error) {
    return (
      <AppLayout>
        <div className="p-4 flex items-center justify-center min-h-[80vh]">
          <p className="text-muted-foreground animate-pulse">Looking up location...</p>
        </div>
      </AppLayout>
    );
  }

  // Default: prompt to scan
  return (
    <AppLayout>
      <div className="p-4 flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <ScanLine className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold">Scan a QR Code</h1>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Find a QR code at one of our locations and scan it to check in, learn the story, take a quiz, and earn points!
          </p>
          <Button onClick={() => setShowScanner(true)} size="lg" className="w-full max-w-xs">
            <ScanLine className="w-5 h-5 mr-2" /> Open Scanner
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
