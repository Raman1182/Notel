
'use client';

import type { NextPage } from 'next';
import { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/shared/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, Search, FileText as FileTextIcon, Loader2, Inbox, Trash2 } from 'lucide-react';
import type { SessionData } from '@/app/study/launch/page';
import type { TreeNode } from '@/components/study/session-sidebar';
import { getSessionsBySubject, deleteSession, type SessionDocumentWithId } from '@/services/session-service';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EnrichedSessionDataForSubject extends SessionDocumentWithId {
  noteTitlesSummary: string;
}

function formatSessionDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  let formatted = '';
  if (h > 0) formatted += `${h}h `;
  if (m > 0 || h === 0) formatted += `${m}m`;
  return formatted.trim() || '0m';
}

function getNoteTitlesSummary(tree: TreeNode[], notesContent: Record<string, string>, limit = 3): string {
    const titles: string[] = [];
    const seenTitles = new Set<string>();

    function findTitles(nodes: TreeNode[]) {
        for (const node of nodes) {
            if (titles.length >= limit) break;
            if (node.type === 'note' && notesContent[node.id]?.trim() && !seenTitles.has(node.name.toLowerCase())) {
                titles.push(node.name);
                seenTitles.add(node.name.toLowerCase());
            } else if ((node.type === 'title' || node.type === 'subheading') && !seenTitles.has(node.name.toLowerCase())) {
                 titles.push(node.name);
                 seenTitles.add(node.name.toLowerCase());
            }
            if (node.children && titles.length < limit) {
                findTitles(node.children);
            }
        }
    }
    if (tree && tree.length > 0 && tree[0].children) {
        findTitles(tree[0].children);
    }
    if (titles.length === 0 && tree && tree.length > 0 && tree[0].name && !seenTitles.has(tree[0].name.toLowerCase())) { 
      if (tree[0].children && tree[0].children.length > 0 && tree[0].children[0].type === 'note' && notesContent[tree[0].children[0].id]?.trim()) {
        titles.push(tree[0].children[0].name); 
      } else if (Object.keys(notesContent).length > 0) {
         titles.push("General Notes");
      }
    }

    return titles.length > 0 ? titles.join(', ') : 'No specific topics identified';
}


function SessionsForSubjectContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const subjectPath = params.subjectPath as string;
  const subjectName = useMemo(() => {
    try {
      return subjectPath ? decodeURIComponent(subjectPath) : 'Unknown Subject';
    } catch (e) {
      return 'Error Decoding Subject';
    }
  }, [subjectPath]);

  const [sessionsForSubject, setSessionsForSubject] = useState<EnrichedSessionDataForSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const fetchSessions = useCallback(async (userId: string) => {
    if (!subjectName || subjectName === 'Error Decoding Subject') {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
      const fetchedSessions = await getSessionsBySubject(userId, subjectName);
      const enrichedSessions: EnrichedSessionDataForSubject[] = fetchedSessions.map(session => ({
        ...session,
        noteTitlesSummary: getNoteTitlesSummary(session.treeData || [], session.notesContent || {}),
      }));
      enrichedSessions.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
      setSessionsForSubject(enrichedSessions);
    } catch (error) {
      console.error(`Error loading sessions for subject ${subjectName}:`, error);
      toast({ title: "Error", description: "Could not load your sessions.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [subjectName, toast]);

  useEffect(() => {
    if (user) {
      fetchSessions(user.uid);
    } else {
      setIsLoading(false);
      setSessionsForSubject([]);
    }
  }, [user, fetchSessions]);

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await deleteSession(sessionToDelete);
      setSessionsForSubject(prev => prev.filter(s => s.id !== sessionToDelete));
      toast({ title: "Session Deleted", description: "The study session has been permanently removed." });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({ title: "Error", description: "Could not delete the session.", variant: "destructive" });
    } finally {
      setSessionToDelete(null);
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-1 justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Loading sessions for {subjectName}...</p>
        </div>
    );
  }
  
  if (!isLoading && sessionsForSubject.length === 0) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
            <Inbox className="h-20 w-20 text-primary mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-3">No Sessions Found</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                It seems there are no study sessions recorded for the subject "{subjectName}".
            </p>
            <Button onClick={() => router.push('/notes')} className="mb-2">Back to Subjects</Button>
            <Button variant="outline" onClick={() => router.push('/study/launch')}>Start a New Session</Button>
        </div>
      )
  }


  return (
    <>
      {sessionsForSubject.map((session) => (
          <Card key={session.id} className="bg-card border-border shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ease-out mb-6 relative group">
            <Link href={`/notes/${session.id}/viewer?subject=${encodeURIComponent(subjectName)}`} passHref>
              <div className="cursor-pointer">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-primary/80" />
                      <span>
                        {session.startTime ? new Date(session.startTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                    <span>{formatSessionDuration(session.duration)} planned</span>
                  </div>
                  <CardTitle className="text-xl font-semibold leading-tight truncate flex items-center" title={session.subject}>
                    <FileTextIcon className="h-5 w-5 mr-2 text-primary shrink-0" /> 
                    Session Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    <span className="font-medium text-foreground/80">Topics:</span> {session.noteTitlesSummary || "General notes for this session."}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {(session.notesContent ? Object.keys(session.notesContent).length : 0)} note(s)
                  </div>
                </CardContent>
                <div className="p-4 pt-3 border-t border-border/10 flex justify-end">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                        View Session Notes <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
              </div>
            </Link>
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute top-3 right-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setSessionToDelete(session.id);
              }}
              aria-label="Delete session"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
      ))}

      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the study session and all of its notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


const NotesSessionsForSubjectPage: NextPage = () => {
  const params = useParams();
  const subjectPath = params.subjectPath as string;
  const subjectName = useMemo(() => {
    try {
      return subjectPath ? decodeURIComponent(subjectPath) : 'Selected Subject';
    } catch (e) {
      return 'Error Subject Name';
    }
  }, [subjectPath]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <div>
            <nav className="text-sm text-muted-foreground mb-1">
              <Link href="/" className="hover:text-primary">Home</Link>
              {' / '}
              <Link href="/notes" className="hover:text-primary">View Notes</Link>
              {' / '}
              <span className="truncate max-w-[200px] md:max-w-xs inline-block align-bottom">{subjectName}</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground tracking-tight">
              {subjectName} Sessions
            </h1>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Search className="h-6 w-6" />
            <span className="sr-only">Search Sessions</span>
          </Button>
        </div>
        <Suspense fallback={
            <div className="flex flex-1 justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg text-muted-foreground">Loading...</p>
            </div>
        }>
          <SessionsForSubjectContent />
        </Suspense>
      </main>
    </div>
  );
};

export default NotesSessionsForSubjectPage;
