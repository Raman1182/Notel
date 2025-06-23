
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Send, X, MessageSquare, Loader2, Link as LinkIcon } from 'lucide-react'; 
import { studyBuddyFlow, type StudyBuddyInput, type StudyBuddyOutput } from '@/ai/flows/study-buddy-flow';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  text: string;
  citations?: StudyBuddyOutput['citations'];
}

export function AiAssistantBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [chatInputValue, setChatInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [currentStudySubject, setCurrentStudySubject] = useState<string | undefined>(undefined);
  const scrollAreaRef = useRef<HTMLDivElement>(null);


  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollableViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollableViewport) {
        scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);


  useEffect(() => {
    const handleOpenAiAssistant = (event?: CustomEvent) => {
      setIsOpen(true);
      setIsChatOpen(true);
      const detailText = event?.detail?.text; 
      const detailSubject = event?.detail?.subject || localStorage.getItem('learnlog-lastActiveSubject') || undefined;

      setCurrentStudySubject(detailSubject);
      setMessages([]); 

      setChatInputValue(detailText || ''); 
      setMessages([{ 
          id: 'initial-chat', 
          type: 'system', 
          text: 'Hello! I am LearnLog AI, your study buddy. How can I help you today? You can ask me questions, paste text for discussion, or request study tips.' 
      }]);
    };
    window.addEventListener('open-ai-assistant', handleOpenAiAssistant as EventListener);
    
    if (isOpen && !currentStudySubject) {
        const lastSubject = localStorage.getItem('learnlog-lastActiveSubject');
        if (lastSubject) setCurrentStudySubject(lastSubject);
    }

    return () => window.removeEventListener('open-ai-assistant', handleOpenAiAssistant as EventListener);
  }, [isOpen]);


  const handleChatSubmit = async () => {
    if (!chatInputValue.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), type: 'user', text: chatInputValue };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = chatInputValue;
    setChatInputValue('');
    setIsLoading(true);

    try {
      const input: StudyBuddyInput = { 
          query: currentInput,
          studySubject: currentStudySubject,
      };
      const result = await studyBuddyFlow(input);
      const aiMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        type: 'ai', 
        text: result.response,
        citations: result.citations,
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error processing AI chat request:', error);
      const errorMessageText = error instanceof Error ? error.message : 'Sorry, I had trouble processing your request.';
      const errorMessage: Message = { id: (Date.now() + 1).toString(), type: 'system', text: errorMessageText };
      setMessages(prev => [...prev, errorMessage]);
      toast({ title: "AI Chat Error", description: "Could not process your request.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleChatOpenState = () => {
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    if (newOpenState) { 
        setIsChatOpen(true); 
        setCurrentStudySubject(localStorage.getItem('learnlog-lastActiveSubject') || undefined);
        setMessages([{ 
          id: 'initial-chat-toggle', 
          type: 'system', 
          text: 'Hello! I am LearnLog AI. How can I help?' 
        }]);
        setChatInputValue('');
    } else {
        setIsChatOpen(false);
    }
  };


  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 focus:ring-ring focus:ring-offset-2 animate-pulse-subtle active:animate-none"
        onClick={toggleChatOpenState}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? <X className="h-7 w-7" /> : <Lightbulb className="h-7 w-7" />}
      </Button>

      <Dialog open={isChatOpen} onOpenChange={(open) => { setIsChatOpen(open); if (!open) setIsOpen(false); }}>
        <DialogContent className="max-w-lg w-[90vw] h-[75vh] md:h-[70vh] flex flex-col p-0 bg-popover/90 backdrop-blur-xl border-border shadow-2xl rounded-xl overflow-hidden">
          <DialogHeader className="p-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg font-headline">
              <MessageSquare className="h-5 w-5 text-primary" />
              LearnLog AI
            </DialogTitle>
             <DialogDescription className="text-xs">Your conversational study buddy with web search.</DialogDescription>
          </DialogHeader>
          
          <ScrollArea ref={scrollAreaRef} className="flex-grow p-3 md:p-4">
             <div className="space-y-3 md:space-y-4">
                {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`flex flex-col animate-slide-up-fade ${
                    msg.type === 'user' ? 'items-end' : 'items-start'
                    }`}
                >
                    <div
                    className={cn("max-w-[85%] rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-sm shadow-sm",
                        msg.type === 'user' ? 'bg-primary text-primary-foreground' :
                        msg.type === 'ai' ? 'bg-secondary text-secondary-foreground' :
                        'bg-muted text-muted-foreground text-center w-full text-xs py-1.5 md:py-2'
                    )}
                    >
                    {msg.text.split('\n').map((line, index) => (
                        <span key={index}>{line}{index < msg.text.split('\n').length - 1 && <br />}</span>
                    ))}
                    </div>
                    {msg.type === 'ai' && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2 text-xs w-full max-w-[85%]">
                            <p className="font-semibold mb-1 text-muted-foreground">Sources:</p>
                            <div className="space-y-1">
                            {msg.citations.map((citation, index) => (
                                <Link
                                    key={index}
                                    href={citation.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start gap-1.5 text-primary/80 hover:text-primary hover:underline"
                                >
                                <LinkIcon className="h-3 w-3 mt-0.5 shrink-0" />
                                <span className="truncate" title={citation.title}>{citation.title}</span>
                                </Link>
                            ))}
                            </div>
                        </div>
                    )}
                </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start animate-slide-up-fade">
                        <div className="max-w-[75%] rounded-lg px-4 py-3 text-sm bg-secondary text-secondary-foreground">
                            <div className="flex items-center space-x-1.5">
                                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-wave-dot-1"></span>
                                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-wave-dot-2"></span>
                                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-wave-dot-3"></span>
                            </div>
                        </div>
                    </div>
                )}
             </div>
          </ScrollArea>
          <div className="p-2 md:p-3 border-t border-border">
            <div className="flex w-full items-center space-x-2">
              <Textarea
                placeholder={currentStudySubject ? `Ask about ${currentStudySubject} or paste text...` : "Ask your study buddy or paste text..."}
                value={chatInputValue}
                onChange={(e) => setChatInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit(); }}}
                className="flex-1 min-h-[40px] md:min-h-[44px] max-h-[100px] md:max-h-[120px] resize-none bg-input text-sm rounded-lg"
                rows={1}
              />
              <Button type="submit" size="icon" onClick={handleChatSubmit} disabled={isLoading || !chatInputValue.trim()} aria-label="Send message" className="h-10 w-10 md:h-11 md:w-11">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
