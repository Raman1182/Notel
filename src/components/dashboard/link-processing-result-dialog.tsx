
'use client';

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, Copy, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface LinkProcessingResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: string;
  structuredNotes: string;
  error?: string | null;
}

export function LinkProcessingResultDialog({ 
    open, 
    onOpenChange, 
    summary, 
    structuredNotes,
    error 
}: LinkProcessingResultDialogProps) {
  const [copiedNotes, setCopiedNotes] = useState(false);
  const { toast } = useToast();

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(structuredNotes)
      .then(() => {
        setCopiedNotes(true);
        toast({ title: "Notes Copied!", description: "Structured notes copied to clipboard." });
        setTimeout(() => setCopiedNotes(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy notes: ', err);
        toast({ title: "Copy Failed", description: "Could not copy notes to clipboard.", variant: "destructive" });
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Processing Result</DialogTitle>
          <DialogDescription>
            AI-generated summary and notes from the provided link.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
            <Alert variant="destructive" className="my-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Processing Issue</AlertTitle>
                <AlertDescription>{summary || error}</AlertDescription>
            </Alert>
        )}

        <ScrollArea className="flex-1 my-4 pr-3 custom-scrollbar">
            {!error ? (
              <div className="space-y-4">
                <div>
                    <h3 className="text-md font-semibold mb-1 text-primary">Summary</h3>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                    {summary || "No summary could be generated."}
                    </p>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-md font-semibold text-primary">Structured Notes</h3>
                        {structuredNotes && (
                            <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyNotes}
                            className="text-xs"
                            disabled={!structuredNotes}
                            >
                            {copiedNotes ? <Check className="h-4 w-4 mr-1 text-success" /> : <Copy className="h-4 w-4 mr-1" />}
                            {copiedNotes ? "Copied!" : "Copy Notes"}
                            </Button>
                        )}
                    </div>
                    <pre className="text-sm text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap font-code text-xs leading-relaxed">
                    {structuredNotes || "No structured notes could be generated."}
                    </pre>
                </div>
              </div>
            ) : (
                <div className="text-center text-muted-foreground p-4">
                    <p>See the error message above for details.</p>
                </div>
            )}
        </ScrollArea>

        <DialogFooter className="mt-auto pt-4 border-t border-border">
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
