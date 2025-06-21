
import type { LucideIcon } from 'lucide-react';
import { Home, BookOpen, Lightbulb, Settings, FileText, ListChecks, Briefcase, MessageCircle, PlayCircle, Wand2, CalendarClock, BarChart3, Trophy } from 'lucide-react'; 

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
    id: 'analytics',
    name: 'View Analytics',
    section: 'Navigation',
    icon: BarChart3,
    keywords: ['analytics', 'stats', 'progress', 'data', 'charts'],
    href: '/analytics',
  },
  {
    id: 'achievements',
    name: 'View Achievements',
    section: 'Navigation',
    icon: Trophy,
    keywords: ['achievements', 'gamification', 'badges', 'awards', 'progress'],
    href: '/achievements',
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
    id: 'settings',
    name: 'Open Settings',
    section: 'App',
    icon: Settings,
    keywords: ['preferences', 'settings', 'configure', 'options', 'profile'],
    href: '/settings', 
  },
   { 
    id: 'ai-summarize-generic-action', 
    name: 'Summarize Content with AI (Chat)', 
    section: 'AI Tools', 
    icon: Lightbulb, 
    keywords: ['summarize', 'ai tool', 'quick summary', 'digest text', 'explain', 'expand'],
    perform: () => { 
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
        const event = new CustomEvent('open-command-palette', { detail: { initialQuery: 'create new note in session' } });
        window.dispatchEvent(event);
    }
  },
];
