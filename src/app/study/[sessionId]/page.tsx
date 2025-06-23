
'use client';

import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SessionSidebar, type TreeNode, findNodeByIdRecursive } from '@/components/study/session-sidebar';
import { FloatingTimerWidget } from '@/components/study/floating-timer-widget';
import { Paperclip, Loader2, X, Brain, MessageSquare, Sparkles, FileText as FileTextIcon, AlertTriangle, Layers, History, HelpCircle, Link2, Map } from 'lucide-react';
import type { SessionData, TimerMode } from '@/app/study/launch/page';
import { processText, type ProcessTextInput } from '@/ai/flows/process-text-flow';
import { generateFlashcardsFlow, type GenerateFlashcardsInput, type GenerateFlashcardsOutput, type Flashcard } from '@/ai/flows/generate-flashcards-flow';
import { generateQuizFlow, type GenerateQuizInput, type GenerateQuizOutput, type QuizQuestion } from '@/ai/flows/generate-quiz-flow';
import { findNoteConnectionsFlow, type FindNoteConnectionsInput, type FindNoteConnectionsOutput, type ConnectionSuggestion } from '@/ai/flows/find-note-connections-flow';
import { useAuth } from '@/contexts/auth-context';
import { getSession, updateSession, getSessions, type SessionDocumentWithId } from '@/services/session-service';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FlashcardViewer } from '@/components/study/flashcard-viewer';
import { QuizTaker } from '@/components/study/quiz-taker';
import { Card, CardHeader as UiCardHeader, CardContent as UiCardContent, CardTitle as UiCardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AddPdfDialog } from '@/components/study/add-pdf-dialog';
import { GenerateMindmapDialog } from '@/components/study/generate-mindmap-dialog';
import { generateMindmapFlow } from '@/ai/flows/generate-mindmap-flow';


// Debounce utility
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout | null = null;
  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}

function findFirstNoteRecursive(nodes: TreeNode[]): TreeNode | null {
  for (const node of nodes) {
    if (node.type === 'note') return node;
    if (node.children) {
      const foundInChild = findFirstNoteRecursive(node.children);
      if (foundInChild) return foundInChild;
    }
  }
  return null;
}

async function getHistoricalNoteSnippets(userId: string, currentSessionId: string, maxSnippets = 10, snippetLength = 300): Promise<FindNoteConnectionsInput['historicalNotes']> {
  if (!userId) return [];
  const historicalNotes: FindNoteConnectionsInput['historicalNotes'] = [];
  try {
    const allSessions = await getSessions(userId);
    
    for (const session of allSessions) {
      if (session.id === currentSessionId) continue;
      if (historicalNotes.length >= maxSnippets) break;

      const { treeData, notesContent } = session;
      if (treeData && notesContent) {
        const extractSnippetsRecursive = (nodes: TreeNode[]) => {
          for (const node of nodes) {
            if (historicalNotes.length >= maxSnippets) return;
            if (node.type === 'note' && notesContent[node.id] && notesContent[node.id].trim().length > 50) { 
              historicalNotes.push({
                noteId: `${session.id}__${node.id}`,
                subject: session.subject,
                title: node.name,
                contentSnippet: notesContent[node.id].substring(0, snippetLength) + (notesContent[node.id].length > snippetLength ? '...' : ''),
              });
            }
            if (node.children) extractSnippetsRecursive(node.children);
          }
        };
        extractSnippetsRecursive(treeData);
      }
    }
  } catch (e) {
    console.error("Could not fetch historical sessions for connection analysis", e);
  }
  return historicalNotes;
}

