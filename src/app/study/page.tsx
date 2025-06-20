
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/shared/app-header'; 
import { Maximize2, Minimize2, Pause, Play, Settings2, Volume2, VolumeX } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { SettingsProvider } from '@/components/settings-provider'; // Added for consistency

const DigitalTimer = () => {
  const [time, setTime] = useState(0); // time in seconds
  const [isRunning, setIsRunning] = useState(false);

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
    <div className="text-center">
      <p className="text-6xl font-bold font-mono text-foreground tabular-nums tracking-tighter">
        {formatTime(time)}
      </p>
      <Button onClick={() => setIsRunning(!isRunning)} variant="ghost" className="mt-2 text-sm">
        {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
        {isRunning ? 'Pause Timer' : 'Start Timer'}
      </Button>
    </div>
  );
};


const FloatingControlBar = ({ onToggleFocus, isFocusMode }: { onToggleFocus: () => void; isFocusMode: boolean }) => {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-auto max-w-md
                    bg-background/70 backdrop-blur-md border border-border 
                    rounded-full shadow-xl p-2 flex items-center space-x-2 z-50">
      <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/20 active:scale-95 transition-transform" aria-label="Play/Pause">
        <Play className="h-5 w-5" /> {/* Icon should toggle based on state */}
      </Button>
      <div className="w-24"> {/* Placeholder for a progress bar or scrub bar */}
         <Progress value={33} className="h-1.5"/>
      </div>
      <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="rounded-full hover:bg-primary/20 active:scale-95 transition-transform" aria-label={isMuted ? "Unmute" : "Mute"}>
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={onToggleFocus} className="rounded-full hover:bg-primary/20 active:scale-95 transition-transform" aria-label={isFocusMode ? "Exit focus mode" : "Enter focus mode"}>
        {isFocusMode ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
      </Button>
       <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/20 active:scale-95 transition-transform" aria-label="Settings">
        <Settings2 className="h-5 w-5" />
      </Button>
    </div>
  );
};


export default function StudySessionPage() {
  const [isFocusMode, setIsFocusMode] = useState(false);

  const toggleFocusMode = () => setIsFocusMode(prev => !prev);

  return (
    <SettingsProvider> {/* Ensure settings context is available if AppHeader uses it */}
      <div className="flex flex-col h-screen bg-background text-foreground">
        <AppHeader />
        
        <div className={`flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 transition-opacity duration-500 ${isFocusMode ? 'opacity-50 [&>*:not(.focused-area)]:opacity-30' : 'opacity-100'}`}>
          {/* PDF/Document Viewer Area */}
          <div className={`h-full flex flex-col items-center justify-center bg-white/5 border-r border-border p-4 ${isFocusMode ? 'focused-area !opacity-100' : ''}`}>
            <p className="text-muted-foreground">PDF Viewer Area</p>
            <iframe src="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" title="Dummy PDF for study session" className="w-full h-5/6 mt-4 rounded-md border border-border"></iframe>
          </div>

          {/* Notes Editor Area */}
          <div className={`h-full flex flex-col items-center justify-center bg-white/5 p-4 ${isFocusMode && !document.activeElement?.closest('.pdf-area') ? 'focused-area !opacity-100' : ''}`}>
            <p className="text-muted-foreground mb-4">Notes Editor Area</p>
            <Textarea 
              defaultValue="Start typing your notes here..." 
              className="w-full h-5/6 bg-input border-border rounded-md p-4 text-base resize-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
        
        <div className={`py-8 transition-opacity duration-500 ${isFocusMode ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}>
          <DigitalTimer />
        </div>

        <FloatingControlBar onToggleFocus={toggleFocusMode} isFocusMode={isFocusMode} />
      </div>
    </SettingsProvider>
  );
}
