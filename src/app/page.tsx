
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/shared/app-header';
import { StudyStreakWidget } from '@/components/dashboard/study-streak-widget';
import { QuickActionsWidget } from '@/components/dashboard/quick-actions-widget';
import { AiAssistantBubble } from '@/components/ai-assistant/ai-assistant-bubble';
import { WidgetCard } from '@/components/dashboard/widget-card';
import { AddDeadlineDialog } from '@/components/dashboard/add-deadline-dialog';
import { AddTodoDialog } from '@/components/dashboard/add-todo-dialog';
import { DeadlineItem, type Deadline } from '@/components/dashboard/deadline-item';
import { TodoItem, type Todo } from '@/components/dashboard/todo-item';
import { Button } from '@/components/ui/button';
import { PlusCircle, CalendarClock, ListTodo, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SessionData } from '@/app/study/launch/page';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const MAX_DEADLINES = 7;

export default function DashboardPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [recentSessions, setRecentSessions] = useState<SessionData[]>([]);
  const [showAddDeadlineDialog, setShowAddDeadlineDialog] = useState(false);
  const [showAddTodoDialog, setShowAddTodoDialog] = useState(false);
  const [showDeadlineLimitAlert, setShowDeadlineLimitAlert] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load deadlines
    const storedDeadlines = localStorage.getItem('learnlog-deadlines');
    if (storedDeadlines) {
      setDeadlines(JSON.parse(storedDeadlines).sort((a: Deadline, b: Deadline) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    }
    // Load todos
    const storedTodos = localStorage.getItem('learnlog-todos');
    if (storedTodos) {
      setTodos(JSON.parse(storedTodos));
    }
    // Load recent sessions
    const sessionsIndexJSON = localStorage.getItem('learnlog-sessions-index');
    if (sessionsIndexJSON) {
      const sessionIds: string[] = JSON.parse(sessionsIndexJSON);
      const sessions: SessionData[] = sessionIds.map(id => {
        const sessionJSON = localStorage.getItem(`learnlog-session-${id}`);
        return sessionJSON ? JSON.parse(sessionJSON) : null;
      }).filter(session => session !== null) as SessionData[];
      setRecentSessions(sessions.slice(0, 3)); // Show top 3 recent sessions
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
      localStorage.setItem('learnlog-deadlines', JSON.stringify(updated));
      return updated;
    });
    toast({ title: "Deadline Added", description: `"${newDeadline.title}" successfully added.` });
  };

  const toggleDeadlineComplete = (id: string) => {
    setDeadlines(prev => {
      const updated = prev.map(d => d.id === id ? { ...d, completed: !d.completed } : d);
      localStorage.setItem('learnlog-deadlines', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteDeadline = (id: string) => {
    setDeadlines(prev => {
      const updated = prev.filter(d => d.id !== id);
      localStorage.setItem('learnlog-deadlines', JSON.stringify(updated));
      return updated;
    });
    toast({ title: "Deadline Removed", variant: "default" });
  };

  const handleAddTodo = (newTodo: Omit<Todo, 'id' | 'completed'>) => {
    const todoWithId: Todo = { ...newTodo, id: Date.now().toString(), completed: false };
    setTodos(prev => {
      const updated = [todoWithId, ...prev]; // Add to top
      localStorage.setItem('learnlog-todos', JSON.stringify(updated));
      return updated;
    });
    toast({ title: "To-Do Added", description: `"${newTodo.title}" added to your list.` });
  };

  const toggleTodoComplete = (id: string) => {
    setTodos(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      localStorage.setItem('learnlog-todos', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem('learnlog-todos', JSON.stringify(updated));
      return updated;
    });
    toast({ title: "To-Do Removed", variant: "default" });
  };

  return (
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground tracking-tight">
              Welcome to LearnLog
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
              <ScrollArea className="h-[180px] pr-3"> {/* Max height for scroll */}
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

            <WidgetCard title="To-Do List" className="md:col-span-2 lg:col-span-2" interactive={false}>
              <div className="flex justify-end mb-3 -mt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowAddTodoDialog(true)} className="text-primary hover:text-primary/80">
                  <PlusCircle className="h-4 w-4 mr-1" /> Add To-Do
                </Button>
              </div>
              {todos.length === 0 && (
                 <p className="text-sm text-muted-foreground text-center py-4">Your to-do list is empty. Add some tasks!</p>
              )}
              <ScrollArea className="h-[260px] pr-2"> {/* Max height for scroll */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {todos.map(todo => (
                      <TodoItem key={todo.id} todo={todo} onToggleComplete={toggleTodoComplete} onDelete={deleteTodo} />
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
