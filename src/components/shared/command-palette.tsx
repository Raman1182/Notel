'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { commandPaletteActions, type CommandAction } from '@/config/command-palette-actions';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '../ui/scroll-area';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredActions, setFilteredActions] = useState<CommandAction[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm(''); // Reset search term when opening
      setSelectedIndex(0); // Reset selected index
      // Focus input after a short delay to ensure it's rendered
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm) {
      const sections: Record<string, CommandAction[]> = {};
      commandPaletteActions.forEach(action => {
        if (!sections[action.section]) sections[action.section] = [];
        sections[action.section].push(action);
      });
      const groupedActions = Object.values(sections).flat();
      setFilteredActions(groupedActions);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const results = commandPaletteActions.filter(action =>
      action.name.toLowerCase().includes(lowerSearchTerm) ||
      (action.keywords && action.keywords.some(keyword => keyword.toLowerCase().includes(lowerSearchTerm)))
    );
    setFilteredActions(results);
    setSelectedIndex(0);
  }, [searchTerm, commandPaletteActions]);

  const handleAction = useCallback((action: CommandAction) => {
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
        setSelectedIndex((prev) => (prev + 1) % filteredActions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          handleAction(filteredActions[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, handleAction]);
  
  // Scroll into view
  useEffect(() => {
    const selectedElement = document.getElementById(`action-${selectedIndex}`);
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 max-w-xl bg-popover/80 backdrop-blur-xl border-border shadow-2xl rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-base h-10 placeholder:text-muted-foreground"
            aria-label="Command input"
          />
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            {filteredActions.length === 0 && searchTerm && (
              <p className="p-4 text-sm text-center text-muted-foreground">No results found.</p>
            )}
            {filteredActions.map((action, index) => {
              const Icon = action.icon;
              // Check if this is the start of a new section
              const isNewSection = index === 0 || filteredActions[index-1].section !== action.section;
              
              return (
                <div key={action.id}>
                  {isNewSection && (
                    <p className="px-3 py-2 text-xs font-semibold text-muted-foreground tracking-wider">
                      {action.section}
                    </p>
                  )}
                  <button
                    id={`action-${index}`}
                    onClick={() => handleAction(action)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-md transition-colors duration-100 ease-in-out
                      ${index === selectedIndex ? 'bg-primary/20 text-primary-foreground' : 'hover:bg-primary/10'}`}
                    aria-selected={index === selectedIndex}
                    role="option"
                  >
                    {Icon && <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary-foreground" />}
                    <span className="flex-1 text-sm">{action.name}</span>
                    {action.href && <span className="text-xs text-muted-foreground">Navigate</span>}
                  </button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
