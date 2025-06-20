
import type { LucideIcon } from 'lucide-react';
import { Home, BookOpen, Lightbulb, Settings, FileText, ListChecks, Briefcase, MessageCircle, PlayCircle, Wand2 } from 'lucide-react'; // Added Wand2 for AI Tools

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
    name: 'View My Notes',
    section: 'Navigation', 
    icon: BookOpen,
    keywords: ['note', 'notes', 'documents', 'write', 'view', 'saved sessions', 'subjects', 'journey'],
    href: '/notes', 
  },
  {
    id: 'tasks',
    name: 'Tasks & Deadlines', // Combined for clarity
    section: 'Navigation',
    icon: ListChecks,
    keywords: ['todo', 'tasks', 'assignments', 'checklist', 'deadlines'],
    href: '/tasks', // Assuming a /tasks page might consolidate these
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
    name: 'Open AI Assistant', // General "Open" command
    section: 'AI Tools', // Moved to AI Tools for consistency
    icon: MessageCircle,
    keywords: ['ai', 'assistant', 'chatbot', 'help', 'ask question'],
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
    id: 'ai-summarize-content-action', // Kept specific ID for summarization if needed later
    name: 'Summarize Content with AI', // More specific
    section: 'AI Tools', 
    icon: Lightbulb, // Lightbulb for specific tool
    keywords: ['summarize', 'ai tool', 'quick summary', 'digest text'],
    perform: () => {
      // This can open the assistant in summarize mode, or trigger a specific summarize UI later
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
        // This might need to become smarter, e.g., check if a session is active
        // For now, it opens command palette again, perhaps to pick a session or use current context
        const event = new CustomEvent('open-command-palette', { detail: { initialQuery: 'create new note in session' } });
        window.dispatchEvent(event);
    }
  },
];
