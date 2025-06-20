
'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, FolderOpen, FolderClosed, BookText, Sparkles, History, Settings, ChevronsLeftRight } from 'lucide-react'; // Using FolderOpen/Closed for clarity
import { Button } from '@/components/ui/button'; // For potential future use

interface TreeItemData {
  id: string;
  label: string;
  iconType?: 'H1' | 'H2' | 'H3' | 'FILE'; // For specific icons based on heading level or file
  children?: TreeItemData[];
}

const sampleTreeData: TreeItemData[] = [
  { 
    id: 'notebook-title', 
    label: 'Quantum Mechanics Notes', 
    iconType: 'H1', 
    children: [
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
    ]
  }
];

const IconMap: Record<Required<TreeItemData>['iconType'], React.ElementType> = {
  H1: BookText, 
  H2: FolderOpen, // Will toggle to FolderClosed if not open
  H3: ChevronRight, // Will rotate if it has children and is open
  FILE: FileText,
};

const TreeItemDisplay: React.FC<{ item: TreeItemData; level: number; onSelect: (id: string) => void; activeId: string | null }> = ({ item, level, onSelect, activeId }) => {
  const [isOpen, setIsOpen] = useState(level < 2); // Auto-open H1 and H2
  
  const hasChildren = item.children && item.children.length > 0;
  let ItemIcon = IconMap[item.iconType || 'FILE'];

  if (item.iconType === 'H2' && hasChildren) {
    ItemIcon = isOpen ? FolderOpen : FolderClosed;
  } else if (hasChildren && item.iconType === 'H3') { // For H3 or generic items with children
     ItemIcon = ChevronRight; // Will be rotated via CSS
  }


  const handleToggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selection when toggling
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };
  
  const handleSelect = () => {
    onSelect(item.id);
    // If it's a leaf node, don't toggle open/close state
    if (!hasChildren) return;
    // If it's a folder-like node, toggle its open state on label click
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <div 
        className={`flex items-center py-1.5 pr-2 group cursor-pointer rounded-md text-sm
                    transition-colors duration-100 ease-in-out
                    ${activeId === item.id ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100'}`}
        style={{ paddingLeft: `${0.5 + level * 1}rem` }} // 1rem indent per level
        onClick={handleSelect}
      >
        {hasChildren ? (
          <button onClick={handleToggleOpen} className="p-0.5 mr-1 rounded-sm hover:bg-white/20 focus:outline-none">
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
          </button>
        ) : (
          <span className="w-4 mr-1.5 shrink-0"></span> // Placeholder for alignment if no children expander
        )}
        <ItemIcon className={`h-4 w-4 mr-2 shrink-0 ${item.iconType === 'H1' ? 'text-primary' : ''}`} />
        <span className="truncate flex-1 group-hover:text-foreground-opacity-100">{item.label}</span>
      </div>
      {isOpen && hasChildren && (
        // Indent guide: a left border on the children container
        // The ml is calculated: base_padding_left + icon_area_width + half_of_icon_area_for_centering_line
        <div className="border-l border-white/10 ml-[calc(0.5rem_+_1rem_*_0.5_+_1px_)]" style={{ paddingLeft: `${level === 0 ? 0 : 0.75}rem`}}> {/* Adjusted for sub-level indent */}
          {item.children?.map(child => (
            <TreeItemDisplay key={child.id} item={child} level={level + 1} onSelect={onSelect} activeId={activeId} />
          ))}
        </div>
      )}
    </div>
  );
};


export function SessionSidebar() {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSelectNote = (id: string) => {
    setActiveNoteId(id);
    // Potentially load note content here
  };

  if (isCollapsed) {
    return (
      <div className="w-[60px] h-full bg-[#0F0F0F] text-white p-3 flex flex-col items-center space-y-4 shrink-0 transition-all duration-300 ease-in-out">
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(false)} className="hover:bg-white/20">
          <ChevronsLeftRight className="h-5 w-5 transform rotate-180" />
        </Button>
        <BookText className="h-6 w-6 text-primary cursor-pointer hover:opacity-80" title={sampleTreeData[0]?.label || "Notebook"}/>
        <Sparkles className="h-6 w-6 text-foreground-opacity-70 cursor-pointer hover:opacity-80" title="AI Tools"/>
        <History className="h-6 w-6 text-foreground-opacity-70 cursor-pointer hover:opacity-80" title="Revision History"/>
        <Settings className="h-6 w-6 text-foreground-opacity-70 cursor-pointer hover:opacity-80 mt-auto" title="Session Settings"/>
      </div>
    );
  }

  return (
    <div className="w-[280px] h-full bg-[#0F0F0F] text-white p-4 flex flex-col shrink-0 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between mb-3">
        <input 
          type="text" 
          defaultValue={sampleTreeData[0]?.label || "Untitled Notebook"} 
          className="w-full bg-transparent text-lg font-semibold border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 outline-none placeholder-muted-foreground truncate mr-2"
          placeholder="Notebook Title"
        />
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)} className="hover:bg-white/20">
          <ChevronsLeftRight className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1">
        {sampleTreeData.map(item => (
          <TreeItemDisplay key={item.id} item={item} level={0} onSelect={handleSelectNote} activeId={activeNoteId}/>
        ))}
      </div>
    </div>
  );
}

