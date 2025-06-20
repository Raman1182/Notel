
'use client';

import { useEffect, useState, useCallback } from 'react';
import { WidgetCard } from './widget-card';
import { FlameIcon } from '../icons/flame-icon';
import { getSessions, type SessionDocumentWithId } from '@/services/session-service';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const MINIMUM_SESSION_MINUTES_FOR_STREAK = 15;

function calculateStudyStreak(sessions: SessionDocumentWithId[]): number {
  if (!sessions || sessions.length === 0) {
    return 0;
  }

  const qualifyingSessions = sessions
    .filter(session => (session.actualDuration ? session.actualDuration / 60 : session.duration) >= MINIMUM_SESSION_MINUTES_FOR_STREAK && session.startTime)
    .map(session => new Date(session.startTime).toDateString())
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (qualifyingSessions.length === 0) {
    return 0;
  }

  let currentStreak = 0;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

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
        break;
      }
    }
  }

  if (qualifyingSessions[0] !== today.toDateString() && qualifyingSessions[0] !== yesterday.toDateString()) {
    return 0;
  }

  return currentStreak;
}

export function StudyStreakWidget() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [animatedStreak, setAnimatedStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStreakData = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const allSessionData = await getSessions(userId);
      const calculatedStreak = calculateStudyStreak(allSessionData);
      setStreak(calculatedStreak);
    } catch (error) {
      console.error("Error loading session data for streak:", error);
      setStreak(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchStreakData(user.uid);
    } else {
      setIsLoading(false);
      setStreak(0);
    }
  }, [user, fetchStreakData]);


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
