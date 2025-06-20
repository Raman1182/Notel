
'use client';

import type { NextPage } from 'next';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/shared/app-header';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar'; // Renamed to avoid conflict
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AddDeadlineDialog } from '@/components/dashboard/add-deadline-dialog';
import type { Deadline } from '@/components/dashboard/deadline-item';
import { PlusCircle, CalendarDays, ListFilter, ChevronLeft, ChevronRight, BadgeCheck, GripHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MAX_DEADLINES_CALENDAR_POPOVER = 5;

const CalendarPage: NextPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [showAddDeadlineDialog, setShowAddDeadlineDialog] = useState(false);
  const [selectedDateForPopover, setSelectedDateForPopover] = useState<Date | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    const storedDeadlines = localStorage.getItem('learnlog-deadlines');
    if (storedDeadlines) {
      const parsedDeadlines: Deadline[] = JSON.parse(storedDeadlines);
      setDeadlines(parsedDeadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    }
  }, []);

  const handleAddDeadline = (newDeadline: Omit<Deadline, 'id' | 'completed'>) => {
    // Max deadline limit is handled in dashboard, but could be checked here too if needed.
    const deadlineWithId: Deadline = { ...newDeadline, id: Date.now().toString(), completed: false };
    setDeadlines(prev => {
      const updated = [...prev, deadlineWithId].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      localStorage.setItem('learnlog-deadlines', JSON.stringify(updated));
      return updated;
    });
    toast({ title: "Deadline Added", description: `"${newDeadline.title}" added.` });
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

  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, Deadline[]>();
    deadlines.forEach(deadline => {
      const dateStr = format(parseISO(deadline.dueDate), 'yyyy-MM-dd');
      const existing = map.get(dateStr) || [];
      map.set(dateStr, [...existing, deadline]);
    });
    return map;
  }, [deadlines]);

  const daysInMonthWithDeadlines = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end }).map(day => ({
      date: day,
      deadlines: deadlinesByDate.get(format(day, 'yyyy-MM-dd')) || [],
    }));
  }, [currentMonth, deadlinesByDate]);

  const DayCellContent = ({ date, deadlinesForDay }: { date: Date, deadlinesForDay: Deadline[] }) => {
    const dayNumber = format(date, 'd');
    const hasPendingDeadlines = deadlinesForDay.some(d => !d.completed);
    const allCompleted = deadlinesForDay.length > 0 && deadlinesForDay.every(d => d.completed);
  
    return (
      <div className="flex flex-col h-full p-1.5 items-center justify-start relative">
        <span className={`absolute top-1.5 right-1.5 text-xs ${isSameDay(date, new Date()) ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
          {dayNumber}
        </span>
        {deadlinesForDay.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1 justify-center items-center">
            {hasPendingDeadlines && <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" title="Pending deadline"></div>}
            {allCompleted && <BadgeCheck className="h-3 w-3 text-green-500" title="All deadlines completed"/>}
            {!hasPendingDeadlines && !allCompleted && deadlinesForDay.length > 0 && <div className="h-2 w-2 rounded-full bg-muted-foreground/50" title="Deadline exists"></div> }
          </div>
        )}
         {deadlinesForDay.length > 2 && (
          <span className="text-[10px] text-primary/70 mt-0.5">+{deadlinesForDay.length - (hasPendingDeadlines ? 1:0) - (allCompleted ? 1:0) } more</span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
            <div>
                <nav className="text-sm text-muted-foreground mb-1">
                    <Link href="/" className="hover:text-primary">Home</Link>
                    {' / '}
                    <span>Study Calendar</span>
                </nav>
                <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground tracking-tight">
                    Study Calendar
                </h1>
            </div>
            <Button onClick={() => setShowAddDeadlineDialog(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <PlusCircle className="mr-2 h-5 w-5" /> Add Deadline
            </Button>
        </div>

        <Card className="bg-card border-border shadow-lg">
            <CardHeader className="border-b border-border/20 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <h2 className="text-xl font-semibold text-center min-w-[180px]">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h2>
                        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                    <Button variant="ghost" onClick={() => setCurrentMonth(new Date())} className="text-primary hover:text-primary">
                        Today
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ShadcnCalendar
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    selected={selectedDateForPopover}
                    onSelect={(date) => {
                        if (date) {
                            setSelectedDateForPopover(date);
                            setIsPopoverOpen(true);
                        } else {
                            setSelectedDateForPopover(null);
                            setIsPopoverOpen(false);
                        }
                    }}
                    className="!p-2 sm:!p-3 md:!p-4 w-full [&_table]:w-full [&_table]:border-collapse"
                    classNames={{
                        table: "w-full border-collapse",
                        head_row: "flex",
                        head_cell: "w-1/7 text-muted-foreground rounded-md font-normal text-[0.8rem] p-2 text-center",
                        row: "flex w-full mt-0.5",
                        cell: `h-20 sm:h-24 md:h-28 w-1/7 text-center text-sm p-0 relative rounded-md border border-transparent
                               focus-within:relative focus-within:z-20 
                               hover:border-primary/30 hover:bg-accent/50 transition-colors duration-150
                               data-[selected=true]:bg-primary/10 data-[selected=true]:border-primary`,
                        day: "h-full w-full p-1 focus:relative focus:z-20 cursor-pointer flex flex-col items-center justify-start",
                        day_today: "bg-accent/30 border-primary/50",
                        day_selected: "bg-primary/20 !border-primary text-primary-foreground",
                        day_disabled: "text-muted-foreground/50 opacity-50 cursor-not-allowed",
                        day_outside: "text-muted-foreground/50 opacity-70",
                        caption_label: "text-xl font-bold",
                        nav_button: "h-8 w-8",
                    }}
                    components={{
                      DayContent: ({ date, activeModifiers }) => {
                         const formattedDateKey = format(date, 'yyyy-MM-dd');
                         const deadlinesForDay = deadlinesByDate.get(formattedDateKey) || [];
                         return (
                            <Popover
                                open={isPopoverOpen && selectedDateForPopover && isSameDay(date, selectedDateForPopover)}
                                onOpenChange={(open) => {
                                    if (selectedDateForPopover && isSameDay(date, selectedDateForPopover)) {
                                      setIsPopoverOpen(open);
                                      if (!open) setSelectedDateForPopover(null);
                                    }
                                }}
                            >
                                <PopoverTrigger asChild className="w-full h-full">
                                    <div 
                                        role="button" 
                                        tabIndex={0} 
                                        className="w-full h-full" 
                                        onClickCapture={(e) => {
                                            // Prevent ShadcnCalendar's onSelect if clicking on existing content
                                            if ((e.target as HTMLElement).closest('.deadline-item-in-popover')) {
                                               e.stopPropagation();
                                               return;
                                            }
                                            setSelectedDateForPopover(date);
                                            setIsPopoverOpen(true);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                setSelectedDateForPopover(date);
                                                setIsPopoverOpen(true);
                                            }
                                        }}
                                        aria-label={`View deadlines for ${format(date, 'PPP')}`}
                                    >
                                      <DayCellContent date={date} deadlinesForDay={deadlinesForDay} />
                                    </div>
                                </PopoverTrigger>
                                {deadlinesForDay.length > 0 && (
                                <PopoverContent className="w-80 z-50" align="start" side="bottom">
                                    <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">
                                        Deadlines for {format(date, 'MMMM d, yyyy')}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                        Manage your tasks for this day.
                                        </p>
                                    </div>
                                    <ScrollArea className="max-h-[200px] pr-3">
                                      <div className="grid gap-2">
                                          {deadlinesForDay.slice(0, MAX_DEADLINES_CALENDAR_POPOVER).map((deadline) => (
                                          <div key={deadline.id} className="deadline-item-in-popover text-sm p-2 bg-muted/50 rounded-md">
                                              <p className={`font-medium ${deadline.completed ? 'line-through text-muted-foreground' : ''}`}>{deadline.title}</p>
                                          </div>
                                          ))}
                                          {deadlinesForDay.length > MAX_DEADLINES_CALENDAR_POPOVER && (
                                              <p className="text-xs text-muted-foreground text-center mt-1">
                                                  + {deadlinesForDay.length - MAX_DEADLINES_CALENDAR_POPOVER} more...
                                              </p>
                                          )}
                                      </div>
                                    </ScrollArea>
                                    <Button onClick={() => { setIsPopoverOpen(false); router.push(`/?date=${format(date, 'yyyy-MM-dd')}`); }} size="sm">
                                        View All / Edit on Dashboard
                                    </Button>
                                    </div>
                                </PopoverContent>
                                )}
                            </Popover>
                         );
                      }
                    }}
                />
            </CardContent>
        </Card>
      </main>
      {showAddDeadlineDialog && <AddDeadlineDialog open={showAddDeadlineDialog} onOpenChange={setShowAddDeadlineDialog} onAddDeadline={handleAddDeadline} />}
    </div>
  );
};

export default CalendarPage;

// Helper hook for router, as it's client component
import { useRouter } from 'next/navigation';
function CalendarPageWithRouter() {
    const router = useRouter();
    return <CalendarPage router={router} />;
}
// This is a bit of a hack for the DayContent popover interaction with router
// A better way would be to pass router explicitly or use context if this page grows.
// For now, adding router to props of CalendarPage.

interface CalendarPageProps {
  router: ReturnType<typeof useRouter>;
}


