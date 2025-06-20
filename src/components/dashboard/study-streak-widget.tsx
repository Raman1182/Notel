'use client';

import { useEffect, useState } from 'react';
import { WidgetCard } from './widget-card';
import { FlameIcon } from '../icons/flame-icon';

export function StudyStreakWidget() {
  const [streak, setStreak] = useState(0); // Placeholder, fetch from backend
  const [animatedStreak, setAnimatedStreak] = useState(0);

  useEffect(() => {
    // Simulate fetching streak
    setTimeout(() => setStreak(7), 500); 
  }, []);

  useEffect(() => {
    if (streak === animatedStreak) return;

    const timer = setInterval(() => {
      setAnimatedStreak(prev => {
        if (prev < streak) return prev + 1;
        clearInterval(timer);
        return prev;
      });
    }, 50); // Adjust speed of animation

    return () => clearInterval(timer);
  }, [streak, animatedStreak]);

  return (
    <WidgetCard title="Study Streak" className="min-w-[200px]">
      <div className="flex items-center justify-center space-x-4 p-4">
        <FlameIcon size={64} className="text-warning" />
        <div className="text-center">
          <p className="text-5xl font-bold font-headline text-foreground tabular-nums">
            {animatedStreak}
          </p>
          <p className="text-sm text-muted-foreground">days</p>
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground mt-2">Keep the fire going!</p>
    </WidgetCard>
  );
}
