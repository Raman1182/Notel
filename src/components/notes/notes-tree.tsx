'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarTrigger,
  SidebarTitle,
} from "@/components/ui/enhanced-sidebar"; // Assuming enhanced-sidebar is the new name for sidebar.tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger as AccordionPrimitiveTrigger } from '@/components/ui/accordion';
import { FileText, Folder, ChevronRight, GripVertical } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from "@/lib/utils";
import * as AccordionPrimitive from "@radix-ui/react-accordion";


interface NoteItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  children?: NoteItem[];
}

const sampleNotes: NoteItem[] = [
  {
    id: '1', label: 'Semester 1', icon: Folder, children: [
      { id: '1-1', label: 'Calculus Notes', icon: FileText },
      { id: '1-2', label: 'Physics Lectures', icon: FileText, children: [
        { id: '1-2-1', label: 'Chapter 1: Mechanics', icon: FileText },
        { id: '1-2-2', label: 'Chapter 2: Thermodynamics', icon: FileText },
      ]},
    ]
  },
  {
    id: '2', label: 'Research Project', icon: Folder, children: [
      { id: '2-1', label: 'Literature Review', icon: FileText },
      { id: '2-2', label: 'Methodology', icon: FileText },
    ]
  },
  { id: '3', label: 'Personal Memos', icon: FileText },
];

// Custom AccordionTrigger to conditionally hide chevron
const CustomAccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & { showChevron?: boolean }
>(({ className, children, showChevron = true, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        !showChevron && "accordion-trigger-no-chevron",
        className
      )}
      {...props}
    >
      {children}
      {showChevron && <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200" />}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
CustomAccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;


function NotesAccordionRecursive({ items, level = 0, activeNoteId, setActiveNoteId }: { items: NoteItem[], level?: number, activeNoteId: string | null, setActiveNoteId: (id: string) => void }) {
  return (
    <Accordion type="multiple" className="w-full">
      {items.map((item) => (
        <AccordionItem value={item.id} key={item.id} className="border-b-0">
          <CustomAccordionTrigger
            className={`hover:bg-sidebar-accent/50 rounded-md px-2 py-1.5 text-sm
            ${activeNoteId === item.id ? 'bg-primary/20 text-primary-foreground shadow-[inset_2px_0_0_0_hsl(var(--primary))]' : ''}`}
            style={{ paddingLeft: `${0.5 + level * 1}rem` }}
            onClick={() => { if(!item.children) setActiveNoteId(item.id) }}
            showChevron={!!item.children}
          >
            <div className="flex items-center gap-2">
              {item.icon && <item.icon className="h-4 w-4 text-muted-foreground" />}
              <span>{item.label}</span>
            </div>
          </CustomAccordionTrigger>
          {item.children && item.children.length > 0 && (
            <AccordionContent className="pt-0 pb-0 pl-0">
              <NotesAccordionRecursive items={item.children} level={level + 1} activeNoteId={activeNoteId} setActiveNoteId={setActiveNoteId} />
            </AccordionContent>
          )}
        </AccordionItem>
      ))}
      <style jsx global>{`
        .accordion-trigger-no-chevron > svg { display: none !important; }
      `}</style>
    </Accordion>
  );
}


export function NotesTree() {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  return (
    <Sidebar side="left" collapsible="icon" variant="sidebar" className="border-r border-border/50">
      <SidebarHeader className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <Folder className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold font-headline">My Notes</h2>
        </div>
        <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
         <button className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-8 h-8 rounded-md hover:bg-sidebar-accent" onClick={() => {
            const trigger = document.querySelector('[data-sidebar="trigger"]') as HTMLElement | null;
            trigger?.click();
         }}>
            <Folder className="h-5 w-5 text-primary" />
        </button>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <ScrollArea className="h-full">
            <div className="p-2">
              <NotesAccordionRecursive items={sampleNotes} activeNoteId={activeNoteId} setActiveNoteId={setActiveNoteId} />
            </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
