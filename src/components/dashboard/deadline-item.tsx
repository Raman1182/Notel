
'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, differenceInDays } from 'date-fns';

export interface Deadline {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD string
  completed: boolean;
}

interface DeadlineItemProps {
  deadline: Deadline;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

function getDueDateInfo(dueDateStr: string): { text: string; colorClass: string } {
  const due = new Date(dueDateStr + 'T00:00:00'); // Ensure it's parsed as local date
  const today = new Date();
  today.setHours(0,0,0,0); // Compare dates only

  if (isToday(due)) {
    return { text: "Today", colorClass: "text-warning" };
  }
  if (isPast(due) && !isToday(due)) {
    return { text: `Overdue by ${differenceInDays(today, due)} day(s)`, colorClass: "text-destructive" };
  }
  const diff = differenceInDays(due, today);
  if (diff === 1) {
    return { text: "Tomorrow", colorClass: "text-amber-500" }; // A slightly different warning
  }
  if (diff <= 7) {
    return { text: `In ${diff} days`, colorClass: "text-primary/80" };
  }
  return { text: format(due, "MMM d"), colorClass: "text-muted-foreground" };
}

export function DeadlineItem({ deadline, onToggleComplete, onDelete }: DeadlineItemProps) {
  const { text: dueDateText, colorClass } = getDueDateInfo(deadline.dueDate);

  return (
    <li className={cn(
        "flex items-center justify-between p-3 rounded-md bg-white/5 border-l-4 transition-all duration-200",
        deadline.completed ? "border-green-500/50 opacity-60" : "border-primary/50",
        !deadline.completed && isPast(new Date(deadline.dueDate)) && !isToday(new Date(deadline.dueDate)) ? "border-destructive" : 
        !deadline.completed && isToday(new Date(deadline.dueDate)) ? "border-warning" : ""
      )}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <Checkbox
          id={`deadline-${deadline.id}`}
          checked={deadline.completed}
          onCheckedChange={() => onToggleComplete(deadline.id)}
          aria-label={`Mark deadline ${deadline.title} as ${deadline.completed ? 'incomplete' : 'complete'}`}
        />
        <label
          htmlFor={`deadline-${deadline.id}`}
          className={cn(
            "text-sm text-foreground/90 cursor-pointer truncate",
            deadline.completed && "line-through text-muted-foreground"
          )}
          title={deadline.title}
        >
          {deadline.title}
        </label>
      </div>
      <div className="flex items-center space-x-2 shrink-0 ml-2">
        {!deadline.completed && (
          <span className={cn("text-xs px-2 py-0.5 rounded-full bg-white/10 flex items-center", colorClass)}>
            <CalendarClock className="h-3 w-3 mr-1"/>
            {dueDateText}
          </span>
        )}
        <Button variant="ghost" size="icon" onClick={() => onDelete(deadline.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete deadline</span>
        </Button>
      </div>
    </li>
  );
}
