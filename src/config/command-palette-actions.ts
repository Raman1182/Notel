
import type { LucideIcon } from 'lucide-react';
import { Home, BookOpen, Lightbulb, Settings, FileText, ListChecks, Briefcase, MessageCircle, PlayCircle, Wand2, CalendarClock, LinkIcon } from 'lucide-react'; 

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
    keywords: ['study', 'session', 'focus', 'timer', 'new session', 'launch', 'pomodoro'],
    href: '/study/launch', 
  },
  {
    id: 'my-notes', 
    name: 'View My Notes',
    section: 'Navigation', 
    icon: BookOpen,
    keywords: ['note', 'notes', 'documents', 'write', 'view', 'saved sessions', 'subjects', 'journey'],
    href: '/notes', 
  },
  {
    id: 'study-calendar',
    name: 'Open Study Calendar',
    section: 'Navigation',
    icon: CalendarClock,
    keywords: ['calendar', 'schedule', 'deadlines', 'plan', 'events'],
    href: '/calendar',
  },
  {
    id: 'tasks',
    name: 'Tasks & Deadlines (Dashboard)', 
    section: 'Navigation',
    icon: ListChecks,
    keywords: ['todo', 'tasks', 'assignments', 'checklist', 'deadlines', 'dashboard tasks'],
    href: '/#tasks', 
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
    id: 'open-ai-assistant-chat', 
    name: 'Open AI Assistant (Chat)', 
    section: 'AI Tools', 
    icon: MessageCircle,
    keywords: ['ai', 'assistant', 'chatbot', 'help', 'ask question', 'study buddy'],
    perform: () => {
        const event = new CustomEvent('open-ai-assistant', { detail: { mode: 'chat' } });
        window.dispatchEvent(event);
      },
  },
  {
    id: 'open-ai-assistant-process-link', 
    name: 'Process Link with AI', 
    section: 'AI Tools', 
    icon: LinkIcon, 
    keywords: ['ai', 'assistant', 'url', 'summarize link', 'youtube summary', 'article summary', 'notes from link'],
    perform: () => {
        const event = new CustomEvent('open-ai-assistant', { detail: { mode: 'process_link' } });
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
   { // This action is now somewhat redundant due to the above, but kept for broader "summarize" keyword
    id: 'ai-summarize-generic-action', 
    name: 'Summarize Content with AI (Chat)', 
    section: 'AI Tools', 
    icon: Lightbulb, 
    keywords: ['summarize', 'ai tool', 'quick summary', 'digest text', 'explain', 'expand'],
    perform: () => { // Opens general chat, user can paste or ask for summary
      const event = new CustomEvent('open-ai-assistant', { detail: { mode: 'chat' } });
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
        // This might be better handled by the AI Smart Search in command palette
        // or a more direct "add note to current session" command if a session is active.
        // For now, it can open the command palette focused on a more specific query.
        const event = new CustomEvent('open-command-palette', { detail: { initialQuery: 'create new note in session' } });
        window.dispatchEvent(event);
    }
  },
];

