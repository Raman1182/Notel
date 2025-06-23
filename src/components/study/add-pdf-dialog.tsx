
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
import { useToast } from '@/hooks/use-toast';

interface AddPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (url: string) => void;
  currentUrl?: string | null;
}

export function AddPdfDialog({ open, onOpenChange, onSave, currentUrl }: AddPdfDialogProps) {
  const [url, setUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open && currentUrl) {
      setUrl(currentUrl);
    } else if (!open) {
      setUrl(''); // Reset on close
    }
  }, [open, currentUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast({ title: "URL Required", description: "Please enter a valid PDF URL.", variant: "destructive" });
      return;
    }
    try {
      new URL(url.trim());
    } catch (_) {
      toast({ title: "Invalid URL", description: "The provided URL is not valid.", variant: "destructive" });
      return;
    }
    
    if (!url.trim().toLowerCase().endsWith('.pdf')) {
        toast({ title: "Invalid File Type", description: "The URL must point directly to a PDF file (ending in .pdf).", variant: "destructive" });
        return;
    }

    onSave(url.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Attach PDF from URL</DialogTitle>
          <DialogDescription>
            Paste the direct URL to a publicly accessible PDF file. This app does not store the PDF, only the link to it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pdf-url" className="text-right">
                PDF URL
              </Label>
              <Input
                id="pdf-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://example.com/document.pdf"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save and Attach</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
