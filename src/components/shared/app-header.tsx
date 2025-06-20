'use client';

import { Cog, Minus, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/contexts/settings-context';
import Link from 'next/link';

export function AppHeader() {
  const { fontSize, setFontSize, highContrast, setHighContrast } = useSettings();

  const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 1, 24));
  const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 1, 12));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Sparkles className="h-7 w-7 text-primary" />
          <span className="text-2xl font-bold font-headline tracking-tight">LearnLog</span>
        </Link>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="App settings">
              <Cog className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 space-y-4 bg-popover text-popover-foreground rounded-xl shadow-xl border-border">
            <div className="space-y-2">
              <Label htmlFor="font-size" className="text-sm font-medium">Font Size</Label>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={decreaseFontSize} aria-label="Decrease font size">
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center text-sm tabular-nums">{fontSize}px</span>
                <Button variant="outline" size="icon" onClick={increaseFontSize} aria-label="Increase font size">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="high-contrast" className="text-sm font-medium">High Contrast</Label>
              <Switch
                id="high-contrast"
                checked={highContrast}
                onCheckedChange={setHighContrast}
                aria-label="Toggle high contrast mode"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
