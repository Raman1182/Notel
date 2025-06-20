
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Todo } from './todo-item';

interface AddTodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTodo: (newTodoData: Omit<Todo, 'id' | 'completed'>) => void; // Changed prop name for clarity
}

export function AddTodoDialog({ open, onOpenChange, onAddTodo }: AddTodoDialogProps) {
  const [title, setTitle] = useState('');
  const [importance, setImportance] = useState<Todo['importance']>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a title for your to-do.");
      return;
    }
    // Pass only the data needed to create a new todo, ID and completed are handled by the service/parent
    onAddTodo({ title: title.trim(), importance });
    setTitle('');
    setImportance('medium');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New To-Do</DialogTitle>
          <DialogDescription>
            Plan your day with a new task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="todo-title" className="text-right">
                Task
              </Label>
              <Input
                id="todo-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Read Chapter 5"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="importance" className="text-right">
                Importance
              </Label>
              <RadioGroup
                defaultValue="medium"
                value={importance}
                onValueChange={(value: Todo['importance']) => setImportance(value)}
                className="col-span-3 flex space-x-3"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="high" id="r-high" />
                  <Label htmlFor="r-high" className="font-normal text-red-500">High</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="medium" id="r-medium" />
                  <Label htmlFor="r-medium" className="font-normal text-yellow-500">Medium</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="low" id="r-low" />
                  <Label htmlFor="r-low" className="font-normal text-green-500">Low</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Add To-Do</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
