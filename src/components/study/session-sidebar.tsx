
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, FileText as FileTextIcon, FolderOpen, FolderClosed, BookText, ChevronsLeftRight, PlusSquare, FilePlus2, FolderPlus, Dot, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface TreeNode {
  id: string;
  name: string;
  type: 'subject' | 'title' | 'subheading' | 'note';
  children?: TreeNode[]; 
  parentId: string | null; 
}

export function findNodeByIdRecursive(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeByIdRecursive(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

const TypeIconMap: Record<TreeNode['type'], React.ElementType> = {
  subject: BookText,
  title: FolderOpen, 
  subheading: FolderOpen, 
  note: FileTextIcon,
};

interface TreeItemDisplayProps {
  item: TreeNode;
  level: number;
  onSelectNode: (id: string, type: TreeNode['type']) => void;
  activeNodeId: string | null;
  onAddNode: (parentId: string, type: 'title' | 'subheading' | 'note', name: string) => void;
  onRenameNode: (nodeId: string, newName: string) => void;
  onDeleteNode: (nodeId: string) => void;
  isReadOnly?: boolean;
}

const TreeItemDisplay: React.FC<TreeItemDisplayProps> = ({ item, level, onSelectNode, activeNodeId, onAddNode, onRenameNode, onDeleteNode, isReadOnly = false }) => {
  const [isOpen, setIsOpen] = useState(level < 1 || item.type === 'subject' || (item.children && item.children.length > 0 && (item.type === 'title' || item.type === 'subheading'))); 
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(item.name);
  
  const [editingChild, setEditingChild] = useState<{type: 'title' | 'subheading' | 'note', name: string} | null>(null);
  const childInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
    }
    if (editingChild && childInputRef.current) {
      childInputRef.current.focus();
    }
  }, [isEditing, editingChild]);
  
  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };
  
  const handleRenameConfirm = (e?: React.FocusEvent | React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (editingName.trim()) {
        onRenameNode(item.id, editingName);
    } else {
        setEditingName(item.name); // Revert if empty
    }
    setIsEditing(false);
  };

  const handleStartAddChild = (type: 'title' | 'subheading' | 'note', e?: React.MouseEvent) => {
    if (isReadOnly) return;
    e?.stopPropagation();
    e?.preventDefault();
    setEditingChild({ type, name: '' });
    if (!isOpen && item.children && item.children.length >= 0) { 
      setIsOpen(true);
    }
  };

  const handleChildNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingChild) {
      setEditingChild({ ...editingChild, name: e.target.value });
    }
  };

  const handleConfirmAddChild = (e?: React.FormEvent | React.FocusEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (editingChild && editingChild.name.trim()) {
      onAddNode(item.id, editingChild.type, editingChild.name.trim());
    }
    setEditingChild(null);
  };
  
  const handleCancelAddChild = () => {
    setEditingChild(null);
  };
  
  const ItemIcon = (item.type === 'title' || item.type === 'subheading') 
                    ? (isOpen ? FolderOpen : FolderClosed) 
                    : TypeIconMap[item.type];

  const handleToggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === 'subject' || item.type === 'title' || item.type === 'subheading') { 
      setIsOpen(!isOpen);
    }
  };
  
  const handleSelect = () => {
    if (!isEditing) {
        onSelectNode(item.id, item.type);
    }
  };

  const canAddSubheading = item.type === 'title'; 
  const canAddNoteToThisLevel = item.type === 'subject' || item.type === 'title' || item.type === 'subheading';
  const canBeParent = item.type === 'subject' || item.type === 'title' || item.type === 'subheading';

  return (
    <div>
      <div 
        className={cn(
            `flex items-center py-1.5 pr-1 group cursor-pointer rounded-md text-sm
            transition-colors duration-100 ease-in-out relative`,
            activeNodeId === item.id ? 'bg-primary/20 text-primary font-medium' : 'hover:bg-white/10 text-foreground-opacity-70 hover:text-foreground-opacity-100'
        )}
        style={{ paddingLeft: `${0.5 + level * 0.8}rem` }}
        onClick={handleSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {canBeParent ? (
          <button onClick={handleToggleOpen} className="p-0.5 mr-1.5 rounded-sm hover:bg-white/20 focus:outline-none shrink-0">
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
          </button>
        ) : (
           <span className="w-4 mr-1.5 shrink-0 flex items-center justify-center"><Dot className="h-4 w-4 opacity-50"/></span>
        )}
        
        <ItemIcon className={cn(`h-4 w-4 mr-1.5 shrink-0`, item.type === 'subject' ? 'text-primary' : activeNodeId === item.id ? 'text-primary': 'text-foreground-opacity-50 group-hover:text-foreground-opacity-70')} />
        
        {isEditing ? (
             <form onSubmit={handleRenameConfirm} className="flex-1">
                <Input
                  ref={editInputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { e.preventDefault(); setIsEditing(false); setEditingName(item.name); }
                  }}
                  onBlur={handleRenameConfirm}
                  className="bg-transparent text-sm outline-none border border-primary/50 rounded px-2 py-1 w-full focus:border-primary h-7"
                />
              </form>
        ) : (
            <span className="truncate flex-1 group-hover:text-foreground-opacity-100">{item.name}</span>
        )}


        {!isReadOnly && isHovered && !editingChild && !isEditing && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center space-x-0.5 bg-[#0F0F0F] p-0.5 rounded">
            {canAddSubheading && ( 
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0.5 hover:bg-white/20" title={`Add Sub-heading to ${item.name}`} onClick={(e) => handleStartAddChild('subheading', e)}>
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
            )}
            {canAddNoteToThisLevel && ( 
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0.5 hover:bg-white/20" title={`Add Note to ${item.name}`} onClick={(e) => handleStartAddChild('note', e)}>
                <FilePlus2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-5 w-5 p-0.5 hover:bg-white/20" title={`Rename ${item.name}`} onClick={handleStartEdit}>
                <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5 p-0.5 text-red-500/70 hover:bg-red-500/20 hover:text-red-400" title={`Delete ${item.name}`} onClick={(e) => { e.stopPropagation(); onDeleteNode(item.id); }}>
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
      
      {!isReadOnly && isOpen && editingChild && (
        <div 
          className="flex items-center py-1.5 pr-1" 
          style={{ paddingLeft: `${0.5 + (level + 1) * 0.8}rem` }} 
        >
          {editingChild.type === 'note' && <FileTextIcon className="h-4 w-4 mr-1.5 shrink-0 text-muted-foreground opacity-70" />}
          {(editingChild.type === 'title' || editingChild.type === 'subheading') && <FolderClosed className="h-4 w-4 mr-1.5 shrink-0 text-muted-foreground opacity-70" />}
          <form onSubmit={handleConfirmAddChild} className="flex-1">
            <Input
              ref={childInputRef}
              type="text"
              value={editingChild.name}
              onChange={handleChildNameChange}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { e.preventDefault(); handleCancelAddChild(); }
              }}
              onBlur={handleConfirmAddChild}
              placeholder={`New ${editingChild.type} name...`}
              className="bg-transparent text-sm outline-none border border-primary/50 rounded px-2 py-1 w-full focus:border-primary h-7"
            />
          </form>
        </div>
      )}

      {isOpen && item.children && item.children.map(child => (
        <TreeItemDisplay 
            key={child.id} 
            item={child} 
            level={level + 1} 
            onSelectNode={onSelectNode} 
            activeNodeId={activeNodeId} 
            onAddNode={onAddNode}
            onRenameNode={onRenameNode}
            onDeleteNode={onDeleteNode}
            isReadOnly={isReadOnly}
        />
      ))}
    </div>
  );
};

interface SessionSidebarProps {
  sessionSubject: string;
  treeData: TreeNode[];
  onSelectNode: (id: string, type: TreeNode['type']) => void;
  activeNodeId: string | null;
  onAddNode: (parentId: string | null, type: 'title' | 'subheading' | 'note', name: string) => void;
  onRenameNode: (nodeId: string, newName: string) => void;
  onDeleteNode: (nodeId: string) => void;
  isReadOnly?: boolean;
}

export function SessionSidebar({ 
    sessionSubject, 
    treeData, 
    onSelectNode, 
    activeNodeId, 
    onAddNode,
    onRenameNode,
    onDeleteNode,
    isReadOnly = false 
}: SessionSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAddingAtRoot, setIsAddingAtRoot] = useState<{ type: 'title' | 'note'; name: string } | null>(null);
  const rootInputRef = useRef<HTMLInputElement>(null);

  const rootNode = treeData.length > 0 && treeData[0]?.type === 'subject' ? treeData[0] : null;

  useEffect(() => {
    if (isAddingAtRoot && rootInputRef.current) {
      rootInputRef.current.focus();
    }
  }, [isAddingAtRoot]);

  const handleStartAddAtRoot = (type: 'title' | 'note', e?: React.MouseEvent) => {
    if (isReadOnly || !rootNode) return;
    e?.stopPropagation();
    setIsAddingAtRoot({ type, name: '' });
  };

  const handleRootItemNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAddingAtRoot) {
      setIsAddingAtRoot({ ...isAddingAtRoot, name: e.target.value });
    }
  };

  const handleConfirmAddAtRoot = (e?: React.FormEvent | React.FocusEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isAddingAtRoot && isAddingAtRoot.name.trim() && rootNode) {
      onAddNode(rootNode.id, isAddingAtRoot.type, isAddingAtRoot.name.trim());
    }
    setIsAddingAtRoot(null);
  };

  const handleCancelAddAtRoot = () => {
    setIsAddingAtRoot(null);
  };

  if (isCollapsed) {
    return (
      <div className="w-[60px] h-full bg-[#0F0F0F] text-white p-3 flex flex-col items-center space-y-4 shrink-0 transition-all duration-300 ease-in-out border-r border-white/10">
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(false)} className="hover:bg-white/20">
          <ChevronsLeftRight className="h-5 w-5 transform rotate-180" />
        </Button>
        {rootNode && <BookText className="h-6 w-6 text-primary cursor-pointer hover:opacity-80" title={sessionSubject || "Notebook"} onClick={() => rootNode && onSelectNode(rootNode.id, 'subject')}/>}
      </div>
    );
  }

  return (
    <div className="w-[280px] h-full bg-[#0F0F0F] text-white p-3 flex flex-col shrink-0 overflow-y-hidden custom-scrollbar transition-all duration-300 ease-in-out border-r border-white/10">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
        {rootNode ? (
            <div 
                className={cn(
                    "flex items-center gap-2 w-full mr-1 cursor-pointer rounded-md p-1 flex-grow",
                    activeNodeId === rootNode.id ? 'bg-primary/20 text-primary font-medium -ml-1 pl-2' : 'hover:bg-white/10'
                )}
                onClick={() => rootNode && onSelectNode(rootNode.id, 'subject')}
            >
                <BookText className="h-5 w-5 text-primary flex-shrink-0" />
                <h2 className="text-lg font-semibold truncate" title={sessionSubject}>
                    {sessionSubject}
                </h2>
            </div>
        ) : (
             <div className="flex items-center gap-2 w-full mr-1 p-1 flex-grow">
                <BookText className="h-5 w-5 text-primary flex-shrink-0" />
                <h2 className="text-lg font-semibold truncate text-muted-foreground">Loading...</h2>
            </div>
        )}
        <div className="flex items-center shrink-0">
            {!isReadOnly && rootNode && (
              <>
                <Button variant="ghost" size="icon" title="Add New Title" onClick={(e) => handleStartAddAtRoot('title', e)} className="hover:bg-white/20 h-7 w-7 p-1">
                    <FolderPlus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Add New Note to Subject" onClick={(e) => handleStartAddAtRoot('note', e)} className="hover:bg-white/20 h-7 w-7 p-1">
                    <FilePlus2 className="h-4 w-4" />
                </Button>
              </>
            )}
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
                onRenameNode={onRenameNode}
                onDeleteNode={onDeleteNode}
                isReadOnly={isReadOnly}
              />
         ))}
         {!isReadOnly && rootNode && isAddingAtRoot && (
            <div 
                className="flex items-center py-1.5 pr-1" 
                style={{ paddingLeft: `${0.5 + 0 * 0.8}rem` }} 
            >
                {isAddingAtRoot.type === 'note' && <FileTextIcon className="h-4 w-4 mr-1.5 shrink-0 text-muted-foreground opacity-70" />}
                {isAddingAtRoot.type === 'title' && <FolderClosed className="h-4 w-4 mr-1.5 shrink-0 text-muted-foreground opacity-70" />}
                <form onSubmit={handleConfirmAddAtRoot} className="flex-1">
                <Input
                    ref={rootInputRef}
                    type="text"
                    value={isAddingAtRoot.name}
                    onChange={handleRootItemNameChange}
                    onKeyDown={(e) => {
                    if (e.key === 'Escape') { e.preventDefault(); handleCancelAddAtRoot(); }
                    }}
                    onBlur={handleConfirmAddAtRoot}
                    placeholder={`New ${isAddingAtRoot.type} name...`}
                    className="bg-transparent text-sm outline-none border border-primary/50 rounded px-2 py-1 w-full focus:border-primary h-7"
                />
                </form>
            </div>
         )}
         {rootNode && (!rootNode.children || rootNode.children.length === 0) && !isAddingAtRoot && (
            <p className="text-xs text-muted-foreground p-2 text-center">
              {isReadOnly ? "No notes or titles in this session." : "No items yet. Use buttons above to add."}
            </p>
         )}
         {!rootNode && !isAddingAtRoot && (
             <p className="text-xs text-muted-foreground p-2 text-center">Loading tree...</p>
         )}
      </ScrollArea>
    </div>
  );
}
