import type { LucideIcon } from 'lucide-react';
import { Home, BookOpen, Lightbulb, Settings, FileText, ListChecks, Briefcase, MessageCircle } from 'lucide-react'; // Added ListChecks, Briefcase, MessageCircle

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
    id: 'study-session',
    name: 'Start/View Study Session', // Name updated for clarity
    section: 'Navigation', // Changed section
    icon: BookOpen,
    keywords: ['study', 'session', 'focus', 'timer'],
    href: '/study', 
  },
  {
    id: 'my-notes', // ID updated
    name: 'My Notes', // Name updated
    section: 'Navigation', // Changed section
    icon: FileText,
    keywords: ['note', 'notes', 'documents', 'write', 'view'],
    href: '/notes', // Assuming a /notes page
  },
  {
    id: 'tasks',
    name: 'Tasks',
    section: 'Navigation',
    icon: ListChecks,
    keywords: ['todo', 'tasks', 'assignments', 'checklist'],
    href: '/tasks', // Assuming a /tasks page
  },
  {
    id: 'resources',
    name: 'Resources',
    section: 'Navigation',
    icon: Briefcase, 
    keywords: ['links', 'resources', 'materials', 'library'],
    href: '/resources', // Assuming a /resources page
  },
  {
    id: 'ai-assistant-nav', // ID updated to avoid conflict
    name: 'AI Assistant',
    section: 'Navigation',
    icon: MessageCircle,
    keywords: ['ai', 'summary', 'summarize', 'assistant', 'chatbot', 'help'],
    href: '/ai-assistant', // Assuming an /ai-assistant page or opens the bubble
    perform: () => {
        // This could open the AI assistant bubble if it's not a dedicated page
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
    href: '/settings', // Assuming a /settings page
    perform: () => {
      // If settings are a popover and not a page, trigger it.
      // const settingsButton = document.querySelector('button[aria-label="App settings"]') as HTMLElement;
      // settingsButton?.click();
    },
  },
   // Example of a specific action if AI Summarizer is different from general AI Assistant
   {
    id: 'ai-summarize-action',
    name: 'Summarize Content (AI)',
    section: 'AI Tools', // Kept as a separate tool for quick access
    icon: Lightbulb, // Using Lightbulb as per original quick actions
    keywords: ['summarize', 'ai tool', 'quick summary'],
    perform: () => {
      const event = new CustomEvent('open-ai-assistant', { detail: { mode: 'summarize' } });
      window.dispatchEvent(event);
    },
  },
  { // Example for "New Note" if it's a direct action and not just nav
    id: 'create-new-note-action',
    name: 'Create New Note',
    section: 'Actions',
    icon: FileText, // Or a 'PlusSquare' type icon
    keywords: ['new note', 'add note', 'quick note'],
    perform: () => console.log('Action: Create New Note (placeholder)'), // Implement actual logic
  },
];

