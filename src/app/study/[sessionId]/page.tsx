
'use client';

import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SessionSidebar, type TreeNode, findNodeByIdRecursive } from '@/components/study/session-sidebar';
import { FloatingTimerWidget } from '@/components/study/floating-timer-widget';
import { Paperclip, StickyNote, Loader2, X, Brain, MessageSquare, Sparkles, FileText as FileTextIcon } from 'lucide-react'; // Renamed FileText to FileTextIcon
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
  const [referencePanelMode, setReferencePanelMode] = useState<'pdf' | 'notes' | null>(null);
  const [currentPdf, setCurrentPdf] = useState<{ name: string; dataUri: string } | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [showAiButtons, setShowAiButtons] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionRunning, setIsSessionRunning] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [notebookTitle, setNotebookTitle] = useState('');


  // Load session data, tree, notes, and PDF attachment info from localStorage
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

        const attachedPdfName = localStorage.getItem(`learnlog-session-${sessionId}-pdfName`);
        if (attachedPdfName) {
          // We don't auto-load the PDF content, just remember its name.
          // User will need to re-select if they want to view it.
          // Optionally, prompt user here.
        }

      } else {
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


  useEffect(() => {
    if (sessionId && !isLoading) { 
      localStorage.setItem(`learnlog-session-${sessionId}-timer`, sessionTime.toString());
      localStorage.setItem(`learnlog-session-${sessionId}-running`, isSessionRunning.toString());
    }
  }, [sessionTime, isSessionRunning, sessionId, isLoading]);

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
      if (activeNoteId) {
        const finalNotes = { ...notesContent, [activeNoteId]: currentNoteContent };
        localStorage.setItem(`learnlog-session-${sessionId}-notesContent`, JSON.stringify(finalNotes));
      } else {
        localStorage.setItem(`learnlog-session-${sessionId}-notesContent`, JSON.stringify(notesContent));
      }
      if (treeData.length > 0) localStorage.setItem(`learnlog-session-${sessionId}-tree`, JSON.stringify(treeData));
      localStorage.setItem(`learnlog-session-${sessionId}-timer`, sessionTime.toString());
      localStorage.setItem(`learnlog-session-${sessionId}-running`, 'false'); 
      router.push('/'); 
    }
  };

  const handleNoteSelect = (nodeId: string, nodeType: TreeNode['type']) => {
    if (nodeType === 'note') {
      if (activeNoteId && activeNoteId !== nodeId && currentNoteContent !== (notesContent[activeNoteId] || '')) {
         setNotesContent(prev => {
            const updatedNotes = { ...prev, [activeNoteId as string]: currentNoteContent };
            localStorage.setItem(`learnlog-session-${sessionId}-notesContent`, JSON.stringify(updatedNotes));
            return updatedNotes;
        });
      }
      setActiveNoteId(nodeId);
      setCurrentNoteContent(notesContent[nodeId] || '');
    } else {
      setActiveNoteId(nodeId); // Allow selecting non-note items to see their name, but editor remains disabled
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
      children: (type === 'note' || type === 'subject') ? [] : [], 
      parentId: parentId,
    };
    if (type === 'subject') newNode.children = [];

    if (type === 'note') {
      setNotesContent(prev => ({ ...prev, [newNode.id]: '' }));
    }
    
    const updateTreeRecursively = (nodes: TreeNode[], pId: string | null): TreeNode[] => {
      if (pId === null ) { 
        if (nodes.length > 0 && nodes[0].id === 'root' && nodes[0].type === 'subject') { 
            const rootNode = nodes[0];
            return [{ ...rootNode, children: [...(rootNode.children || []), newNode] }];
        }
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
    setTreeData(prevTree => updateTreeRecursively(prevTree, parentId || 'root'));
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

  const handleOpenPdfSelector = () => {
    pdfInputRef.current?.click();
  };

  const handlePdfSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        setCurrentPdf({ name: file.name, dataUri });
        setReferencePanelMode('pdf');
        setIsReferencePanelOpen(true);
        if (sessionId) {
            localStorage.setItem(`learnlog-session-${sessionId}-pdfName`, file.name);
        }
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast({ title: "Invalid File", description: "Please select a PDF file.", variant: "destructive" });
    }
    // Reset file input to allow selecting the same file again if needed
    if (event.target) event.target.value = ''; 
  };

  const handleClearPdf = () => {
    setCurrentPdf(null);
    setReferencePanelMode(null); 
    setIsReferencePanelOpen(false); // Or keep open with no content if preferred
    if (sessionId) {
        localStorage.removeItem(`learnlog-session-${sessionId}-pdfName`);
    }
  };
  
  const handleOpenPreviousNotes = () => {
    setReferencePanelMode('notes');
    setIsReferencePanelOpen(true);
    setCurrentPdf(null); // Ensure PDF is not shown if switching to notes
  };
  
  const closeReferencePanel = () => {
    setIsReferencePanelOpen(false);
    setReferencePanelMode(null);
    // setCurrentPdf(null); // Decide if clearing PDF on panel close is desired
  }

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
      <input type="file" accept="application/pdf" ref={pdfInputRef} onChange={handlePdfSelected} className="hidden" />
      
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
                <Button variant="outline" size="sm" onClick={handleOpenPdfSelector} className="bg-white/5 border-white/10 hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100">
                <Paperclip className="h-4 w-4 mr-2" />
                Add PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleOpenPreviousNotes} className="bg-white/5 border-white/10 hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100">
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
              <div className="w-[35%] max-w-[500px] h-full bg-[#0F0F0F] border border-white/10 p-0 rounded-lg flex flex-col overflow-hidden custom-scrollbar shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 p-2 mb-0 shrink-0">
                  <span className="font-semibold text-sm ml-2">
                    {referencePanelMode === 'pdf' && currentPdf ? `PDF: ${currentPdf.name}` : 
                     referencePanelMode === 'notes' ? 'Previous Notes' : 'Reference Panel'}
                  </span>
                  <div className="flex items-center">
                    {referencePanelMode === 'pdf' && currentPdf && (
                         <Button variant="ghost" size="sm" onClick={handleClearPdf} className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10 mr-1">
                            Clear PDF
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={closeReferencePanel} className="h-6 w-6 text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4"/>
                    </Button>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center overflow-auto">
                  {referencePanelMode === 'pdf' && currentPdf?.dataUri && (
                    <iframe src={currentPdf.dataUri} width="100%" height="100%" title="PDF Viewer" className="border-none"></iframe>
                  )}
                  {referencePanelMode === 'notes' && (
                    <div className="p-4 text-muted-foreground text-xs">Previous Notes Area - Content to be implemented.</div>
                  )}
                  {!referencePanelMode && (
                     <div className="p-4 text-muted-foreground text-xs">Select a reference to view.</div>
                  )}
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


export default function StudySessionPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0A0A0A]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <StudySessionPageContent />
    </Suspense>
  );
}


    