
'use client';

import { useEffect, useState } from 'react';
import { WidgetCard } from './widget-card';
import { FlameIcon } from '../icons/flame-icon';
import type { SessionData } from '@/app/study/launch/page';
import { cn } from '@/lib/utils'; // Added this import

const MINIMUM_SESSION_MINUTES_FOR_STREAK = 15;

function calculateStudyStreak(sessions: SessionData[]): number {
  if (!sessions || sessions.length === 0) {
    return 0;
  }

  const qualifyingSessions = sessions
    .filter(session => session.duration >= MINIMUM_SESSION_MINUTES_FOR_STREAK && session.startTime)
    .map(session => new Date(session.startTime).toDateString()) // Get just the date part
    .filter((value, index, self) => self.indexOf(value) === index) // Unique dates
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Sort by most recent

  if (qualifyingSessions.length === 0) {
    return 0;
  }

  let currentStreak = 0;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Check if today or yesterday is a qualifying day
  if (qualifyingSessions[0] === today.toDateString() || qualifyingSessions[0] === yesterday.toDateString()) {
    currentStreak = 1;
    let lastDate = new Date(qualifyingSessions[0]);

    for (let i = 1; i < qualifyingSessions.length; i++) {
      const currentDate = new Date(qualifyingSessions[i]);
      const expectedPreviousDate = new Date(lastDate);
      expectedPreviousDate.setDate(lastDate.getDate() - 1);

      if (currentDate.toDateString() === expectedPreviousDate.toDateString()) {
        currentStreak++;
        lastDate = currentDate;
      } else {
        break; // Streak broken
      }
    }
  }
  
  // If the most recent qualifying session wasn't today or yesterday, the streak is 0,
  // unless it was exactly yesterday, in which case the loop above handles it.
  // If streak is 1 and the only qualifying day is not today, it means it was yesterday.
  // If today is not a qualifying day, but yesterday was, streak is maintained.
  // If qualifyingSessions[0] is not today, and streak is currently 1, it means the last session was yesterday.
  // If qualifyingSessions[0] is not today AND not yesterday, streak is 0.
   if (qualifyingSessions[0] !== today.toDateString() && qualifyingSessions[0] !== yesterday.toDateString()) {
    return 0;
  }


  return currentStreak;
}


export function StudyStreakWidget() {
  const [streak, setStreak] = useState(0);
  const [animatedStreak, setAnimatedStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    try {
      const sessionsIndexJSON = localStorage.getItem('learnlog-sessions-index');
      if (!sessionsIndexJSON) {
        setStreak(0);
        setIsLoading(false);
        return;
      }
      const sessionIds: string[] = JSON.parse(sessionsIndexJSON);
      const allSessionData: SessionData[] = sessionIds.map(id => {
        const sessionJSON = localStorage.getItem(`learnlog-session-${id}`);
        return sessionJSON ? JSON.parse(sessionJSON) : null;
      }).filter(session => session !== null) as SessionData[];
      
      const calculatedStreak = calculateStudyStreak(allSessionData);
      setStreak(calculatedStreak);

    } catch (error) {
      console.error("Error loading session data for streak:", error);
      setStreak(0); // Default to 0 on error
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    if (streak === animatedStreak || isLoading) return;

    const timer = setInterval(() => {
      setAnimatedStreak(prev => {
        if (prev < streak) return prev + 1;
        clearInterval(timer);
        return prev;
      });
    }, 50); 

    return () => clearInterval(timer);
  }, [streak, animatedStreak, isLoading]);

  return (
    <WidgetCard title="Study Streak" className="min-w-[200px]">
      <div className="flex items-center justify-center space-x-4 p-4">
        <FlameIcon size={64} className={cn("text-warning", streak > 0 ? "opacity-100" : "opacity-30")} />
        <div className="text-center">
          <p className="text-5xl font-bold font-headline text-foreground tabular-nums">
            {isLoading ? '-' : animatedStreak}
          </p>
          <p className="text-sm text-muted-foreground">days</p>
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground mt-2">
        {isLoading ? "Calculating..." : (streak > 0 ? "Keep the fire going!" : "Start a session to build your streak!")}
      </p>
    </WidgetCard>
  );
}
