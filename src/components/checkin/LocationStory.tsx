import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Lightbulb, ArrowRight } from "lucide-react";

interface LocationStoryProps {
  locationName: string;
  storyText: string;
  funFact: string | null;
  onContinue: () => void;
}

export default function LocationStory({ locationName, storyText, funFact, onContinue }: LocationStoryProps) {
  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="pt-2 text-center">
        <BookOpen className="w-10 h-10 mx-auto text-primary mb-2" />
        <h1 className="font-display text-2xl font-bold">{locationName}</h1>
        <p className="text-muted-foreground text-sm">The Story</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm leading-relaxed">{storyText}</p>
        </CardContent>
      </Card>

      {funFact && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex gap-3">
            <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Fun Fact</p>
              <p className="text-sm">{funFact}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={onContinue} className="w-full" size="lg">
        Continue to Quiz <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
