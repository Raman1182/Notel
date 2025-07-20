
'use client';

import { Cog, Menu, Minus, Plus, Sparkles, Home, BookOpen, FileText, ListChecks, Briefcase, MessageCircle, Target, Settings as SettingsIcon, Flame, Search, PlayCircle, CalendarClock, LogOut, User as UserIcon, LogIn, Trophy, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/contexts/settings-context';
import { useAuth } from '@/contexts/auth-context';
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
  const { user, signOut, loading } = useAuth();
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
            <span className="text-2xl font-bold font-headline tracking-tight">Notel</span>
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
                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/analytics" className="w-full flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" /> Analytics
                    </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/achievements" className="w-full flex items-center">
                        <Trophy className="mr-2 h-4 w-4" /> Achievements
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/settings" className="w-full flex items-center">
                        <Cog className="mr-2 h-4 w-4" /> App Settings
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
            <Button onClick={() => router.push('/auth')} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
            </Button>
          )}
          
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
