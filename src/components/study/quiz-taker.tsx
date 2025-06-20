
'use client';

import type { QuizQuestion } from '@/ai/flows/generate-quiz-flow';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, CheckCircle, RotateCcwIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

interface QuizTakerProps {
  questions: QuizQuestion[];
  quizTitle?: string;
}

interface UserAnswer {
  questionIndex: number;
  answer: string;
}

type QuizPhase = 'taking' | 'results';

export function QuizTaker({ questions, quizTitle = "Quiz" }: QuizTakerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [currentSelection, setCurrentSelection] = useState<string | undefined>(undefined);
  const [quizPhase, setQuizPhase] = useState<QuizPhase>('taking');
  const [score, setScore] = useState(0);

  useEffect(() => {
    const savedAnswer = userAnswers.find(ua => ua.questionIndex === currentIndex);
    setCurrentSelection(savedAnswer?.answer);
  }, [currentIndex, userAnswers]);

  if (!questions || questions.length === 0) {
    return <p className="text-muted-foreground text-center py-10">No questions in this quiz.</p>;
  }

  const currentQuestion = questions[currentIndex];

  const handleOptionSelect = (value: string) => {
    setCurrentSelection(value);
    setUserAnswers(prev => {
      const existingAnswerIndex = prev.findIndex(ua => ua.questionIndex === currentIndex);
      const newAnswer: UserAnswer = { questionIndex: currentIndex, answer: value };
      if (existingAnswerIndex > -1) {
        const updatedAnswers = [...prev];
        updatedAnswers[existingAnswerIndex] = newAnswer;
        return updatedAnswers;
      }
      return [...prev, newAnswer];
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  const handleSubmitQuiz = () => {
    let calculatedScore = 0;
    userAnswers.forEach(ua => {
      const question = questions[ua.questionIndex];
      if (question && question.correctAnswer && ua.answer && question.correctAnswer.trim().toLowerCase() === ua.answer.trim().toLowerCase()) {
        calculatedScore++;
      }
    });
    setScore(calculatedScore);
    setQuizPhase('results');
  };
  
  const handleRetakeQuiz = () => {
    setCurrentIndex(0);
    setUserAnswers([]);
    setCurrentSelection(undefined);
    setScore(0);
    setQuizPhase('taking');
  };

  if (quizPhase === 'results') {
    return (
      <div className="flex flex-col items-center w-full gap-6 p-4 md:p-6">
        <CardHeader className="text-center p-0">
          <CardTitle className="text-2xl md:text-3xl font-bold">{quizTitle} - Results</CardTitle>
          <CardDescription className="text-lg md:text-xl mt-2 text-muted-foreground">
            You scored: <span className="text-primary font-semibold">{score} / {questions.length}</span> ({((score / questions.length) * 100).toFixed(0)}%)
          </CardDescription>
        </CardHeader>
        <ScrollArea className="w-full max-h-[calc(70vh-200px)] pr-3 custom-scrollbar">
          <div className="space-y-4">
            {questions.map((q, index) => {
              const userAnswerObj = userAnswers.find(ua => ua.questionIndex === index);
              const userAnswerText = userAnswerObj?.answer || "Not answered";
              const isCorrect = q.correctAnswer && userAnswerObj?.answer ? q.correctAnswer.trim().toLowerCase() === userAnswerObj.answer.trim().toLowerCase() : false;
              
              return (
                <Card 
                    key={index} 
                    className={cn('p-4 border-l-4', 
                        isCorrect ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'
                    )}
                >
                  <p className="font-semibold text-base text-foreground">{index + 1}. {q.question}</p>
                  <p className={cn("text-sm mt-1", isCorrect ? "text-success-foreground/80" : "text-destructive-foreground/80")}>
                    Your answer: <span className="font-medium">{userAnswerText}</span>
                  </p>
                  {!isCorrect && q.correctAnswer && (
                    <p className="text-sm mt-1 text-green-300">
                      Correct answer: <span className="font-medium">{q.correctAnswer}</span>
                    </p>
                  )}
                  {q.explanation && (
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                      <span className="font-semibold">Explanation:</span> {q.explanation}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </ScrollArea>
        <Button onClick={handleRetakeQuiz} variant="outline" size="lg" className="mt-4">
          <RotateCcwIcon className="mr-2 h-5 w-5" /> Retake Quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full p-2 md:p-4 gap-3 md:gap-4">
      <CardHeader className="p-0 md:p-1">
        <CardTitle className="text-xl md:text-2xl mb-2 text-center font-bold">{quizTitle}</CardTitle>
        <div className="flex items-center justify-between px-1">
            <p className="text-sm text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>
            <Progress value={((currentIndex + 1) / questions.length) * 100} className="w-2/5 h-2.5 bg-muted" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-2 md:p-3 mt-2 min-h-[250px]">
        <p className="text-base md:text-lg font-semibold mb-4 md:mb-6 text-foreground">{currentQuestion.question}</p>
        {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
          <RadioGroup
            value={currentSelection}
            onValueChange={handleOptionSelect}
            className="space-y-3 md:space-y-4"
          >
            {currentQuestion.options.map((option, index) => (
              <Label
                key={index}
                htmlFor={`option-${index}-${currentIndex}`} // Ensure unique ID for each question render
                className="flex items-center space-x-3 p-3 md:p-4 border-2 border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:shadow-md"
              >
                <RadioGroupItem value={option} id={`option-${index}-${currentIndex}`} className="border-primary/50 text-primary"/>
                <span className="text-sm md:text-base text-foreground/90">{option}</span>
              </Label>
            ))}
          </RadioGroup>
        )}
        {currentQuestion.type === 'open-ended' && (
          <Textarea
            placeholder="Type your answer here..."
            value={currentSelection || ''}
            onChange={(e) => handleOptionSelect(e.target.value)}
            className="min-h-[120px] text-base md:text-lg p-3 bg-input border-border focus:border-primary"
            rows={4}
          />
        )}
      </CardContent>

      <div className="flex items-center justify-between p-2 md:p-3 border-t border-border mt-auto">
        <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0} size="lg">
          <ArrowLeft className="mr-2 h-5 w-5" /> Previous
        </Button>
        {currentIndex === questions.length - 1 ? (
          <Button onClick={handleSubmitQuiz} className="bg-success hover:bg-success/90 text-success-foreground" size="lg">
            Submit Quiz <CheckCircle className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <Button onClick={handleNext} size="lg">
            Next <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
