import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { AdminSidebar } from '../components/AdminSidebar';
import { FileGridItem } from '../components/FileGridItem';
import { FileListItem } from '../components/FileListItem';
import { RenameDialog } from '../components/RenameDialog';
import { DeleteDialog } from '../components/DeleteDialog';
import { isAdmin } from '../utils/auth';
import { documentsApi } from '../lib/api';
import { Document } from '../types';
import { toast } from 'sonner';
import { ChevronLeft, FolderOpen, Folder } from 'lucide-react';

interface MonthGroup {
  label: string;
  key: string;
  count: number;
  documents: Document[];
}

export function Archives() {
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<MonthGroup | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<Document | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Document | null>(null);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      setLoading(true);
      // Fetch all documents older than 3 days
      const docs = await documentsApi.getArchives();
      setAllDocuments(docs);
    } catch (err: any) {
      toast.error('Failed to load archives');
    } finally {
      setLoading(false);
    }
  };

  // Group documents by month
  const monthGroups: MonthGroup[] = (() => {
    const groups: Record<string, Document[]> = {};

    allDocuments.forEach((doc) => {
      const date = new Date(doc.uploadedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, documents]) => ({
        key,
        label: documents[0]
          ? new Date(documents[0].uploadedAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
          : key,
        count: documents.length,
        documents,
      }));
  })();

  const handleRenameConfirm = async (newName: string) => {
    if (!itemToRename) return;
    try {
      await documentsApi.rename(itemToRename.id, newName);
      setAllDocuments((prev) =>
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
      setAllDocuments((prev) => prev.filter((f) => f.id !== itemToDelete.id));
      if (selectedMonth) {
        setSelectedMonth((prev) =>
          prev ? {
            ...prev,
            documents: prev.documents.filter((d) => d.id !== itemToDelete.id),
            count: prev.count - 1,
          } : null
        );
      }
      toast.success(`Deleted "${itemToDelete.name}"`);
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const SidebarComponent = isAdmin() ? AdminSidebar : Sidebar;

  return (
    <div className="size-full flex bg-background">
      <SidebarComponent currentPage="archives" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b bg-background flex items-center px-6 gap-4">
          {selectedMonth && (
            <button
              onClick={() => setSelectedMonth(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="size-4" />
              Back to Archives
            </button>
          )}
          <h2 className="text-base font-semibold">
            {selectedMonth ? selectedMonth.label : 'Archives'}
          </h2>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Loading archives...</p>
            </div>
          ) : !selectedMonth ? (
            // Month folders view
            monthGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p className="text-lg mb-2">No archived documents</p>
                <p className="text-sm">Documents older than a month appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {monthGroups.map((group) => (
                  <button
                    key={group.key}
                    onClick={() => setSelectedMonth(group)}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
                  >
                    <FolderOpen className="size-16 text-primary group-hover:scale-105 transition-transform" />
                    <p className="text-sm font-medium text-center">{group.label}</p>
                    <p className="text-xs text-muted-foreground">{group.count} file{group.count !== 1 ? 's' : ''}</p>
                  </button>
                ))}
              </div>
            )
          ) : (
            // Files inside selected month
            selectedMonth.documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>No files in this month</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {selectedMonth.documents.map((item) => (
                  <FileGridItem
                    key={item.id}
                    item={item}
                    isSelected={selectedDocId === item.id}
                    onClick={() => setSelectedDocId(item.id)}
                    onDoubleClick={async () => {
                      await documentsApi.updateAccess(item.id);
                      window.open(`http://localhost:3001/uploads/${encodeURIComponent(item.filePath.replace(/.*uploads[/\\]/, ''))}`, '_blank');
                    }}
                    onRename={() => { setItemToRename(item); setRenameDialogOpen(true); }}
                    onDelete={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <RenameDialog item={itemToRename} open={renameDialogOpen} onOpenChange={setRenameDialogOpen} onRename={handleRenameConfirm} />
      <DeleteDialog item={itemToDelete} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDeleteConfirm} />
    </div>
  );
}