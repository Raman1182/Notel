
'use client';

import * as React from 'react'; 
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { commandPaletteActions, type CommandAction } from '@/config/command-palette-actions';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2, Lightbulb, History, Wand2 } from 'lucide-react'; 
import { smartSearchFlow, type SmartSearchInput, type SmartSearchOutput } from '@/ai/flows/smart-search-flow';
import { useToast } from '@/hooks/use-toast';

// Define a type for what's actually stored in localStorage
interface StoredRecentItem {
  id: string;
  timestamp: number;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<CommandAction[]>([]);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [recentItems, setRecentItems] = useState<CommandAction[]>([]); // Store full CommandAction objects for rendering
  const [quickCommands, setQuickCommands] = useState<CommandAction[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Listener for external open command
  useEffect(() => {
    const handleOpen = (event?: CustomEvent<{ initialQuery?: string }>) => {
      setIsOpen(true);
      const initialQuery = event?.detail?.initialQuery;
      setSearchTerm(initialQuery || '');
      setSelectedIndex(0);
      setAiSuggestions([]);
      setAiResponse(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    window.addEventListener('open-command-palette', handleOpen as EventListener);
    return () => window.removeEventListener('open-command-palette', handleOpen as EventListener);
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        setIsOpen((open) => {
          const newOpenState = !open;
          if (newOpenState) {
            setSearchTerm(''); // Reset search term on open, unless initialQuery is passed via event
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

  // Load and rehydrate recent items from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const storedRecentsJSON = localStorage.getItem('Notel-recent-cmd-items');
      if (storedRecentsJSON) {
        try {
          const parsedStoredRecents: StoredRecentItem[] = JSON.parse(storedRecentsJSON);
          
          const rehydratedRecents = parsedStoredRecents
            .map(storedItem => {
              const originalAction = commandPaletteActions.find(cmd => cmd.id === storedItem.id);
              if (!originalAction) return null;
              // Attach timestamp for sorting, then it can be used for display if needed or stripped
              return { ...originalAction, timestamp: storedItem.timestamp };
            })
            .filter(item => item !== null) as (CommandAction & { timestamp: number })[];
          
          rehydratedRecents.sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first
          
          setRecentItems(rehydratedRecents);
        } catch (e) {
          console.error("Failed to parse or rehydrate recent items from localStorage", e);
          localStorage.removeItem('Notel-recent-cmd-items');
          setRecentItems([]);
        }
      } else {
        setRecentItems([]);
      }
    }
  }, [isOpen]);


  const addRecentItem = useCallback((action: CommandAction) => {
    let currentStoredRecents: StoredRecentItem[] = [];
    if (typeof window !== 'undefined') {
        const storedRecentsJSON = localStorage.getItem('Notel-recent-cmd-items');
        currentStoredRecents = storedRecentsJSON ? JSON.parse(storedRecentsJSON) : [];
    }

    currentStoredRecents = currentStoredRecents.filter(item => item.id !== action.id);
    currentStoredRecents.unshift({ id: action.id, timestamp: Date.now() });

    const newStoredRecents = currentStoredRecents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    if (typeof window !== 'undefined') {
        localStorage.setItem('Notel-recent-cmd-items', JSON.stringify(newStoredRecents));
    }
    
    // Update the state for immediate UI reflection
    const rehydratedNewRecents = newStoredRecents
        .map(storedItem => {
            const originalAction = commandPaletteActions.find(cmd => cmd.id === storedItem.id);
            if (!originalAction) return null;
            return { ...originalAction, timestamp: storedItem.timestamp };
        })
        .filter(item => item !== null) as (CommandAction & { timestamp: number })[];
    
    rehydratedNewRecents.sort((a, b) => b.timestamp - a.timestamp);
    setRecentItems(rehydratedNewRecents);

  }, []);

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
        
        setAiSuggestions(result.suggestedActions?.map(sa => ({...sa, icon: commandPaletteActions.find(ca => ca.id === sa.id)?.icon || Wand2 })) || []);
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
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, toast]);


  // Filter Quick Commands
  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    if (!lowerSearchTerm) {
      const initialCommands = commandPaletteActions.filter(action => 
        ['Navigation', 'App'].includes(action.section)
      ).slice(0,5);
      setQuickCommands(initialCommands);
      setSelectedIndex(0);
      return;
    }
    
    const results = commandPaletteActions.filter(action =>
      action.name.toLowerCase().includes(lowerSearchTerm) ||
      (action.keywords && action.keywords.some(keyword => keyword.toLowerCase().includes(lowerSearchTerm)))
    ).slice(0, 10);
    setQuickCommands(results);
    setSelectedIndex(0); 
  }, [searchTerm]);

  const allFilteredActions = useMemo(() => {
    const aiActionIds = new Set(aiSuggestions.map(a => a.id));
    const recentActionIds = new Set(recentItems.map(r => r.id));

    const uniqueRecents = recentItems.filter(r => !aiActionIds.has(r.id));
    const uniqueQuickCommands = quickCommands.filter(qc => !aiActionIds.has(qc.id) && !recentActionIds.has(qc.id));
    
    return [...aiSuggestions, ...uniqueRecents, ...uniqueQuickCommands];
  }, [aiSuggestions, recentItems, quickCommands]);


  const handleAction = useCallback((action: CommandAction) => {
    addRecentItem(action);
    if (action.href) {
      router.push(action.href);
    } else if (action.perform) {
      action.perform();
    }
    setIsOpen(false);
  }, [router, addRecentItem]);

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

  const renderSection = (title: string, iconElement: React.ElementType, items: CommandAction[], isLoading?: boolean, itemOffset: number = 0) => {
    if (isLoading) {
      return (
        <div className="px-3 py-2">
          <div className="flex items-center text-xs font-semibold text-muted-foreground tracking-wider mb-2">
            {React.createElement(iconElement, { className: "h-4 w-4 mr-2 animate-pulse-subtle" })}
            {title}
          </div>
          <div className="p-4 text-center text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        </div>
      );
    }

    if (!items || items.length === 0) {
      if (title === "Quick Commands" && searchTerm) { // Only show "No commands match" for Quick Commands if searching
         return (
            <div className="px-3 py-2">
                <div className="flex items-center text-xs font-semibold text-muted-foreground tracking-wider mb-2">
                    {React.createElement(iconElement, { className: "h-4 w-4 mr-2" })}
                    {title}
                </div>
            </div>
         );
      }
      return null;
    }

    return (
      <div className="px-1 py-2">
        <div className="flex items-center px-3 text-xs font-semibold text-muted-foreground tracking-wider mb-1">
          {React.createElement(iconElement, { className: "h-4 w-4 mr-2" })}
          {title}
        </div>
        {items.map((action, localIndex) => {
          const globalIndex = itemOffset + localIndex;
          const ActionIcon = action.icon || Wand2; // Default to Wand2 if no icon
          return (
            <button
              key={action.id + '-' + title + '-' + localIndex} 
              id={`action-item-${globalIndex}`}
              onClick={() => handleAction(action)}
              className={`w-full text-left flex items-center gap-3 p-2.5 mx-1 rounded-md transition-colors duration-100 ease-in-out
                ${globalIndex === selectedIndex ? 'bg-primary/20 text-primary font-semibold' : 'hover:bg-primary/10 text-foreground'}`}
              aria-selected={globalIndex === selectedIndex}
              role="option"
            >
              <ActionIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
              <span className="flex-1 text-sm truncate">{action.name}</span>
              {action.href && <span className="text-xs text-muted-foreground">Navigate</span>}
            </button>
          );
        })}
      </div>
    );
  };
  
  let currentOffset = 0;
  const aiSuggestionsSection = !isLoadingAi && aiSuggestions.length > 0 ? 
    renderSection("AI Suggestions", Wand2, aiSuggestions, false, currentOffset) : null;
  currentOffset += aiSuggestions.length;

  const recentItemsSection = searchTerm.length === 0 && recentItems.length > 0 && !isLoadingAi ? 
    renderSection("Recent", History, recentItems, false, currentOffset) : null;
  if (searchTerm.length === 0 && recentItems.length > 0) currentOffset += recentItems.length;
  
  const quickCommandsSection = quickCommands.length > 0 && !isLoadingAi ? 
    renderSection("Quick Commands", Lightbulb, quickCommands, false, currentOffset) : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 max-w-2xl w-[95vw] sm:w-full bg-popover/80 backdrop-blur-xl border-border shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[80vh]">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
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
            {isLoadingAi && searchTerm.length >=3 && renderSection("AI Suggestions", Wand2, [], true, 0)}
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
            {aiSuggestionsSection}
            {recentItemsSection}
            {quickCommandsSection}

            {allFilteredActions.length === 0 && searchTerm && !isLoadingAi && (
              <p className="p-6 text-sm text-center text-muted-foreground">No results found for "{searchTerm}".</p>
            )}
          </div>
        </ScrollArea>
        <div className="p-2 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Tip: Use <kbd>Cmd+K</kbd> or <kbd>/</kbd> to open.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
