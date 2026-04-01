import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Send } from "lucide-react";

interface LocationFeedbackProps {
  locationName: string;
  onSubmit: (rating: number, feedback: string) => void;
  loading: boolean;
}

export default function LocationFeedback({ locationName, onSubmit, loading }: LocationFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="pt-2 text-center">
        <Star className="w-10 h-10 mx-auto text-primary mb-2" />
        <h1 className="font-display text-xl font-bold">Rate This Location</h1>
        <p className="text-muted-foreground text-sm">How was your experience at {locationName}?</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-125"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Your feedback (optional)</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Tell us about your experience..."
              maxLength={500}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => onSubmit(rating, feedback)}
        className="w-full"
        disabled={rating === 0 || loading}
        size="lg"
      >
        <Send className="w-4 h-4 mr-2" />
        {loading ? "Submitting..." : "Submit & Earn Points"}
      </Button>
    </div>
  );
}
