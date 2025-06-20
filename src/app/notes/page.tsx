
'use client';

import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/shared/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, CalendarDays, Inbox } from 'lucide-react';
import type { SessionData } from '@/app/study/launch/page'; // Assuming SessionData structure is defined here

const NotesHomePage: NextPage = () => {
  const [savedSessions, setSavedSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    try {
      const sessionsIndexJSON = localStorage.getItem('learnlog-sessions-index');
      if (sessionsIndexJSON) {
        const sessionIds: string[] = JSON.parse(sessionsIndexJSON);
        const sessionsData: SessionData[] = sessionIds.map(id => {
          const sessionJSON = localStorage.getItem(`learnlog-session-${id}`);
          return sessionJSON ? JSON.parse(sessionJSON) : null;
        }).filter(session => session !== null) as SessionData[];
        
        // Sort sessions by start time, most recent first
        sessionsData.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
        setSavedSessions(sessionsData);
      }
    } catch (error) {
      console.error("Error loading saved sessions:", error);
      // Optionally, add a toast message here
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground tracking-tight">
            My Notes & Sessions
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Review your past study sessions and notes.
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="minimal-spinner"></div>
            <p className="ml-3 text-muted-foreground">Loading your sessions...</p>
          </div>
        )}

        {!isLoading && savedSessions.length === 0 && (
          <Card className="bg-card border-border shadow-lg text-center">
            <CardHeader>
                <Inbox className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl">No Saved Sessions Yet</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base mb-6">
                It looks like you haven't started any study sessions. Once you do, they'll appear here for you to review.
              </CardDescription>
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/study/launch">
                  Start Your First Session
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && savedSessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedSessions.map((session) => (
              <Card key={session.sessionId} className="bg-card border-border shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <BookOpen className="h-8 w-8 text-primary mb-2" />
                  </div>
                  <CardTitle className="text-xl font-semibold leading-tight truncate" title={session.subject}>
                    {session.subject || 'Untitled Session'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    <span>
                      {session.startTime ? new Date(session.startTime).toLocaleDateString() : 'N/A'}
                      {' at '}
                      {session.startTime ? new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Duration: {session.duration ? `${session.duration} min` : 'N/A'}
                  </p>
                </CardContent>
                <div className="p-4 pt-0 mt-auto">
                    <Button asChild className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50">
                        <Link href={`/notes/${session.sessionId}/viewer`}>
                        View Notes
                        <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NotesHomePage;
