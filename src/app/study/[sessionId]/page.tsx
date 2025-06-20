
'use client';

import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SessionSidebar, type TreeNode, findNodeByIdRecursive } from '@/components/study/session-sidebar';
import { FloatingTimerWidget } from '@/components/study/floating-timer-widget';
import { Paperclip, StickyNote, Loader2, X, Brain, MessageSquare, Sparkles, FileText as FileTextIcon, AlertTriangle, Layers, History, HelpCircle, Link2 } from 'lucide-react';
import type { SessionData, TimerMode } from '@/app/study/launch/page';
import { processText, type ProcessTextInput } from '@/ai/flows/process-text-flow';
import { generateFlashcardsFlow, type GenerateFlashcardsInput, type GenerateFlashcardsOutput, type Flashcard } from '@/ai/flows/generate-flashcards-flow';
import { generateQuizFlow, type GenerateQuizInput, type GenerateQuizOutput, type QuizQuestion } from '@/ai/flows/generate-quiz-flow';
import { findNoteConnectionsFlow, type FindNoteConnectionsInput, type FindNoteConnectionsOutput, type ConnectionSuggestion } from '@/ai/flows/find-note-connections-flow';


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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FlashcardViewer } from '@/components/study/flashcard-viewer';
import { QuizTaker } from '@/components/study/quiz-taker';
import { Card, CardHeader as UiCardHeader, CardContent as UiCardContent, CardTitle as UiCardTitle } from '@/components/ui/card'; // Renamed to avoid conflict


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

// Helper function to find the first note in a tree
function findFirstNoteRecursive(nodes: TreeNode[]): TreeNode | null {
  for (const node of nodes) {
    if (node.type === 'note') {
      return node;
    }
    if (node.children) {
      const foundInChild = findFirstNoteRecursive(node.children);
      if (foundInChild) {
        return foundInChild;
      }
    }
  }
  return null;
}

