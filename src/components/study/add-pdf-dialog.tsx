
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { File, Link as LinkIcon } from 'lucide-react';

interface AddPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveUrl: (url: string) => void;
  onAddLocalResource: (resourceName: string) => void;
  currentUrl?: string | null;
}

export function AddPdfDialog({ open, onOpenChange, onSaveUrl, onAddLocalResource, currentUrl }: AddPdfDialogProps) {
  const [activeTab, setActiveTab] = useState('url');
  const [url, setUrl] = useState('');
  const [localFileName, setLocalFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
        setUrl(currentUrl || '');
        setLocalFileName('');
        setActiveTab(currentUrl ? 'url' : 'url');
    }
  }, [open, currentUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setLocalFileName(e.target.files[0].name);
    } else {
      setLocalFileName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'url') {
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

    } else { // activeTab === 'local'
      if (!localFileName) {
        toast({ title: "No File Selected", description: "Please select a PDF file from your computer.", variant: "destructive" });
        return;
      }
      onAddLocalResource(localFileName);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Attach a Resource</DialogTitle>
          <DialogDescription>
            Link a publicly accessible PDF from a URL to view it here, or add a reference to a local PDF file in your notes.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">From URL</TabsTrigger>
                <TabsTrigger value="local">From Computer</TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="py-4 space-y-2">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="pdf-url" className="text-right">
                        PDF URL
                    </Label>
                    <Input
                        id="pdf-url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., https://arxiv.org/pdf/2401.00001.pdf"
                    />
                </div>
                 <p className="col-span-4 text-xs text-muted-foreground px-1 pl-[calc(25%+1rem)]">
                    The URL must be public and end with .pdf. Links from private cloud storage may not work.
                </p>
            </TabsContent>
            <TabsContent value="local" className="py-4">
                <div className="flex flex-col items-center justify-center space-y-3 text-center">
                    <p className="text-sm text-muted-foreground">Select a PDF to add its name as a resource in your notes. The file itself will not be uploaded.</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <File className="mr-2 h-4 w-4" />
                        Select PDF File
                    </Button>
                    {localFileName && (
                        <p className="text-sm text-foreground font-medium pt-2">
                            Selected: <span className="text-primary">{localFileName}</span>
                        </p>
                    )}
                </div>
            </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSubmit}>
            {activeTab === 'url' ? 'Save & Attach URL' : 'Add Resource Reference'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
