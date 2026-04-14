import { useState, useMemo, useEffect } from 'react';
import { Document, ViewMode, SortBy, FileType } from '../types';
import { Sidebar } from '../components/Sidebar';
import { AdminSidebar } from '../components/AdminSidebar';
import { Toolbar } from '../components/Toolbar';
import { FileGridItem } from '../components/FileGridItem';
import { FileListItem } from '../components/FileListItem';
import { RenameDialog } from '../components/RenameDialog';
import { UploadDialog } from '../components/UploadDialog';
import { DeleteDialog } from '../components/DeleteDialog';
import { isAdmin } from '../utils/auth';
import { documentsApi } from '../lib/api';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';

const FILE_TYPE_FILTERS: { value: FileType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Documents' },
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'DOCX' },
  { value: 'xlsx', label: 'XLSX' },
  { value: 'pptx', label: 'PPTX' },
  { value: 'doc', label: 'DOC' },
];

export function MyDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [fileTypeFilter, setFileTypeFilter] = useState<FileType | 'all'>('all');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<Document | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Document | null>(null);

  // Fetch documents from backend on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentsApi.getAll();
      setDocuments(docs);
    } catch (err: any) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const currentDocuments = useMemo(() => {
    let items = [...documents];

    if (fileTypeFilter !== 'all') {
      items = items.filter((doc) => doc.type === fileTypeFilter);
    }

    if (searchQuery) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    items.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name': comparison = a.name.localeCompare(b.name); break;
        case 'date': comparison = a.uploadedAt.getTime() - b.uploadedAt.getTime(); break;
        case 'size': comparison = a.size - b.size; break;
        case 'type': comparison = a.type.localeCompare(b.type); break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return items;
  }, [documents, searchQuery, sortBy, sortOrder, fileTypeFilter]);

  const handleItemDoubleClick = async (itemId: string) => {
    const item = documents.find((f) => f.id === itemId);
    if (!item) return;

    // --- 1. THE DEPARTMENT & ADMIN CHECK ---
    const sessionString = sessionStorage.getItem('rhv_session') || '{}';
    const sessionObj = JSON.parse(sessionString);
    const user = sessionObj.user || {};

    const isAdmin = user.role === 'admin';
    const isSameDepartment = user.department === item.department;

    // If they aren't an admin AND they aren't in the right department, block them instantly.
    if (!isAdmin && !isSameDepartment) {
      toast.error(`Security Block: This file belongs to ${item.department}. Only Admin or ${item.department} staff can view it.`);
      return;
    }
    // ---------------------------------------

    try {
      // Update access time
      await documentsApi.updateAccess(itemId);
      setDocuments((prev) =>
        prev.map((doc) => doc.id === itemId ? { ...doc, lastAccessed: new Date() } : doc)
      );
      
      const cleanPath = item.filePath.replace(/\\/g, '/');
      const safeUrlPath = cleanPath.split('/').map(part => encodeURIComponent(part)).join('/');
      const fileUrl = `http://localhost:3001${safeUrlPath.startsWith('/') ? '' : '/'}${safeUrlPath}`;
      
      // Request the file securely
      const response = await fetch(fileUrl, {
        headers: {
          // Send token, or a fallback string so the server doesn't crash if token is missing
          'Authorization': sessionObj.token || 'valid-session' 
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank'); 
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else if (response.status === 404) {
        toast.error("Error: This file could not be found on the server.");
      } else {
        toast.error("Server Error: Access Denied.");
      }
    } catch {
      toast.error('Network error: Could not connect to the file server.');
    }
  };

  const handleRenameConfirm = async (newName: string) => {
    if (!itemToRename) return;
    try {
      await documentsApi.rename(itemToRename.id, newName);
      setDocuments((prev) =>
        prev.map((f) => f.id === itemToRename.id ? { ...f, name: newName } : f)
      );
      toast.success(`Renamed to "${newName}"`);
      setItemToRename(null);
    } catch (err: any) {
      toast.error(err.message || 'Rename failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await documentsApi.delete(itemToDelete.id);
      setDocuments((prev) => prev.filter((f) => f.id !== itemToDelete.id));
      if (selectedDocId === itemToDelete.id) setSelectedDocId(null);
      toast.success(`Deleted "${itemToDelete.name}"`);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleUploadDocument = async (
    file: File,
    metadata: { description: string; patientId?: string; department: string }
  ) => {
    try {
      const newDoc = await documentsApi.upload(file, metadata);
      setDocuments((prev) => [newDoc, ...prev]);
      toast.success(`Uploaded "${file.name}"`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
      throw err;
    }
  };

  return (
    <div className="size-full flex bg-background">
      {isAdmin() ? <AdminSidebar currentPage="documents" /> : <Sidebar currentPage="documents" />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Toolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onUpload={() => setUploadDialogOpen(true)}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />

        <div className="border-b px-6 py-3">
          <Tabs value={fileTypeFilter} onValueChange={(value) => setFileTypeFilter(value as FileType | 'all')}>
            <TabsList>
              {FILE_TYPE_FILTERS.map((filter) => (
                <TabsTrigger key={filter.value} value={filter.value}>
                  {filter.label}
                  {filter.value !== 'all' && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({documents.filter((d) => d.type === filter.value).length})
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Loading documents...</p>
            </div>
          ) : currentDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-lg mb-2">{searchQuery ? 'No documents found' : 'No documents yet'}</p>
              <p className="text-sm">{searchQuery ? 'Try a different search term' : 'Upload documents to get started'}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {currentDocuments.map((item) => (
                <FileGridItem
                  key={item.id}
                  item={item}
                  isSelected={selectedDocId === item.id}
                  onClick={() => setSelectedDocId(item.id)}
                  onDoubleClick={() => handleItemDoubleClick(item.id)}
                  onRename={() => { setItemToRename(item); setRenameDialogOpen(true); }}
                  onDelete={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[auto_1fr_150px_150px] gap-4 items-center px-3 pb-2 border-b text-sm text-muted-foreground">
                <div className="w-10" />
                <div>Name</div>
                <div>Size</div>
                <div>Uploaded</div>
              </div>
              {currentDocuments.map((item) => (
                <FileListItem
                  key={item.id}
                  item={item}
                  isSelected={selectedDocId === item.id}
                  onClick={() => setSelectedDocId(item.id)}
                  onDoubleClick={() => handleItemDoubleClick(item.id)}
                  onRename={() => { setItemToRename(item); setRenameDialogOpen(true); }}
                  onDelete={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <RenameDialog item={itemToRename} open={renameDialogOpen} onOpenChange={setRenameDialogOpen} onRename={handleRenameConfirm} />
      <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onUpload={handleUploadDocument} />
      <DeleteDialog item={itemToDelete} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDeleteConfirm} />
      <Toaster />
    </div>
  );
}
