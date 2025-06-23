
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, Plus } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface GenerateMindmapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (topic: string, details?: string) => void;
  onAddToNotes: (markdown: string) => void;
  isLoading: boolean;
  generatedMapMarkdown: string | null;
}

export function GenerateMindmapDialog({
  open,
  onOpenChange,
  onGenerate,
  onAddToNotes,
  isLoading,
  generatedMapMarkdown,
}: GenerateMindmapDialogProps) {
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');

  const handleGenerateClick = () => {
    if (topic.trim()) {
      onGenerate(topic.trim(), details.trim());
    }
  };
  
  useEffect(() => {
    if (open) {
      setTopic('');
      setDetails('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate AI Mind Map</DialogTitle>
          <DialogDescription>
            Enter a topic and optional details, and the AI will create a structured mind map for you.
          </DialogDescription>
        </DialogHeader>

        {!generatedMapMarkdown && !isLoading && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mindmap-topic">Topic (Required)</Label>
              <Input
                id="mindmap-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Photosynthesis"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mindmap-details">Specific Details (Optional)</Label>
              <Textarea
                id="mindmap-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="e.g., Focus on the light-dependent reactions and the Calvin cycle."
                rows={3}
              />
            </div>
          </div>
        )}

        {isLoading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p>Generating your mind map...</p>
            </div>
        )}

        {generatedMapMarkdown && !isLoading && (
            <div className="flex-1 flex flex-col min-h-0">
                 <h3 className="text-lg font-semibold mb-2">Generated Mind Map</h3>
                 <ScrollArea className="flex-1 bg-muted/50 p-4 rounded-md border">
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                        {generatedMapMarkdown}
                    </pre>
                </ScrollArea>
            </div>
        )}

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!generatedMapMarkdown ? (
            <Button onClick={handleGenerateClick} disabled={isLoading || !topic.trim()}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Generate
            </Button>
          ) : (
            <Button onClick={() => onAddToNotes(generatedMapMarkdown)}>
              <Plus className="mr-2 h-4 w-4" /> Add to Notes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
