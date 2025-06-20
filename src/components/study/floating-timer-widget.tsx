
'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Pause, Play, Square } from 'lucide-react';
import React from 'react';

interface FloatingTimerWidgetProps {
  timeInSeconds: number;
  isRunning: boolean;
  onTogglePlayPause: () => void;
  onEndSession?: () => void;
  className?: string;
}

export function FloatingTimerWidget({
  timeInSeconds,
  isRunning,
  onTogglePlayPause,
  onEndSession,
  className,
}: FloatingTimerWidgetProps) {
  
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        "fixed top-5 right-5 z-50 flex items-center justify-center p-2 rounded-full bg-background/80 backdrop-blur-md shadow-xl border border-border",
        "transition-all duration-300 ease-out",
        // isRunning && "animate-pulse-subtle ring-2 ring-primary ring-offset-2 ring-offset-background", // pulse can be distracting
        className
      )}
    >
      <div className="flex items-center space-x-2">
        <span className="text-base font-mono font-medium text-foreground tabular-nums min-w-[50px] sm:min-w-[60px] text-center px-1">
          {formatTime(timeInSeconds)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onTogglePlayPause}
          className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-primary/20 text-primary"
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          {isRunning ? <Pause className="h-4 w-4 sm:h-5 sm:w-5" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5" />}
        </Button>
        {onEndSession && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onEndSession}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-destructive/20 text-destructive"
            aria-label="End session"
          >
            <Square className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
