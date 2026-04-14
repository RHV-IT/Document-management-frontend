import { useState, useMemo, useEffect } from 'react';
import { Document, ViewMode, SortBy } from '../types';
import { Sidebar } from '../components/Sidebar';
import { AdminSidebar } from '../components/AdminSidebar';
import { documentsApi } from '../lib/api';
import { Toolbar } from '../components/Toolbar';
import { FileGridItem } from '../components/FileGridItem';
import { FileListItem } from '../components/FileListItem';
import { RenameDialog } from '../components/RenameDialog';
import { UploadDialog } from '../components/UploadDialog';
import { DeleteDialog } from '../components/DeleteDialog';
import { getFileTypeFromExtension, getFileExtension } from '../utils/fileUtils';
import { isAdmin } from '../utils/auth';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

type TimeGroup = 'today' | 'yesterday' | 'last7days';

interface GroupedDocuments {
  today: Document[];
  yesterday: Document[];
  last7days: Document[];
}

export function RecentFiles() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Dialog states
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<Document | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Document | null>(null);

  useEffect(() => {
    documentsApi.getRecent()
      .then((docs) => setDocuments(docs))
      .catch(() => {});
  }, []);
  
  // Group documents by time period
  const groupedDocuments = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let items = [...documents];
    
    // Apply search filter
    if (searchQuery) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Group by time
    const grouped: GroupedDocuments = {
      today: [],
      yesterday: [],
      last7days: [],
    };
    
    items.forEach((doc) => {
      const accessedDate = new Date(doc.lastAccessed);
      const accessedDateOnly = new Date(accessedDate.getFullYear(), accessedDate.getMonth(), accessedDate.getDate());
      
      if (accessedDateOnly.getTime() === today.getTime()) {
        grouped.today.push(doc);
      } else if (accessedDateOnly.getTime() === yesterday.getTime()) {
        grouped.yesterday.push(doc);
      } else if (accessedDate >= sevenDaysAgo) {
        grouped.last7days.push(doc);
      }
    });
    
    // Sort each group
    const sortDocuments = (docs: Document[]) => {
      return docs.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'date':
            comparison = a.lastAccessed.getTime() - b.lastAccessed.getTime();
            break;
          case 'size':
            comparison = a.size - b.size;
            break;
          case 'type':
            comparison = a.type.localeCompare(b.type);
            break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    };
    
    grouped.today = sortDocuments(grouped.today);
    grouped.yesterday = sortDocuments(grouped.yesterday);
    grouped.last7days = sortDocuments(grouped.last7days);
    
    return grouped;
  }, [documents, searchQuery, sortBy, sortOrder]);
  
  const handleItemClick = (itemId: string) => {
    setSelectedDocId(itemId);
  };
  
  const handleItemDoubleClick = async (itemId: string) => {
    const item = documents.find((f) => f.id === itemId);
    if (!item) return;

    // --- 1. THE DEPARTMENT & ADMIN CHECK ---
    const sessionString = sessionStorage.getItem('rhv_session') || '{}';
    const sessionObj = JSON.parse(sessionString);
    const user = sessionObj.user || {};

    const isAdmin = user.role === 'admin';
    const isSameDepartment = user.department === item.department;

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
  
  const handleRename = (itemId: string) => {
    const item = documents.find((f) => f.id === itemId);
    if (item) {
      setItemToRename(item);
      setRenameDialogOpen(true);
    }
  };
  
  const handleRenameConfirm = (newName: string) => {
    if (itemToRename) {
      setDocuments((prev) =>
        prev.map((f) => (f.id === itemToRename.id ? { ...f, name: newName } : f))
      );
      toast.success(`Renamed to "${newName}"`);
      setItemToRename(null);
    }
  };
  
  const handleDelete = (itemId: string) => {
    const item = documents.find((f) => f.id === itemId);
    if (item) {
      setItemToDelete(item);
      setDeleteDialogOpen(true);
    }
  };
  
  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      setDocuments((prev) => prev.filter((f) => f.id !== itemToDelete.id));
      
      if (selectedDocId === itemToDelete.id) {
        setSelectedDocId(null);
      }
      
      toast.success(`Deleted "${itemToDelete.name}"`);
      setItemToDelete(null);
    }
  };
  
  const handleUpload = () => {
    setUploadDialogOpen(true);
  };
  
  const handleUploadDocument = async (file: File, metadata: { description: string; patientId?: string; department: string }) => {
    const newDoc: Document = {
      id: 'doc' + Date.now(),
      name: file.name,
      type: getFileTypeFromExtension(getFileExtension(file.name)) as any,
      size: file.size,
      uploadedAt: new Date(),
      lastAccessed: new Date(),
      filePath: `/rhv-storage/documents/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${file.name}`,
      uploadedBy: 'Current User',
      ...metadata,
    };
    
    setDocuments((prev) => [newDoc, ...prev]);
    toast.success(`Uploaded "${file.name}"`);
  };
  
  const renderDocumentGroup = (title: string, docs: Document[]) => {
    if (docs.length === 0) return null;
    
    return (
      <div key={title} className="mb-8">
        <h2 className="text-lg font-semibold mb-4 px-1">{title}</h2>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {docs.map((item) => (
              <FileGridItem
                key={item.id}
                item={item}
                isSelected={selectedDocId === item.id}
                onClick={() => handleItemClick(item.id)}
                onDoubleClick={() => handleItemDoubleClick(item.id)}
                onRename={() => handleRename(item.id)}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((item) => (
              <FileListItem
                key={item.id}
                item={item}
                isSelected={selectedDocId === item.id}
                onClick={() => handleItemClick(item.id)}
                onDoubleClick={() => handleItemDoubleClick(item.id)}
                onRename={() => handleRename(item.id)}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const hasAnyDocuments = groupedDocuments.today.length > 0 || 
                          groupedDocuments.yesterday.length > 0 || 
                          groupedDocuments.last7days.length > 0;
  
  return (
    <div className="size-full flex bg-background">
      {isAdmin() ? <AdminSidebar currentPage="recent" /> : <Sidebar currentPage="recent" />}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Toolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onUpload={handleUpload}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />
        
        <div className="flex-1 overflow-auto p-6">
          {!hasAnyDocuments ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-lg mb-2">
                {searchQuery ? 'No recent documents found' : 'No recent activity'}
              </p>
              <p className="text-sm">
                {searchQuery ? 'Try a different search term' : 'Documents you access will appear here'}
              </p>
            </div>
          ) : (
            <>
              {viewMode === 'list' && (
                <div className="grid grid-cols-[auto_1fr_150px_150px] gap-4 items-center px-3 pb-2 mb-4 border-b text-sm text-muted-foreground">
                  <div className="w-10" />
                  <div>Name</div>
                  <div>Size</div>
                  <div>Last Accessed</div>
                </div>
              )}
              {renderDocumentGroup('Today', groupedDocuments.today)}
              {renderDocumentGroup('Yesterday', groupedDocuments.yesterday)}
              {renderDocumentGroup('Last 7 Days', groupedDocuments.last7days)}
            </>
          )}
        </div>
      </div>
      
      <RenameDialog
        item={itemToRename}
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        onRename={handleRenameConfirm}
      />
      
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUploadDocument}
      />
      
      <DeleteDialog
        item={itemToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
      
      <Toaster />
    </div>
  );
}