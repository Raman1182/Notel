
'use client';

import { useEffect, useState, useCallback, Key } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/shared/app-header';
import { Textarea } from '@/components/ui/textarea';
import { SessionSidebar, type TreeNode } from '@/components/study/session-sidebar';
import { FloatingTimerWidget } from '@/components/study/floating-timer-widget';
import { Paperclip, StickyNote, Loader2, X } from 'lucide-react';
import type { SessionData } from '@/app/study/launch/page'; // Import SessionData

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

export default function StudySessionPage() {
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

  // Load session data, tree, and notes from localStorage
  useEffect(() => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const storedSessionDataJSON = localStorage.getItem(`learnlog-session-${sessionId}`);
      if (storedSessionDataJSON) {
        const parsedSessionData: SessionData = JSON.parse(storedSessionDataJSON);
        setSessionData(parsedSessionData);

        const storedTreeJSON = localStorage.getItem(`learnlog-session-${sessionId}-tree`);
        const parsedTree: TreeNode[] = storedTreeJSON ? JSON.parse(storedTreeJSON) : [{ id: 'root', name: parsedSessionData.subject, type: 'subject', children: [], parentId: null }];
        setTreeData(parsedTree);
        
        const storedNotesContentJSON = localStorage.getItem(`learnlog-session-${sessionId}-notesContent`);
        const parsedNotesContent: Record<string, string> = storedNotesContentJSON ? JSON.parse(storedNotesContentJSON) : {};
        setNotesContent(parsedNotesContent);

        // Auto-select the first note if available
        const firstNote = findFirstNote(parsedTree);
        if (firstNote) {
          setActiveNoteId(firstNote.id);
          setCurrentNoteContent(parsedNotesContent[firstNote.id] || '');
        } else {
          // If no notes, try to select the default created one or root
           const defaultNote = parsedTree[0]?.children?.find(child => child.type === 'note');
           if (defaultNote) {
            setActiveNoteId(defaultNote.id);
            setCurrentNoteContent(parsedNotesContent[defaultNote.id] || '');
           } else if (parsedTree.length > 0 && parsedTree[0].type === 'note') {
             setActiveNoteId(parsedTree[0].id);
             setCurrentNoteContent(parsedNotesContent[parsedTree[0].id] || '');
           }
        }

        const savedTime = localStorage.getItem(`learnlog-session-${sessionId}-timer`);
        if (savedTime) setSessionTime(parseInt(savedTime, 10));
        
        const savedRunning = localStorage.getItem(`learnlog-session-${sessionId}-running`);
        setIsSessionRunning(savedRunning === 'true');

      } else {
        console.error("Session data not found for ID:", sessionId);
        router.push('/study/launch');
      }
    } catch (error) {
      console.error("Error loading session data:", error);
      router.push('/study/launch');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, router]);

  const findFirstNote = (nodes: TreeNode[]): TreeNode | null => {
    for (const node of nodes) {
      if (node.type === 'note') return node;
      if (node.children) {
        const found = findFirstNote(node.children);
        if (found) return found;
      }
    }
    return null;
  };


  // Save tree and notes content to localStorage
  const saveTreeToLocalStorage = useCallback(
    debounce((newTree: TreeNode[]) => {
      if (sessionId) {
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
    if (treeData.length > 0) {
        saveTreeToLocalStorage(treeData);
    }
  }, [treeData, saveTreeToLocalStorage]);

  useEffect(() => {
    if (Object.keys(notesContent).length > 0 || (activeNoteId && currentNoteContent !== (notesContent[activeNoteId] || '')) ) {
        saveNotesContentToLocalStorage(notesContent);
    }
  }, [notesContent, saveNotesContentToLocalStorage, activeNoteId, currentNoteContent]);

  useEffect(() => {
    if (activeNoteId) {
      const updatedNotesContent = { ...notesContent, [activeNoteId]: currentNoteContent };
      setNotesContent(updatedNotesContent);
      // saveNotesContentToLocalStorage will be triggered by notesContent change
    }
  }, [currentNoteContent, activeNoteId]); // Removed notesContent from deps to avoid loop with its own save


  // Save timer state to localStorage
  useEffect(() => {
    if (sessionId && !isLoading) { // ensure not to save initial 0 if still loading
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
      // Save final state before navigating
      if (activeNoteId) {
          const finalNotes = { ...notesContent, [activeNoteId]: currentNoteContent };
          localStorage.setItem(`learnlog-session-${sessionId}-notesContent`, JSON.stringify(finalNotes));
      }
      localStorage.setItem(`learnlog-session-${sessionId}-tree`, JSON.stringify(treeData));
      localStorage.setItem(`learnlog-session-${sessionId}-timer`, sessionTime.toString());
      localStorage.setItem(`learnlog-session-${sessionId}-running`, 'false');
      router.push('/'); 
    }
  };

  const toggleReferencePanel = () => setIsReferencePanelOpen(prev => !prev);

  const handleNoteSelect = (nodeId: string, nodeType: TreeNode['type']) => {
    if (nodeType === 'note') {
      if (activeNoteId && activeNoteId !== nodeId) {
        // Save current note before switching
        setNotesContent(prev => ({ ...prev, [activeNoteId]: currentNoteContent }));
      }
      setActiveNoteId(nodeId);
      setCurrentNoteContent(notesContent[nodeId] || '');
    } else {
      // If a folder/title is clicked, maybe just highlight it but don't change editor
      setActiveNoteId(nodeId); // Or set to null if non-notes shouldn't clear editor
      // setCurrentNoteContent(''); // Optionally clear editor or show placeholder
    }
  };

  const addNodeToTree = (parentId: string | null, type: 'title' | 'subheading' | 'note') => {
    const newNodeName = prompt(`Enter name for new ${type}:`);
    if (!newNodeName) return;

    const newNode: TreeNode = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: newNodeName,
      type,
      children: [],
      parentId: parentId,
    };

    if (type === 'note') {
      setNotesContent(prev => ({ ...prev, [newNode.id]: '' }));
    }
    
    const addToChildren = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return { ...node, children: [...(node.children || []), newNode] };
        }
        if (node.children) {
          return { ...node, children: addToChildren(node.children) };
        }
        return node;
      });
    };

    if (parentId === null || parentId === 'root') { // Adding to the root (subject)
       setTreeData(prevTree => {
           if (prevTree.length > 0 && prevTree[0].id === 'root') {
               const rootNode = prevTree[0];
               return [{...rootNode, children: [...(rootNode.children || []), newNode]}];
           }
           return prevTree; // Should not happen if root always exists
       });
    } else {
       setTreeData(prevTree => addToChildren(prevTree));
    }
  };
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentNoteContent(e.target.value);
    // Debounced save will be handled by useEffect on currentNoteContent/activeNoteId
  };


  if (isLoading || !sessionData) {
    return (
      <div className="flex flex-col h-screen bg-[#0A0A0A] text-foreground items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading your session...</p>
      </div>
    );
  }
  
  const currentActiveNode = activeNoteId ? findNodeById(treeData, activeNoteId) : null;
  const isEditorActive = currentActiveNode?.type === 'note';


  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-foreground overflow-hidden">
      <AppHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <SessionSidebar 
          sessionSubject={sessionData.subject}
          treeData={treeData}
          onSelectNode={handleNoteSelect}
          activeNodeId={activeNoteId}
          onAddNode={addNodeToTree}
        />

        <main className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto relative custom-scrollbar">
          
          <div className="flex items-center justify-end mb-4 space-x-2">
            <Button variant="outline" size="sm" onClick={toggleReferencePanel} className="bg-white/5 border-white/10 hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100">
              <Paperclip className="h-4 w-4 mr-2" />
              Add PDF
            </Button>
            <Button variant="outline" size="sm" onClick={toggleReferencePanel} className="bg-white/5 border-white/10 hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100">
              <StickyNote className="h-4 w-4 mr-2" />
              Previous Notes
            </Button>
          </div>

          <div className="flex flex-1 gap-4 min-h-0">
            <div 
              className="relative flex-1 h-full flex flex-col" // Added flex flex-col
            >
              <Textarea 
                placeholder={isEditorActive ? "Start typing your notes here..." : "Select a note from the sidebar to begin editing."}
                className="w-full flex-1 bg-[#0F0F0F] border-white/10 rounded-md p-4 text-base resize-none focus:ring-primary focus:border-primary font-code custom-scrollbar"
                value={isEditorActive ? currentNoteContent : ''}
                onChange={handleTextareaChange}
                onFocus={() => setShowAiButtons(true)}
                onBlur={() => setTimeout(() => setShowAiButtons(false), 100)} // Delay to allow AI button clicks
                disabled={!isEditorActive}
              />
              {isEditorActive && (
                <div 
                    className={`flex items-center justify-end space-x-2 p-2 bg-[#0F0F0F] border-t border-white/10 rounded-b-md transition-opacity duration-200 ${showAiButtons ? 'opacity-100' : 'opacity-0'}`}
                >
                  <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs p-1.5">✨ Explain</Button>
                  <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs p-1.5">📋 Summarize</Button>
                  <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs p-1.5">⤴️ Expand</Button>
                </div>
              )}
            </div>

            {isReferencePanelOpen && (
              <div className="w-[30%] h-full bg-[#0F0F0F] border-white/10 p-4 rounded-md flex flex-col overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 text-sm">
                  <span>Reference Panel</span>
                  <Button variant="ghost" size="icon" onClick={toggleReferencePanel} className="h-6 w-6 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4"/>
                  </Button>
                </div>
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  PDF / Reference Viewer Area
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 text-xs text-muted-foreground text-right border-t border-white/10 pt-2">
              Word Count: {isEditorActive ? currentNoteContent.split(/\s+/).filter(Boolean).length : 0} | {activeNoteId ? (notesContent.hasOwnProperty(activeNoteId) ? 'Saved' : 'Saving...') : 'No active note'}
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
export function findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}
