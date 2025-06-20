
'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, FolderOpen, FolderClosed, BookText, Sparkles, History, Settings, ChevronsLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TreeItemData {
  id: string;
  label: string;
  iconType?: 'H1' | 'H2' | 'H3' | 'FILE';
  children?: TreeItemData[];
}

const sampleTreeData: TreeItemData[] = [
  // This will be replaced by dynamic data from notes later
  // For now, the top-level item label is driven by notebookTitle prop
  { 
    id: 'chap1', 
    label: 'Chapter 1: Wave-Particle Duality', 
    iconType: 'H2', 
    children: [
      { id: 'chap1-intro', label: 'Introduction', iconType: 'H3' },
      { id: 'chap1-experiments', label: 'Key Experiments', iconType: 'FILE' },
      { id: 'chap1-implications', label: 'Implications', iconType: 'FILE' },
    ]
  },
  { 
    id: 'chap2', 
    label: 'Chapter 2: Schrödinger Equation', 
    iconType: 'H2', 
    children: [
      { id: 'chap2-deriv', label: 'Derivation', iconType: 'H3' },
      { id: 'chap2-solutions', label: 'Solutions & Examples', iconType: 'FILE' },
    ]
  },
  { id: 'chap3', label: 'Chapter 3: Quantum Tunneling', iconType: 'H2' },
  { id: 'references', label: 'References', iconType: 'FILE' },
];

const IconMap: Record<Required<TreeItemData>['iconType'], React.ElementType> = {
  H1: BookText, 
  H2: FolderOpen,
  H3: ChevronRight,
  FILE: FileText,
};

const TreeItemDisplay: React.FC<{ item: TreeItemData; level: number; onSelect: (id: string) => void; activeId: string | null }> = ({ item, level, onSelect, activeId }) => {
  const [isOpen, setIsOpen] = useState(level < 1); // Auto-open first level children
  
  const hasChildren = item.children && item.children.length > 0;
  let ItemIcon = IconMap[item.iconType || 'FILE'];

  if (item.iconType === 'H2' && hasChildren) {
    ItemIcon = isOpen ? FolderOpen : FolderClosed;
  } else if (hasChildren && item.iconType === 'H3') {
     ItemIcon = ChevronRight;
  }

  const handleToggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };
  
  const handleSelect = () => {
    onSelect(item.id);
    if (!hasChildren) return;
    setIsOpen(!isOpen);
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
        {hasChildren ? (
          <button onClick={handleToggleOpen} className="p-0.5 mr-1 rounded-sm hover:bg-white/20 focus:outline-none">
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
          </button>
        ) : (
          <span className="w-4 mr-1.5 shrink-0"></span>
        )}
        <ItemIcon className={`h-4 w-4 mr-2 shrink-0 ${item.iconType === 'H1' ? 'text-primary' : ''}`} />
        <span className="truncate flex-1 group-hover:text-foreground-opacity-100">{item.label}</span>
      </div>
      {isOpen && hasChildren && (
        <div className="border-l border-white/10 ml-[calc(0.5rem_+_1rem_*_0.5_+_1px_)]" style={{ paddingLeft: `${level === 0 ? 0 : 0.75}rem`}}>
          {item.children?.map(child => (
            <TreeItemDisplay key={child.id} item={child} level={level + 1} onSelect={onSelect} activeId={activeId} />
          ))}
        </div>
      )}
    </div>
  );
};

interface SessionSidebarProps {
  notebookTitle: string;
  onNotebookTitleChange: (title: string) => void;
}

export function SessionSidebar({ notebookTitle, onNotebookTitleChange }: SessionSidebarProps) {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSelectNote = (id: string) => {
    setActiveNoteId(id);
  };

  if (isCollapsed) {
    return (
      <div className="w-[60px] h-full bg-[#0F0F0F] text-white p-3 flex flex-col items-center space-y-4 shrink-0 transition-all duration-300 ease-in-out border-r border-white/10">
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(false)} className="hover:bg-white/20">
          <ChevronsLeftRight className="h-5 w-5 transform rotate-180" />
        </Button>
        <BookText className="h-6 w-6 text-primary cursor-pointer hover:opacity-80" title={notebookTitle || "Notebook"}/>
        <Sparkles className="h-6 w-6 text-foreground-opacity-70 cursor-pointer hover:opacity-80" title="AI Tools"/>
        <History className="h-6 w-6 text-foreground-opacity-70 cursor-pointer hover:opacity-80" title="Revision History"/>
        <Settings className="h-6 w-6 text-foreground-opacity-70 cursor-pointer hover:opacity-80 mt-auto" title="Session Settings"/>
      </div>
    );
  }

  return (
    <div className="w-[280px] h-full bg-[#0F0F0F] text-white p-4 flex flex-col shrink-0 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out border-r border-white/10">
      <div className="flex items-center justify-between mb-3">
        <input 
          type="text" 
          value={notebookTitle}
          onChange={(e) => onNotebookTitleChange(e.target.value)}
          className="w-full bg-transparent text-lg font-semibold border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 outline-none placeholder-muted-foreground truncate mr-2"
          placeholder="Notebook Title"
        />
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)} className="hover:bg-white/20">
          <ChevronsLeftRight className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1">
        {/* The first item is the notebook itself, its children are the actual sections */}
         <TreeItemDisplay 
            item={{ id: 'notebook-root', label: 'Content Outline', iconType: 'H1', children: sampleTreeData }} 
            level={-1} // Special level to hide its own expander/icon for root
            onSelect={handleSelectNote} 
            activeId={activeNoteId}
          />
      </div>
    </div>
  );
}
