import { 
  FileText, 
  File,
  FileType as FileTypeIcon,
  FileSpreadsheet,
  Presentation
} from 'lucide-react';
import { FileType } from '../types';

interface FileIconProps {
  type: FileType;
  className?: string;
  color?: string;
}

export function FileIcon({ type, className = 'size-5', color }: FileIconProps) {
  const iconProps = { className, style: color ? { color } : undefined };
  
  switch (type) {
    case 'pdf':
      return <FileTypeIcon {...iconProps} className={`${className} text-red-600`} />;
    case 'docx':
    case 'doc':
      return <FileText {...iconProps} className={`${className} text-blue-600`} />;
    case 'xlsx':
      return <FileSpreadsheet {...iconProps} className={`${className} text-green-600`} />;
    case 'pptx':
      return <Presentation {...iconProps} className={`${className} text-orange-600`} />;
    default:
      return <File {...iconProps} />;
  }
}