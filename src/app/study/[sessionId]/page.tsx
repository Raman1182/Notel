
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/shared/app-header';
import { Textarea } from '@/components/ui/textarea';
import { SessionSidebar } from '@/components/study/session-sidebar';
import { FloatingTimerWidget } from '@/components/study/floating-timer-widget';
import { Paperclip, StickyNote, Loader2 } from 'lucide-react';

// Debounce utility
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout | null = null;
  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}

interface SessionData {
  sessionId: string;
  subject: string;
  duration: number;
  ambientSound: string;
  startTime: number;
}

export default function StudySessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isReferencePanelOpen, setIsReferencePanelOpen] = useState(false);
  const [showAiButtons, setShowAiButtons] = useState(false);

  const [noteContent, setNoteContent] = useState('');
  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionRunning, setIsSessionRunning] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load session data and notes from localStorage
  useEffect(() => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const storedSessionDataJSON = localStorage.getItem(`learnlog-session-${sessionId}`);
      if (storedSessionDataJSON) {
        const parsedSessionData: SessionData = JSON.parse(storedSessionDataJSON);
        setSessionData(parsedSessionData);
        
        const savedNotes = localStorage.getItem(`learnlog-session-${sessionId}-notes`);
        if (savedNotes) setNoteContent(savedNotes);

        const savedTime = localStorage.getItem(`learnlog-session-${sessionId}-timer`);
        if (savedTime) setSessionTime(parseInt(savedTime, 10));
        
        const savedRunning = localStorage.getItem(`learnlog-session-${sessionId}-running`);
        setIsSessionRunning(savedRunning === 'true');

      } else {
        // Session data not found, redirect or show error
        console.error("Session data not found for ID:", sessionId);
        router.push('/study/launch'); // Or an error page
      }
    } catch (error) {
      console.error("Error loading session data:", error);
      router.push('/study/launch');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, router]);

  // Save notes to localStorage (debounced)
  const saveNotesToLocalStorage = useCallback(
    debounce((content: string) => {
      if (sessionId) {
        localStorage.setItem(`learnlog-session-${sessionId}-notes`, content);
      }
    }, 500),
    [sessionId]
  );

  useEffect(() => {
    if (noteContent !== '' || localStorage.getItem(`learnlog-session-${sessionId}-notes`)) {
      saveNotesToLocalStorage(noteContent);
    }
  }, [noteContent, saveNotesToLocalStorage, sessionId]);
  
  // Save timer state to localStorage
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(`learnlog-session-${sessionId}-timer`, sessionTime.toString());
      localStorage.setItem(`learnlog-session-${sessionId}-running`, isSessionRunning.toString());
    }
  }, [sessionTime, isSessionRunning, sessionId]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSessionRunning && !isLoading) {
      interval = setInterval(() => {
        setSessionTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionRunning, isLoading]);

  const toggleSessionRunning = () => {
    setIsSessionRunning(prev => !prev);
  };

  const handleEndSession = () => {
    if (window.confirm("Are you sure you want to end this study session?")) {
      setIsSessionRunning(false);
      // Further logic for saving final state, archiving, navigating away, etc.
      // For now, just stop timer and maybe navigate to dashboard.
      router.push('/'); 
    }
  };

  const toggleReferencePanel = () => setIsReferencePanelOpen(prev => !prev);

  if (isLoading || !sessionData) {
    return (
      <div className="flex flex-col h-screen bg-[#0A0A0A] text-foreground items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading your session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-foreground overflow-hidden">
      <AppHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <SessionSidebar 
          sessionSubject={sessionData.subject}
        />

        <main className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto relative custom-scrollbar">
          
          <div className="flex items-center justify-end mb-4 space-x-2">
            <Button variant="outline" size="sm" onClick={toggleReferencePanel} className="bg-white/5 border-white/10 hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100">
              <Paperclip className="h-4 w-4 mr-2" />
              Add PDF
            </Button>
            <Button variant="outline" size="sm" onClick={toggleReferencePanel} className="bg-white/5 border-white/10 hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100">
              <StickyNote className="h-4 w-4 mr-2" />
              Previous Notes
            </Button>
          </div>

          <div className="flex flex-1 gap-4 min-h-0">
            <div 
              className="relative flex-1 h-full"
              onMouseEnter={() => setShowAiButtons(true)}
              onMouseLeave={() => setShowAiButtons(false)}
            >
              <Textarea 
                placeholder="Start typing your notes here..." 
                className="w-full h-full bg-[#0F0F0F] border-white/10 rounded-md p-4 text-base resize-none focus:ring-primary focus:border-primary font-code custom-scrollbar"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
              {showAiButtons && (
                <div className="absolute bottom-4 right-4 flex space-x-2">
                  {/* AI Buttons - Placeholder */}
                  <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs p-1.5">✨ Explain</Button>
                  <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs p-1.5">📋 Summarize</Button>
                  <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs p-1.5">⤴️ Expand</Button>
                </div>
              )}
            </div>

            {isReferencePanelOpen && (
              <div className="w-[30%] h-full bg-[#0F0F0F] border-white/10 p-4 rounded-md flex flex-col overflow-y-auto custom-scrollbar">
                <div className="flex items-center border-b border-white/10 pb-2 mb-2 text-sm">
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-t-md">Reference.pdf</span>
                  <button className="ml-auto text-muted-foreground hover:text-foreground">&times;</button>
                </div>
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  PDF / Reference Viewer Area
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 text-xs text-muted-foreground text-right border-t border-white/10 pt-2">
              Word Count: {noteContent.split(/\s+/).filter(Boolean).length} | Saved
          </div>
        </main>
      </div>
      <FloatingTimerWidget 
          timeInSeconds={sessionTime}
          isRunning={isSessionRunning}
          onTogglePlayPause={toggleSessionRunning}
          onEndSession={handleEndSession}
      />
    </div>
  );
}
