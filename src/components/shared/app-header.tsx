
'use client';

import { Cog, Menu, Minus, Plus, Sparkles, Home, BookOpen, FileText, ListChecks, Briefcase, MessageCircle, Target, Settings as SettingsIcon, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/contexts/settings-context';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/study', label: 'Study Sessions', icon: BookOpen },
  { href: '/notes', label: 'My Notes', icon: FileText },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/resources', label: 'Resources', icon: Briefcase },
  { href: '/ai-assistant', label: 'AI Assistant', icon: MessageCircle },
];

export function AppHeader() {
  const { fontSize, setFontSize, highContrast, setHighContrast } = useSettings();
  const pathname = usePathname();
  const router = useRouter();

  const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 2, 24));
  const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 2, 12));

  const handleStartSession = () => {
    router.push('/study');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold font-headline tracking-tight">LearnLog</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "secondary" : "ghost"}
                size="sm"
                asChild
                className="text-sm"
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="default" size="sm" onClick={handleStartSession} className="hidden sm:flex">
            <Target className="mr-2 h-4 w-4" />
            Start Session
          </Button>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border shadow-xl">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.label} asChild>
                    <Link href={item.href} className="flex items-center w-full">
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                   <Button variant="default" size="sm" onClick={handleStartSession} className="w-full justify-start sm:hidden">
                      <Target className="mr-2 h-4 w-4" />
                      Start Session
                    </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* User Menu & Settings */}
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="https://placehold.co/40x40.png" alt="User avatar" data-ai-hint="person minimalist" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-popover text-popover-foreground border-border shadow-xl" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">John Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    john.doe@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center">
                <Flame className="mr-2 h-4 w-4 text-warning" />
                Study Streak: 7 days
              </DropdownMenuItem>
              <DropdownMenuSeparator />
               <Popover>
                <PopoverTrigger asChild>
                    <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                        <Cog className="mr-2 h-4 w-4" /> App Display
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 space-y-4 bg-popover text-popover-foreground rounded-xl shadow-xl border-border ml-2">
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
              <DropdownMenuItem asChild>
                <Link href="/settings" className="w-full flex items-center">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  More Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
