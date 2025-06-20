
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { commandPaletteActions, type CommandAction } from '@/config/command-palette-actions';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2, Lightbulb, History, Wand2 } from 'lucide-react'; // Added icons
import { smartSearchFlow, type SmartSearchInput, type SmartSearchOutput } from '@/ai/flows/smart-search-flow';
import { useToast } from '@/hooks/use-toast';

interface RecentItem extends CommandAction {
  timestamp: number;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<CommandAction[]>([]);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [quickCommands, setQuickCommands] = useState<CommandAction[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const allFilteredActions = [...aiSuggestions, ...recentItems, ...quickCommands];

  // Listener for external open command
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setSearchTerm('');
      setSelectedIndex(0);
      // Reset AI states
      setAiSuggestions([]);
      setAiResponse(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    window.addEventListener('open-command-palette', handleOpen);
    return () => window.removeEventListener('open-command-palette', handleOpen);
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        setIsOpen((open) => {
          const newOpenState = !open;
          if (newOpenState) {
            setSearchTerm('');
            setSelectedIndex(0);
            setAiSuggestions([]);
            setAiResponse(null);
            setTimeout(() => inputRef.current?.focus(), 100);
          }
          return newOpenState;
        });
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Load recent items from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRecents = localStorage.getItem('learnlog-recent-cmd-items');
      if (storedRecents) {
        setRecentItems(JSON.parse(storedRecents));
      }
    }
  }, [isOpen]);

  const addRecentItem = (action: CommandAction) => {
    setRecentItems(prev => {
      const newRecents = [
        { ...action, timestamp: Date.now() },
        ...prev.filter(item => item.id !== action.id)
      ].slice(0, 5); // Keep last 5
      if (typeof window !== 'undefined') {
        localStorage.setItem('learnlog-recent-cmd-items', JSON.stringify(newRecents));
      }
      return newRecents;
    });
  };

  // AI Search Debounce
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 3) {
      setAiSuggestions([]);
      setAiResponse(null);
      setIsLoadingAi(false);
      return;
    }

    setIsLoadingAi(true);
    const handler = setTimeout(async () => {
      try {
        const input: SmartSearchInput = { query: searchTerm, currentPage: window.location.pathname };
        const result: SmartSearchOutput = await smartSearchFlow(input);
        
        setAiSuggestions(result.suggestedActions || []);
        setAiResponse(result.aiResponse || null);

      } catch (error) {
        console.error('Error fetching AI suggestions:', error);
        toast({
          title: "AI Search Error",
          description: "Could not fetch AI suggestions.",
          variant: "destructive",
        });
        setAiSuggestions([]);
        setAiResponse(null);
      } finally {
        setIsLoadingAi(false);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, toast]);


  // Filter Quick Commands
  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    if (!lowerSearchTerm) {
      // Show some default commands or group by section initially
      const initialCommands = commandPaletteActions.filter(action => 
        ['Navigation', 'App'].includes(action.section) // Show some common sections by default
      ).slice(0,5);
      setQuickCommands(initialCommands);
      return;
    }
    
    const results = commandPaletteActions.filter(action =>
      action.name.toLowerCase().includes(lowerSearchTerm) ||
      (action.keywords && action.keywords.some(keyword => keyword.toLowerCase().includes(lowerSearchTerm)))
    ).slice(0, 10); // Limit results
    setQuickCommands(results);
    setSelectedIndex(0); // Reset index when commands change
  }, [searchTerm, commandPaletteActions]);


  const handleAction = useCallback((action: CommandAction) => {
    addRecentItem(action);
    if (action.href) {
      router.push(action.href);
    } else if (action.perform) {
      action.perform();
    }
    setIsOpen(false);
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, allFilteredActions.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allFilteredActions.length) % Math.max(1, allFilteredActions.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allFilteredActions[selectedIndex]) {
          handleAction(allFilteredActions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allFilteredActions, selectedIndex, handleAction]);
  
  useEffect(() => {
    const selectedElement = document.getElementById(`action-item-${selectedIndex}`);
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  const renderSection = (title: string, icon: React.ElementType, items: CommandAction[], isLoading?: boolean, emptyText?: string) => {
    if (isLoading) {
      return (
        <div className="px-3 py-2">
          <div className="flex items-center text-xs font-semibold text-muted-foreground tracking-wider mb-2">
            {React.createElement(icon, { className: "h-4 w-4 mr-2 animate-pulse-subtle" })}
            {title}
          </div>
          <div className="p-4 text-center text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        </div>
      );
    }

    if (!items || items.length === 0) {
      if (emptyText && searchTerm) { // Only show empty text if there's a search term and items are expected
         return (
            <div className="px-3 py-2">
                <div className="flex items-center text-xs font-semibold text-muted-foreground tracking-wider mb-2">
                    {React.createElement(icon, { className: "h-4 w-4 mr-2" })}
                    {title}
                </div>
                {/* <p className="p-2 text-sm text-center text-muted-foreground">{emptyText}</p> */}
            </div>
         );
      }
      return null;
    }

    return (
      <div className="px-1 py-2">
        <div className="flex items-center px-3 text-xs font-semibold text-muted-foreground tracking-wider mb-1">
          {React.createElement(icon, { className: "h-4 w-4 mr-2" })}
          {title}
        </div>
        {items.map((action, index) => {
          // Calculate global index for selection
          let globalIndex = 0;
          if (items === aiSuggestions) globalIndex = index;
          else if (items === recentItems) globalIndex = aiSuggestions.length + index;
          else if (items === quickCommands) globalIndex = aiSuggestions.length + recentItems.length + index;
          
          const ActionIcon = action.icon;
          return (
            <button
              key={action.id + '-' + index} // Ensure unique keys if IDs repeat across sections
              id={`action-item-${globalIndex}`}
              onClick={() => handleAction(action)}
              className={`w-full text-left flex items-center gap-3 p-2.5 mx-1 rounded-md transition-colors duration-100 ease-in-out
                ${globalIndex === selectedIndex ? 'bg-primary/20 text-primary-foreground' : 'hover:bg-primary/10'}`}
              aria-selected={globalIndex === selectedIndex}
              role="option"
            >
              {ActionIcon && <ActionIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary-foreground flex-shrink-0" />}
              <span className="flex-1 text-sm truncate">{action.name}</span>
              {action.href && <span className="text-xs text-muted-foreground">Navigate</span>}
            </button>
          );
        })}
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 max-w-2xl w-[95vw] sm:w-full bg-popover/80 backdrop-blur-xl border-border shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-3 border-b border-border">
          <Input
            ref={inputRef}
            type="text"
            placeholder="What do you need? Type commands or ask AI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-lg h-12 placeholder:text-muted-foreground"
            aria-label="Command input"
          />
        </div>
        <ScrollArea className="flex-grow">
          <div className="py-1">
            {isLoadingAi && searchTerm.length >=3 && renderSection("AI Suggestions", Wand2, [], true)}
            {!isLoadingAi && aiResponse && (
                <div className="px-1 py-2">
                    <div className="flex items-center px-3 text-xs font-semibold text-muted-foreground tracking-wider mb-1">
                        <Wand2 className="h-4 w-4 mr-2" /> AI Assistant
                    </div>
                    <div className="p-3 mx-1 my-1 rounded-md bg-secondary text-secondary-foreground text-sm">
                        {aiResponse}
                    </div>
                </div>
            )}
            {!isLoadingAi && aiSuggestions.length > 0 && renderSection("AI Suggestions", Wand2, aiSuggestions)}
            
            {searchTerm.length === 0 && recentItems.length > 0 && renderSection("Recent", History, recentItems)}
            
            {quickCommands.length > 0 && renderSection("Quick Commands", Lightbulb, quickCommands, false, "No commands match your search.")}

            {allFilteredActions.length === 0 && searchTerm && !isLoadingAi && (
              <p className="p-6 text-sm text-center text-muted-foreground">No results found for "{searchTerm}".</p>
            )}
          </div>
        </ScrollArea>
        <div className="p-2 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Tip: Use <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-sm dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">Cmd+K</kbd> or <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-sm dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">/</kbd> to open.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
