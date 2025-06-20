
'use client';

import React, { useState } from 'react';
import { ChevronDown, FileText, FolderOpen, FolderClosed, BookText, Sparkles, History, Settings, ChevronsLeftRight, PlusSquare, Edit3, Trash2, Dot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';

export interface TreeNode {
  id: string;
  name: string;
  type: 'subject' | 'title' | 'subheading' | 'note';
  children?: TreeNode[];
  parentId: string | null; 
}

const TypeIconMap: Record<TreeNode['type'], React.ElementType> = {
  subject: BookText,
  title: FolderOpen, 
  subheading: FolderOpen, 
  note: FileText,
};


interface TreeItemDisplayProps {
  item: TreeNode;
  level: number;
  onSelectNode: (id: string, type: TreeNode['type']) => void;
  activeNodeId: string | null;
  onAddNode: (parentId: string | null, type: 'title' | 'subheading' | 'note') => void;
  // Add rename/delete handlers later
}

const TreeItemDisplay: React.FC<TreeItemDisplayProps> = ({ item, level, onSelectNode, activeNodeId, onAddNode }) => {
  const [isOpen, setIsOpen] = useState(level < 1 || item.type === 'subject'); // Auto-open subject and first level titles
  
  const hasChildren = item.children && item.children.length > 0;
  let ItemIcon = TypeIconMap[item.type];

  if ((item.type === 'title' || item.type === 'subheading') && hasChildren) {
    ItemIcon = isOpen ? FolderOpen : FolderClosed;
  } else if (item.type === 'subject') {
    ItemIcon = BookText; // Always book for subject root
  }


  const handleToggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };
  
  const handleSelect = () => {
    onSelectNode(item.id, item.type);
    if (hasChildren && !isOpen && item.type !== 'note') { 
        setIsOpen(true);
    }
  };

  const handleAddChild = (e: React.MouseEvent, childType: 'title' | 'subheading' | 'note') => {
    e.stopPropagation();
    onAddNode(item.id, childType);
    if (!isOpen) setIsOpen(true); // Open parent if adding child
  };

  return (
    <div>
      <div 
        className={`flex items-center py-1.5 pr-1 group cursor-pointer rounded-md text-sm
                    transition-colors duration-100 ease-in-out relative
                    ${activeNodeId === item.id ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100'}`}
        style={{ paddingLeft: `${0.5 + level * 0.8}rem` }} // Reduced indent factor
        onClick={handleSelect}
      >
        {hasChildren && item.type !== 'subject' ? (
          <button onClick={handleToggleOpen} className="p-0.5 mr-1.5 rounded-sm hover:bg-white/20 focus:outline-none shrink-0">
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
          </button>
        ) : (
           item.type !== 'subject' && <span className="w-4 mr-1.5 shrink-0"><Dot className="h-4 w-4 opacity-50"/></span> // Space for non-children non-subject, or use Dot
        )}
        
        <ItemIcon className={`h-4 w-4 mr-1.5 shrink-0 ${item.type === 'subject' ? 'text-primary' : ''}`} />
        <span className="truncate flex-1 group-hover:text-foreground-opacity-100">{item.name}</span>

        {/* Placeholder for add/edit/delete actions - shown on hover */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-0.5">
          {item.type !== 'note' && (
            <Button variant="ghost" size="icon" className="h-5 w-5 p-0.5 hover:bg-white/20" title={`Add note to ${item.name}`} onClick={(e) => handleAddChild(e, 'note')}>
              <PlusSquare className="h-3.5 w-3.5" />
            </Button>
          )}
          {/* Add other action buttons (edit, delete) here later */}
        </div>
      </div>
      {isOpen && hasChildren && (
        <div className="border-l border-white/10 ml-[calc(0.5rem_+_0.5rem_+_0.25rem)]" style={{paddingLeft: `${item.type === 'subject' ? 0 : 0.5}rem`}}>
          {item.children?.map(child => (
            <TreeItemDisplay key={child.id} item={child} level={level + 1} onSelectNode={onSelectNode} activeNodeId={activeNodeId} onAddNode={onAddNode} />
          ))}
        </div>
      )}
    </div>
  );
};

interface SessionSidebarProps {
  sessionSubject: string;
  treeData: TreeNode[];
  onSelectNode: (id: string, type: TreeNode['type']) => void;
  activeNodeId: string | null;
  onAddNode: (parentId: string | null, type: 'title' | 'subheading' | 'note') => void;
}

export function SessionSidebar({ sessionSubject, treeData, onSelectNode, activeNodeId, onAddNode }: SessionSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const rootNode = treeData.length > 0 && treeData[0].type === 'subject' ? treeData[0] : null;

  if (isCollapsed) {
    return (
      <div className="w-[60px] h-full bg-[#0F0F0F] text-white p-3 flex flex-col items-center space-y-4 shrink-0 transition-all duration-300 ease-in-out border-r border-white/10">
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(false)} className="hover:bg-white/20">
          <ChevronsLeftRight className="h-5 w-5 transform rotate-180" />
        </Button>
        <BookText className="h-6 w-6 text-primary cursor-pointer hover:opacity-80" title={sessionSubject || "Notebook"}/>
        {/* Simplified icons for collapsed mode */}
        <PlusSquare className="h-6 w-6 text-foreground-opacity-70 cursor-pointer hover:opacity-80" title="Add Note" onClick={() => onAddNode(rootNode?.id || null, 'note')}/>
        <Sparkles className="h-6 w-6 text-foreground-opacity-70 cursor-pointer hover:opacity-80" title="AI Tools"/>
        <Settings className="h-6 w-6 text-foreground-opacity-70 cursor-pointer hover:opacity-80 mt-auto" title="Session Settings"/>
      </div>
    );
  }

  return (
    <div className="w-[280px] h-full bg-[#0F0F0F] text-white p-3 flex flex-col shrink-0 overflow-y-hidden custom-scrollbar transition-all duration-300 ease-in-out border-r border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 w-full mr-1">
            <BookText className="h-5 w-5 text-primary flex-shrink-0" />
            <h2 className="text-lg font-semibold truncate" title={sessionSubject}>
                {sessionSubject}
            </h2>
        </div>
        <div className="flex items-center">
            <Button variant="ghost" size="icon" title="Add New Note to Subject" onClick={() => onAddNode(rootNode?.id || null, 'note')} className="hover:bg-white/20 h-7 w-7 p-1">
                <PlusSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)} className="hover:bg-white/20 h-7 w-7 p-1">
                <ChevronsLeftRight className="h-5 w-5" />
            </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 -ml-2 pr-1"> 
         {rootNode && rootNode.children && rootNode.children.map(childNode => (
             <TreeItemDisplay 
                key={childNode.id}
                item={childNode} 
                level={0} 
                onSelectNode={onSelectNode} 
                activeNodeId={activeNodeId}
                onAddNode={onAddNode}
              />
         ))}
         {(!rootNode || !rootNode.children || rootNode.children.length === 0) && (
            <p className="text-xs text-muted-foreground p-2 text-center">No notes yet. Click '+' to add.</p>
         )}
      </ScrollArea>
    </div>
  );
}
