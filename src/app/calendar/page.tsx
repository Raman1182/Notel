
'use client';

import type { NextPage } from 'next';
import { useState, useEffect, useMemo, useRef } from 'react'; // Added useRef
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/shared/app-header';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AddDeadlineDialog } from '@/components/dashboard/add-deadline-dialog';
import type { Deadline } from '@/components/dashboard/deadline-item';
import { PlusCircle, CalendarDays, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';


const DayCellInternalContent = ({ date, deadlinesForDay }: { date: Date, deadlinesForDay: Deadline[] }) => {
  const dayNumber = format(date, 'd');
  const hasPendingDeadlines = deadlinesForDay.some(d => !d.completed);
  const allCompleted = deadlinesForDay.length > 0 && deadlinesForDay.every(d => d.completed);

  return (
    <div className="flex flex-col h-full p-1 items-center justify-start relative w-full">
      <span className={cn(
        "absolute top-1.5 right-1.5 text-xs font-medium", // Made font slightly bolder
        isSameDay(date, new Date()) ? 'text-primary' : 'text-muted-foreground'
      )}>
        {dayNumber}
      </span>
      {deadlinesForDay.length > 0 && (
        <div className="mt-6 flex flex-col items-center justify-center gap-0.5"> {/* Adjusted mt */}
          {hasPendingDeadlines && <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" title="Pending deadline"></div>}
          {allCompleted && <BadgeCheck className="h-3 w-3 text-green-500" title="All deadlines completed"/>}
          {!hasPendingDeadlines && !allCompleted && deadlinesForDay.length > 0 && <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" title="Deadline exists"></div> }
          
          {/* Simplified "+N more" logic for small cells */}
          {deadlinesForDay.length > 1 && (hasPendingDeadlines || allCompleted) && (
            <span className="text-[9px] text-primary/80 mt-0.5">
              +{deadlinesForDay.length - (hasPendingDeadlines || allCompleted ? 1 : 0)}
            </span>
          )}
           {deadlinesForDay.length > 2 && !hasPendingDeadlines && !allCompleted && (
             <span className="text-[9px] text-primary/80 mt-0.5">+{deadlinesForDay.length}</span>
           )}
        </div>
      )}
    </div>
  );
};


const CalendarPage: NextPage = () => {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [showAddDeadlineDialog, setShowAddDeadlineDialog] = useState(false);
  
  const { toast } = useToast();

  // State for hover popover management, one per calendar for simplicity
  // The actual open state will be managed within each DayContent instance.
  // This is more of a placeholder if global control was needed, but we'll go local.

  useEffect(() => {
    const storedDeadlines = localStorage.getItem('learnlog-deadlines');
    if (storedDeadlines) {
      const parsedDeadlines: Deadline[] = JSON.parse(storedDeadlines);
      setDeadlines(parsedDeadlines.sort((a, b) => {
        const dateDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        return (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
      }));
    }
  }, []);

  const handleAddDeadline = (newDeadline: Omit<Deadline, 'id' | 'completed'>) => {
    const deadlineWithId: Deadline = { ...newDeadline, id: Date.now().toString(), completed: false };
    setDeadlines(prev => {
      const updated = [...prev, deadlineWithId].sort((a, b) => {
        const dateDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        return (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
      });
      localStorage.setItem('learnlog-deadlines', JSON.stringify(updated));
      return updated;
    });
    toast({ title: "Deadline Added", description: `"${newDeadline.title}" added.` });
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
                    // selected and onSelect are not used for hover popover control
                    className="!p-2 sm:!p-3 md:!p-4 w-full [&_table]:w-full [&_table]:border-collapse"
                    classNames={{
                        table: "w-full border-collapse",
                        head_row: "flex",
                        head_cell: "w-1/7 text-muted-foreground rounded-md font-normal text-[0.8rem] p-2 text-center",
                        row: "flex w-full mt-0.5", // Reduced mt for tighter rows
                        cell: cn(`h-24 w-1/7 text-center text-sm p-0 relative rounded-md border border-transparent
                               focus-within:relative focus-within:z-20 
                               hover:border-primary/30 hover:bg-accent/50 transition-colors duration-150`
                        ),
                        day: "h-full w-full p-0 focus:relative focus:z-20 cursor-pointer flex flex-col items-center justify-start", // p-0 for day
                        day_today: "bg-accent/30 border-primary/50",
                        day_selected: "bg-primary/20 !border-primary text-primary-foreground",
                        day_disabled: "text-muted-foreground/50 opacity-50 cursor-not-allowed",
                        day_outside: "text-muted-foreground/50 opacity-70",
                        caption_label: "text-xl font-bold",
                        nav_button: "h-8 w-8",
                    }}
                    components={{
                      DayContent: ({ date }) => {
                         const formattedDateKey = format(date, 'yyyy-MM-dd');
                         const deadlinesForDay = deadlinesByDate.get(formattedDateKey) || [];
                         
                         const [isPopoverOpen, setIsPopoverOpen] = useState(false);
                         const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
                         const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

                         const handleMouseEnterTrigger = () => {
                            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                            if (deadlinesForDay.length > 0) {
                                openTimeoutRef.current = setTimeout(() => setIsPopoverOpen(true), 100); // Open quickly
                            }
                         };
                         const handleMouseLeaveTrigger = () => {
                            if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
                            closeTimeoutRef.current = setTimeout(() => setIsPopoverOpen(false), 200); // Delay closing
                         };
                         const handleMouseEnterContent = () => {
                            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                         };
                         const handleMouseLeaveContent = () => {
                           closeTimeoutRef.current = setTimeout(() => setIsPopoverOpen(false), 200);
                         };
                         
                         const handleClickTrigger = () => {
                             if (deadlinesForDay.length > 0) {
                                 setIsPopoverOpen(prev => !prev); // Toggle on click
                             }
                         }

                         return (
                            <Popover open={isPopoverOpen && deadlinesForDay.length > 0} onOpenChange={setIsPopoverOpen}>
                                <PopoverTrigger 
                                    asChild
                                    onMouseEnter={handleMouseEnterTrigger}
                                    onMouseLeave={handleMouseLeaveTrigger}
                                    onClick={handleClickTrigger} // Keep click for accessibility
                                >
                                    <div 
                                        role="button" 
                                        tabIndex={0} 
                                        className="w-full h-full flex items-center justify-center outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 rounded-md" // Added focus style to trigger
                                        aria-label={`View deadlines for ${format(date, 'PPP')}`}
                                    >
                                      <DayCellInternalContent date={date} deadlinesForDay={deadlinesForDay} />
                                    </div>
                                </PopoverTrigger>
                                {deadlinesForDay.length > 0 && (
                                <PopoverContent 
                                    className="w-80 z-50 bg-popover text-popover-foreground border-border" 
                                    align="start" 
                                    side="bottom"
                                    onMouseEnter={handleMouseEnterContent}
                                    onMouseLeave={handleMouseLeaveContent}
                                >
                                    <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">
                                        Deadlines for {format(date, 'MMMM d, yyyy')}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                        {deadlinesForDay.filter(d => !d.completed).length} pending.
                                        </p>
                                    </div>
                                    <ScrollArea className="max-h-[200px] pr-3 custom-scrollbar">
                                      <div className="grid gap-2">
                                          {deadlinesForDay.map((deadline) => (
                                          <div key={deadline.id} className="deadline-item-in-popover text-sm p-2 bg-muted/50 rounded-md flex items-center justify-between group">
                                              <span className={cn("font-medium truncate", deadline.completed ? 'line-through text-muted-foreground' : '')} title={deadline.title}>
                                                {deadline.title}
                                              </span>
                                          </div>
                                          ))}
                                      </div>
                                    </ScrollArea>
                                    <Button onClick={() => { router.push(`/?date=${format(date, 'yyyy-MM-dd')}`); setIsPopoverOpen(false); }} size="sm">
                                        Manage on Dashboard
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


    