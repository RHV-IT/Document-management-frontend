export type FileType = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'doc' | 'other';

export interface Document {
  id: string;
  name: string;
  type: FileType;
  size: number;
  uploadedAt: Date;
  lastAccessed: Date;
  filePath: string; // Server file path
  uploadedBy: string;
  patientId?: string;
  department?: string;
  description?: string;
}

export type ViewMode = 'grid' | 'list';
export type SortBy = 'name' | 'date' | 'size' | 'type';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  staffId: string;
  role: 'admin' | 'staff';
  department: string;
  dateAdded: Date;
  status: 'active' | 'inactive';
}