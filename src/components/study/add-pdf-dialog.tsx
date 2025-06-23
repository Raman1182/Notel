
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
  onSaveUrl: (url: string) => void;
  currentUrl?: string | null;
}

export function AddPdfDialog({ open, onOpenChange, onSaveUrl, currentUrl }: AddPdfDialogProps) {
  const [url, setUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
        setUrl(currentUrl || '');
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
    onSaveUrl(url.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Attach PDF from URL</DialogTitle>
          <DialogDescription>
            Link a publicly accessible PDF from a URL to view it alongside your notes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="py-4 space-y-2">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pdf-url" className="text-right">
                    PDF URL
                </Label>
                <Input
                    id="pdf-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="col-span-3"
                    placeholder="https://arxiv.org/pdf/2401.00001.pdf"
                />
            </div>
            <p className="col-span-4 text-xs text-muted-foreground px-1 pl-[calc(25%+1rem)]">
                The URL must be public and end with .pdf. Links from private cloud storage may not work.
            </p>
            <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Save & Attach URL</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
