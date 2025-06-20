
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Send, X, MessageSquare, Loader2 } from 'lucide-react'; // Added Loader2
import { summarizeContent, type SummarizeContentInput } from '@/ai/flows/summarize-content';
// Future: import { askGeneralAssistant, type GeneralAssistantInput } from '@/ai/flows/general-assistant-flow';
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
  const [mode, setMode] = useState<'chat' | 'summarize'>('chat'); // Default to chat
  const { toast } = useToast();

  useEffect(() => {
    const handleOpenAiAssistant = (event?: CustomEvent) => {
      setIsOpen(true);
      setIsChatOpen(true);
      const detailMode = event?.detail?.mode || 'chat';
      setMode(detailMode as 'chat' | 'summarize');

      setMessages([{ 
        id: 'initial', 
        type: 'system', 
        text: detailMode === 'summarize' 
              ? 'Paste the content you want to summarize below.' 
              : 'Hello! I am your AI Study Assistant. How can I help you today? You can ask me questions or ask for explanations.' 
      }]);

      if (detailMode === 'summarize' && event?.detail?.text) {
        setInputValue(event.detail.text);
      } else {
        setInputValue(''); // Clear input for general chat
      }
    };
    window.addEventListener('open-ai-assistant', handleOpenAiAssistant as EventListener);
    return () => window.removeEventListener('open-ai-assistant', handleOpenAiAssistant as EventListener);
  }, []);


  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), type: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // For now, all queries go to summarizeContent. 
      // This would be expanded with a new flow for general assistance.
      const input: SummarizeContentInput = { content: currentInput };
      const result = await summarizeContent(input);
      const aiMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        type: 'ai', 
        text: mode === 'summarize' ? result.summary : `I processed your query: "${currentInput.substring(0,50)}...". Here's a summary related to it: ${result.summary}` 
      };
      // In a real scenario with a general assistant:
      // if (mode === 'summarize') {
      //   const input: SummarizeContentInput = { content: currentInput };
      //   const result = await summarizeContent(input);
      //   aiMessage.text = result.summary;
      // } else { // mode === 'chat'
      //   const input: GeneralAssistantInput = { query: currentInput, context: "User's study notes/history" }; // context needs to be populated
      //   const result = await askGeneralAssistant(input);
      //   aiMessage.text = result.response;
      // }
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error processing AI request:', error);
      const errorMessage: Message = { id: (Date.now() + 1).toString(), type: 'system', text: 'Sorry, I had trouble processing your request. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "AI Error",
        description: "Could not process your request.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleChat = () => {
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    if (newOpenState) { // if we are opening
        setIsChatOpen(true);
        setMode('chat'); // Default to chat when opened via bubble click
        setMessages([{ 
          id: 'initial', 
          type: 'system', 
          text: 'Hello! I am your AI Study Assistant. How can I help you today?' 
        }]);
        setInputValue('');
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
              {mode === 'summarize' ? 'Paste content below to get a summary.' : 'Ask questions, get explanations, or paste content.'}
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
                placeholder={mode === 'summarize' ? "Paste content to summarize..." : "Ask your AI assistant..."}
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
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
