
'use client';

import { Suspense, useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/shared/app-header';
import { SessionSidebar, type TreeNode, findNodeByIdRecursive } from '@/components/study/session-sidebar';
import type { SessionData } from '@/app/study/launch/page';
import { Loader2, AlertTriangle, Edit } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { getSession, type SessionDocumentWithId } from '@/services/session-service';
import { useAuth } from '@/contexts/auth-context';

function findFirstNoteRecursiveViewer(nodes: TreeNode[]): TreeNode | null {
  for (const node of nodes) {
    if (node.type === 'note') return node;
    if (node.children) {
      const foundInChild = findFirstNoteRecursiveViewer(node.children);
      if (foundInChild) return foundInChild;
    }
  }
  return null;
}

function SessionNotesViewerContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const sessionId = params.sessionId as string;
  const subjectNameFromQuery = searchParams.get('subject');

  const [sessionData, setSessionData] = useState<SessionDocumentWithId | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [notesContent, setNotesContent] = useState<Record<string, string>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [currentNoteDisplayContent, setCurrentNoteDisplayContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentSubjectName = useMemo(() => {
    if (sessionData?.subject) return sessionData.subject;
    if (subjectNameFromQuery) return subjectNameFromQuery;
    return "Session";
  }, [sessionData, subjectNameFromQuery]);

  const loadSession = useCallback(async (sid: string) => {
    setIsLoading(true);
    setError(null);
    try {
        const fetchedSession = await getSession(sid);
        if (!fetchedSession || fetchedSession.userId !== user?.uid) {
            setError(fetchedSession ? "You do not have permission to view this session." : "Session data not found.");
            setIsLoading(false);
            return;
        }
        
        setSessionData(fetchedSession);
        const parsedTreeData = fetchedSession.treeData || [];
        setTreeData(parsedTreeData);
        const parsedNotesContent = fetchedSession.notesContent || {};
        setNotesContent(parsedNotesContent);
      
        const firstNote = findFirstNoteRecursiveViewer(parsedTreeData);
        if (firstNote) {
            setActiveNoteId(firstNote.id);
            setCurrentNoteDisplayContent(parsedNotesContent[firstNote.id] || 'This note is empty.');
        } else {
            setCurrentNoteDisplayContent('Select a note to view its content.');
        }

    } catch (err) {
      console.error("Error loading session for viewing:", err);
      setError("Could not load session data. It might be corrupted.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (sessionId && user) {
        loadSession(sessionId);
    } else if (!user) {
        setIsLoading(false);
    }
  }, [sessionId, user, loadSession]);

  const handleNoteSelectInViewer = (nodeId: string, nodeType: TreeNode['type']) => {
    setActiveNoteId(nodeId);
    if (nodeType === 'note') {
      setCurrentNoteDisplayContent(notesContent[nodeId] || 'This note is empty.');
    } else {
      const selectedNode = findNodeByIdRecursive(treeData, nodeId);
      setCurrentNoteDisplayContent(`You've selected '${selectedNode?.name || 'an item'}'. Select a specific note to see its content.`);
    }
  };
  
  const currentActiveNode = activeNoteId ? findNodeByIdRecursive(treeData, activeNoteId) : null;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading session notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Session</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push('/notes')}>Back to Notes List</Button>
        </div>
      </div>
    );
  }
  
  if (!sessionData) {
     return (
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-semibold text-destructive mb-2">Session Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested session could not be loaded.</p>
          <Button onClick={() => router.push('/notes')}>Back to Notes List</Button>
        </div>
      </div>
    );
  }
  
  const sessionDateForBreadcrumb = sessionData.startTime ? new Date(sessionData.startTime).toLocaleDateString() : "Details";

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-foreground overflow-hidden">
      <AppHeader />
       <nav className="text-sm text-muted-foreground px-6 pt-3 pb-1 border-b border-border/20 bg-background">
          <Link href="/" className="hover:text-primary">Home</Link>
          {' / '}
          <Link href="/notes" className="hover:text-primary">View Notes</Link>
          {currentSubjectName !== "Session" && (
            <>
              {' / '}
              <Link href={`/notes/subject/${encodeURIComponent(currentSubjectName)}`} className="hover:text-primary truncate max-w-[150px] md:max-w-xs inline-block align-bottom">
                {currentSubjectName}
              </Link>
            </>
          )}
          {' / '}
          <span className="truncate max-w-[150px] md:max-w-xs inline-block align-bottom">Session ({sessionDateForBreadcrumb})</span>
        </nav>
      <div className="flex flex-1 overflow-hidden">
        <SessionSidebar
          sessionSubject={sessionData.subject || 'Untitled Session'}
          treeData={treeData}
          onSelectNode={handleNoteSelectInViewer}
          activeNodeId={activeNoteId}
          onAddNode={() => {}} 
          isReadOnly={true} 
        />
        <main className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto relative custom-scrollbar bg-[#0A0A0A]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-foreground-opacity-70">
                Viewing: {sessionData.subject} {activeNoteId && currentActiveNode ? `/ ${currentActiveNode.name}` : ''}
            </div>
             <Button variant="outline" size="sm" onClick={() => router.push(`/study/${sessionId}`)} className="bg-primary/10 hover:bg-primary/20 text-primary">
                <Edit className="h-4 w-4 mr-2" />
                Open in Editor
            </Button>
          </div>
          <ScrollArea className="flex-1 bg-[#0F0F0F] rounded-lg border border-white/10 shadow-inner p-6">
            <div 
                className="prose prose-invert max-w-none font-code text-base whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: currentNoteDisplayContent.replace(/\n/g, '<br />') }}
            />
          </ScrollArea>
           <div className="mt-3 text-xs text-muted-foreground text-right border-t border-white/10 pt-2 flex justify-end items-center">
              <span>Read-only view.</span>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SessionNotesViewerPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SessionNotesViewerContent />
    </Suspense>
  );
}
