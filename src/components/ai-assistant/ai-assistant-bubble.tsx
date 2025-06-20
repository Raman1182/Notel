
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Send, X, MessageSquare, Loader2 } from 'lucide-react'; 
import { studyBuddyFlow, type StudyBuddyInput } from '@/ai/flows/study-buddy-flow';
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
  const [mode, setMode] = useState<'chat' | 'summarize'>('chat'); 
  const { toast } = useToast();
  const [currentStudySubject, setCurrentStudySubject] = useState<string | undefined>(undefined);


  useEffect(() => {
    const handleOpenAiAssistant = (event?: CustomEvent) => {
      setIsOpen(true);
      setIsChatOpen(true);
      const detailMode = event?.detail?.mode || 'chat';
      const detailText = event?.detail?.text;
      const detailSubject = event?.detail?.subject || localStorage.getItem('learnlog-lastActiveSubject') || undefined;

      setMode(detailMode as 'chat' | 'summarize');
      setCurrentStudySubject(detailSubject);

      let initialMessageText = 'Hello! I am LearnLog AI, your study buddy. How can I help you today? You can ask me questions, request explanations, or get study tips.';
      if (detailMode === 'summarize') {
        initialMessageText = 'Paste the content you want to summarize below, or describe what you need summarized.';
        if (detailText) {
            setInputValue(detailText);
        } else {
            setInputValue('');
        }
      } else {
         setInputValue(''); // Clear input for general chat
      }
      
      setMessages([{ 
        id: 'initial', 
        type: 'system', 
        text: initialMessageText
      }]);
    };
    window.addEventListener('open-ai-assistant', handleOpenAiAssistant as EventListener);
    
    // Attempt to get last active subject if bubble is opened generically
    if (isOpen && !currentStudySubject) {
        const lastSubject = localStorage.getItem('learnlog-lastActiveSubject');
        if (lastSubject) setCurrentStudySubject(lastSubject);
    }

    return () => window.removeEventListener('open-ai-assistant', handleOpenAiAssistant as EventListener);
  }, [isOpen]); // Added isOpen dependency


  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), type: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      let aiMessageText = '';
      if (mode === 'summarize') {
        // For summarize mode, we'll actually use the studyBuddyFlow but frame the query as a summarization request.
        // This allows the user to also ask for summarization of a topic if they don't paste text.
        const input: StudyBuddyInput = { 
            query: `Summarize this for me: ${currentInput}`, 
            contextText: currentInput.length > 100 ? currentInput : undefined, // Heuristic: if input is long, it's likely the text to summarize
            studySubject: currentStudySubject 
        };
        const result = await studyBuddyFlow(input);
        aiMessageText = result.response;

      } else { // mode === 'chat'
        const input: StudyBuddyInput = { 
            query: currentInput,
            studySubject: currentStudySubject,
            // contextText could be populated if user pastes larger chunks of text for discussion
        };
        const result = await studyBuddyFlow(input);
        aiMessageText = result.response;
      }
      
      const aiMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        type: 'ai', 
        text: aiMessageText
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error processing AI request:', error);
      const errorMessageText = error instanceof Error ? error.message : 'Sorry, I had trouble processing your request. Please try again.';
      const errorMessage: Message = { id: (Date.now() + 1).toString(), type: 'system', text: errorMessageText };
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
    if (newOpenState) { 
        setIsChatOpen(true);
        setMode('chat'); 
        setCurrentStudySubject(localStorage.getItem('learnlog-lastActiveSubject') || undefined);
        setMessages([{ 
          id: 'initial', 
          type: 'system', 
          text: 'Hello! I am LearnLog AI, your study buddy. How can I help you today?' 
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
              LearnLog AI
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {mode === 'summarize' 
                ? 'Need a summary? Paste your text or describe the topic.' 
                : currentStudySubject 
                ? `Your AI study buddy for ${currentStudySubject}. Ask me anything!`
                : 'Your AI study buddy. Ask me anything!'}
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
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm shadow-sm ${ // slightly increased max-width and padding
                    msg.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : msg.type === 'ai'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground text-center w-full text-xs py-2' // System messages
                  }`}
                >
                  {msg.text.split('\n').map((line, index) => ( // Handle multi-line responses
                    <span key={index}>
                      {line}
                      {index < msg.text.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
                 <div className="flex justify-start">
                    <div className="max-w-[75%] rounded-lg px-4 py-3 text-sm bg-secondary text-secondary-foreground">
                        <div className="flex items-center space-x-1.5">
                            <span className="h-2 w-2 bg-muted-foreground rounded-full animate-wave-dot-1"></span>
                            <span className="h-2 w-2 bg-muted-foreground rounded-full animate-wave-dot-2"></span>
                            <span className="h-2 w-2 bg-muted-foreground rounded-full animate-wave-dot-3"></span>
                        </div>
                    </div>
                </div>
            )}
          </ScrollArea>

          <DialogFooter className="p-3 border-t border-border">
            <div className="flex w-full items-center space-x-2">
              <Textarea
                placeholder={mode === 'summarize' ? "Paste content or describe what to summarize..." : "Ask your study buddy..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-input text-sm rounded-lg" // Adjusted styles
                rows={1}
              />
              <Button type="submit" size="icon" onClick={handleSubmit} disabled={isLoading || !inputValue.trim()} aria-label="Send message" className="h-11 w-11">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
