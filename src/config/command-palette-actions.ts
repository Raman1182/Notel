
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
    name: 'My Notes', 
    section: 'Navigation', 
    icon: FileText,
    keywords: ['note', 'notes', 'documents', 'write', 'view', 'saved sessions'],
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
    // href: '/ai-assistant',  // Removed direct href as it opens a dialog
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
        // This action implies adding a note to the *current* study session.
        // If a study session is active, we could dispatch an event to it.
        // For now, it might be better suited as a command within an active session
        // rather than a global command palette action unless we can target the active session.
        // Or, it could prompt to start a new session if none is active.
        // For simplicity, let's assume it attempts to trigger a new note in the command palette
        // which might then guide the user or interact with an active session if the logic exists.
        // This is a placeholder for more complex logic.
        const event = new CustomEvent('open-command-palette', { detail: { initialQuery: 'create new note in session' } });
        window.dispatchEvent(event);
        // alert("To create a new note, please start or resume a study session and use the sidebar options.");
    }
  },
];
