
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/shared/app-header';
import { StudyStreakWidget } from '@/components/dashboard/study-streak-widget';
import { QuickActionsWidget } from '@/components/dashboard/quick-actions-widget';
import { AiAssistantBubble } from '@/components/ai-assistant/ai-assistant-bubble';
import { WidgetCard } from '@/components/dashboard/widget-card';
import { AddDeadlineDialog } from '@/components/dashboard/add-deadline-dialog';
import { AddTodoDialog } from '@/components/dashboard/add-todo-dialog';
import { AddLinkDialog } from '@/components/dashboard/add-link-dialog';
import { LinkProcessingResultDialog } from '@/components/dashboard/link-processing-result-dialog';
import { DeadlineItem, type Deadline } from '@/components/dashboard/deadline-item';
import { TodoItem, type Todo } from '@/components/dashboard/todo-item';
import { SavedLinkItem, type SavedLink } from '@/components/dashboard/saved-link-item';
import { Button } from '@/components/ui/button';
import { PlusCircle, CalendarClock, ListTodo, BookOpen, LinkIcon, Loader2, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SessionData } from '@/app/study/launch/page';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { processUrlFlow, type ProcessUrlInput, type ProcessUrlOutput } from '@/ai/flows/process-url-flow';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth
import { getTodos, addTodo as addTodoService, updateTodo as updateTodoService, deleteTodo as deleteTodoService, type TodoDocument } from '@/services/todo-service'; // Import todo services

const MAX_DEADLINES = 7;

