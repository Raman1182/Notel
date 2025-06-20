
'use client';

// This component is no longer used as the primary navigation sidebar
// after switching to the command palette / spotlight search system.
// It is kept here for reference or potential future use in specific contexts
// but is not actively part of the main app layout.

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
  // useSidebar, // Not used directly here if this component is just for structure
} from "@/components/ui/enhanced-sidebar"; // Assuming enhanced-sidebar is the new name for sidebar.tsx
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Home,
  BookOpen,
  FileText,
  ListChecks,
  Briefcase,
  Sparkles, 
  Settings,
  Target, 
  MessageCircle
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/study', label: 'Study Sessions', icon: BookOpen },
  { href: '/notes', label: 'My Notes', icon: FileText },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/resources', label: 'Resources', icon: Briefcase },
  { href: '/ai-assistant', label: 'AI Assistant', icon: MessageCircle },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  // const { state: sidebarState } = useSidebar(); // Context hook would error if not within provider

  const handleStartSession = () => {
    router.push('/study');
  };

  return (
    <Sidebar side="left" collapsible="icon" variant="floating" className="border-r border-border/50">
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
            <span className="ml-2 group-data-[collapsible=icon]:hidden min-w-0 truncate">Start Session</span>
          </Button>
        </div>

        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                tooltip={item.label}
                className="group-data-[collapsible=icon]:justify-start" 
              >
                <Link href={item.href} passHref>
                  <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary group-data-[active=true]:text-primary flex-shrink-0" />
                  <span className="min-w-0 truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t-0">
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
          <span>Study Streak: 7 🔥</span>
        </div>
        <Separator className="my-2 bg-border/50 group-data-[collapsible=icon]:hidden" />

        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:py-2">
          <Avatar className="h-9 w-9 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10">
            <AvatarImage src="https://placehold.co/40x40.png" alt="User avatar" data-ai-hint="person minimalist" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="font-semibold text-foreground">John Doe</p>
          </div>
        </div>
         <SidebarMenuButton
            asChild
            isActive={pathname === '/settings'}
            tooltip="Settings"
            className="group-data-[collapsible=icon]:justify-start"
        >
            <Link href="/settings" passHref>
                <Settings className="h-5 w-5 text-muted-foreground group-hover:text-primary group-data-[active=true]:text-primary flex-shrink-0" />
                <span className="min-w-0 truncate group-data-[collapsible=icon]:hidden">Settings</span>
            </Link>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
