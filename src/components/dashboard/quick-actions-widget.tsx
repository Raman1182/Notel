
'use client';

import { Button } from '@/components/ui/button';
import { WidgetCard } from './widget-card';
import { BookOpen, FilePlus2, Lightbulb, PlayCircle } from 'lucide-react'; // Added PlayCircle
import { useRouter } from 'next/navigation';

export function QuickActionsWidget() {
  const router = useRouter();

  const handleNewNote = () => {
    // Placeholder: In a real app, this would open a new note editor or trigger a command
    console.log("New Note Clicked");
    // Potentially use command palette action:
    // commandPaletteActions.find(a => a.id === 'new-note')?.perform?.();
    // For now, could also route to a notes page or trigger command palette for new note
    const event = new CustomEvent('open-command-palette', { detail: { initialQuery: 'create new note' } });
    window.dispatchEvent(event);
  };
  
  const handleStudySession = () => {
    router.push('/study/launch'); // Updated to launch page
  };

  const handleAISummary = () => {
    // Placeholder: trigger AI assistant
    const event = new CustomEvent('open-ai-assistant', { detail: { mode: 'summarize' } });
    window.dispatchEvent(event);
  };

  return (
    <WidgetCard title="Quick Actions">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          className="w-full h-20 flex flex-col items-center justify-center space-y-1 border-primary/30 hover:bg-primary/10 hover:text-primary-foreground group transition-all duration-200 ease-out hover:shadow-3d-lift hover:-translate-y-0.5"
          onClick={handleStudySession}
        >
          <PlayCircle className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" /> {/* Updated Icon */}
          <span className="text-sm">New Session</span>
        </Button>
        <Button 
          variant="outline" 
          className="w-full h-20 flex flex-col items-center justify-center space-y-1 border-primary/30 hover:bg-primary/10 hover:text-primary-foreground group transition-all duration-200 ease-out hover:shadow-3d-lift hover:-translate-y-0.5"
          onClick={handleNewNote}
        >
          <FilePlus2 className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
          <span className="text-sm">New Note</span>
        </Button>
        <Button 
          variant="outline" 
          className="w-full h-20 flex flex-col items-center justify-center space-y-1 sm:col-span-2 border-primary/30 hover:bg-primary/10 hover:text-primary-foreground group transition-all duration-200 ease-out hover:shadow-3d-lift hover:-translate-y-0.5"
          onClick={handleAISummary}
          >
          <Lightbulb className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
          <span className="text-sm">AI Summarizer</span>
        </Button>
      </div>
    </WidgetCard>
  );
}

    