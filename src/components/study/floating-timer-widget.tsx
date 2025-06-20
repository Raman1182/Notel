
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Pause, Play, Square, GripVertical } from 'lucide-react';

interface FloatingTimerWidgetProps {
  timeInSeconds: number;
  isRunning: boolean;
  onTogglePlayPause: () => void;
  onEndSession?: () => void; // Changed to optional as page now controls dialog
  className?: string;
}

export function FloatingTimerWidget({
  timeInSeconds,
  isRunning,
  onTogglePlayPause,
  onEndSession,
  className,
}: FloatingTimerWidgetProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true); // Indicate component has mounted for client-side positioning
  }, []);

  useEffect(() => {
    if (hasMounted && widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      const initialX = window.innerWidth - rect.width - 20; // 20px offset from right
      const initialY = 20; // 20px offset from top
      setPosition({ x: Math.max(0, initialX), y: Math.max(0, initialY) });
    }
  }, [hasMounted]);


  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Only allow dragging if the GripVertical icon itself is clicked, or if no buttons exist for some reason
    if (!target.closest('button') || target.closest('.drag-handle')) {
        setIsDragging(true);
        if (widgetRef.current) {
          const rect = widgetRef.current.getBoundingClientRect();
          setDragStartOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }
        e.preventDefault(); 
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !widgetRef.current) return;

    let newX = e.clientX - dragStartOffset.x;
    let newY = e.clientY - dragStartOffset.y;

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

  // Don't render until mounted to avoid SSR positioning issues
  if (!hasMounted) {
    return null;
  }

  return (
    <div
      ref={widgetRef}
      className={cn(
        "fixed z-50 flex items-center justify-between p-2 rounded-lg bg-background/80 backdrop-blur-md shadow-xl border border-border",
        "transition-opacity duration-300 ease-out", 
        isDragging ? 'cursor-grabbing shadow-2xl' : 'cursor-default', // Grab on whole widget if not specific handle
        className
      )}
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        touchAction: 'none', // Prevents scrolling on touch devices when dragging
      }}
    >
      <div 
        className="drag-handle flex items-center cursor-grab pr-1"
        onMouseDown={handleMouseDown} // Attach mousedown to the drag handle only
      >
         <GripVertical className="h-5 w-5 text-muted-foreground/50 shrink-0 touch-none" />
      </div>
      <div className="flex items-center space-x-1.5">
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
            onClick={onEndSession} // This will now trigger the dialog opening on the page
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

