
'use client';

import { useState } from 'react'; // Added missing import
import { Button } from '@/components/ui/button';
import { Link2, ExternalLink, Trash2, Loader2, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SavedLink {
  id: string;
  title: string;
  url: string;
}

interface SavedLinkItemProps {
  link: SavedLink;
  onProcessLink: (url: string) => Promise<void>;
  onDelete: (id: string) => void;
  isProcessing: boolean; // To disable process button globally if any link is being processed
}

export function SavedLinkItem({ link, onProcessLink, onDelete, isProcessing }: SavedLinkItemProps) {
  const [isCurrentItemProcessing, setIsCurrentItemProcessing] = useState(false);

  const handleProcessClick = async () => {
    setIsCurrentItemProcessing(true);
    await onProcessLink(link.url);
    setIsCurrentItemProcessing(false);
  };
  
  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  };

  return (
    <div className={cn(
        "flex flex-col p-3 rounded-md bg-card border border-border/70 shadow-sm hover:shadow-md transition-shadow duration-200 space-y-2"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
            <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline flex items-center group"
            title={link.url}
            >
            <Link2 className="h-4 w-4 mr-2 text-primary/80 shrink-0"/>
            <span className="truncate">{link.title}</span>
            <ExternalLink className="h-3 w-3 ml-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"/>
            </a>
            <p className="text-xs text-muted-foreground truncate mt-0.5 ml-6">{getHostname(link.url)}</p>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-1.5 pt-1 border-t border-border/20 -mx-3 px-3 pb-1">
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleProcessClick} 
            disabled={isProcessing || isCurrentItemProcessing}
            className="text-xs text-accent-foreground hover:bg-accent/20 disabled:opacity-60"
        >
          {(isProcessing && isCurrentItemProcessing) ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1.5" />}
          Process
        </Button>
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(link.id)} 
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            disabled={isProcessing || isCurrentItemProcessing}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">Delete link</span>
        </Button>
      </div>
    </div>
  );
}