function StudySessionPageContent() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { user } = useAuth();
  const { toast } = useToast();

  const [sessionData, setSessionData] = useState<SessionDocumentWithId | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [notesContent, setNotesContent] = useState<Record<string, string>>({});
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [currentNoteContent, setCurrentNoteContent] = useState('');
  
  const [referencePanelContent, setReferencePanelContent] = useState<'previous-notes' | 'pdf' | null>(null);
  const [isFetchingReference, setIsFetchingReference] = useState(false);
  const [historicalNotesForPanel, setHistoricalNotesForPanel] = useState<FindNoteConnectionsInput['historicalNotes']>([]);
  
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [parsedAiContent, setParsedAiContent] = useState<any>(null); 
  const [aiGeneratedContentType, setAiGeneratedContentType] = useState<'flashcards' | 'quiz' | 'connections' | null>(null);
  const [aiConnectionSuggestions, setAiConnectionSuggestions] = useState<ConnectionSuggestion[]>([]);

  const [sessionTime, setSessionTime] = useState(0); 
  const [isSessionRunning, setIsSessionRunning] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);
  const [showAddPdfDialog, setShowAddPdfDialog] = useState(false);
  const [temporaryPdfUrl, setTemporaryPdfUrl] = useState<string | null>(null);

  const [showMindmapDialog, setShowMindmapDialog] = useState(false);
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);
  const [generatedMindmap, setGeneratedMindmap] = useState<string | null>(null);


  // Debounced save functions for Firestore
  const saveTreeToFirestore = useCallback(debounce((newTree: TreeNode[]) => {
    if (sessionId) updateSession(sessionId, { treeData: newTree });
  }, 2000), [sessionId]);

  const saveNotesContentToFirestore = useCallback(debounce((content: Record<string, string>) => {
    if (sessionId) updateSession(sessionId, { notesContent: content });
  }, 1000), [sessionId]);
  
  const saveActualDurationToFirestore = useCallback((duration: number) => {
      if (sessionId) updateSession(sessionId, { actualDuration: duration });
  }, [sessionId]);

  // Effect to clean up temporary local PDF URL
  useEffect(() => {
    return () => {
      if (temporaryPdfUrl) {
        URL.revokeObjectURL(temporaryPdfUrl);
      }
    };
  }, [temporaryPdfUrl]);

  useEffect(() => {
    if (!sessionId || !user) {
        if (!user) router.push('/auth');
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    
    getSession(sessionId)
      .then(fetchedSessionData => {
        if (fetchedSessionData && fetchedSessionData.userId === user.uid) {
          setSessionData(fetchedSessionData);
          setTreeData(fetchedSessionData.treeData || []);
          setNotesContent(fetchedSessionData.notesContent || {});
          setSessionTime(fetchedSessionData.actualDuration || 0);

          const firstNote = findFirstNoteRecursive(fetchedSessionData.treeData || []);
          if (firstNote) {
            setActiveNoteId(firstNote.id);
            setCurrentNoteContent((fetchedSessionData.notesContent || {})[firstNote.id] || '');
          } else {
            setCurrentNoteContent('Select or create a note to begin.');
          }
        } else if (fetchedSessionData) {
            setError("You do not have permission to view this session.");
        } else {
            setError(`Session data not found for ID: ${sessionId}.`);
        }
      })
      .catch(err => {
        console.error("Error loading session data:", err);
        setError("Could not load session data. It might be corrupted or you may not have access.");
      })
      .finally(() => setIsLoading(false));

  }, [sessionId, user, router]);

  useEffect(() => {
    if (treeData.length > 0 && !isLoading) saveTreeToFirestore(treeData);
  }, [treeData, saveTreeToFirestore, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      if (activeNoteId && currentNoteContent !== (notesContent[activeNoteId] || '')) {
          const newNotesContent = { ...notesContent, [activeNoteId]: currentNoteContent };
          setNotesContent(newNotesContent);
          saveNotesContentToFirestore(newNotesContent);
      }
    }
  }, [currentNoteContent, activeNoteId, isLoading, notesContent, saveNotesContentToFirestore]);

  // Debounced version for periodic saves
  const debouncedSaveDuration = useCallback(debounce((duration: number) => {
    if (sessionId) updateSession(sessionId, { actualDuration: duration });
  }, 5000), [sessionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSessionRunning && !isLoading) {
      interval = setInterval(() => {
        setSessionTime(prevTime => {
          const newTime = prevTime + 1;
          debouncedSaveDuration(newTime);
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionRunning, isLoading, debouncedSaveDuration]);

  const toggleSessionRunning = () => setIsSessionRunning(prev => !prev);
  
  const confirmEndSession = () => {
    setIsSessionRunning(false);
    if (sessionId) {
      // Direct call to save final time immediately
      saveActualDurationToFirestore(sessionTime);
    }
    setShowEndSessionDialog(false);
    toast({ title: "Session Paused", description: `${sessionData?.subject || 'Session'} progress saved.`});
    router.push('/');
  };

  const handleNoteSelect = (nodeId: string, nodeType: TreeNode['type']) => {
    setActiveNoteId(nodeId);
    if (nodeType === 'note') {
      const content = notesContent[nodeId] || '';
      setCurrentNoteContent(content);
    } else {
      const selectedNode = findNodeByIdRecursive(treeData, nodeId);
      setCurrentNoteContent(`You've selected '${selectedNode?.name || 'an item'}'. Select a specific note to see its content.`);
    }
  };

  const addNodeToTree = (parentId: string | null, type: 'title' | 'subheading' | 'note', name: string) => {
    if (!name.trim()) return;
    const newNode: TreeNode = {
      id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: name.trim(), type, children: [], parentId: parentId,
    };
    if (type === 'note') {
      setNotesContent(prev => ({ ...prev, [newNode.id]: '' }));
    }
    const updateTreeRecursively = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) {
          return { ...node, children: [...(node.children || []), newNode] };
        }
        if (node.children) {
          return { ...node, children: updateTreeRecursively(node.children) };
        }
        return node;
      });
    };
    
    setTreeData(prevTree => {
        if (!parentId) { // Adding to root
             const rootNode = prevTree[0];
             if (rootNode) {
                 return [{ ...rootNode, children: [...(rootNode.children || []), newNode] }];
             }
             return prevTree;
        }
        return updateTreeRecursively(prevTree);
    });
  };
  
  const handleRenameNode = (nodeId: string, newName: string) => {
    if (!newName.trim()) return;
    const updateNameRecursively = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(node => {
            if (node.id === nodeId) {
                return { ...node, name: newName.trim() };
            }
            if (node.children) {
                return { ...node, children: updateNameRecursively(node.children) };
            }
            return node;
        });
    };
    setTreeData(prevTree => updateNameRecursively(prevTree));
  };
  
  const handleDeleteNode = () => {
    if (!nodeToDelete) return;

    let noteIdsToDelete: string[] = [];
    
    const findDescendantNoteIds = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.type === 'note') {
          noteIdsToDelete.push(node.id);
        }
        if (node.children) {
          findDescendantNoteIds(node.children);
        }
      }
    };

    const filterTreeRecursively = (nodes: TreeNode[], idToDelete: string): TreeNode[] => {
      return nodes.filter(node => {
        if (node.id === idToDelete) {
          if (node.type === 'note') {
            noteIdsToDelete.push(node.id);
          }
          if (node.children) {
            findDescendantNoteIds(node.children);
          }
          return false;
        }
        if (node.children) {
          node.children = filterTreeRecursively(node.children, idToDelete);
        }
        return true;
      });
    };

    setTreeData(prevTree => filterTreeRecursively([...prevTree], nodeToDelete));
    
    setNotesContent(prevNotes => {
      const newNotes = { ...prevNotes };
      noteIdsToDelete.forEach(id => {
        delete newNotes[id];
      });
      return newNotes;
    });

    if (activeNoteId === nodeToDelete || noteIdsToDelete.includes(activeNoteId || '')) {
      setActiveNoteId(null);
      setCurrentNoteContent("Select a note to view its content.");
    }
    
    setNodeToDelete(null);
    toast({ title: "Item Deleted", description: "The selected item and its contents have been removed." });
  };
  
  const handleAiAction = async (actionType: 'explain' | 'summarize' | 'expand') => {
    if (!activeNoteId || !currentNoteContent.trim()) return;
    setIsAiProcessing(true);
    try {
      const result = await processText({ action: actionType, text: currentNoteContent, context: sessionData?.subject });
      setCurrentNoteContent(prev => prev + `\n\n---\n**AI ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}:**\n${result.processedText}\n---`);
      toast({ title: "AI Action Successful" });
    } catch (error) {
      toast({ title: "AI Error", description: error instanceof Error ? error.message : "Could not process content.", variant: "destructive" });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!activeNoteId || !currentNoteContent.trim()) return;
    setIsAiProcessing(true);
    setParsedAiContent(null);
    try {
      const result = await generateFlashcardsFlow({ noteContent: currentNoteContent, subject: sessionData?.subject, numFlashcards: 10 });
      setParsedAiContent(result.flashcards);
      setAiGeneratedContentType('flashcards');
    } catch (error) {
      toast({ title: "Error", description: "Could not generate flashcards.", variant: "destructive"});
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleGenerateQuiz = async () => {
     if (!activeNoteId || !currentNoteContent.trim()) return;
    setIsAiProcessing(true);
    setParsedAiContent(null);
    try {
      const result = await generateQuizFlow({ noteContent: currentNoteContent, subject: sessionData?.subject, numQuestions: 5, quizType: 'mixed' });
      setParsedAiContent({ questions: result.questions, title: result.quizTitle || `${sessionData?.subject} Quiz` });
      setAiGeneratedContentType('quiz');
    } catch (error) {
      toast({ title: "Error", description: "Could not generate quiz.", variant: "destructive"});
    } finally {
      setIsAiProcessing(false);
    }
  };
  
  const handleFindConnections = async () => {
    if (!user || !activeNoteId || !currentNoteContent.trim()) return;
    setIsAiProcessing(true);
    setParsedAiContent(null);
    try {
      const historicalNotes = await getHistoricalNoteSnippets(user.uid, sessionId);
      if (historicalNotes.length === 0) {
        toast({title: "Not enough data", description: "No other notes found to create connections with.", variant: "default"});
        setIsAiProcessing(false);
        return;
      }
      const result = await findNoteConnectionsFlow({
        currentNoteId: activeNoteId,
        currentNoteContent: currentNoteContent,
        currentNoteSubject: sessionData?.subject,
        historicalNotes: historicalNotes,
      });
      setAiConnectionSuggestions(result.suggestions);
      setAiGeneratedContentType('connections');
    } catch (error) {
      toast({ title: "Error", description: "Could not find connections.", variant: "destructive"});
    } finally {
      setIsAiProcessing(false);
    }
  };
  
  const handleToggleReferencePanel = async (type: 'previous-notes' | 'pdf') => {
    if (referencePanelContent === type) {
      setReferencePanelContent(null);
      return;
    }

    setReferencePanelContent(type);

    if (type === 'previous-notes' && user) {
      setIsFetchingReference(true);
      try {
        const notes = await getHistoricalNoteSnippets(user.uid, sessionId);
        setHistoricalNotesForPanel(notes);
      } catch (e) {
        toast({ title: "Error", description: "Could not load previous notes.", variant: "destructive" });
        setReferencePanelContent(null);
      } finally {
        setIsFetchingReference(false);
      }
    }
  };

  const handleAttachUrl = async (url: string) => {
    if (!sessionId || !sessionData) return;
    try {
        if (temporaryPdfUrl) { // Clear local PDF if setting a permanent URL
          URL.revokeObjectURL(temporaryPdfUrl);
          setTemporaryPdfUrl(null);
        }
        await updateSession(sessionId, { pdfUrl: url });
        setSessionData(prev => prev ? { ...prev, pdfUrl: url } : null);
        toast({ title: "PDF Attached", description: "The PDF can now be viewed in the reference panel." });
        setReferencePanelContent('pdf');
        setShowAddPdfDialog(false);
    } catch (error) {
        console.error("Error setting PDF URL:", error);
        toast({ title: "Error", description: "Could not attach the PDF.", variant: "destructive" });
    }
  };
  
  const handleAttachLocalFile = (file: File) => {
    if (temporaryPdfUrl) {
        URL.revokeObjectURL(temporaryPdfUrl);
    }
    if (sessionData?.pdfUrl) {
      // Clear permanent URL visually for this session if a local file is loaded
      updateSession(sessionId, { pdfUrl: undefined }); // Also clear from DB
      setSessionData(prev => prev ? { ...prev, pdfUrl: undefined } : null);
    }
    const newUrl = URL.createObjectURL(file);
    setTemporaryPdfUrl(newUrl);
    setReferencePanelContent('pdf');
    setShowAddPdfDialog(false);
    toast({ title: "Local PDF Loaded", description: "This PDF is for temporary viewing and will not be saved." });
  };
  
  const handleGenerateMindmap = async (topic: string, details?: string) => {
    setIsGeneratingMindmap(true);
    setGeneratedMindmap(null);
    try {
        const result = await generateMindmapFlow({ topic, details });
        setGeneratedMindmap(result.markdownRepresentation);
    } catch(e) {
        console.error("Error generating mind map", e);
        toast({ title: "Mind Map Error", description: "Could not generate the mind map.", variant: "destructive" });
        setShowMindmapDialog(false);
    } finally {
        setIsGeneratingMindmap(false);
    }
  };

  const handleAddMindmapToNotes = (markdown: string) => {
    if (!activeNoteId) {
        toast({ title: "No Active Note", description: "Please select a note to add the mind map to.", variant: "destructive"});
        return;
    }
    setCurrentNoteContent(prev => prev + `\n\n## Mind Map: ${generatedMindmap?.split('\n')[0].replace(/- /g, '') || 'Topic'}\n\n${markdown}\n`);
    setShowMindmapDialog(false);
    setGeneratedMindmap(null);
    toast({ title: "Mind Map Added", description: "The generated mind map has been added to your current note." });
  };


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
  
  let saveStatus = 'Saved'; // Default to saved since writes are debounced
  
  const sidebarActiveNodeIdProp = activeNoteId;
  const pdfToDisplay = temporaryPdfUrl || (sessionData.pdfUrl ? `https://docs.google.com/gview?url=${encodeURIComponent(sessionData.pdfUrl)}&embedded=true` : null);


  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-foreground overflow-hidden">
      <AlertDialog open={showEndSessionDialog} onOpenChange={setShowEndSessionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Study Session?</AlertDialogTitle>
            <AlertDialogDescription>This will save your progress and return you to the dashboard. You can resume this session later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowEndSessionDialog(false)}>Continue Studying</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndSession} className="bg-primary hover:bg-primary/90">Save & Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={!!nodeToDelete} onOpenChange={(open) => !open && setNodeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the selected item and all of its content. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNodeToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNode} variant="destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!aiGeneratedContentType} onOpenChange={(open) => !open && setAiGeneratedContentType(null)}>
        <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl min-h-[70vh] flex flex-col p-0">
           <DialogHeader className="p-4 border-b border-border/20">
             <DialogTitle className="text-xl">
               {aiGeneratedContentType === 'flashcards' && 'AI Generated Flashcards'}
               {aiGeneratedContentType === 'quiz' && (parsedAiContent?.title || 'AI Generated Quiz')}
               {aiGeneratedContentType === 'connections' && 'AI Suggested Connections'}
             </DialogTitle>
             <DialogDescription>
                {aiGeneratedContentType === 'flashcards' && 'Review key concepts from your note.'}
                {aiGeneratedContentType === 'quiz' && 'Test your knowledge based on the current note.'}
                {aiGeneratedContentType === 'connections' && 'Discover links to your other study materials.'}
             </DialogDescription>
           </DialogHeader>
           
           <div className="flex-grow overflow-y-auto custom-scrollbar">
             {aiGeneratedContentType === 'flashcards' && <FlashcardViewer flashcards={parsedAiContent as Flashcard[]} />}
             {aiGeneratedContentType === 'quiz' && <QuizTaker questions={parsedAiContent.questions as QuizQuestion[]} quizTitle={parsedAiContent.title} />}
             {aiGeneratedContentType === 'connections' && (
               <div className="p-4 space-y-4">
                 {aiConnectionSuggestions.length > 0 ? aiConnectionSuggestions.map((suggestion, index) => {
                    const [connectionSessionId] = suggestion.connectedNoteId.split('__');
                    return (
                        <Card key={index} className="bg-muted/30 p-4 border-l-4 border-primary/70">
                          <UiCardHeader className="p-0 pb-2">
                            <UiCardTitle className="text-base md:text-lg">
                              <Link href={`/notes/${connectionSessionId}/viewer`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
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
           </div>
           
           <DialogFooter className="p-3 border-t border-border/20 mt-0">
             <Button variant="outline" onClick={() => setAiGeneratedContentType(null)}>Close</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AddPdfDialog
        open={showAddPdfDialog}
        onOpenChange={setShowAddPdfDialog}
        onSaveUrl={handleAttachUrl}
        onAttachLocalFile={handleAttachLocalFile}
        currentUrl={sessionData?.pdfUrl}
      />

      <GenerateMindmapDialog
          open={showMindmapDialog}
          onOpenChange={(isOpen) => {
              if (!isOpen) {
                  setGeneratedMindmap(null); // Reset on close
              }
              setShowMindmapDialog(isOpen);
          }}
          onGenerate={handleGenerateMindmap}
          onAddToNotes={handleAddMindmapToNotes}
          isLoading={isGeneratingMindmap}
          generatedMapMarkdown={generatedMindmap}
      />


      <div className="flex flex-1 overflow-hidden">
        <SessionSidebar 
            sessionSubject={sessionData.subject || 'Session'} 
            treeData={treeData} 
            onSelectNode={handleNoteSelect} 
            activeNodeId={sidebarActiveNodeIdProp} 
            onAddNode={addNodeToTree} 
            onRenameNode={handleRenameNode}
            onDeleteNode={(nodeId) => setNodeToDelete(nodeId)}
        />
        <main className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto relative custom-scrollbar bg-[#0A0A0A]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground truncate max-w-[calc(100%-400px)]">
                {sessionData.subject} {activeNoteId && currentActiveNode ? `/ ${currentActiveNode.name}` : ''}
            </div>
             <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setShowMindmapDialog(true)} className="hover:bg-primary/10">
                    <Map className="h-4 w-4 mr-2" />
                    Mind Map
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleToggleReferencePanel('previous-notes')} className="hover:bg-primary/10">
                    <History className="h-4 w-4 mr-2" />
                    Previous Notes
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleToggleReferencePanel('pdf')} className="hover:bg-primary/10">
                    <Paperclip className="h-4 w-4 mr-2" />
                    {pdfToDisplay ? 'View PDF' : 'Attach PDF'}
                </Button>
            </div>
          </div>
          <div className="flex flex-1 gap-4 min-h-0">
            <div className="relative flex-1 h-full flex flex-col bg-[#0F0F0F] rounded-lg border border-white/10 shadow-inner">
              <Textarea 
                placeholder={isEditorActive ? "Start typing your notes here..." : "Select a note from the sidebar to begin editing, or create a new one."}
                className="w-full flex-1 bg-transparent border-none rounded-t-md p-6 text-base resize-none focus:ring-0 focus:border-transparent font-code custom-scrollbar"
                value={isEditorActive ? currentNoteContent : ''}
                onChange={(e) => setCurrentNoteContent(e.target.value)}
                disabled={!isEditorActive || isAiProcessing}
              />
              {isEditorActive && (
                <div className="flex items-center justify-end space-x-1 p-2 border-t border-white/10 rounded-b-md bg-[#0F0F0F]">
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
            
            {referencePanelContent === 'previous-notes' && (
              <div className="w-[35%] max-w-[500px] h-full bg-[#0F0F0F] border border-white/10 p-0 rounded-lg flex flex-col overflow-hidden custom-scrollbar shadow-lg animate-slide-in-from-right">
                <div className="flex items-center justify-between p-2 border-b border-white/10">
                  <h3 className="text-base font-semibold ml-2">
                    Previous Notes
                  </h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setReferencePanelContent(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-3">
                    {isFetchingReference && (
                      <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                    {!isFetchingReference && (
                      <div className="space-y-3">
                        {historicalNotesForPanel.length > 0 ? (
                          historicalNotesForPanel.map(note => {
                            const [noteSessionId] = note.noteId.split('__');
                            return (
                              <div key={note.noteId} className="p-2.5 bg-white/5 rounded-md border border-white/10 hover:border-primary/50 transition-colors">
                                <Link href={`/notes/${noteSessionId}/viewer?subject=${encodeURIComponent(note.subject || '')}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-primary hover:underline">{note.title}</Link>
                                <p className="text-xs text-muted-foreground mt-0.5">{note.subject}</p>
                                <p className="text-xs text-foreground/80 mt-1.5 line-clamp-3">{note.contentSnippet}</p>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-center text-muted-foreground p-4">No previous relevant notes found.</p>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            {referencePanelContent === 'pdf' && (
              <div className="w-[35%] max-w-[500px] h-full bg-[#0F0F0F] border border-white/10 p-0 rounded-lg flex flex-col overflow-hidden custom-scrollbar shadow-lg animate-slide-in-from-right">
                <div className="flex items-center justify-between p-2 border-b border-white/10">
                  <h3 className="text-base font-semibold ml-2">
                    PDF Reference
                  </h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setReferencePanelContent(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 flex flex-col">
                  {pdfToDisplay ? (
                    <>
                      <div className="p-2 border-b border-white/10 flex items-center justify-between">
                        <div>
                          <Button variant="link" size="sm" onClick={() => setShowAddPdfDialog(true)}>
                              {sessionData.pdfUrl ? 'Change URL' : 'Change File'}
                          </Button>
                          {sessionData.pdfUrl &&
                            <Button variant="link" size="sm" asChild>
                                <a href={sessionData.pdfUrl} target="_blank" rel="noopener noreferrer">
                                    Open in new tab
                                </a>
                            </Button>
                          }
                        </div>
                      </div>
                      {sessionData.pdfUrl && <p className="text-xs text-muted-foreground px-3 py-1 bg-background/50">Note: PDF must be publicly accessible to be viewed here.</p>}
                      <iframe
                        key={pdfToDisplay}
                        src={pdfToDisplay}
                        title="PDF Viewer"
                        className="w-full h-full border-0 flex-1"
                      />
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                        <FileTextIcon className="h-12 w-12 mb-4 opacity-50" />
                        <p className="font-semibold text-lg">No PDF Attached</p>
                        <p className="text-sm mt-2 mb-4">Attach a PDF from a URL or your computer to view it.</p>
                        <Button onClick={() => setShowAddPdfDialog(true)}>Attach PDF</Button>
                    </div>
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
      <FloatingTimerWidget timeInSeconds={sessionTime} isRunning={isSessionRunning} onTogglePlayPause={toggleSessionRunning} onEndSession={() => setShowEndSessionDialog(true)} timerMode={sessionData.timerMode as TimerMode} pomodoroCycle={sessionData.pomodoroCycle} />
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
