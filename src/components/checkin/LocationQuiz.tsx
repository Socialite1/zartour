import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, ArrowRight, HelpCircle } from "lucide-react";

interface QuizQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: string;
  question_order: number;
}

interface LocationQuizProps {
  questions: QuizQuestion[];
  onComplete: (answers: { questionId: string; selected: string; correct: boolean }[]) => void;
}

export default function LocationQuiz({ questions, onComplete }: LocationQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: string; selected: string; correct: boolean }[]>([]);

  const question = questions[currentIndex];
  if (!question) return null;

  const isCorrect = selectedOption === question.correct_option;

  const handleSubmitAnswer = () => {
    setShowResult(true);
    setAnswers(prev => [...prev, {
      questionId: question.id,
      selected: selectedOption,
      correct: selectedOption === question.correct_option,
    }]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      const finalAnswers = [...answers];
      // last answer already pushed in handleSubmitAnswer
      onComplete(finalAnswers);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption("");
      setShowResult(false);
    }
  };

  const options = [
    { key: "a", text: question.option_a },
    { key: "b", text: question.option_b },
    { key: "c", text: question.option_c },
  ];

  const correctCount = answers.filter(a => a.correct).length;

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="pt-2 text-center">
        <HelpCircle className="w-10 h-10 mx-auto text-primary mb-2" />
        <h1 className="font-display text-xl font-bold">Quiz Time!</h1>
        <p className="text-muted-foreground text-sm">
          Question {currentIndex + 1} of {questions.length} · {correctCount}/{answers.length} correct
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <p className="font-medium">{question.question_text}</p>

          <RadioGroup value={selectedOption} onValueChange={setSelectedOption} disabled={showResult}>
            {options.map(opt => {
              let optionClass = "border rounded-lg p-3 flex items-center gap-3 transition-colors";
              if (showResult) {
                if (opt.key === question.correct_option) {
                  optionClass += " border-green-500 bg-green-500/10";
                } else if (opt.key === selectedOption && !isCorrect) {
                  optionClass += " border-destructive bg-destructive/10";
                } else {
                  optionClass += " opacity-50";
                }
              } else if (opt.key === selectedOption) {
                optionClass += " border-primary bg-primary/5";
              }

              return (
                <Label key={opt.key} className={optionClass}>
                  <RadioGroupItem value={opt.key} />
                  <span className="text-sm flex-1">{opt.text}</span>
                  {showResult && opt.key === question.correct_option && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  {showResult && opt.key === selectedOption && !isCorrect && opt.key !== question.correct_option && (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                </Label>
              );
            })}
          </RadioGroup>

          {showResult && (
            <div className={`p-3 rounded-lg text-sm text-center font-medium ${isCorrect ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
              {isCorrect ? "🎉 Correct!" : "❌ Not quite — see the right answer above!"}
            </div>
          )}
        </CardContent>
      </Card>

      {!showResult ? (
        <Button onClick={handleSubmitAnswer} className="w-full" disabled={!selectedOption}>
          Submit Answer
        </Button>
      ) : (
        <Button onClick={handleNext} className="w-full">
          {currentIndex + 1 >= questions.length ? "Continue to Feedback" : "Next Question"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
}
