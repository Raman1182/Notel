
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SessionSidebar, type TreeNode } from '@/components/study/session-sidebar';
import { FloatingTimerWidget } from '@/components/study/floating-timer-widget';
import { Paperclip, StickyNote, Loader2, X, Settings, Zap, CheckSquare, ChevronDown, Sparkles, Brain, MessageSquare, FileText } from 'lucide-react';
import type { SessionData } from '@/app/study/launch/page';
import { processText, type ProcessTextInput } from '@/ai/flows/process-text-flow';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [notesContent, setNotesContent] = useState<Record<string, string>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  
  const [currentNoteContent, setCurrentNoteContent] = useState('');

  const [isReferencePanelOpen, setIsReferencePanelOpen] = useState(false);
  const [showAiButtons, setShowAiButtons] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

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
        const defaultRootNode: TreeNode = { id: 'root', name: parsedSessionData.subject, type: 'subject', children: [], parentId: null };
        const defaultNoteId = `${Date.now()}-default-note-${Math.random().toString(16).slice(2)}`;
        const defaultNoteNode: TreeNode = { id: defaultNoteId, name: 'Session Note', type: 'note', children: [], parentId: 'root' };
        
        let parsedTreeData: TreeNode[] = storedTreeJSON ? JSON.parse(storedTreeJSON) : [{ ...defaultRootNode, children: [defaultNoteNode] }];
        if (parsedTreeData.length === 0 || parsedTreeData[0].type !== 'subject') {
            parsedTreeData = [{ ...defaultRootNode, children: [defaultNoteNode] }];
        }
        setTreeData(parsedTreeData);
        
        const storedNotesContentJSON = localStorage.getItem(`learnlog-session-${sessionId}-notesContent`);
        const parsedNotesContent: Record<string, string> = storedNotesContentJSON ? JSON.parse(storedNotesContentJSON) : { [defaultNoteId]: '' };
        setNotesContent(parsedNotesContent);

        const firstNoteInTree = findFirstNoteRecursive(parsedTreeData);
        if (firstNoteInTree) {
          setActiveNoteId(firstNoteInTree.id);
          setCurrentNoteContent(parsedNotesContent[firstNoteInTree.id] || '');
        } else if (parsedTreeData[0]?.children?.length > 0 && parsedTreeData[0].children[0].type === 'note') {
            const firstChildNote = parsedTreeData[0].children[0];
            setActiveNoteId(firstChildNote.id);
            setCurrentNoteContent(parsedNotesContent[firstChildNote.id] || '');
        } else {
           // If no notes, create one if root exists
            if (parsedTreeData.length > 0 && parsedTreeData[0].id === 'root') {
                const newNoteId = `${Date.now()}-initial-note`;
                const newNote: TreeNode = { id: newNoteId, name: "My First Note", type: 'note', parentId: 'root' };
                setTreeData(prevTree => [{ ...prevTree[0], children: [...(prevTree[0].children || []), newNote] }]);
                setNotesContent(prevNotes => ({ ...prevNotes, [newNoteId]: '' }));
                setActiveNoteId(newNoteId);
                setCurrentNoteContent('');
            }
        }


        const savedTime = localStorage.getItem(`learnlog-session-${sessionId}-timer`);
        if (savedTime) setSessionTime(parseInt(savedTime, 10));
        
        const savedRunning = localStorage.getItem(`learnlog-session-${sessionId}-running`);
        setIsSessionRunning(savedRunning === 'true');

      } else {
        console.error("Session data not found for ID:", sessionId);
        toast({ title: "Error", description: "Session data not found.", variant: "destructive" });
        router.push('/study/launch'); 
      }
    } catch (error) {
      console.error("Error loading session data:", error);
      toast({ title: "Error", description: "Could not load session data.", variant: "destructive" });
      router.push('/study/launch');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, router, toast]);

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
    if (!isLoading && activeNoteId && currentNoteContent !== (notesContent[activeNoteId] || '')) {
        setNotesContent(prev => ({ ...prev, [activeNoteId as string]: currentNoteContent }));
    }
  }, [currentNoteContent, activeNoteId, isLoading]);

  useEffect(() => {
    if (!isLoading && Object.keys(notesContent).length > 0) {
        saveNotesContentToLocalStorage(notesContent);
    }
  }, [notesContent, saveNotesContentToLocalStorage, isLoading]);


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
    if (window.confirm("Are you sure you want to end this study session? All notes will be saved.")) {
      setIsSessionRunning(false);
      // Ensure latest content is flushed to notesContent before saving
      if (activeNoteId) {
        const finalNotes = { ...notesContent, [activeNoteId]: currentNoteContent };
        localStorage.setItem(`learnlog-session-${sessionId}-notesContent`, JSON.stringify(finalNotes));
      } else {
        localStorage.setItem(`learnlog-session-${sessionId}-notesContent`, JSON.stringify(notesContent));
      }
      if (treeData.length > 0) localStorage.setItem(`learnlog-session-${sessionId}-tree`, JSON.stringify(treeData));
      localStorage.setItem(`learnlog-session-${sessionId}-timer`, sessionTime.toString());
      localStorage.setItem(`learnlog-session-${sessionId}-running`, 'false'); // Explicitly set to false
      router.push('/'); 
    }
  };

  const toggleReferencePanel = () => setIsReferencePanelOpen(prev => !prev);

  const handleNoteSelect = (nodeId: string, nodeType: TreeNode['type']) => {
    if (nodeType === 'note') {
      if (activeNoteId && activeNoteId !== nodeId && currentNoteContent !== (notesContent[activeNoteId] || '')) {
        // Save current note before switching (direct save, not debounced)
         setNotesContent(prev => {
            const updatedNotes = { ...prev, [activeNoteId as string]: currentNoteContent };
            localStorage.setItem(`learnlog-session-${sessionId}-notesContent`, JSON.stringify(updatedNotes));
            return updatedNotes;
        });
      }
      setActiveNoteId(nodeId);
      setCurrentNoteContent(notesContent[nodeId] || '');
    } else {
      setActiveNoteId(nodeId);
    }
  };

  const addNodeToTree = (parentId: string | null, type: 'title' | 'subheading' | 'note', name: string) => {
    if (!name || name.trim() === '') {
        toast({ title: "Error", description: "Node name cannot be empty.", variant: "destructive" });
        return;
    }

    const newNode: TreeNode = {
      id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: name.trim(),
      type,
      children: (type === 'note' || type === 'subject') ? [] : [], // subjects can have children, notes cannot
      parentId: parentId,
    };
    if (type === 'subject') newNode.children = []; // ensure subject can have children

    if (type === 'note') {
      setNotesContent(prev => ({ ...prev, [newNode.id]: '' }));
    }
    
    const updateTreeRecursively = (nodes: TreeNode[], pId: string | null): TreeNode[] => {
      if (pId === null ) { // Adding to root if tree is empty or pId is explicitly null
        if (nodes.length > 0 && nodes[0].id === 'root' && nodes[0].type === 'subject') { // Common case: adding to existing root
            const rootNode = nodes[0];
            return [{ ...rootNode, children: [...(rootNode.children || []), newNode] }];
        }
        // This case should ideally not be hit if a root subject node always exists.
        // If it's a new tree, the first node should be a subject.
        // For simplicity, we assume parentId 'root' is always the first node.
        return [...nodes, newNode]; 
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
    
    setTreeData(prevTree => updateTreeRecursively(prevTree, parentId || 'root')); // Default to 'root' if parentId is null
  };
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentNoteContent(e.target.value);
  };

  const handleAiAction = async (actionType: 'explain' | 'summarize' | 'expand') => {
    if (!activeNoteId || !currentNoteContent.trim()) {
      toast({ title: "Info", description: "Please select a note with content to process.", variant: "default" });
      return;
    }
    setIsAiProcessing(true);
    const currentActiveNodeDetails = activeNoteId ? findNodeByIdRecursive(treeData, activeNoteId) : null;
    const context = `${notebookTitle}${currentActiveNodeDetails ? ` - ${currentActiveNodeDetails.name}` : ''}`;

    try {
      const input: ProcessTextInput = {
        action: actionType,
        text: currentNoteContent,
        context: context,
      };
      const result = await processText(input);
      setCurrentNoteContent(prev => 
        prev + `\n\n---\n**AI ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}:**\n${result.processedText}\n---`
      );
      toast({ title: "AI Action Successful", description: `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} complete.`, variant: "default" });
    } catch (error) {
      console.error(`Error during AI action (${actionType}):`, error);
      toast({ title: "AI Error", description: `Could not ${actionType} content. Please try again.`, variant: "destructive" });
    } finally {
      setIsAiProcessing(false);
    }
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


          <div className="flex flex-1 gap-4 min-h-0">
            <div 
              className="relative flex-1 h-full flex flex-col bg-[#0F0F0F] rounded-lg border border-white/10 shadow-inner"
            >
              <Textarea 
                placeholder={isEditorActive ? "Start typing your notes here..." : "Select a note from the sidebar to begin editing, or create a new one."}
                className="w-full flex-1 bg-transparent border-none rounded-t-md p-6 text-base resize-none focus:ring-0 focus:border-transparent font-code custom-scrollbar"
                value={isEditorActive ? currentNoteContent : ''}
                onChange={handleTextareaChange}
                onFocus={() => setShowAiButtons(isEditorActive)}
                onBlur={() => setTimeout(() => { if (!isAiProcessing) setShowAiButtons(false); }, 200)}
                disabled={!isEditorActive || isAiProcessing}
              />
              {isEditorActive && (
                <div 
                    className={`flex items-center justify-end space-x-2 p-2 border-t border-white/10 rounded-b-md transition-opacity duration-200 ${showAiButtons || isAiProcessing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                  <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-primary/20 backdrop-blur-sm text-xs p-1.5 px-2 text-foreground-opacity-70 hover:text-foreground disabled:opacity-50" onClick={() => handleAiAction('explain')} disabled={isAiProcessing}>
                    {isAiProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Brain className="h-3 w-3 mr-1" />} Explain
                  </Button>
                  <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-primary/20 backdrop-blur-sm text-xs p-1.5 px-2 text-foreground-opacity-70 hover:text-foreground disabled:opacity-50" onClick={() => handleAiAction('summarize')} disabled={isAiProcessing}>
                    {isAiProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />} Summarize
                  </Button>
                  <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-primary/20 backdrop-blur-sm text-xs p-1.5 px-2 text-foreground-opacity-70 hover:text-foreground disabled:opacity-50" onClick={() => handleAiAction('expand')} disabled={isAiProcessing}>
                    {isAiProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />} Expand
                  </Button>
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
