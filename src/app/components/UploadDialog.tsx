import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, metadata: {
    description: string;
    patientId?: string;
    department: string;
  }) => Promise<void>;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export function UploadDialog({ open, onOpenChange, onUpload }: UploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [patientId, setPatientId] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const session = JSON.parse(sessionStorage.getItem('rhv_session') || '{}');
  const userDepartment = session.user?.department || '';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeFile = () => {
    setSelectedFile(null);
    setFileName('');
  };

  const handleUpload = async () => {
    if (!selectedFile || !fileName) return;

    setUploadState('uploading');
    setErrorMessage('');

    try {
      await onUpload(selectedFile, {
        description,
        patientId: patientId || undefined,
        department: userDepartment,
      });
      setUploadState('success');
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.message || 'Upload failed. Please try again.');
      setUploadState('error');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFileName('');
    setDescription('');
    setPatientId('');
    setUploadState('idle');
    setErrorMessage('');
  };

  const handleClose = () => {
    if (uploadState !== 'uploading') {
      resetForm();
      onOpenChange(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            Upload Document
          </DialogTitle>
          <DialogDescription>
            Upload patient records or administrative documents to the RHV server
          </DialogDescription>
        </DialogHeader>

        {uploadState === 'success' ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="size-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Successful!</h3>
            <p className="text-sm text-muted-foreground">
              {fileName} has been uploaded to the server
            </p>
          </div>
        ) : uploadState === 'error' ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <AlertCircle className="size-16 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Failed</h3>
            <p className="text-sm text-muted-foreground">
              {errorMessage || 'There was an error uploading the document.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* File drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              />

              {selectedFile ? (
                <div className="flex items-center justify-center gap-3 p-2">
                  <File className="size-8 text-primary flex-shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="size-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="mb-2">Drop file here or click to browse</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
                  </p>
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Select File
                  </Button>
                </>
              )}
            </div>

            {/* Metadata fields */}
            {selectedFile && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="fileName">File Name *</Label>
                  <Input
                    id="fileName"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Enter file name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the document"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patientId">Patient ID (optional)</Label>
                  <Input
                    id="patientId"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    placeholder="PT-2026-XXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={userDepartment} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    Document will be filed under your department
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {uploadState === 'idle' && (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || !fileName}>
              Upload Document
            </Button>
          </DialogFooter>
        )}

        {uploadState === 'uploading' && (
          <div className="py-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Uploading to server...</span>
            </div>
          </div>
        )}

        {uploadState === 'error' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={() => setUploadState('idle')}>Try Again</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}