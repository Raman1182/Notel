
'use client';

import type { NextPage } from 'next';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter directly
import { AppHeader } from '@/components/shared/app-header';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AddDeadlineDialog } from '@/components/dashboard/add-deadline-dialog';
import type { Deadline } from '@/components/dashboard/deadline-item';
import { PlusCircle, CalendarDays, ListFilter, ChevronLeft, ChevronRight, BadgeCheck, GripHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const MAX_DEADLINES_CALENDAR_POPOVER = 5;

// Define DayCellContent component within CalendarPage or as a separate component
const DayCellContent = ({ date, deadlinesForDay }: { date: Date, deadlinesForDay: Deadline[] }) => {
  const dayNumber = format(date, 'd');
  const hasPendingDeadlines = deadlinesForDay.some(d => !d.completed);
  const allCompleted = deadlinesForDay.length > 0 && deadlinesForDay.every(d => d.completed);

  return (
    <div className="flex flex-col h-full p-1.5 items-center justify-start relative">
      <span className={cn(
        "absolute top-1.5 right-1.5 text-xs",
        isSameDay(date, new Date()) ? 'text-primary font-bold' : 'text-muted-foreground'
      )}>
        {dayNumber}
      </span>
      {deadlinesForDay.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1 justify-center items-center">
          {hasPendingDeadlines && <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" title="Pending deadline"></div>}
          {allCompleted && <BadgeCheck className="h-3 w-3 text-green-500" title="All deadlines completed"/>}
          {!hasPendingDeadlines && !allCompleted && deadlinesForDay.length > 0 && <div className="h-2 w-2 rounded-full bg-muted-foreground/50" title="Deadline exists"></div> }
         
          {deadlinesForDay.length > 1 && (hasPendingDeadlines || allCompleted) && deadlinesForDay.length - (hasPendingDeadlines ? 1 : 0) - (allCompleted ? 1 : 0) > 0 && (
            <span className="text-[10px] text-primary/70 mt-0.5">
              +{deadlinesForDay.length - (hasPendingDeadlines ? 1:0) - (allCompleted ? 1:0) } more
            </span>
          )}
           {deadlinesForDay.length > 2 && !hasPendingDeadlines && !allCompleted && (
             <span className="text-[10px] text-primary/70 mt-0.5">+{deadlinesForDay.length} total</span>
           )}
        </div>
      )}
    </div>
  );
};


const CalendarPage: NextPage = () => {
  const router = useRouter(); // Use router directly
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
      // Sort by due date, then by completion status (pending first)
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
  
  const toggleDeadlineCompleteInPopover = (id: string) => {
    setDeadlines(prev => {
      const updated = prev.map(d => d.id === id ? { ...d, completed: !d.completed } : d);
      localStorage.setItem('learnlog-deadlines', JSON.stringify(updated));
      // If popover is open for a date that includes this deadline, force a re-render of popover content
      // by briefly closing and reopening, or by ensuring deadlinesByDate recomputes.
      // The dependency on `deadlines` for `deadlinesByDate` should handle this.
      return updated;
    });
  };

  const deleteDeadlineFromPopover = (id: string) => {
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
      const dateStr = format(parseISO(deadline.dueDate), 'yyyy-MM-dd'); // Store by YYYY-MM-DD
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
                    selected={selectedDateForPopover}
                    onSelect={(date) => {
                        if (date) {
                            // Check if the clicked date is already selected, if so, toggle popover
                            if (selectedDateForPopover && isSameDay(date, selectedDateForPopover)) {
                                setIsPopoverOpen(!isPopoverOpen); 
                                if (isPopoverOpen) setSelectedDateForPopover(null); // if closing, deselect
                                else setSelectedDateForPopover(date); // if opening, ensure selected
                            } else { // New date selected
                                setSelectedDateForPopover(date);
                                setIsPopoverOpen(true);
                            }
                        } else { // Date deselected by calendar (e.g. clicking outside)
                            setSelectedDateForPopover(null);
                            setIsPopoverOpen(false);
                        }
                    }}
                    className="!p-2 sm:!p-3 md:!p-4 w-full [&_table]:w-full [&_table]:border-collapse"
                    classNames={{
                        table: "w-full border-collapse",
                        head_row: "flex",
                        head_cell: "w-1/7 text-muted-foreground rounded-md font-normal text-[0.8rem] p-2 text-center", // 1/7 width for 7 days
                        row: "flex w-full mt-0.5",
                        cell: cn(`h-20 sm:h-24 md:h-28 w-1/7 text-center text-sm p-0 relative rounded-md border border-transparent
                               focus-within:relative focus-within:z-20 
                               hover:border-primary/30 hover:bg-accent/50 transition-colors duration-150`,
                               // Custom style to ensure selected day remains visually distinct even when popover trigger is inside
                               "[&[aria-selected=true]]:bg-primary/10 [&[aria-selected=true]]:border-primary" 
                        ),
                        day: "h-full w-full p-1 focus:relative focus:z-20 cursor-pointer flex flex-col items-center justify-start",
                        day_today: "bg-accent/30 border-primary/50",
                        day_selected: "bg-primary/20 !border-primary text-primary-foreground", // Default selected style
                        day_disabled: "text-muted-foreground/50 opacity-50 cursor-not-allowed",
                        day_outside: "text-muted-foreground/50 opacity-70",
                        caption_label: "text-xl font-bold",
                        nav_button: "h-8 w-8",
                    }}
                    components={{
                      DayContent: ({ date }) => { // Removed activeModifiers as it's not used
                         const formattedDateKey = format(date, 'yyyy-MM-dd');
                         const deadlinesForDay = deadlinesByDate.get(formattedDateKey) || [];
                         const isCurrentSelectedForPopover = selectedDateForPopover && isSameDay(date, selectedDateForPopover);

                         return (
                            <Popover
                                open={isPopoverOpen && isCurrentSelectedForPopover && deadlinesForDay.length > 0}
                                onOpenChange={(open) => {
                                    if (isCurrentSelectedForPopover) {
                                      setIsPopoverOpen(open);
                                      if (!open) setSelectedDateForPopover(null); // Deselect date if popover is closed
                                    }
                                }}
                            >
                                <PopoverTrigger 
                                    asChild 
                                    className="w-full h-full"
                                    // onClickCapture ensures this runs before calendar's onSelect IF calendar selection changes date
                                    // but primarily to ensure clicking the trigger itself opens/closes the popover for *this* date
                                    onClickCapture={(e) => {
                                        e.stopPropagation(); // Prevent calendar's main onSelect if we are just managing popover for an already selected date
                                        if (deadlinesForDay.length === 0) {
                                           setIsPopoverOpen(false); // Don't open popover for days with no deadlines
                                           setSelectedDateForPopover(date); // Still allow selecting the day in calendar
                                           return;
                                        }
                                        
                                        if (isCurrentSelectedForPopover) {
                                            setIsPopoverOpen(!isPopoverOpen);
                                        } else {
                                            setSelectedDateForPopover(date);
                                            setIsPopoverOpen(true);
                                        }
                                    }}
                                >
                                    <div 
                                        role="button" 
                                        tabIndex={0} 
                                        className="w-full h-full"
                                        aria-label={`View deadlines for ${format(date, 'PPP')}`}
                                        // onKeyDown for accessibility if needed
                                    >
                                      <DayCellContent date={date} deadlinesForDay={deadlinesForDay} />
                                    </div>
                                </PopoverTrigger>
                                {deadlinesForDay.length > 0 && ( // Content only if there are deadlines
                                <PopoverContent className="w-80 z-50 bg-popover text-popover-foreground border-border" align="start" side="bottom">
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
                                              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Removed toggle and delete from here to simplify, manage on dashboard */}
                                              </div>
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
