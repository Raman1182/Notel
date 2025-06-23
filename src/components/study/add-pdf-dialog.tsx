
'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, Upload } from 'lucide-react';

interface AddPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveUrl: (url: string) => void;
  onAttachLocalFile: (file: File) => void;
  currentUrl?: string | null;
}

export function AddPdfDialog({ open, onOpenChange, onSaveUrl, onAttachLocalFile, currentUrl }: AddPdfDialogProps) {
  const [url, setUrl] = useState('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
        setUrl(currentUrl || '');
    }
  }, [open, currentUrl]);

  const handleUrlSubmit = (e: React.FormEvent) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.type !== 'application/pdf') {
            toast({ title: "Invalid File Type", description: "Please select a PDF file.", variant: "destructive" });
            return;
        }
        onAttachLocalFile(file);
        onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Attach PDF Reference</DialogTitle>
          <DialogDescription>
            Provide a public URL or select a local PDF file to view alongside your notes.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url"><Link className="h-4 w-4 mr-2"/>From URL</TabsTrigger>
                <TabsTrigger value="local"><Upload className="h-4 w-4 mr-2"/>From Computer</TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="pt-4">
                <form onSubmit={handleUrlSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="pdf-url">Public PDF URL</Label>
                        <Input
                            id="pdf-url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://arxiv.org/pdf/2401.00001.pdf"
                        />
                         <p className="text-xs text-muted-foreground px-1">
                            The URL must be public and end with .pdf.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit">Save & Attach URL</Button>
                    </DialogFooter>
                </form>
            </TabsContent>
            <TabsContent value="local" className="pt-4">
                <div className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        Select a PDF from your computer for temporary viewing. This file will not be saved to your account.
                    </p>
                    <Input
                        id="local-pdf"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="hidden"
                    />
                    <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                        <Upload className="h-4 w-4 mr-2"/>
                        Choose PDF File
                    </Button>
                </div>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
