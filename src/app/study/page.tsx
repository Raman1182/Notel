
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/shared/app-header'; 
import { Textarea } from '@/components/ui/textarea';
import { SettingsProvider } from '@/components/settings-provider';
import { SessionSidebar } from '@/components/study/session-sidebar';
import { Maximize2, Minimize2, Pause, Play, Settings2, Volume2, VolumeX, FileUp, StickyNote, Paperclip } from 'lucide-react'; // Added Paperclip

// Simple Timer Logic (to be replaced by FloatingTimerWidget later)
const StudyTimer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setIsRunning(true); // Start timer immediately on mount
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="text-center mb-4 text-foreground-opacity-70">
      <p className="text-xl font-mono">
        {formatTime(time)}
      </p>
      <Button onClick={() => setIsRunning(!isRunning)} variant="ghost" size="sm" className="mt-1 text-xs">
        {isRunning ? <Pause className="mr-1 h-3 w-3" /> : <Play className="mr-1 h-3 w-3" />}
        {isRunning ? 'Pause' : 'Start'}
      </Button>
    </div>
  );
};


export default function StudySessionPage() {
  const [isReferencePanelOpen, setIsReferencePanelOpen] = useState(false);
  // Placeholder for AI assist buttons visibility
  const [showAiButtons, setShowAiButtons] = useState(false);


  const toggleReferencePanel = () => setIsReferencePanelOpen(prev => !prev);

  return (
    <SettingsProvider>
      <div className="flex flex-col h-screen bg-[#0A0A0A] text-foreground"> {/* Deep dark background */}
        <AppHeader />
        
        <div className="flex flex-1 overflow-hidden">
          <SessionSidebar />

          {/* Main Content Area (Note Taking + Reference Panel) */}
          <main className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto relative">
            
            {/* Top Bar within Note Area: Timer, Attachment Buttons */}
            <div className="flex items-center justify-between mb-4">
              <StudyTimer /> {/* Simple timer display */}
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={toggleReferencePanel} className="bg-white/5 border-white/10 hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Add PDF
                </Button>
                <Button variant="outline" size="sm" onClick={toggleReferencePanel} className="bg-white/5 border-white/10 hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100">
                  <StickyNote className="h-4 w-4 mr-2" />
                  Previous Notes
                </Button>
              </div>
            </div>

            {/* Note Taking and Reference Panel Split */}
            <div className="flex flex-1 gap-4 min-h-0"> {/* min-h-0 is important for flex children to scroll */}
              <div 
                className="relative flex-1 h-full"
                onMouseEnter={() => setShowAiButtons(true)}
                onMouseLeave={() => setShowAiButtons(false)}
              >
                <Textarea 
                  placeholder="Start typing your notes here for Quantum Mechanics..." 
                  className="w-full h-full bg-[#0F0F0F] border-white/10 rounded-md p-4 text-base resize-none focus:ring-primary focus:border-primary font-code custom-scrollbar"
                />
                {/* Placeholder for AI Assist Buttons */}
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
                  {/* Placeholder for Tab System */}
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
            {/* Placeholder for Status Bar */}
            <div className="mt-4 text-xs text-muted-foreground text-right border-t border-white/10 pt-2">
                Word Count: 0 | Saved a few seconds ago
            </div>
          </main>
        </div>
      </div>
    </SettingsProvider>
  );
}

