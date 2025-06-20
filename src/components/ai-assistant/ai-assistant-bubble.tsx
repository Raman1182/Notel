'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Send, X, MessageSquare } from 'lucide-react';
import { summarizeContent, type SummarizeContentInput } from '@/ai/flows/summarize-content';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  text: string;
}

export function AiAssistantBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOpenAiAssistant = (event?: CustomEvent) => {
      setIsOpen(true);
      setIsChatOpen(true);
      if (event?.detail?.mode === 'summarize' && event?.detail?.text) {
        setInputValue(event.detail.text);
      }
    };
    window.addEventListener('open-ai-assistant', handleOpenAiAssistant as EventListener);
    return () => window.removeEventListener('open-ai-assistant', handleOpenAiAssistant as EventListener);
  }, []);


  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), type: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const input: SummarizeContentInput = { content: userMessage.text };
      const result = await summarizeContent(input);
      const aiMessage: Message = { id: (Date.now() + 1).toString(), type: 'ai', text: result.summary };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error summarizing content:', error);
      const errorMessage: Message = { id: (Date.now() + 1).toString(), type: 'system', text: 'Sorry, I had trouble generating a summary. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "AI Error",
        description: "Could not generate summary.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleChat = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) { // if we are opening
        setIsChatOpen(true);
        setMessages([{ id: 'initial', type: 'system', text: 'Hello! How can I help you study today? Paste your content below for a summary.'}])
    } else {
        setIsChatOpen(false);
    }
  };


  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 focus:ring-ring focus:ring-offset-2 animate-button-press active:animate-none"
        onClick={toggleChat}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? <X className="h-7 w-7" /> : <Lightbulb className="h-7 w-7" />}
      </Button>

      <Dialog open={isChatOpen} onOpenChange={(open) => { setIsChatOpen(open); if (!open) setIsOpen(false); }}>
        <DialogContent className="max-w-lg w-[90vw] h-[70vh] flex flex-col p-0 bg-popover/90 backdrop-blur-xl border-border shadow-2xl rounded-xl overflow-hidden">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg font-headline">
              <MessageSquare className="h-5 w-5 text-primary" />
              AI Study Assistant
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Get help with summaries, explanations, and more.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-grow p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex animate-slide-up-fade ${
                  msg.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${
                    msg.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : msg.type === 'ai'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground text-center w-full'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
                 <div className="flex justify-start">
                    <div className="max-w-[75%] rounded-lg px-4 py-3 text-sm bg-secondary text-secondary-foreground">
                        <div className="flex items-center space-x-1">
                            <span className="h-2 w-2 bg-muted-foreground rounded-full animate-wave-dot-1"></span>
                            <span className="h-2 w-2 bg-muted-foreground rounded-full animate-wave-dot-2"></span>
                            <span className="h-2 w-2 bg-muted-foreground rounded-full animate-wave-dot-3"></span>
                        </div>
                    </div>
                </div>
            )}
          </ScrollArea>

          <DialogFooter className="p-4 border-t border-border">
            <div className="flex w-full items-center space-x-2">
              <Textarea
                placeholder="Paste content to summarize or ask a question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-input text-sm"
                rows={1}
              />
              <Button type="submit" size="icon" onClick={handleSubmit} disabled={isLoading || !inputValue.trim()} aria-label="Send message">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
