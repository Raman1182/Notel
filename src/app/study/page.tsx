
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/shared/app-header';
import { Textarea } from '@/components/ui/textarea';
import { SettingsProvider } from '@/components/settings-provider';
import { SessionSidebar } from '@/components/study/session-sidebar';
import { FloatingTimerWidget } from '@/components/study/floating-timer-widget';
import { Paperclip, StickyNote } from 'lucide-react'; // Added Paperclip

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


export default function StudySessionPage() {
  const [isReferencePanelOpen, setIsReferencePanelOpen] = useState(false);
  const [showAiButtons, setShowAiButtons] = useState(false);

  const [notebookTitle, setNotebookTitle] = useState('Untitled Session');
  const [noteContent, setNoteContent] = useState('');

  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionRunning, setIsSessionRunning] = useState(false); // Start paused, user clicks play

  // Load from localStorage on mount
  useEffect(() => {
    const savedTitle = localStorage.getItem('learnlog-study-title');
    const savedContent = localStorage.getItem('learnlog-study-content');
    const savedTime = localStorage.getItem('learnlog-study-time');
    const savedRunning = localStorage.getItem('learnlog-study-running');

    if (savedTitle) setNotebookTitle(savedTitle);
    if (savedContent) setNoteContent(savedContent);
    if (savedTime) setSessionTime(parseInt(savedTime, 10));
    if (savedRunning) setIsSessionRunning(savedRunning === 'true');

    // Start timer immediately if it was running or if it's a new session (time is 0)
    if (savedRunning === 'true' || !savedTime) {
      setIsSessionRunning(true);
    }
  }, []);

  // Save title to localStorage (debounced)
  const saveTitleToLocalStorage = useCallback(
    debounce((title: string) => {
      localStorage.setItem('learnlog-study-title', title);
    }, 500),
    []
  );

  useEffect(() => {
    if (notebookTitle !== 'Untitled Session' || localStorage.getItem('learnlog-study-title')) { // Avoid saving initial default immediately
        saveTitleToLocalStorage(notebookTitle);
    }
  }, [notebookTitle, saveTitleToLocalStorage]);

  // Save content to localStorage (debounced)
  const saveContentToLocalStorage = useCallback(
    debounce((content: string) => {
      localStorage.setItem('learnlog-study-content', content);
    }, 500),
    []
  );

  useEffect(() => {
    if (noteContent !== '' || localStorage.getItem('learnlog-study-content')) { // Avoid saving initial empty immediately
        saveContentToLocalStorage(noteContent);
    }
  }, [noteContent, saveContentToLocalStorage]);
  
  // Save timer state to localStorage
  useEffect(() => {
    localStorage.setItem('learnlog-study-time', sessionTime.toString());
    localStorage.setItem('learnlog-study-running', isSessionRunning.toString());
  }, [sessionTime, isSessionRunning]);


  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSessionRunning) {
      interval = setInterval(() => {
        setSessionTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionRunning]);

  const toggleSessionRunning = () => {
    setIsSessionRunning(prev => !prev);
  };

  const toggleReferencePanel = () => setIsReferencePanelOpen(prev => !prev);

  return (
    <SettingsProvider>
      <div className="flex flex-col h-screen bg-[#0A0A0A] text-foreground overflow-hidden">
        <AppHeader />
        
        <div className="flex flex-1 overflow-hidden">
          <SessionSidebar 
            notebookTitle={notebookTitle}
            onNotebookTitleChange={setNotebookTitle}
          />

          <main className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto relative custom-scrollbar">
            
            <div className="flex items-center justify-end mb-4 space-x-2"> {/* Removed StudyTimer, buttons to the right */}
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
                    <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs p-1.5">✨ Explain</Button>
                    <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs p-1.5">📋 Summarize</Button>
                    <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs p-1.5">⤴️ Expand</Button>
                  </div>
                )}
              </div>

              {isReferencePanelOpen && (
                <div className="w-[40%] h-full bg-[#0F0F0F] border-white/10 p-4 rounded-md flex flex-col overflow-y-auto custom-scrollbar">
                  <div className="flex items-center border-b border-white/10 pb-2 mb-2 text-sm">
                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-t-md">Physics.pdf</span>
                    <span className="px-3 py-1 text-muted-foreground hover:bg-white/5 rounded-t-md">Chapter1.pdf</span>
                    <button className="ml-auto text-muted-foreground hover:text-foreground">&times;</button>
                  </div>
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    PDF / Previous Notes Viewer Area
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 text-xs text-muted-foreground text-right border-t border-white/10 pt-2">
                Word Count: {noteContent.split(/\s+/).filter(Boolean).length} | Saved { /* Implement more accurate save status later */}
            </div>
          </main>
        </div>
        <FloatingTimerWidget 
            timeInSeconds={sessionTime}
            isRunning={isSessionRunning}
            onTogglePlayPause={toggleSessionRunning}
        />
      </div>
    </SettingsProvider>
  );
}
