
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Pause, Play, Square, GripVertical, Coffee, Brain } from 'lucide-react';
import type { TimerMode } from '@/app/study/launch/page';

interface FloatingTimerWidgetProps {
  timeInSeconds: number;
  isRunning: boolean;
  onTogglePlayPause: () => void;
  onEndSession?: () => void;
  className?: string;
  timerMode: TimerMode;
  pomodoroCycle?: { workMinutes: number; breakMinutes: number };
}

type PomodoroPhase = 'work' | 'break';

export function FloatingTimerWidget({
  timeInSeconds,
  isRunning,
  onTogglePlayPause,
  onEndSession,
  className,
  timerMode,
  pomodoroCycle = { workMinutes: 25, breakMinutes: 5 }, // Default cycle
}: FloatingTimerWidgetProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);

  const [currentPhase, setCurrentPhase] = useState<PomodoroPhase>('work');
  const [pomodoroTimeRemaining, setPomodoroTimeRemaining] = useState(pomodoroCycle.workMinutes * 60);
  const [pomodoroCyclesCompleted, setPomodoroCyclesCompleted] = useState(0);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      const initialX = window.innerWidth - rect.width - 20;
      const initialY = 20;
      setPosition({ x: Math.max(0, initialX), y: Math.max(0, initialY) });
    }
  }, [hasMounted]);

  // Pomodoro Logic
  useEffect(() => {
    if (timerMode !== 'pomodoro_25_5' || !isRunning || !hasMounted) {
      // If not pomodoro, or not running, or not mounted, reset/do nothing with pomodoro specifics
      if (timerMode === 'pomodoro_25_5') setPomodoroTimeRemaining(pomodoroCycle.workMinutes * 60);
      return;
    }

    let interval: NodeJS.Timeout | null = null;

    if (pomodoroTimeRemaining > 0) {
      interval = setInterval(() => {
        setPomodoroTimeRemaining(prev => prev - 1);
      }, 1000);
    } else { // Phase ended
      if (currentPhase === 'work') {
        setCurrentPhase('break');
        setPomodoroTimeRemaining(pomodoroCycle.breakMinutes * 60);
        // TODO: Add notification for break start
      } else { // Break ended
        setCurrentPhase('work');
        setPomodoroTimeRemaining(pomodoroCycle.workMinutes * 60);
        setPomodoroCyclesCompleted(prev => prev + 1);
        // TODO: Add notification for work start
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerMode, isRunning, pomodoroTimeRemaining, currentPhase, pomodoroCycle, hasMounted]);


  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target.closest('button') || target.closest('.drag-handle')) {
        setIsDragging(true);
        if (widgetRef.current) {
          const rect = widgetRef.current.getBoundingClientRect();
          setDragStartOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
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

  if (!hasMounted) return null;

  const displayTime = timerMode === 'pomodoro_25_5' ? pomodoroTimeRemaining : timeInSeconds;
  const phaseIcon = currentPhase === 'work' ? <Brain className="h-3.5 w-3.5 mr-1 text-primary" /> : <Coffee className="h-3.5 w-3.5 mr-1 text-green-400" />;


  return (
    <div
      ref={widgetRef}
      className={cn(
        "fixed z-50 flex items-center justify-between p-2 rounded-lg bg-background/80 backdrop-blur-md shadow-xl border border-border",
        "transition-opacity duration-300 ease-out", 
        isDragging ? 'cursor-grabbing shadow-2xl' : 'cursor-default',
        className,
        timerMode === 'pomodoro_25_5' && currentPhase === 'work' && 'border-primary/50',
        timerMode === 'pomodoro_25_5' && currentPhase === 'break' && 'border-green-500/50',
      )}
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        touchAction: 'none',
      }}
    >
      <div 
        className="drag-handle flex items-center cursor-grab pr-1 touch-none"
        onMouseDown={handleMouseDown}
      >
         <GripVertical className="h-5 w-5 text-muted-foreground/50 shrink-0" />
      </div>
      <div className="flex items-center space-x-1.5">
        {timerMode === 'pomodoro_25_5' && phaseIcon}
        <span className="text-base font-mono font-medium text-foreground tabular-nums min-w-[50px] sm:min-w-[60px] text-center px-1">
          {formatTime(displayTime)}
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
