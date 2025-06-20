
'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, FolderOpen, FolderClosed, BookText, Sparkles, History, Settings, ChevronsLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TreeItemData {
  id: string;
  label: string;
  iconType?: 'H1' | 'H2' | 'H3' | 'FILE';
  children?: TreeItemData[];
}

// Sample static tree data, to be made dynamic later
const sampleSubTreeData: TreeItemData[] = [
  { 
    id: 'chap1', 
    label: 'Chapter 1: Introduction', 
    iconType: 'H2', 
    children: [
      { id: 'chap1-intro', label: 'Overview', iconType: 'H3' },
      { id: 'chap1-concepts', label: 'Key Concepts', iconType: 'FILE' },
    ]
  },
  { 
    id: 'chap2', 
    label: 'Chapter 2: Core Mechanics', 
    iconType: 'H2',
  },
  { id: 'session-note', label: 'General Session Note', iconType: 'FILE' },
];

const IconMap: Record<Required<TreeItemData>['iconType'], React.ElementType> = {
  H1: BookText, 
  H2: FolderOpen,
  H3: ChevronRight,
  FILE: FileText,
};

const TreeItemDisplay: React.FC<{ item: TreeItemData; level: number; onSelect: (id: string) => void; activeId: string | null }> = ({ item, level, onSelect, activeId }) => {
  const [isOpen, setIsOpen] = useState(level < 1); 
  
  const hasChildren = item.children && item.children.length > 0;
  let ItemIcon = IconMap[item.iconType || 'FILE'];

  if (item.iconType === 'H2' && hasChildren) {
    ItemIcon = isOpen ? FolderOpen : FolderClosed;
  } else if (hasChildren && item.iconType === 'H3') {
     ItemIcon = ChevronRight; // Keep as chevron for H3, or specific icon if needed
  }


  const handleToggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };
  
  const handleSelect = () => {
    onSelect(item.id);
    if (hasChildren && !isOpen) { // Only open if not already open on select
        setIsOpen(true);
    } else if (hasChildren && isOpen && item.iconType !== 'H1') { // allow H1 to re-toggle
        // If it's already open and has children (and not H1), selecting again does not close it.
        // To make it toggle open/close on re-select, add: setIsOpen(!isOpen);
    }
  };

  return (
    <div>
      <div 
        className={`flex items-center py-1.5 pr-2 group cursor-pointer rounded-md text-sm
                    transition-colors duration-100 ease-in-out
                    ${activeId === item.id ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100'}`}
        style={{ paddingLeft: `${0.5 + level * 1}rem` }}
        onClick={handleSelect}
      >
        {hasChildren && item.iconType !== 'H1' ? ( // H1 (root) doesn't get its own chevron from this logic
          <button onClick={handleToggleOpen} className="p-0.5 mr-1 rounded-sm hover:bg-white/20 focus:outline-none">
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
          </button>
        ) : (
           item.iconType !== 'H1' && <span className="w-4 mr-1.5 shrink-0"></span> // Space for non-children, non-H1
        )}
        {/* Icon for H1 is handled by its wrapper */}
        {item.iconType !== 'H1' && <ItemIcon className={`h-4 w-4 mr-2 shrink-0 ${item.iconType === 'H1' ? 'text-primary' : ''}`} />}
        <span className="truncate flex-1 group-hover:text-foreground-opacity-100">{item.label}</span>
      </div>
      {isOpen && hasChildren && (
        // For H1, children are indented normally. For others, slightly more.
        <div className={`border-l border-white/10 ml-[calc(0.5rem_+_0.5rem_+_0.25rem)]`} style={{ paddingLeft: `${level === -1 ? 0 : 0.75}rem`}}>
          {item.children?.map(child => (
            <TreeItemDisplay key={child.id} item={child} level={level + 1} onSelect={onSelect} activeId={activeId} />
          ))}
        </div>
      )}
    </div>
  );
};

interface SessionSidebarProps {
  sessionSubject: string;
}

export function SessionSidebar({ sessionSubject }: SessionSidebarProps) {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  // The overall session subject is now passed as a prop. 
  // If we want an editable title within the sidebar for the session, it can be added.
  // For now, using sessionSubject directly.

  const handleSelectNote = (id: string) => {
    setActiveNoteId(id);
    // Here, you would typically load the content for the selected note/section into the main editor
    console.log("Selected note/section ID:", id);
  };

  if (isCollapsed) {
    return (
      <div className="w-[60px] h-full bg-[#0F0F0F] text-white p-3 flex flex-col items-center space-y-4 shrink-0 transition-all duration-300 ease-in-out border-r border-white/10">
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(false)} className="hover:bg-white/20">
          <ChevronsLeftRight className="h-5 w-5 transform rotate-180" />
        </Button>
        <BookText className="h-6 w-6 text-primary cursor-pointer hover:opacity-80" title={sessionSubject || "Notebook"}/>
        <Sparkles className="h-6 w-6 text-foreground-opacity-70 cursor-pointer hover:opacity-80" title="AI Tools"/>
        <History className="h-6 w-6 text-foreground-opacity-70 cursor-pointer hover:opacity-80" title="Revision History"/>
        <Settings className="h-6 w-6 text-foreground-opacity-70 cursor-pointer hover:opacity-80 mt-auto" title="Session Settings"/>
      </div>
    );
  }

  // Root node for the tree, using sessionSubject
  const rootTreeItem: TreeItemData = {
    id: 'session-root',
    label: sessionSubject,
    iconType: 'H1', // Represents the main subject/notebook
    children: sampleSubTreeData, // Static children for now
  };

  return (
    <div className="w-[280px] h-full bg-[#0F0F0F] text-white p-4 flex flex-col shrink-0 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out border-r border-white/10">
      <div className="flex items-center justify-between mb-1">
        {/* Displaying session subject as a non-editable title here, or could use an Input if desired */}
        <div className="flex items-center gap-2 w-full mr-2">
            <BookText className="h-5 w-5 text-primary flex-shrink-0" />
            <h2 className="text-lg font-semibold truncate" title={sessionSubject}>
                {sessionSubject}
            </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)} className="hover:bg-white/20 flex-shrink-0">
          <ChevronsLeftRight className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 -ml-2"> {/* Negative margin to align TreeItemDisplay padding */}
         <TreeItemDisplay 
            item={rootTreeItem} 
            level={-1} // Root level is special
            onSelect={handleSelectNote} 
            activeId={activeNoteId}
          />
      </div>
    </div>
  );
}
