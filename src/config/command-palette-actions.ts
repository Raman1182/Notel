
import type { LucideIcon } from 'lucide-react';
import { Home, BookOpen, Lightbulb, Settings, FileText, ListChecks, Briefcase, MessageCircle, PlayCircle } from 'lucide-react';

export interface CommandAction {
  id: string;
  name: string;
  section: string;
  icon?: LucideIcon;
  keywords?: string[];
  perform?: () => void; 
  href?: string; 
}

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
    id: 'study-session-launch', 
    name: 'New Study Session', 
    section: 'Navigation', 
    icon: PlayCircle, 
    keywords: ['study', 'session', 'focus', 'timer', 'new session', 'launch'],
    href: '/study/launch', 
  },
  {
    id: 'my-notes', 
    name: 'View My Notes', // Updated name
    section: 'Navigation', 
    icon: BookOpen, // Changed icon to BookOpen to differentiate from FileText
    keywords: ['note', 'notes', 'documents', 'write', 'view', 'saved sessions', 'subjects', 'journey'],
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
    name: 'Create New Note (in active session)',
    section: 'Actions',
    icon: FileText, 
    keywords: ['new note', 'add note', 'quick note', 'current session'],
    perform: () => {
        const event = new CustomEvent('open-command-palette', { detail: { initialQuery: 'create new note in session' } });
        window.dispatchEvent(event);
    }
  },
];
