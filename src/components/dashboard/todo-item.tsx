
'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Todo {
  id: string;
  title: string;
  importance: 'high' | 'medium' | 'low';
  completed: boolean;
  userId?: string;
  createdAt?: string; // Changed from Timestamp | Date
}

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const importanceColors = {
  high: 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30',
  medium: 'bg-yellow-500/15 border-yellow-500/40 hover:bg-yellow-500/25',
  low: 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20',
};

const completedColors = 'bg-muted/30 border-muted/40 opacity-60';

export function TodoItem({ todo, onToggleComplete, onDelete }: TodoItemProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg shadow-sm flex flex-col justify-between min-h-[100px] border transition-all duration-200",
        todo.completed ? completedColors : importanceColors[todo.importance]
      )}
    >
      <div className="flex items-start space-x-3 mb-2 flex-1">
        <Checkbox
          id={`todo-${todo.id}`}
          checked={todo.completed}
          onCheckedChange={() => onToggleComplete(todo.id)}
          aria-label={`Mark to-do ${todo.title} as ${todo.completed ? 'incomplete' : 'complete'}`}
          className="mt-1 border-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <label
          htmlFor={`todo-${todo.id}`}
          className={cn(
            "text-sm font-medium text-foreground/90 cursor-pointer break-words",
            todo.completed && "line-through text-muted-foreground"
          )}
        >
          {todo.title}
        </label>
      </div>
      <div className="flex justify-end items-center mt-auto pt-1">
        <Button variant="ghost" size="icon" onClick={() => onDelete(todo.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete to-do</span>
        </Button>
      </div>
    </div>
  );
}
