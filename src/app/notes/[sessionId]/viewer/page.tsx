
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/shared/app-header';
import { SessionSidebar, type TreeNode, findNodeByIdRecursive } from '@/components/study/session-sidebar';
import type { SessionData } from '@/app/study/launch/page';
import { Loader2, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

function findFirstNoteRecursiveViewer(nodes: TreeNode[]): TreeNode | null {
  for (const node of nodes) {
    if (node.type === 'note') {
      return node;
    }
    if (node.children) {
      const foundInChild = findFirstNoteRecursiveViewer(node.children);
      if (foundInChild) {
        return foundInChild;
      }
    }
  }
  return null;
}

function SessionNotesViewerContent() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [notesContent, setNotesContent] = useState<Record<string, string>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [currentNoteDisplayContent, setCurrentNoteDisplayContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Session ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const storedSessionDataJSON = localStorage.getItem(`learnlog-session-${sessionId}`);
      if (!storedSessionDataJSON) {
        setError(`Session data not found for ID: ${sessionId}. It might have been deleted or never existed.`);
        setIsLoading(false);
        return;
      }
      const parsedSessionData: SessionData = JSON.parse(storedSessionDataJSON);
      setSessionData(parsedSessionData);

      const storedTreeJSON = localStorage.getItem(`learnlog-session-${sessionId}-tree`);
      const parsedTreeData: TreeNode[] = storedTreeJSON ? JSON.parse(storedTreeJSON) : [];
      if (parsedTreeData.length === 0 && parsedSessionData.subject) {
        // Create a default tree if none exists but session data does
         parsedTreeData.push({
            id: 'root',
            name: parsedSessionData.subject,
            type: 'subject',
            children: [],
            parentId: null
         });
      }
      setTreeData(parsedTreeData);

      const storedNotesContentJSON = localStorage.getItem(`learnlog-session-${sessionId}-notesContent`);
      const parsedNotesContent: Record<string, string> = storedNotesContentJSON ? JSON.parse(storedNotesContentJSON) : {};
      setNotesContent(parsedNotesContent);
      
      // Try to select the first note if available
      const firstNote = findFirstNoteRecursiveViewer(parsedTreeData);
      if (firstNote) {
        setActiveNoteId(firstNote.id);
        setCurrentNoteDisplayContent(parsedNotesContent[firstNote.id] || 'This note is empty or content could not be loaded.');
      } else if (parsedTreeData.length > 0 && parsedTreeData[0].type === 'subject') {
        setActiveNoteId(parsedTreeData[0].id); // Select the subject itself
        setCurrentNoteDisplayContent(`Select a note from the '${parsedSessionData.subject}' session to view its content.`);
      } else {
        setCurrentNoteDisplayContent('No notes available in this session or structure is unrecognized.');
      }

    } catch (err) {
      console.error("Error loading session for viewing:", err);
      setError("Could not load session data. It might be corrupted.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const handleNoteSelectInViewer = (nodeId: string, nodeType: TreeNode['type']) => {
    setActiveNoteId(nodeId);
    if (nodeType === 'note') {
      setCurrentNoteDisplayContent(notesContent[nodeId] || 'This note is empty or content could not be loaded.');
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

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-foreground overflow-hidden">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <SessionSidebar
          sessionSubject={sessionData.subject || 'Untitled Session'}
          treeData={treeData}
          onSelectNode={handleNoteSelectInViewer}
          activeNodeId={activeNoteId}
          onAddNode={() => {}} // No-op for read-only viewer
          isReadOnly={true} 
        />
        <main className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto relative custom-scrollbar bg-[#0A0A0A]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
                Viewing: {sessionData.subject} {activeNoteId && currentActiveNode ? `/ ${currentActiveNode.name}` : ''}
            </div>
            {/* Placeholder for any viewer-specific actions if needed later */}
          </div>
          <ScrollArea className="flex-1 bg-[#0F0F0F] rounded-lg border border-white/10 shadow-inner p-6">
            {/* Using a div with whitespace-pre-wrap to render basic text formatting like newlines */}
            <div 
                className="prose prose-invert max-w-none font-code text-base whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: currentNoteDisplayContent.replace(/\n/g, '<br />') }} // Basic newline handling
            />
             {/* For more complex markdown, a parser would be needed here.
                 Example: <ReactMarkdown>{currentNoteDisplayContent}</ReactMarkdown> 
                 Ensure to install react-markdown and its typings if used.
              */}
          </ScrollArea>
           <div className="mt-3 text-xs text-muted-foreground text-right border-t border-white/10 pt-2 flex justify-end items-center">
              <span>Viewing previously saved note.</span>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SessionNotesViewerPage() {
  return (
    // Suspense is crucial here because child components might use hooks like useSearchParams/useParams
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
