
'use client';

import type { Flashcard } from '@/ai/flows/generate-flashcards-flow';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, RefreshCwIcon } from 'lucide-react'; // Changed to RefreshCwIcon
import { cn } from '@/lib/utils';

interface FlashcardViewerProps {
  flashcards: Flashcard[];
}

export function FlashcardViewer({ flashcards }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return <p className="text-muted-foreground text-center py-10">No flashcards to display.</p>;
  }

  const currentFlashcard = flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false); 
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false); 
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flex flex-col items-center w-full gap-4 p-2 md:p-4">
      <div className="w-full max-w-lg aspect-[16/10] perspective">
        <Card
          className={cn(
            'relative w-full h-full transition-transform duration-700 preserve-3d text-card-foreground shadow-xl cursor-pointer flex items-center justify-center p-6 text-center bg-card',
            isFlipped ? 'rotate-y-180' : ''
          )}
          onClick={handleFlip}
          role="button"
          tabIndex={0}
          aria-pressed={isFlipped}
          aria-label={isFlipped ? `Back: ${currentFlashcard.back}` : `Front: ${currentFlashcard.front}`}
        >
          {/* Front of the card */}
          <CardContent className="absolute w-full h-full backface-hidden flex items-center justify-center p-4">
            <p className="text-xl md:text-2xl font-semibold">{currentFlashcard.front}</p>
          </CardContent>
          {/* Back of the card */}
          <CardContent className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-4">
            <p className="text-lg md:text-xl">{currentFlashcard.back}</p>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground mt-2">
        Card {currentIndex + 1} of {flashcards.length}
      </p>

      <div className="flex items-center justify-center w-full max-w-md mt-1 space-x-3">
        <Button variant="outline" size="icon" onClick={handlePrevious} disabled={flashcards.length <= 1} aria-label="Previous card">
          <ArrowLeft className="h-5 w-5" />
        </Button>
         <Button variant="default" onClick={handleFlip} className="px-6 py-2 text-base" aria-label="Flip card">
          <RefreshCwIcon className="mr-2 h-5 w-5" /> Flip
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext} disabled={flashcards.length <= 1} aria-label="Next card">
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Global styles for flip animation - ideally in globals.css but here for encapsulation if preferred */}
      {/* It's better to have these in globals.css for wider use and to avoid style tag per component instance */}
      {/* For this exercise, keeping it as instructed if possible to modify globals.css (already done for previous features) */}
      {/* If not, this <style jsx global> would be how to ensure it's available */}
    </div>
  );
}