export default function DashboardPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth(); // Get user from AuthContext
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]); // This will now be populated from Firestore
  const [recentSessions, setRecentSessions] = useState<SessionData[]>([]);
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);

  const [showAddDeadlineDialog, setShowAddDeadlineDialog] = useState(false);
  const [showAddTodoDialog, setShowAddTodoDialog] = useState(false);
  const [showAddLinkDialog, setShowAddLinkDialog] = useState(false);
  const [showLinkProcessingResultDialog, setShowLinkProcessingResultDialog] = useState(false);
  const [currentLinkProcessingResult, setCurrentLinkProcessingResult] = useState<ProcessUrlOutput | null>(null);
  const [isProcessingLink, setIsProcessingLink] = useState(false);
  const [isTodosLoading, setIsTodosLoading] = useState(true);

  const [showDeadlineLimitAlert, setShowDeadlineLimitAlert] = useState(false);
  const { toast } = useToast();

  // Fetch Todos from Firestore when user is available
  useEffect(() => {
    if (user) {
      setIsTodosLoading(true);
      getTodos(user.uid)
        .then(firestoreTodos => {
          setTodos(firestoreTodos.map(ft => ({ ...ft, id: ft.id } as Todo))); // Adapt if Firestore structure differs
        })
        .catch(error => {
          console.error("Failed to fetch todos:", error);
          toast({ title: "Error", description: "Could not load your to-do list.", variant: "destructive" });
        })
        .finally(() => setIsTodosLoading(false));
    } else {
      setTodos([]); // Clear todos if no user
      setIsTodosLoading(false);
    }
  }, [user, toast]);


  useEffect(() => {
    // Load deadlines (still from localStorage for now, can be migrated later)
    const storedDeadlines = localStorage.getItem('learnlog-deadlines');
    if (storedDeadlines) {
      setDeadlines(JSON.parse(storedDeadlines).sort((a: Deadline, b: Deadline) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    }
    // Load recent sessions (still from localStorage)
    const sessionsIndexJSON = localStorage.getItem('learnlog-sessions-index');
    if (sessionsIndexJSON) {
      const sessionIds: string[] = JSON.parse(sessionsIndexJSON);
      const sessions: SessionData[] = sessionIds.map(id => {
        const sessionJSON = localStorage.getItem(`learnlog-session-${id}`);
        return sessionJSON ? JSON.parse(sessionJSON) : null;
      }).filter(session => session !== null) as SessionData[];
      setRecentSessions(sessions.slice(0, 3));
    }
    // Load saved links (still from localStorage)
    const storedLinks = localStorage.getItem('learnlog-saved-links');
    if (storedLinks) {
      setSavedLinks(JSON.parse(storedLinks));
    }
  }, []);

  const handleAddDeadline = (newDeadline: Omit<Deadline, 'id' | 'completed'>) => {
    if (deadlines.filter(d => !d.completed).length >= MAX_DEADLINES) {
      setShowDeadlineLimitAlert(true);
      return;
    }
    const deadlineWithId: Deadline = { ...newDeadline, id: Date.now().toString(), completed: false };
    setDeadlines(prev => {
      const updated = [...prev, deadlineWithId].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      localStorage.setItem('learnlog-deadlines', JSON.stringify(updated)); // Keep in LS for now
      return updated;
    });
    toast({ title: "Deadline Added", description: `"${newDeadline.title}" successfully added.` });
  };

  const toggleDeadlineComplete = (id: string) => {
    setDeadlines(prev => {
      const updated = prev.map(d => d.id === id ? { ...d, completed: !d.completed } : d);
      localStorage.setItem('learnlog-deadlines', JSON.stringify(updated)); // Keep in LS for now
      return updated;
    });
  };

  const deleteDeadline = (id: string) => {
    setDeadlines(prev => {
      const updated = prev.filter(d => d.id !== id);
      localStorage.setItem('learnlog-deadlines', JSON.stringify(updated)); // Keep in LS for now
      return updated;
    });
    toast({ title: "Deadline Removed", variant: "default" });
  };

  // Updated To-Do Handlers
  const handleAddTodo = async (newTodoData: Omit<Todo, 'id' | 'completed'>) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be signed in to add a to-do.", variant: "destructive" });
      return;
    }
    try {
      const newTodoId = await addTodoService(user.uid, newTodoData);
      const newTodo: Todo = { ...newTodoData, id: newTodoId, completed: false };
      setTodos(prev => [newTodo, ...prev]);
      toast({ title: "To-Do Added", description: `"${newTodo.title}" added to your list.` });
    } catch (error) {
      console.error("Failed to add todo:", error);
      toast({ title: "Error", description: "Could not add to-do. Please try again.", variant: "destructive" });
    }
  };

  const toggleTodoComplete = async (id: string) => {
    if (!user) return;
    const todoToToggle = todos.find(t => t.id === id);
    if (!todoToToggle) return;

    const newCompletedStatus = !todoToToggle.completed;
    try {
      await updateTodoService(id, { completed: newCompletedStatus });
      setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: newCompletedStatus } : t));
    } catch (error) {
      console.error("Failed to toggle todo:", error);
      toast({ title: "Error", description: "Could not update to-do status.", variant: "destructive" });
    }
  };

  const deleteTodo = async (id: string) => {
    if (!user) return;
    try {
      await deleteTodoService(id);
      setTodos(prev => prev.filter(t => t.id !== id));
      toast({ title: "To-Do Removed", variant: "default" });
    } catch (error) {
      console.error("Failed to delete todo:", error);
      toast({ title: "Error", description: "Could not remove to-do.", variant: "destructive" });
    }
  };


  const handleAddLink = (newLink: Omit<SavedLink, 'id'>) => {
    const linkWithId: SavedLink = { ...newLink, id: Date.now().toString() };
    setSavedLinks(prev => {
      const updated = [linkWithId, ...prev];
      localStorage.setItem('learnlog-saved-links', JSON.stringify(updated));
      return updated;
    });
    toast({ title: "Link Saved", description: `"${newLink.title}" added to your links.` });
  };

  const deleteSavedLink = (id: string) => {
    setSavedLinks(prev => {
      const updated = prev.filter(link => link.id !== id);
      localStorage.setItem('learnlog-saved-links', JSON.stringify(updated));
      return updated;
    });
    toast({ title: "Link Removed", variant: "default" });
  };

  const handleProcessSavedLink = async (url: string) => {
    setIsProcessingLink(true);
    setCurrentLinkProcessingResult(null);
    try {
      const result = await processUrlFlow({ url });
      setCurrentLinkProcessingResult(result);
      setShowLinkProcessingResultDialog(true);
      if (result.error) {
        toast({ title: "Link Processing Error", description: result.summary || result.error, variant: "destructive" });
      } else {
        toast({ title: "Link Processed", description: "Summary and notes generated." });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process link.";
      toast({ title: "Processing Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsProcessingLink(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <Sparkles className="h-20 w-20 text-primary mb-6" />
          <h1 className="text-3xl font-bold mb-3">Welcome to LearnLog</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Please sign in with Google to access your personalized dashboard and track your learning journey.
          </p>
          <Button onClick={signInWithGoogle} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <LogIn className="mr-2 h-5 w-5" /> Sign In with Google
          </Button>
        </main>
      </div>
    );
  }

  return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground tracking-tight">
              Welcome back, {user.displayName?.split(' ')[0] || 'Learner'}!
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Your space for focused learning and peak productivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StudyStreakWidget />
            <QuickActionsWidget />
            
            <WidgetCard title="Upcoming Deadlines" className="lg:col-span-1" interactive={false}>
              <div className="flex justify-end mb-3 -mt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddDeadlineDialog(true)} className="text-primary hover:text-primary/80">
                  <PlusCircle className="h-4 w-4 mr-1" /> Add Deadline
                </Button>
              </div>
              {deadlines.filter(d => !d.completed).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming deadlines. Enjoy the peace!</p>
              )}
              <ScrollArea className="h-[180px] pr-3">
                <ul className="space-y-3">
                  {deadlines.filter(d => !d.completed).map(item => (
                    <DeadlineItem key={item.id} deadline={item} onToggleComplete={toggleDeadlineComplete} onDelete={deleteDeadline} />
                  ))}
                </ul>
              </ScrollArea>
               {deadlines.filter(d => d.completed).length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground mt-4 mb-2 pl-1">Completed:</p>
                  <ScrollArea className="h-[80px] pr-3">
                     <ul className="space-y-2">
                      {deadlines.filter(d => d.completed).map(item => (
                        <DeadlineItem key={item.id} deadline={item} onToggleComplete={toggleDeadlineComplete} onDelete={deleteDeadline} />
                      ))}
                    </ul>
                  </ScrollArea>
                </>
              )}
            </WidgetCard>

            <WidgetCard title="To-Do List" className="md:col-span-2 lg:col-span-1" interactive={false}>
              <div className="flex justify-end mb-3 -mt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddTodoDialog(true)} className="text-primary hover:text-primary/80">
                  <PlusCircle className="h-4 w-4 mr-1" /> Add To-Do
                </Button>
              </div>
              {isTodosLoading && (
                <div className="flex justify-center items-center h-[260px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                </div>
              )}
              {!isTodosLoading && todos.length === 0 && (
                 <p className="text-sm text-muted-foreground text-center py-4">Your to-do list is empty. Add some tasks!</p>
              )}
              {!isTodosLoading && todos.length > 0 && (
                <ScrollArea className="h-[260px] pr-2">
                  <div className="grid grid-cols-1 gap-3">
                      {todos.map(todo => (
                        <TodoItem key={todo.id} todo={todo} onToggleComplete={toggleTodoComplete} onDelete={deleteTodo} />
                      ))}
                    </div>
                </ScrollArea>
              )}
            </WidgetCard>
            
            <WidgetCard title="Saved Links" className="md:col-span-2 lg:col-span-1" interactive={false}>
              <div className="flex justify-end mb-3 -mt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddLinkDialog(true)} className="text-primary hover:text-primary/80">
                  <PlusCircle className="h-4 w-4 mr-1" /> Add Link
                </Button>
              </div>
              {savedLinks.length === 0 && (
                 <p className="text-sm text-muted-foreground text-center py-4">No links saved yet. Add some for later reading or processing!</p>
              )}
              <ScrollArea className="h-[260px] pr-2">
                 <div className="grid grid-cols-1 gap-3">
                    {savedLinks.map(link => (
                      <SavedLinkItem 
                        key={link.id} 
                        link={link} 
                        onProcessLink={handleProcessSavedLink} 
                        onDelete={deleteSavedLink} 
                        isProcessing={isProcessingLink}
                      />
                    ))}
                  </div>
              </ScrollArea>
            </WidgetCard>


            <WidgetCard title="Recent Study Sessions" className="lg:col-span-3" interactive={false}>
               {recentSessions.length === 0 && (
                 <p className="text-sm text-muted-foreground text-center py-4">No recent study sessions recorded yet.</p>
               )}
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {recentSessions.map(session => (
                  <Link key={session.sessionId} href={`/notes/${session.sessionId}/viewer?subject=${encodeURIComponent(session.subject)}`} passHref>
                    <div className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/10 flex flex-col h-full">
                        <div className="flex items-center mb-1">
                            <BookOpen className="h-4 w-4 mr-2 text-primary/70 shrink-0"/>
                            <h4 className="font-semibold text-foreground/90 truncate flex-1" title={session.subject}>{session.subject}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-auto">
                            {new Date(session.startTime).toLocaleDateString()}
                        </p>
                    </div>
                  </Link>
                ))}
               </div>
            </WidgetCard>
          </div>
        </main>
        <AiAssistantBubble />
        {showAddDeadlineDialog && <AddDeadlineDialog open={showAddDeadlineDialog} onOpenChange={setShowAddDeadlineDialog} onAddDeadline={handleAddDeadline} />}
        {showAddTodoDialog && <AddTodoDialog open={showAddTodoDialog} onOpenChange={setShowAddTodoDialog} onAddTodo={handleAddTodo} />}
        {showAddLinkDialog && <AddLinkDialog open={showAddLinkDialog} onOpenChange={setShowAddLinkDialog} onAddLink={handleAddLink} />}
        {showLinkProcessingResultDialog && currentLinkProcessingResult && (
          <LinkProcessingResultDialog 
            open={showLinkProcessingResultDialog} 
            onOpenChange={setShowLinkProcessingResultDialog} 
            summary={currentLinkProcessingResult.summary}
            structuredNotes={currentLinkProcessingResult.structuredNotes}
            error={currentLinkProcessingResult.error}
          />
        )}

        <AlertDialog open={showDeadlineLimitAlert} onOpenChange={setShowDeadlineLimitAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Deadline Limit Reached</AlertDialogTitle>
                <AlertDialogDescription>
                    You can have a maximum of {MAX_DEADLINES} active deadlines. Please complete or remove existing ones to add more.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShowDeadlineLimitAlert(false)}>OK</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}
