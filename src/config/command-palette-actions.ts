import type { LucideIcon } from 'lucide-react';
import { Home, BookOpen, Lightbulb, Settings, FileText } from 'lucide-react';

export interface CommandAction {
  id: string;
  name: string;
  section: string;
  icon?: LucideIcon;
  keywords?: string[];
  perform?: () => void; // For client-side actions like navigation
  href?: string; // For Next.js Link navigation
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
    id: 'study-session',
    name: 'Start New Study Session',
    section: 'Actions',
    icon: BookOpen,
    keywords: ['study', 'session', 'focus', 'timer'],
    href: '/study', // Assuming a study page
  },
  {
    id: 'new-note',
    name: 'Create New Note',
    section: 'Notes',
    icon: FileText,
    keywords: ['note', 'new', 'document', 'write'],
    perform: () => console.log('Action: Create New Note (placeholder)'),
  },
  {
    id: 'ai-summary',
    name: 'Summarize Content with AI',
    section: 'AI Tools',
    icon: Lightbulb,
    keywords: ['ai', 'summary', 'summarize', 'assistant'],
    perform: () => {
      // This could open the AI assistant or a specific modal
      console.log('Action: Open AI Summarizer (placeholder)');
      // Potentially use a global state to open the AI Assistant component
      const event = new CustomEvent('open-ai-assistant');
      window.dispatchEvent(event);
    },
  },
  {
    id: 'settings',
    name: 'Open Settings',
    section: 'App',
    icon: Settings,
    keywords: ['preferences', 'settings', 'configure', 'options'],
    perform: () => {
      // This could open the settings popover in the header, or navigate to a settings page
      // For simplicity, this might just log or trigger a UI element if easily accessible
      const settingsButton = document.querySelector('button[aria-label="App settings"]') as HTMLElement;
      settingsButton?.click();
      console.log('Action: Open Settings (placeholder)');
    },
  },
];
