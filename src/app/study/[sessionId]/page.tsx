
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SessionSidebar, type TreeNode } from '@/components/study/session-sidebar';
import { FloatingTimerWidget } from '@/components/study/floating-timer-widget';
import { Paperclip, StickyNote, Loader2, X, Settings, Zap, CheckSquare, ChevronDown } from 'lucide-react';
import type { SessionData } from '@/app/study/launch/page'; 

// Debounce utility
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout | null = null;
  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}


function StudySessionPageContent() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [notesContent, setNotesContent] = useState<Record<string, string>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  
  const [currentNoteContent, setCurrentNoteContent] = useState('');

  const [isReferencePanelOpen, setIsReferencePanelOpen] = useState(false);
  const [showAiButtons, setShowAiButtons] = useState(false);

  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionRunning, setIsSessionRunning] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [notebookTitle, setNotebookTitle] = useState('');


  // Load session data, tree, and notes from localStorage
  useEffect(() => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const storedSessionDataJSON = localStorage.getItem(`learnlog-session-${sessionId}`);
      if (storedSessionDataJSON) {
        const parsedSessionData: SessionData = JSON.parse(storedSessionDataJSON);
        setSessionData(parsedSessionData);
        setNotebookTitle(parsedSessionData.subject); 

        const storedTreeJSON = localStorage.getItem(`learnlog-session-${sessionId}-tree`);
        const parsedTreeData: TreeNode[] = storedTreeJSON ? JSON.parse(storedTreeJSON) : [{ id: 'root', name: parsedSessionData.subject, type: 'subject', children: [], parentId: null }];
        setTreeData(parsedTreeData);
        
        const storedNotesContentJSON = localStorage.getItem(`learnlog-session-${sessionId}-notesContent`);
        const parsedNotesContent: Record<string, string> = storedNotesContentJSON ? JSON.parse(storedNotesContentJSON) : {};
        setNotesContent(parsedNotesContent);

        const firstNoteInTree = findFirstNoteRecursive(parsedTreeData);
        if (firstNoteInTree) {
          setActiveNoteId(firstNoteInTree.id);
          setCurrentNoteContent(parsedNotesContent[firstNoteInTree.id] || '');
        } else {
          // Auto-select the first note child of the root if it exists
          const rootNode = parsedTreeData.find(node => node.type === 'subject');
          const firstChildNote = rootNode?.children?.find(child => child.type === 'note');
          if (firstChildNote) {
            setActiveNoteId(firstChildNote.id);
            setCurrentNoteContent(parsedNotesContent[firstChildNote.id] || '');
          }
        }

        const savedTime = localStorage.getItem(`learnlog-session-${sessionId}-timer`);
        if (savedTime) setSessionTime(parseInt(savedTime, 10));
        
        const savedRunning = localStorage.getItem(`learnlog-session-${sessionId}-running`);
        setIsSessionRunning(savedRunning === 'true');

      } else {
        console.error("Session data not found for ID:", sessionId);
        // Consider redirecting or showing a more user-friendly error
        router.push('/study/launch'); 
      }
    } catch (error) {
      console.error("Error loading session data:", error);
      router.push('/study/launch');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, router]);

  const findFirstNoteRecursive = (nodes: TreeNode[]): TreeNode | null => {
    for (const node of nodes) {
      if (node.type === 'note') return node;
      if (node.children) {
        const found = findFirstNoteRecursive(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const saveTreeToLocalStorage = useCallback(
    debounce((newTree: TreeNode[]) => {
      if (sessionId && newTree.length > 0) { 
        localStorage.setItem(`learnlog-session-${sessionId}-tree`, JSON.stringify(newTree));
      }
    }, 1000),
    [sessionId]
  );

  const saveNotesContentToLocalStorage = useCallback(
    debounce((content: Record<string, string>) => {
      if (sessionId) {
        localStorage.setItem(`learnlog-session-${sessionId}-notesContent`, JSON.stringify(content));
      }
    }, 500),
    [sessionId]
  );
  
  useEffect(() => {
    if (treeData.length > 0 && !isLoading) {
        saveTreeToLocalStorage(treeData);
    }
  }, [treeData, saveTreeToLocalStorage, isLoading]);

  useEffect(() => {
    if (!isLoading && (Object.keys(notesContent).length > 0 || (activeNoteId && currentNoteContent !== (notesContent[activeNoteId] || '')))) {
        saveNotesContentToLocalStorage(notesContent);
    }
  }, [notesContent, saveNotesContentToLocalStorage, isLoading, activeNoteId, currentNoteContent]);


  useEffect(() => {
    if (activeNoteId && !isLoading) {
      if (currentNoteContent !== (notesContent[activeNoteId] || '')) {
        setNotesContent(prev => ({ ...prev, [activeNoteId as string]: currentNoteContent }));
      }
    }
  }, [currentNoteContent, activeNoteId, isLoading]);


  // Save timer state to localStorage
  useEffect(() => {
    if (sessionId && !isLoading) { 
      localStorage.setItem(`learnlog-session-${sessionId}-timer`, sessionTime.toString());
      localStorage.setItem(`learnlog-session-${sessionId}-running`, isSessionRunning.toString());
    }
  }, [sessionTime, isSessionRunning, sessionId, isLoading]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSessionRunning && !isLoading) {
      interval = setInterval(() => {
        setSessionTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionRunning, isLoading]);

  const toggleSessionRunning = () => setIsSessionRunning(prev => !prev);

  const handleEndSession = () => {
    if (window.confirm("Are you sure you want to end this study session?")) {
      setIsSessionRunning(false);
      if (activeNoteId) {
          const finalNotes = { ...notesContent, [activeNoteId]: currentNoteContent };
          localStorage.setItem(`learnlog-session-${sessionId}-notesContent`, JSON.stringify(finalNotes));
      }
      if (treeData.length > 0) localStorage.setItem(`learnlog-session-${sessionId}-tree`, JSON.stringify(treeData));
      localStorage.setItem(`learnlog-session-${sessionId}-timer`, sessionTime.toString());
      localStorage.setItem(`learnlog-session-${sessionId}-running`, 'false');
      router.push('/'); 
    }
  };

  const toggleReferencePanel = () => setIsReferencePanelOpen(prev => !prev);

  const handleNoteSelect = (nodeId: string, nodeType: TreeNode['type']) => {
    if (nodeType === 'note') {
      if (activeNoteId && activeNoteId !== nodeId && currentNoteContent !== (notesContent[activeNoteId] || '')) {
        // Save current note before switching
        setNotesContent(prev => ({ ...prev, [activeNoteId as string]: currentNoteContent }));
      }
      setActiveNoteId(nodeId);
      setCurrentNoteContent(notesContent[nodeId] || '');
    } else {
      // If selecting a folder-like item, you might want to clear the editor or show a placeholder
      setActiveNoteId(nodeId); // Still track active selection for context
      // setCurrentNoteContent(''); // Or some placeholder text
    }
  };

  const addNodeToTree = (parentId: string | null, type: 'title' | 'subheading' | 'note', name: string) => {
    if (!name || name.trim() === '') {
        console.warn("Node name cannot be empty."); // Use console.warn or toast for user feedback
        return;
    }

    const newNode: TreeNode = {
      id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: name.trim(),
      type,
      children: type === 'note' ? undefined : [], 
      parentId: parentId,
    };

    if (type === 'note') {
      setNotesContent(prev => ({ ...prev, [newNode.id]: '' })); // Initialize empty content for new note
    }
    
    const updateTreeRecursively = (nodes: TreeNode[], pId: string | null): TreeNode[] => {
      if (pId === null || pId === 'root') { // Adding to root
        if (nodes.length > 0 && nodes[0].id === 'root' && nodes[0].type === 'subject') {
          const rootNode = nodes[0];
          return [{...rootNode, children: [...(rootNode.children || []), newNode]}];
        }
        return [...nodes, newNode]; // Should not happen if root always exists
      }
      return nodes.map(node => {
        if (node.id === pId) {
          return { ...node, children: [...(node.children || []), newNode] };
        }
        if (node.children) {
          return { ...node, children: updateTreeRecursively(node.children, pId) };
        }
        return node;
      });
    };
    
    setTreeData(prevTree => updateTreeRecursively(prevTree, parentId));
  };
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentNoteContent(e.target.value);
  };


  if (isLoading || !sessionData) {
    return (
      <div className="flex flex-col h-screen bg-[#0A0A0A] text-foreground items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading your session...</p>
      </div>
    );
  }
  
  const currentActiveNode = activeNoteId ? findNodeByIdRecursive(treeData, activeNoteId) : null;
  const isEditorActive = currentActiveNode?.type === 'note';

  const wordCount = isEditorActive ? currentNoteContent.trim().split(/\s+/).filter(Boolean).length : 0;
  const saveStatus = activeNoteId ? (notesContent.hasOwnProperty(activeNoteId) && notesContent[activeNoteId] === currentNoteContent ? 'Saved' : 'Saving...') : 'No active note';


  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-foreground overflow-hidden">
      
      <div className="flex flex-1 overflow-hidden">
        <SessionSidebar 
          sessionSubject={notebookTitle} 
          treeData={treeData}
          onSelectNode={handleNoteSelect}
          activeNodeId={activeNoteId}
          onAddNode={addNodeToTree}
        />

        <main className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto relative custom-scrollbar bg-[#0A0A0A]">
          
          <div className="flex items-center justify-between mb-4">
             {/* Breadcrumb placeholder */}
            <div className="text-sm text-muted-foreground">
                {notebookTitle} {activeNoteId && currentActiveNode ? `/ ${currentActiveNode.name}` : ''}
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={toggleReferencePanel} className="bg-white/5 border-white/10 hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100">
                <Paperclip className="h-4 w-4 mr-2" />
                Add PDF
                </Button>
                <Button variant="outline" size="sm" onClick={toggleReferencePanel} className="bg-white/5 border-white/10 hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100">
                <StickyNote className="h-4 w-4 mr-2" />
                Previous Notes
                </Button>
            </div>
          </div>


          <div className="flex flex-1 gap-4 min-h-0"> {/* Ensure parent has min-h-0 for flex children to shrink */}
            <div 
              className="relative flex-1 h-full flex flex-col bg-[#0F0F0F] rounded-lg border border-white/10 shadow-inner"
            >
              <Textarea 
                placeholder={isEditorActive ? "Start typing your notes here..." : "Select a note from the sidebar to begin editing, or create a new one."}
                className="w-full flex-1 bg-transparent border-none rounded-t-md p-6 text-base resize-none focus:ring-0 focus:border-transparent font-code custom-scrollbar"
                value={isEditorActive ? currentNoteContent : ''}
                onChange={handleTextareaChange}
                onFocus={() => setShowAiButtons(isEditorActive)}
                onBlur={() => setTimeout(() => setShowAiButtons(false), 200)} // Delay to allow clicking AI buttons
                disabled={!isEditorActive}
              />
              {isEditorActive && (
                <div 
                    className={`flex items-center justify-end space-x-2 p-2 border-t border-white/10 rounded-b-md transition-opacity duration-200 ${showAiButtons ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                  <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-primary/20 backdrop-blur-sm text-xs p-1.5 px-2 text-foreground-opacity-70 hover:text-foreground">✨ Explain</Button>
                  <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-primary/20 backdrop-blur-sm text-xs p-1.5 px-2 text-foreground-opacity-70 hover:text-foreground">📋 Summarize</Button>
                  <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-primary/20 backdrop-blur-sm text-xs p-1.5 px-2 text-foreground-opacity-70 hover:text-foreground">⤴️ Expand</Button>
                </div>
              )}
            </div>

            {isReferencePanelOpen && (
              <div className="w-[35%] max-w-[500px] h-full bg-[#0F0F0F] border border-white/10 p-4 rounded-lg flex flex-col overflow-y-auto custom-scrollbar shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                  <span className="font-semibold text-sm">Reference Panel</span>
                  <Button variant="ghost" size="icon" onClick={toggleReferencePanel} className="h-6 w-6 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4"/>
                  </Button>
                </div>
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
                  PDF / Reference Viewer Area
                </div>
              </div>
            )}
          </div>
          {/* Status Bar */}
          <div className="mt-3 text-xs text-muted-foreground text-right border-t border-white/10 pt-2 flex justify-between items-center">
              <span>Word Count: {wordCount}</span>
              <span>{saveStatus}</span>
          </div>
        </main>
      </div>
      <FloatingTimerWidget 
          timeInSeconds={sessionTime}
          isRunning={isSessionRunning}
          onTogglePlayPause={toggleSessionRunning}
          onEndSession={handleEndSession}
      />
    </div>
  );
}

// Helper function to find a node by ID in the tree
export function findNodeByIdRecursive(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeByIdRecursive(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export default function StudySessionPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0A0A0A]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <StudySessionPageContent />
    </Suspense>
  );
}

