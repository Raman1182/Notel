
'use client';

import { Cog, Menu, Minus, Plus, Sparkles, Home, BookOpen, FileText, ListChecks, Briefcase, MessageCircle, Target, Settings as SettingsIcon, Flame, Search, PlayCircle, CalendarClock, LogOut, User as UserIcon, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/contexts/settings-context';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth
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
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { fontSize, setFontSize, highContrast, setHighContrast } = useSettings();
  const { user, signInWithGoogle, signOut, loading } = useAuth(); // Get auth state and functions
  const router = useRouter();
  const pathname = usePathname(); 

  const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 2, 24));
  const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 2, 12));

  const openCommandPalette = () => {
    const event = new CustomEvent('open-command-palette');
    window.dispatchEvent(event);
  };
  
  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/study/launch', label: 'New Session', icon: PlayCircle },
    { href: '/notes', label: 'View Notes', icon: FileText },
    { href: '/calendar', label: 'Calendar', icon: CalendarClock },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold font-headline tracking-tight">LearnLog</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-1">
          {navLinks.map(link => (
            <Button 
              key={link.href}
              variant="ghost" 
              onClick={() => router.push(link.href)} 
              className={cn(
                "text-foreground-opacity-70 hover:text-foreground",
                pathname === link.href && "text-primary bg-primary/10 font-semibold"
              )}
            >
              {link.icon && <link.icon className="mr-2 h-4 w-4" />}
              {link.label}
            </Button>
          ))}
        </div>


        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={openCommandPalette}
            className="rounded-full h-10 w-10 hover:bg-primary/10 focus-visible:ring-primary/50 focus-visible:ring-offset-0 active:scale-95 transition-all duration-200 ease-out shadow-sm hover:shadow-md border-primary/30 group"
            aria-label="Open command palette"
          >
            <Search className="h-5 w-5 text-primary group-hover:text-primary transition-colors" />
          </Button>
          
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || `https://placehold.co/40x40.png?text=${user.displayName?.charAt(0) || 'U'}`} alt={user.displayName || "User avatar"} data-ai-hint="person minimalist" />
                    <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="h-5 w-5"/>}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-popover text-popover-foreground border-border shadow-xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || "No email"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center cursor-pointer">
                  <Flame className="mr-2 h-4 w-4 text-warning" />
                  Study Streak: (Coming Soon)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <Popover>
                  <PopoverTrigger asChild>
                      <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
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
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings" className="w-full flex items-center">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    More Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive hover:!bg-destructive/20 focus:!bg-destructive/20">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !loading && !user && (
            <Button onClick={signInWithGoogle} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
            </Button>
          )}
          
          {/* Mobile Menu Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-popover text-popover-foreground border-border shadow-xl" align="end" forceMount>
                {navLinks.map(link => (
                    <DropdownMenuItem key={`mobile-${link.href}`} onClick={() => router.push(link.href)}>
                        {link.icon && <link.icon className="mr-2 h-4 w-4" />}
                        {link.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
