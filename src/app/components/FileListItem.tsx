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

interface FileListItemProps {
  item: Document;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function FileListItem({
  item,
  isSelected,
  onClick,
  onDoubleClick,
  onRename,
  onDelete,
}: FileListItemProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={`group grid grid-cols-[auto_1fr_150px_150px] gap-4 items-center p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent hover:border-primary/50 ${
            isSelected ? 'bg-accent border-primary' : 'bg-card'
          }`}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
        >
          <div className="w-10 h-10 rounded flex items-center justify-center bg-muted/50">
            <FileIcon 
              type={item.type} 
              className="size-5" 
            />
          </div>
          
          <div className="min-w-0">
            <p className="text-sm truncate">{item.name}</p>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {formatFileSize(item.size)}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {formatDate(item.uploadedAt)}
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