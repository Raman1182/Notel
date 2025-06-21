
'use client';

import type { NextPage } from 'next';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/shared/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Clock, FileText, Inbox, Search, Loader2 } from 'lucide-react';
import type { SessionData } from '@/app/study/launch/page';
import { getSessions, type SessionDocumentWithId } from '@/services/session-service';
import { useAuth } from '@/contexts/auth-context';

interface SubjectAggregate {
  name: string;
  totalPlannedDuration: number; // in minutes
  totalNotes: number;
  lastStudiedTimestamp: number;
  sessionCount: number;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  let formatted = '';
  if (h > 0) formatted += `${h}h `;
  if (m > 0 || h === 0) formatted += `${m}m`;
  return formatted.trim() || '0m';
}

function timeAgo(timestamp: number): string {
  const now = Date.now();
  const seconds = Math.round((now - timestamp) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago';
  if (days === 1) return 'Yesterday';
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const NotesSubjectListingPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [subjectAggregates, setSubjectAggregates] = useState<SubjectAggregate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndAggregateSessions = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const allSessionData = await getSessions(userId);
      const aggregates: Record<string, SubjectAggregate> = {};

      allSessionData.forEach(session => {
        if (!session.subject) return;

        const notesCount = session.notesContent ? Object.keys(session.notesContent).length : 0;
        
        if (!aggregates[session.subject]) {
          aggregates[session.subject] = {
            name: session.subject,
            totalPlannedDuration: 0,
            totalNotes: 0,
            lastStudiedTimestamp: 0,
            sessionCount: 0,
          };
        }
        aggregates[session.subject].totalPlannedDuration += session.duration || 0;
        aggregates[session.subject].totalNotes += notesCount;
        aggregates[session.subject].lastStudiedTimestamp = Math.max(aggregates[session.subject].lastStudiedTimestamp, session.startTime || 0);
        aggregates[session.subject].sessionCount += 1;
      });
      
      const sortedAggregates = Object.values(aggregates).sort((a, b) => b.lastStudiedTimestamp - a.lastStudiedTimestamp);
      setSubjectAggregates(sortedAggregates);

    } catch (error) {
      console.error("Error loading or aggregating session data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if(user) {
      fetchAndAggregateSessions(user.uid);
    } else if (!authLoading) {
      setIsLoading(false);
      setSubjectAggregates([]);
    }
  }, [user, authLoading, fetchAndAggregateSessions]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <div>
            <nav className="text-sm text-muted-foreground mb-1">
              <Link href="/" className="hover:text-primary">Home</Link>
              {' / '}
              <span>View Notes</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground tracking-tight">
              Your Study Journey
            </h1>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Search className="h-6 w-6" />
            <span className="sr-only">Search Notes</span>
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Loading your study journey...</p>
          </div>
        )}

        {!isLoading && subjectAggregates.length === 0 && (
          <Card className="bg-card border-border shadow-lg text-center col-span-full">
            <CardHeader>
                <Inbox className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl">No Study Subjects Yet</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base mb-6">
                Once you start study sessions, your subjects will appear here.
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

        {!isLoading && subjectAggregates.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subjectAggregates.map((subject) => (
              <Link key={subject.name} href={`/notes/subject/${encodeURIComponent(subject.name)}`} passHref>
                <Card className="bg-card border-border shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col h-full cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                       <BookOpen className="h-10 w-10 text-primary mb-3" />
                    </div>
                    <CardTitle className="text-2xl font-bold leading-tight truncate" title={subject.name}>
                      {subject.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2 text-primary/70" />
                        <span>{formatDuration(subject.totalPlannedDuration)} planned study</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                        <FileText className="h-4 w-4 mr-2 text-primary/70" />
                        <span>{subject.totalNotes} notes across {subject.sessionCount} session{subject.sessionCount === 1 ? '' : 's'}</span>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-2 mt-auto text-xs text-muted-foreground border-t border-border/20">
                     Last studied: {timeAgo(subject.lastStudiedTimestamp)}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NotesSubjectListingPage;
