
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  useSidebar, // Import useSidebar
} from "@/components/ui/enhanced-sidebar";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Home,
  BookOpen,
  FileText,
  ListChecks,
  Library,
  Sparkles, // Changed from Lightbulb for logo, use Lightbulb for AI Assistant
  Settings,
  Target, // For Start Session icon
  Briefcase, // Example for Resources
  MessageCircle // Example for AI Assistant
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home, shortcut: '⌘H' },
  { href: '/study', label: 'Study Sessions', icon: BookOpen, shortcut: '⌘S' },
  { href: '/notes', label: 'My Notes', icon: FileText, shortcut: '⌘N' },
  { href: '/tasks', label: 'Tasks', icon: ListChecks, shortcut: '⌘T' },
  { href: '/resources', label: 'Resources', icon: Briefcase, shortcut: '⌘R' }, // Using Briefcase for Resources
  { href: '/ai-assistant', label: 'AI Assistant', icon: MessageCircle, shortcut: '⌘A' }, // Using MessageCircle for AI Assistant
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state: sidebarState } = useSidebar(); // Get sidebar state

  const handleStartSession = () => {
    router.push('/study');
  };

  return (
    <Sidebar side="left" collapsible="icon" variant="floating">
      <SidebarHeader className="p-4 border-b-0 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary transition-all duration-300 group-hover:rotate-[20deg]" />
          <span className="text-2xl font-bold font-headline tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
            LearnLog
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex flex-col p-2 gap-4">
        <div className="px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
           <Button 
            variant="default" 
            className="w-full h-10 shadow-3d-lift group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:p-0"
            onClick={handleStartSession}
            aria-label="Start Study Session"
          >
            <Target className="h-5 w-5" />
            <span className="ml-2 group-data-[collapsible=icon]:hidden">Start Session</span>
          </Button>
        </div>

        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                  tooltip={item.label}
                  shortcut={item.shortcut}
                  className="group-data-[collapsible=icon]:justify-center"
                >
                  <a> {/* Content is now icon then label */}
                    <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-sidebar-primary group-data-[active=true]:text-primary" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t-0">
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
          <span>Study Streak: 7 🔥</span>
        </div>
        <Separator className="my-2 bg-sidebar-border group-data-[collapsible=icon]:hidden" />
        
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:py-2">
          <Avatar className="h-9 w-9 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10">
            <AvatarImage src="https://placehold.co/40x40.png" alt="User avatar" data-ai-hint="person minimalist" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="font-semibold text-foreground">John Doe</p>
          </div>
        </div>
         <Link href="/settings" passHref legacyBehavior className="mt-2">
            <SidebarMenuButton
                asChild
                isActive={pathname === '/settings'}
                tooltip="Settings"
                className="group-data-[collapsible=icon]:justify-center"
            >
                <a>
                    <Settings className="h-5 w-5 text-muted-foreground group-hover:text-sidebar-primary group-data-[active=true]:text-primary" />
                    <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                </a>
            </SidebarMenuButton>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
