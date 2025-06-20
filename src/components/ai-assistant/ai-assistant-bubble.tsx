
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input'; // Added Input
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Send, X, MessageSquare, Loader2, LinkIcon } from 'lucide-react'; 
import { studyBuddyFlow, type StudyBuddyInput } from '@/ai/flows/study-buddy-flow';
import { processUrlFlow, type ProcessUrlInput, type ProcessUrlOutput } from '@/ai/flows/process-url-flow'; // Added
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Added
import { Label } from "@/components/ui/label"; // Added
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Added
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system' | 'ai_structured';
  text: string;
  structuredContent?: string; // For AI's structured notes output
}

type AssistantMode = 'chat' | 'process_link';

export function AiAssistantBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [activeMode, setActiveMode] = useState<AssistantMode>('chat');
  
  // Chat mode states
  const [chatInputValue, setChatInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Process Link mode states
  const [urlInputValue, setUrlInputValue] = useState('');
  const [contentType, setContentType] = useState<'article' | 'youtube_video'>('article');

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
      const detailMode = event?.detail?.mode || 'chat'; // 'chat', 'summarize_text', 'process_link'
      const detailText = event?.detail?.text; // For 'summarize_text'
      const detailUrl = event?.detail?.url; // For 'process_link'
      const detailSubject = event?.detail?.subject || localStorage.getItem('learnlog-lastActiveSubject') || undefined;

      setCurrentStudySubject(detailSubject);
      setMessages([]); // Clear messages on open

      if (detailMode === 'process_link') {
        setActiveMode('process_link');
        setUrlInputValue(detailUrl || '');
        setChatInputValue(''); // Clear chat input
         setMessages([{ 
            id: 'initial-process-link', 
            type: 'system', 
            text: 'Paste a URL above and select its content type. I will try to summarize it and generate notes for you.' 
        }]);
      } else { // Default to chat, or if 'summarize_text' was intended (now part of chat)
        setActiveMode('chat');
        setChatInputValue(detailText || ''); 
        setUrlInputValue(''); // Clear URL input
        setMessages([{ 
            id: 'initial-chat', 
            type: 'system', 
            text: 'Hello! I am LearnLog AI, your study buddy. How can I help you today? You can ask me questions, paste text for discussion, or request study tips.' 
        }]);
      }
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
          // Context text could be prepended or handled differently if user pastes large text
      };
      const result = await studyBuddyFlow(input);
      const aiMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        type: 'ai', 
        text: result.response
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

  const handleProcessUrlSubmit = async () => {
    if (!urlInputValue.trim()) {
        toast({ title: "URL Missing", description: "Please paste a URL to process.", variant: "default" });
        return;
    }
    const userMessage: Message = { id: Date.now().toString(), type: 'user', text: `Processing URL (${contentType}): ${urlInputValue}` };
    setMessages(prev => [...prev, userMessage]); // Show user's action in chat
    setIsLoading(true);
    
    try {
        const input: ProcessUrlInput = { url: urlInputValue, contentType };
        const result = await processUrlFlow(input);

        if (result.error) {
            const errorMessage: Message = { id: (Date.now() +1).toString(), type: 'system', text: result.summary || result.error};
            setMessages(prev => [...prev, errorMessage]);
            toast({ title: "URL Processing Error", description: result.summary || result.error, variant: "destructive"});
        } else {
            const aiResponseMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai_structured',
                text: result.summary,
                structuredContent: result.structuredNotes,
            };
            setMessages(prev => [...prev, aiResponseMessage]);
        }
    } catch (error) {
        console.error('Error processing URL:', error);
        const errorMessageText = error instanceof Error ? error.message : 'Sorry, an unexpected error occurred while processing the URL.';
        const errorMessage: Message = { id: (Date.now() + 1).toString(), type: 'system', text: errorMessageText };
        setMessages(prev => [...prev, errorMessage]);
        toast({ title: "URL Processing Failed", description: "Could not process the URL.", variant: "destructive" });
    } finally {
        setIsLoading(false);
        // Optionally clear URL input: setUrlInputValue(''); 
    }
  };
  
  const toggleChatOpenState = () => {
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    if (newOpenState) { 
        setIsChatOpen(true); // This ensures the dialog itself opens
        // Reset to default chat mode when bubble is clicked
        setActiveMode('chat'); 
        setCurrentStudySubject(localStorage.getItem('learnlog-lastActiveSubject') || undefined);
        setMessages([{ 
          id: 'initial-chat-toggle', 
          type: 'system', 
          text: 'Hello! I am LearnLog AI. How can I help?' 
        }]);
        setChatInputValue('');
        setUrlInputValue('');
    } else {
        setIsChatOpen(false); // This ensures dialog closes
    }
  };


  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 focus:ring-ring focus:ring-offset-2 animate-button-press active:animate-none"
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
             {/* Removed DialogDescription to make space for Tabs */}
          </DialogHeader>
          
          <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as AssistantMode)} className="flex flex-col flex-grow min-h-0">
            <TabsList className="grid w-full grid-cols-2 mx-auto shrink-0 rounded-none border-b border-border bg-transparent p-0">
              <TabsTrigger 
                value="chat" 
                className="py-2.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none text-sm"
              >
                Chat
              </TabsTrigger>
              <TabsTrigger 
                value="process_link" 
                className="py-2.5 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none text-sm"
              >
                Process Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-grow flex flex-col overflow-hidden m-0 p-0">
              <ScrollArea ref={scrollAreaRef} className="flex-grow p-3 space-y-3 md:p-4 md:space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex animate-slide-up-fade ${
                      msg.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={cn("max-w-[85%] rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-sm shadow-sm",
                        msg.type === 'user' ? 'bg-primary text-primary-foreground' :
                        msg.type === 'ai' ? 'bg-secondary text-secondary-foreground' :
                        msg.type === 'ai_structured' ? 'bg-secondary text-secondary-foreground' : // Same as AI for summary
                        'bg-muted text-muted-foreground text-center w-full text-xs py-1.5 md:py-2' // System messages
                      )}
                    >
                      {msg.text.split('\n').map((line, index) => (
                        <span key={index}>{line}{index < msg.text.split('\n').length - 1 && <br />}</span>
                      ))}
                      {msg.type === 'ai_structured' && msg.structuredContent && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-xs font-semibold mb-1 text-foreground/70">Generated Notes:</p>
                          <pre className="whitespace-pre-wrap text-xs bg-black/10 p-2 rounded-md font-code">{msg.structuredContent}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && activeMode === 'chat' && (
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
              <DialogFooter className="p-2 md:p-3 border-t border-border">
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
              </DialogFooter>
            </TabsContent>

            <TabsContent value="process_link" className="flex-grow flex flex-col overflow-hidden m-0 p-0">
              <div className="p-3 md:p-4 space-y-3 border-b border-border">
                <Label htmlFor="url-input" className="text-sm font-medium">URL to Process</Label>
                <Input 
                  id="url-input"
                  type="url"
                  placeholder="https://example.com/article or YouTube link"
                  value={urlInputValue}
                  onChange={(e) => setUrlInputValue(e.target.value)}
                  className="bg-input h-10 md:h-11"
                />
                <RadioGroup value={contentType} onValueChange={(v) => setContentType(v as 'article' | 'youtube_video')} className="flex space-x-4 pt-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="article" id="type-article" />
                    <Label htmlFor="type-article" className="font-normal text-sm">Article</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="youtube_video" id="type-youtube" />
                    <Label htmlFor="type-youtube" className="font-normal text-sm">YouTube Video</Label>
                  </div>
                </RadioGroup>
                <Button onClick={handleProcessUrlSubmit} disabled={isLoading || !urlInputValue.trim()} className="w-full mt-2 h-10 md:h-11">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <LinkIcon className="h-5 w-5 mr-2" />}
                  Process Link
                </Button>
              </div>
              <ScrollArea ref={scrollAreaRef} className="flex-grow p-3 space-y-3 md:p-4 md:space-y-4">
                 {messages.map((msg) => ( // Display messages in this tab too
                  <div
                    key={msg.id}
                    className={`flex animate-slide-up-fade ${
                      msg.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                       className={cn("max-w-[85%] rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-sm shadow-sm",
                        msg.type === 'user' ? 'bg-primary text-primary-foreground' :
                        msg.type === 'ai' ? 'bg-secondary text-secondary-foreground' :
                        msg.type === 'ai_structured' ? 'bg-secondary text-secondary-foreground' :
                        'bg-muted text-muted-foreground text-center w-full text-xs py-1.5 md:py-2'
                      )}
                    >
                      {msg.text.split('\n').map((line, index) => (
                        <span key={index}>{line}{index < msg.text.split('\n').length - 1 && <br />}</span>
                      ))}
                      {msg.type === 'ai_structured' && msg.structuredContent && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-xs font-semibold mb-1 text-foreground/70">Generated Notes:</p>
                          <pre className="whitespace-pre-wrap text-xs bg-black/10 p-2 rounded-md font-code">{msg.structuredContent}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && activeMode === 'process_link' && (
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
              {/* No footer for Process Link tab, submission is via button in content */}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

