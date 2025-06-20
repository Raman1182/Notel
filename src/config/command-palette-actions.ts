
import type { LucideIcon } from 'lucide-react';
import { Home, BookOpen, Lightbulb, Settings, FileText, ListChecks, Briefcase, MessageCircle, PlayCircle } from 'lucide-react'; // Added PlayCircle

export interface CommandAction {
  id: string;
  name: string;
  section: string;
  icon?: LucideIcon;
  keywords?: string[];
  perform?: () => void; // For client-side actions like navigation
  href?: string; // For Next.js Link navigation
}

// Corresponds to the new AppSidebar navigation
export const commandPaletteActions: CommandAction[] = [
  {
    id: 'home',
    name: 'Go to Dashboard',
    section: 'Navigation',
    icon: Home,
    keywords: ['home', 'main', 'dashboard', 'overview'],
    href: '/',
  },
  {
    id: 'study-session-launch', // ID updated
    name: 'New Study Session', 
    section: 'Navigation', 
    icon: PlayCircle, // Updated Icon
    keywords: ['study', 'session', 'focus', 'timer', 'new session', 'launch'],
    href: '/study/launch', // Updated href
  },
  {
    id: 'my-notes', 
    name: 'My Notes', 
    section: 'Navigation', 
    icon: FileText,
    keywords: ['note', 'notes', 'documents', 'write', 'view'],
    href: '/notes', 
  },
  {
    id: 'tasks',
    name: 'Tasks',
    section: 'Navigation',
    icon: ListChecks,
    keywords: ['todo', 'tasks', 'assignments', 'checklist'],
    href: '/tasks', 
  },
  {
    id: 'resources',
    name: 'Resources',
    section: 'Navigation',
    icon: Briefcase, 
    keywords: ['links', 'resources', 'materials', 'library'],
    href: '/resources', 
  },
  {
    id: 'ai-assistant-nav', 
    name: 'AI Assistant',
    section: 'Navigation',
    icon: MessageCircle,
    keywords: ['ai', 'summary', 'summarize', 'assistant', 'chatbot', 'help'],
    href: '/ai-assistant', 
    perform: () => {
        const event = new CustomEvent('open-ai-assistant', { detail: { mode: 'chat' } });
        window.dispatchEvent(event);
      },
  },
  {
    id: 'settings',
    name: 'Open Settings',
    section: 'App',
    icon: Settings,
    keywords: ['preferences', 'settings', 'configure', 'options', 'profile'],
    href: '/settings', 
    perform: () => {
      // If settings are a popover and not a page, trigger it.
      // const settingsButton = document.querySelector('button[aria-label="App settings"]') as HTMLElement;
      // settingsButton?.click();
    },
  },
   {
    id: 'ai-summarize-action',
    name: 'Summarize Content (AI)',
    section: 'AI Tools', 
    icon: Lightbulb, 
    keywords: ['summarize', 'ai tool', 'quick summary'],
    perform: () => {
      const event = new CustomEvent('open-ai-assistant', { detail: { mode: 'summarize' } });
      window.dispatchEvent(event);
    },
  },
  { 
    id: 'create-new-note-action',
    name: 'Create New Note',
    section: 'Actions',
    icon: FileText, 
    keywords: ['new note', 'add note', 'quick note'],
    // Example: perform: () => router.push('/notes/new') or trigger command palette for new note creation UI
    perform: () => {
        const event = new CustomEvent('open-command-palette', { detail: { initialQuery: 'create new note' } });
        window.dispatchEvent(event);
    }
  },
];

    