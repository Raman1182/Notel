
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Pause, Play, Square, GripVertical } from 'lucide-react';

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
  const [position, setPosition] = useState({ x: window.innerWidth - 200, y: 20 }); // Initial top-right-ish
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Adjust initial position if it's off-screen due to SSR/initial window size
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      const initialX = window.innerWidth - rect.width - 20; // 20px offset from right
      const initialY = 20; // 20px offset from top
      setPosition({ x: initialX, y: initialY });
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging via a specific drag handle if one exists, or the whole widget if not.
    // For now, let's assume the whole widget is draggable if no specific handle is designated.
    // Or, check if the target is one of the buttons.
    const target = e.target as HTMLElement;
    if (target.closest('button')) { // Don't drag if clicking on a button
        return;
    }

    setIsDragging(true);
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      setDragStartOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    e.preventDefault(); // Prevents text selection
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !widgetRef.current) return;

    let newX = e.clientX - dragStartOffset.x;
    let newY = e.clientY - dragStartOffset.y;

    // Boundary checks
    const widgetWidth = widgetRef.current.offsetWidth;
    const widgetHeight = widgetRef.current.offsetHeight;
    
    newX = Math.max(0, Math.min(newX, window.innerWidth - widgetWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - widgetHeight));

    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStartOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
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
      ref={widgetRef}
      className={cn(
        "fixed z-50 flex items-center justify-between p-2 rounded-lg bg-background/80 backdrop-blur-md shadow-xl border border-border",
        "transition-opacity duration-300 ease-out", // No position transition for dragging
        isDragging ? 'cursor-grabbing shadow-2xl' : 'cursor-grab',
        className
      )}
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center space-x-1.5">
         <GripVertical className="h-5 w-5 text-muted-foreground/50 shrink-0 mr-1 touch-none" />
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