// Helper to get snippets from historical notes
async function getHistoricalNoteSnippets(currentSessionId: string, maxSnippets = 10, snippetLength = 300): Promise<FindNoteConnectionsInput['historicalNotes']> {
  const historicalNotes: FindNoteConnectionsInput['historicalNotes'] = [];
  const sessionsIndexJSON = localStorage.getItem('learnlog-sessions-index');
  if (!sessionsIndexJSON) return [];

  const allSessionIds: string[] = JSON.parse(sessionsIndexJSON);
  
  for (const sessionId of allSessionIds) {
    if (sessionId === currentSessionId) continue;
    if (historicalNotes.length >= maxSnippets) break;

    const sessionDataJSON = localStorage.getItem(`learnlog-session-${sessionId}`);
    const sessionTreeJSON = localStorage.getItem(`learnlog-session-${sessionId}-tree`);
    const sessionNotesContentJSON = localStorage.getItem(`learnlog-session-${sessionId}-notesContent`);

    if (sessionDataJSON && sessionTreeJSON && sessionNotesContentJSON) {
      try {
        const sessionData: SessionData = JSON.parse(sessionDataJSON);
        const tree: TreeNode[] = JSON.parse(sessionTreeJSON);
        const notesContent: Record<string, string> = JSON.parse(sessionNotesContentJSON);

        const extractSnippetsRecursive = (nodes: TreeNode[]) => {
          for (const node of nodes) {
            if (historicalNotes.length >= maxSnippets) return;
            if (node.type === 'note' && notesContent[node.id] && notesContent[node.id].trim().length > 50) { 
              historicalNotes.push({
                noteId: `${sessionId}__${node.id}`, // Ensure unique ID across sessions for connections
                subject: sessionData.subject,
                title: node.name,
                contentSnippet: notesContent[node.id].substring(0, snippetLength) + (notesContent[node.id].length > snippetLength ? '...' : ''),
              });
            }
            if (node.children) {
              extractSnippetsRecursive(node.children);
            }
          }
        };
        extractSnippetsRecursive(tree);
      } catch (e) {
        console.warn(`Could not parse data for session ${sessionId}`, e);
      }
    }
  }
  return historicalNotes;
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

  const [allSessionsForReference, setAllSessionsForReference] = useState<SessionData[]>([]);
  const [selectedPreviousSessionIdForReference, setSelectedPreviousSessionIdForReference] = useState<string | null>(null);


  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [parsedAiContent, setParsedAiContent] = useState<any>(null); 
  const [aiGeneratedContentType, setAiGeneratedContentType] = useState<'flashcards' | 'quiz' | 'connections' | null>(null);
  const [aiConnectionSuggestions, setAiConnectionSuggestions] = useState<ConnectionSuggestion[]>([]);


  const [sessionTime, setSessionTime] = useState(0); 
  const [isSessionRunning, setIsSessionRunning] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [notebookTitle, setNotebookTitle] = useState('');
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timerMode, setTimerMode] = useState<TimerMode>('normal');
  const [pomodoroCycle, setPomodoroCycle] = useState<{ workMinutes: number; breakMinutes: number } | undefined>(undefined);

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
      if (storedSessionDataJSON) {
        const parsedSessionData: SessionData = JSON.parse(storedSessionDataJSON);
        setSessionData(parsedSessionData);
        setNotebookTitle(parsedSessionData.subject); 
        setTimerMode(parsedSessionData.timerMode || 'normal');
        setPomodoroCycle(parsedSessionData.pomodoroCycle);
        localStorage.setItem('learnlog-lastActiveSubject', parsedSessionData.subject); 

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

      } else {
        setError(`Session data not found for ID: ${sessionId}. It might have been deleted or never existed.`);
        router.push('/study/launch'); 
      }
    } catch (err) {
      console.error("Error loading session data:", err);
      setError("Could not load session data. It might be corrupted.");
      router.push('/study/launch');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, router]);


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
  }, [currentNoteContent, activeNoteId, isLoading, notesContent]); 

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

  const confirmEndSession = () => {
    setIsSessionRunning(false);
    const finalNotesToSave = activeNoteId ? { ...notesContent, [activeNoteId]: currentNoteContent } : notesContent;
    localStorage.setItem(`learnlog-session-${sessionId}-notesContent`, JSON.stringify(finalNotesToSave));

    if (treeData.length > 0) localStorage.setItem(`learnlog-session-${sessionId}-tree`, JSON.stringify(treeData));

    const storedSessionDataJSON = localStorage.getItem(`learnlog-session-${sessionId}`);
    if (storedSessionDataJSON) {
        let parsedSessionData: SessionData = JSON.parse(storedSessionDataJSON);
        const actualDurationMinutes = Math.floor(sessionTime / 60); 
        parsedSessionData = {...parsedSessionData, duration: actualDurationMinutes}; 
        localStorage.setItem(`learnlog-session-${sessionId}`, JSON.stringify(parsedSessionData));
    }

    localStorage.setItem(`learnlog-session-${sessionId}-timer`, sessionTime.toString());
    localStorage.setItem(`learnlog-session-${sessionId}-running`, 'false');
    localStorage.removeItem('learnlog-lastActiveSubject'); 

    setShowEndSessionDialog(false);
    toast({ title: "Session Ended", description: `${notebookTitle} session saved. Actual time: ${Math.floor(sessionTime/60)}m ${sessionTime%60}s.`});
    router.push('/');
  };
  
  const handleAttemptEndSession = () => {
    setShowEndSessionDialog(true);
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
      if (activeNoteId && currentNoteContent !== (notesContent[activeNoteId] || '')) {
         setNotesContent(prev => {
            const updatedNotes = { ...prev, [activeNoteId as string]: currentNoteContent };
            localStorage.setItem(`learnlog-session-${sessionId}-notesContent`, JSON.stringify(updatedNotes));
            return updatedNotes;
        });
      }
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
        prev + `\n\n---\n**AI ${actionType.charAt(0).toUpperCase() + actionType.slice(1)} (${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }):**\n${result.processedText}\n---`
      );
      toast({ title: "AI Action Successful", description: `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} complete.`, variant: "default" });
    } catch (error) {
      console.error(`Error during AI action (${actionType}):`, error);
      const errorMessage = error instanceof Error ? error.message : `Could not ${actionType} content. Please try again.`;
      toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!activeNoteId || !currentNoteContent.trim()) {
      toast({ title: "Info", description: "Select a note with content to generate flashcards.", variant: "default" });
      return;
    }
    setIsAiProcessing(true);
    setParsedAiContent(null);
    setAiConnectionSuggestions([]);
    try {
      const input: GenerateFlashcardsInput = { noteContent: currentNoteContent, subject: notebookTitle, numFlashcards: 10 };
      const result: GenerateFlashcardsOutput = await generateFlashcardsFlow(input);
      if (result.flashcards && result.flashcards.length > 0) {
        setParsedAiContent(result.flashcards);
        setAiGeneratedContentType('flashcards');
        toast({ title: "Flashcards Generated", description: "AI has created flashcards from your note." });
      } else {
         setParsedAiContent([]); 
         setAiGeneratedContentType('flashcards'); 
         toast({ title: "No Flashcards", description: "The AI couldn't generate flashcards from this content.", variant: "default" });
      }
    } catch (error) {
      toast({ title: "Flashcard Generation Error", description: error instanceof Error ? error.message : "Could not generate flashcards.", variant: "destructive"});
      setParsedAiContent(null);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleGenerateQuiz = async () => {
     if (!activeNoteId || !currentNoteContent.trim()) {
      toast({ title: "Info", description: "Select a note with content to generate a quiz.", variant: "default" });
      return;
    }
    setIsAiProcessing(true);
    setParsedAiContent(null);
    setAiConnectionSuggestions([]);
    try {
      const input: GenerateQuizInput = { noteContent: currentNoteContent, subject: notebookTitle, numQuestions: 5, quizType: 'mixed' };
      const result: GenerateQuizOutput = await generateQuizFlow(input);
      if (result.questions && result.questions.length > 0) {
        setParsedAiContent({ questions: result.questions, title: result.quizTitle || `${notebookTitle} Quiz` });
        setAiGeneratedContentType('quiz');
        toast({ title: "Quiz Generated", description: "AI has created a quiz from your note." });
      } else {
        setParsedAiContent({ questions: [], title: "No Quiz" });
        setAiGeneratedContentType('quiz');
        toast({ title: "No Quiz Questions", description: "The AI couldn't generate a quiz from this content.", variant: "default" });
      }
    } catch (error) {
      toast({ title: "Quiz Generation Error", description: error instanceof Error ? error.message : "Could not generate quiz.", variant: "destructive"});
      setParsedAiContent(null);
    } finally {
      setIsAiProcessing(false);
    }
  };
  
  const handleFindConnections = async () => {
    if (!activeNoteId || !currentNoteContent.trim()) {
      toast({ title: "Info", description: "Select a note with content to find connections.", variant: "default" });
      return;
    }
    setIsAiProcessing(true);
    setParsedAiContent(null);
    setAiConnectionSuggestions([]);
    try {
      const historicalNotes = await getHistoricalNoteSnippets(sessionId);
      if (historicalNotes.length === 0) {
        toast({title: "No Historical Notes", description: "Not enough historical note data to find connections.", variant: "default"});
        setIsAiProcessing(false);
        setAiGeneratedContentType('connections'); 
        setAiConnectionSuggestions([]);
        return;
      }
      const input: FindNoteConnectionsInput = {
        currentNoteId: activeNoteId,
        currentNoteContent: currentNoteContent,
        currentNoteSubject: notebookTitle,
        historicalNotes: historicalNotes,
      };
      const result = await findNoteConnectionsFlow(input);
      setAiConnectionSuggestions(result.suggestions);
      setAiGeneratedContentType('connections');
      toast({ title: "Connections Analyzed", description: result.suggestions.length > 0 ? `Found ${result.suggestions.length} potential connection(s).` : "No strong connections found this time."});
    } catch (error) {
      toast({ title: "Connection Analysis Error", description: error instanceof Error ? error.message : "Could not analyze connections.", variant: "destructive"});
      setAiGeneratedContentType(null);
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
        setSelectedPreviousSessionIdForReference(null);
        if (sessionId) {
            localStorage.setItem(`learnlog-session-${sessionId}-pdfName`, file.name);
        }
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast({ title: "Invalid File", description: "Please select a PDF file.", variant: "destructive" });
    }
    if (event.target) event.target.value = ''; 
  };

  const handleClearPdf = () => {
    setCurrentPdf(null);
    setReferencePanelMode(null); 
    setIsReferencePanelOpen(false); 
    if (sessionId) {
        localStorage.removeItem(`learnlog-session-${sessionId}-pdfName`);
    }
  };
  
  const handleOpenPreviousNotes = () => {
    setReferencePanelMode('notes');
    setIsReferencePanelOpen(true);
    setCurrentPdf(null); 
    setSelectedPreviousSessionIdForReference(null); 

    const sessionsIndexJSON = localStorage.getItem('learnlog-sessions-index');
    if (sessionsIndexJSON) {
        const allIds: string[] = JSON.parse(sessionsIndexJSON);
        const otherSessionsData = allIds
            .filter(id => id !== sessionId) 
            .map(id => {
                const sessionJSON = localStorage.getItem(`learnlog-session-${id}`);
                return sessionJSON ? JSON.parse(sessionJSON) as SessionData : null;
            })
            .filter(session => session !== null) as SessionData[];
        setAllSessionsForReference(otherSessionsData.sort((a, b) => (b.startTime || 0) - (a.startTime || 0))); 
    } else {
        setAllSessionsForReference([]);
    }
  };
  
  const closeReferencePanel = () => {
    setIsReferencePanelOpen(false);
    setReferencePanelMode(null);
    setSelectedPreviousSessionIdForReference(null);
  }

  if (isLoading || !sessionData) {
    return (
      <div className="flex flex-col h-screen bg-[#0A0A0A] text-foreground items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading your session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-[#0A0A0A] text-foreground items-center justify-center p-6 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Session</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push('/study/launch')}>Back to Launcher</Button>
      </div>
    );
  }
  
  const currentActiveNode = activeNoteId ? findNodeByIdRecursive(treeData, activeNoteId) : null;
  const isEditorActive = currentActiveNode?.type === 'note';

  const wordCount = isEditorActive ? currentNoteContent.trim().split(/\s+/).filter(Boolean).length : 0;
  
  let saveStatus = 'No active note';
  if (activeNoteId) {
    const savedContent = notesContent[activeNoteId];
    if (savedContent === undefined && currentNoteContent === '') { 
        saveStatus = 'Saved'; 
    } else if (savedContent === currentNoteContent) {
        saveStatus = 'Saved';
    } else {
        saveStatus = 'Saving...'; 
    }
  }

  const sidebarActiveNodeIdProp = activeNoteId;


  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-foreground overflow-hidden">
      <input type="file" accept="application/pdf" ref={pdfInputRef} onChange={handlePdfSelected} className="hidden" />
      
      <AlertDialog open={showEndSessionDialog} onOpenChange={setShowEndSessionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Study Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this study session? Your notes and actual study time will be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowEndSessionDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndSession} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog 
        open={!!aiGeneratedContentType && (!!parsedAiContent || aiConnectionSuggestions.length > 0 || (aiGeneratedContentType === 'connections' && aiConnectionSuggestions.length === 0))} 
        onOpenChange={(open) => { 
          if (!open) { 
            setParsedAiContent(null); 
            setAiGeneratedContentType(null); 
            setAiConnectionSuggestions([]); 
          }
        }}
      >
        <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl min-h-[70vh] flex flex-col p-0">
           <DialogHeader className="p-4 border-b border-border/20">
             <DialogTitle className="text-xl">
               {aiGeneratedContentType === 'flashcards' && 'AI Generated Flashcards'}
               {aiGeneratedContentType === 'quiz' && (parsedAiContent?.title || 'AI Generated Quiz')}
               {aiGeneratedContentType === 'connections' && 'AI Suggested Connections'}
               {(!aiGeneratedContentType && parsedAiContent) && 'AI Result'}
             </DialogTitle>
             {aiGeneratedContentType === 'quiz' && <DialogDescription>Test your knowledge based on the current note.</DialogDescription>}
             {aiGeneratedContentType === 'flashcards' && <DialogDescription>Review key concepts from your note.</DialogDescription>}
             {aiGeneratedContentType === 'connections' && <DialogDescription>Discover links to your other study materials.</DialogDescription>}
           </DialogHeader>
           
           <div className="flex-grow overflow-y-auto custom-scrollbar">
             {aiGeneratedContentType === 'flashcards' && Array.isArray(parsedAiContent) && (
               <div className="p-2 md:p-4">
                 <FlashcardViewer flashcards={parsedAiContent as Flashcard[]} />
               </div>
             )}
             {aiGeneratedContentType === 'quiz' && parsedAiContent?.questions && (
                <QuizTaker questions={parsedAiContent.questions as QuizQuestion[]} quizTitle={parsedAiContent.title} />
             )}
             {aiGeneratedContentType === 'connections' && (
               <div className="p-4 space-y-4">
                 {aiConnectionSuggestions.length > 0 ? aiConnectionSuggestions.map((suggestion, index) => {
                    const [connectionSessionId, connectionNoteIdPart] = suggestion.connectedNoteId.split('__');
                    const targetHref = connectionNoteIdPart 
                        ? `/notes/${connectionSessionId}/viewer?subject=${encodeURIComponent(suggestion.connectedNoteSubject || 'Note')}&note=${connectionNoteIdPart}` 
                        : `/notes/${connectionSessionId}/viewer?subject=${encodeURIComponent(suggestion.connectedNoteSubject || 'Note')}`;
                    return (
                        <Card key={index} className="bg-muted/30 p-4 border-l-4 border-primary/70">
                          <UiCardHeader className="p-0 pb-2">
                            <UiCardTitle className="text-base md:text-lg">
                              <Link href={targetHref} 
                                    target="_blank" rel="noopener noreferrer" 
                                    className="text-primary hover:underline flex items-center">
                                <FileTextIcon className="h-4 w-4 mr-2 shrink-0"/> {suggestion.connectedNoteTitle}
                              </Link>
                            </UiCardTitle>
                            {suggestion.connectedNoteSubject && <p className="text-xs text-muted-foreground mt-1">Subject: {suggestion.connectedNoteSubject}</p>}
                          </UiCardHeader>
                          <UiCardContent className="p-0">
                            <p className="text-sm font-semibold mt-1">Concept: <span className="font-normal">{suggestion.connectingConcept}</span></p>
                            <p className="text-sm mt-1"><span className="font-semibold">Explanation:</span> {suggestion.explanation}</p>
                          </UiCardContent>
                        </Card>
                    );
                 }) : <p className="text-muted-foreground text-center py-10">No strong connections found this time.</p>}
               </div>
             )}
            {/* Fallback for unexpected content or loading state (though loading should be handled by isAiProcessing) */}
            {!parsedAiContent && aiGeneratedContentType !== 'connections' && (
                <div className="p-6 text-center text-muted-foreground">Preparing content...</div>
            )}
           </div>
           
           <DialogFooter className="p-3 border-t border-border/20 mt-0">
             <Button variant="outline" onClick={() => { setParsedAiContent(null); setAiGeneratedContentType(null); setAiConnectionSuggestions([]); }}>Close</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 overflow-hidden">
        <SessionSidebar 
          sessionSubject={notebookTitle} 
          treeData={treeData}
          onSelectNode={handleNoteSelect}
          activeNodeId={sidebarActiveNodeIdProp} 
          onAddNode={addNodeToTree}
        />

        <main className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto relative custom-scrollbar bg-[#0A0A0A]">
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground truncate max-w-[calc(100%-300px)]">
                {notebookTitle} {activeNoteId && currentActiveNode ? `/ ${currentActiveNode.name}` : ''}
            </div>
            <div className="flex items-center space-x-2 shrink-0">
                <Button variant="outline" size="sm" onClick={handleOpenPdfSelector} className="bg-white/5 border-white/10 hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100">
                <Paperclip className="h-4 w-4 mr-2" />
                PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleOpenPreviousNotes} className="bg-white/5 border-white/10 hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100">
                <History className="h-4 w-4 mr-2" />
                Prev. Notes
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
                disabled={!isEditorActive || isAiProcessing}
              />
              {isEditorActive && (
                <div 
                    className="flex items-center justify-end space-x-1 p-2 border-t border-white/10 rounded-b-md bg-[#0F0F0F]"
                >
                  <Button size="sm" variant="ghost" className="text-xs p-1.5 px-2 disabled:opacity-50 bg-primary/10 hover:bg-primary/20 text-primary" onClick={() => handleAiAction('explain')} disabled={isAiProcessing || !currentNoteContent.trim()}>
                    {isAiProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Brain className="h-3 w-3 mr-1" />} Explain
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs p-1.5 px-2 disabled:opacity-50 bg-primary/10 hover:bg-primary/20 text-primary" onClick={() => handleAiAction('summarize')} disabled={isAiProcessing || !currentNoteContent.trim()}>
                    {isAiProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />} Summarize
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs p-1.5 px-2 disabled:opacity-50 bg-primary/10 hover:bg-primary/20 text-primary" onClick={() => handleAiAction('expand')} disabled={isAiProcessing || !currentNoteContent.trim()}>
                    {isAiProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />} Expand
                  </Button>
                   <Button size="sm" variant="ghost" className="text-xs p-1.5 px-2 disabled:opacity-50 bg-green-500/10 hover:bg-green-500/20 text-green-400" onClick={handleGenerateFlashcards} disabled={isAiProcessing || !currentNoteContent.trim()}>
                    {isAiProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Layers className="h-3 w-3 mr-1" />} Flashcards
                  </Button>
                   <Button size="sm" variant="ghost" className="text-xs p-1.5 px-2 disabled:opacity-50 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400" onClick={handleGenerateQuiz} disabled={isAiProcessing || !currentNoteContent.trim()}>
                    {isAiProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <HelpCircle className="h-3 w-3 mr-1" />} Quiz
                  </Button>
                   <Button size="sm" variant="ghost" className="text-xs p-1.5 px-2 disabled:opacity-50 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400" onClick={handleFindConnections} disabled={isAiProcessing || !currentNoteContent.trim()}>
                    {isAiProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Link2 className="h-3 w-3 mr-1" />} Connections
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
                <div className="flex-1 flex flex-col items-center justify-start overflow-auto p-3">
                  {referencePanelMode === 'pdf' && currentPdf?.dataUri && (
                    <iframe src={currentPdf.dataUri} width="100%" height="100%" title="PDF Viewer" className="border-none flex-1"></iframe>
                  )}
                  {referencePanelMode === 'notes' && (
                    <ScrollArea className="w-full h-full">
                      {allSessionsForReference.length === 0 && (
                        <p className="text-muted-foreground text-xs text-center py-4">No other sessions found.</p>
                      )}
                      {allSessionsForReference.map(session => (
                        <Button 
                            key={session.sessionId}
                            variant={selectedPreviousSessionIdForReference === session.sessionId ? "secondary" : "ghost"}
                            className="w-full justify-start text-left h-auto py-2 px-3 mb-1.5 block text-foreground hover:bg-primary/10"
                            onClick={() => setSelectedPreviousSessionIdForReference(session.sessionId)}
                        >
                            <span className="block font-medium text-sm truncate">{session.subject}</span>
                            <span className="block text-xs text-muted-foreground">
                                {new Date(session.startTime).toLocaleDateString()} - {session.duration} min planned
                            </span>
                        </Button>
                      ))}
                      {selectedPreviousSessionIdForReference && (
                         <div className="mt-4 p-3 border-t border-border/20 text-center text-muted-foreground text-xs">
                            Viewing details for the selected session is not yet implemented here.
                            You can <Link href={`/notes/${selectedPreviousSessionIdForReference}/viewer?subject=${encodeURIComponent(allSessionsForReference.find(s=>s.sessionId === selectedPreviousSessionIdForReference)?.subject || '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">open it in a new tab</Link>.
                         </div>
                      )}
                    </ScrollArea>
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
          onEndSession={handleAttemptEndSession}
          timerMode={timerMode}
          pomodoroCycle={pomodoroCycle}
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

