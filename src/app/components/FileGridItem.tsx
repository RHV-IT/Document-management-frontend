import { Document } from '../types';
import { FileIcon } from './FileIcon';
import { formatFileSize, formatDate } from '../utils/fileUtils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ui/context-menu';
import { 
  Edit2, 
  Trash2, 
  Copy, 
  Scissors, 
  Download, 
  Star,
  Share2,
  Info
} from 'lucide-react';

interface FileGridItemProps {
  item: Document;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function FileGridItem({
  item,
  isSelected,
  onClick,
  onDoubleClick,
  onRename,
  onDelete,
}: FileGridItemProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={`group relative flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-all hover:bg-accent hover:border-primary/50 ${
            isSelected ? 'bg-accent border-primary' : 'bg-card'
          }`}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
        >
          <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-3 bg-muted/50">
            <FileIcon 
              type={item.type} 
              className="size-8" 
            />
          </div>
          
          <div className="w-full text-center">
            <p className="text-sm truncate mb-1">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(item.size)}
            </p>
          </div>
        </div>
      </ContextMenuTrigger>
      
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onDoubleClick}>
          <FileIcon type={item.type} className="size-4 mr-2" />
          Open
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onRename}>
          <Edit2 className="size-4 mr-2" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem>
          <Copy className="size-4 mr-2" />
          Copy
        </ContextMenuItem>
        <ContextMenuItem>
          <Scissors className="size-4 mr-2" />
          Cut
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          <Star className="size-4 mr-2" />
          Add to Favorites
        </ContextMenuItem>
        <ContextMenuItem>
          <Share2 className="size-4 mr-2" />
          Share
        </ContextMenuItem>
        <ContextMenuItem>
          <Download className="size-4 mr-2" />
          Download
        </ContextMenuItem>
        <ContextMenuItem>
          <Info className="size-4 mr-2" />
          Properties
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="size-4 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}