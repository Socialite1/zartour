import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CheckCircle2, QrCode, ArrowRight, ArrowLeft, Lock } from "lucide-react";
import { PathInfo } from "./pathData";
import QrScanner from "@/components/QrScanner";

interface PathChallengeProps {
  path: PathInfo;
  questId: string;
  totalPaths: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  savedData: Record<string, string>;
  checkedInLocationIds: Set<string>;
  locationId: string | null;
  onSave: (pathNumber: number, data: Record<string, string>, completed: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function PathChallenge({
  path,
  questId,
  totalPaths,
  isUnlocked,
  isCompleted,
  savedData,
  checkedInLocationIds,
  locationId,
  onSave,
  onNext,
  onPrev,
}: PathChallengeProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Record<string, string>>(savedData);
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const needsCheckin = locationId && !checkedInLocationIds.has(locationId);

  useEffect(() => {
    setFormData(savedData);
  }, [path.number, savedData]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (markComplete: boolean) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("quest_path_responses")
        .upsert(
          {
            user_id: user.id,
            quest_id: questId,
            path_number: path.number,
            response_data: formData as any,
            completed: markComplete,
          },
          { onConflict: "user_id,quest_id,path_number" }
        );
      if (error) throw error;

      if (markComplete) {
        // Award points
        await supabase.rpc("advance_quest", { p_quest_id: questId });
        toast.success(`Path ${path.number} completed! +${path.points} XP 🎉`);
      } else {
        toast.success("Progress saved!");
      }
      onSave(path.number, formData, markComplete);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleQrScan = async (result: string) => {
    setShowScanner(false);
    if (!user) return;
    try {
      const { data } = await supabase.rpc("get_location_by_qr", { p_qr_code_id: result });
      if (!data) {
        toast.error("Invalid QR code");
        return;
      }
      const loc = data as any;
      // Create checkin
      await supabase.from("checkins").insert({
        user_id: user.id,
        location_id: loc.id,
        points_earned: loc.points_reward || 10,
      });
      toast.success(`Checked in at ${loc.name}! 📍`);
      // Reload parent state
      onSave(path.number, formData, false);
    } catch {
      toast.error("Check-in failed");
    }
  };

  const allFieldsFilled = path.fields.every((f) => formData[f.key]?.trim());
  const progressPercent = (path.number / totalPaths) * 100;

  if (!isUnlocked) {
    return (
      <div className="text-center py-12 space-y-4">
        <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
        <h3 className="font-display text-lg font-bold text-muted-foreground">
          Path {path.number}: {path.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          Complete the previous path and scan the QR code to unlock this stage.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {showScanner && (
        <QrScanner onScan={handleQrScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Header */}
      <div className={`rounded-xl p-5 bg-gradient-to-br ${path.colorClass} text-foreground`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{path.symbol}</span>
          <div>
            <p className="text-xs uppercase tracking-widest font-medium opacity-70">
              Path {path.number} of {totalPaths} · {path.sephira}
            </p>
            <h2 className="font-display text-xl font-bold">{path.name}</h2>
          </div>
          {isCompleted && <CheckCircle2 className="w-6 h-6 text-green-600 ml-auto" />}
        </div>
        <p className="text-sm opacity-80">{path.theme}</p>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Overall Progress</span>
          <span>{path.number}/{totalPaths}</span>
        </div>
        <Progress value={progressPercent} className="h-2.5" />
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed">{path.description}</p>

      {/* QR Check-in requirement */}
      {needsCheckin && (
        <div className="bg-muted/50 rounded-lg p-4 text-center space-y-2">
          <QrCode className="w-8 h-8 mx-auto text-primary" />
          <p className="text-sm font-medium">Scan the QR code at this location to unlock the challenge</p>
          <Button onClick={() => setShowScanner(true)} size="sm" className="gap-2">
            <QrCode className="w-4 h-4" /> Scan QR Code
          </Button>
        </div>
      )}

      {/* Challenge Fields */}
      {!needsCheckin && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Challenge: {path.outputLabel}
          </h3>
          {path.fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-sm font-medium">{field.label}</label>
              {field.type === "textarea" ? (
                <Textarea
                  placeholder={field.placeholder}
                  value={formData[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  disabled={isCompleted}
                  className="min-h-[80px]"
                />
              ) : (
                <Input
                  placeholder={field.placeholder}
                  value={formData[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  disabled={isCompleted}
                />
              )}
            </div>
          ))}

          {/* Actions */}
          {!isCompleted && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex-1"
              >
                Save Draft
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={saving || !allFieldsFilled}
                className="flex-1"
              >
                Complete Path (+{path.points} XP)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        {path.number > 1 && (
          <Button variant="ghost" onClick={onPrev} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Previous
          </Button>
        )}
        {path.number < totalPaths && (
          <Button variant="ghost" onClick={onNext} className="gap-1 ml-auto">
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
