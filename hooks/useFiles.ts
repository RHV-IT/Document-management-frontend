import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { filesAPI } from '@/services/api/files'
import { queryKeys } from '@/lib/query-keys'
import { permissionsAPI } from '@/services/api/permissions'
import { addNotification } from '@/components/notifications/NotificationCenter'

export interface FilesQueryParams {
  page?: number
  limit?: number
  type?: string
  owner?: string
  department?: string
  fromDate?: string
  toDate?: string
  confidentiality?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  includeDeleted?: boolean
  isScanned?: boolean
}

export interface ArchiveFilesQueryParams {
  page?: number
  limit?: number
  search?: string
  confidentialityLevel?: string
  uploadedBy?: string
  department?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  type?: string
  restrictedOnly?: boolean
}

export function useFilesQuery(params?: FilesQueryParams) {
  return useQuery({
    queryKey: queryKeys.files.list(params),
    queryFn: () => filesAPI.getFiles(params),
    select: (response) => response.data,
  })
}

export function useArchiveFilesQuery(params?: ArchiveFilesQueryParams) {
  return useQuery({
    queryKey: queryKeys.files.archive(params),
    queryFn: () => filesAPI.getArchiveFiles(params),
    select: (response) => response.data,
  })
}

export function useFileQuery(fileId: string) {
  return useQuery({
    queryKey: queryKeys.files.detail(fileId),
    queryFn: () => filesAPI.getFile(fileId),
    select: (response) => response.data,
    enabled: !!fileId,
  })
}

export function useUploadFileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) => filesAPI.uploadFile(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      addNotification('success', 'File Uploaded', 'Your file has been uploaded successfully.')
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to upload file'
      addNotification('error', 'Upload Failed', message)
    },
  })
}

export function useBulkUploadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: File[] | { files: File[]; metadata?: Array<{ alias?: string; confidentialityLevel?: string }>; onProgress?: (progress: number) => void }) => {
      const files = Array.isArray(input) ? input : input.files
      const metadata = Array.isArray(input) ? undefined : input.metadata
      const onProgress = Array.isArray(input) ? undefined : input.onProgress
      return filesAPI.bulkUpload(files, onProgress, metadata)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      addNotification('success', 'Files Uploaded', `${response.data.length} files uploaded successfully.`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to upload files'
      addNotification('error', 'Upload Failed', message)
    },
  })
}

export function useUploadScannedDocumentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) => filesAPI.uploadScan(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      addNotification('success', 'Document Scanned', 'Your scanned document has been uploaded successfully.')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to upload scanned document'
      addNotification('error', 'Upload Failed', message)
    },
  })
}

export function useBulkScanUploadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (files: File[]) => filesAPI.bulkScanUpload(files),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      addNotification('success', 'Documents Scanned', `${response.data.length} scanned documents uploaded successfully.`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to upload scanned documents'
      addNotification('error', 'Upload Failed', message)
    },
  })
}

export function useUpdateFileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileId, formData }: { fileId: string; formData: FormData }) =>
      filesAPI.updateFile(fileId, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.detail(variables.fileId) })
      addNotification('success', 'File Updated', 'File metadata has been updated successfully.')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update file'
      addNotification('error', 'Update Failed', message)
    },
  })
}

export function useDeleteFileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: { fileId: string; permanent?: boolean }) =>
      filesAPI.deleteFile(variables.fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.deleted() })
      addNotification('success', 'File Deleted', 'File has been moved to recycle bin.')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete file'
      addNotification('error', 'Delete Failed', message)
    },
  })
}

export function useRestoreFileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fileId: string) => filesAPI.restoreFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.deleted() })
      addNotification('success', 'File Restored', 'File has been restored from recycle bin.')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to restore file'
      addNotification('error', 'Restore Failed', message)
    },
  })
}

export function useShareFileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileId, userId, access }: { fileId: string; userId: string; access: 'view' | 'download' | 'edit' }) =>
      filesAPI.grantPermission(fileId, userId, access),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.myPermissions() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.mySentPermissions() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.permissions(variables.fileId) })
      addNotification('success', 'File Shared', 'Permission granted successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to share file'
      addNotification('error', 'Share Failed', message)
    },
  })
}

export function useRevokePermissionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (permissionId: string) => filesAPI.revokePermission(permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.myPermissions() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.mySentPermissions() })
      addNotification('success', 'Permission Revoked', 'Access has been revoked')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to revoke permission'
      addNotification('error', 'Revoke Failed', message)
    },
  })
}

export function useFilePermissionsQuery(fileId: string) {
  return useQuery({
    queryKey: queryKeys.files.permissions(fileId),
    queryFn: () => filesAPI.getFilePermissions(fileId),
    select: (response) => response.data,
    enabled: !!fileId,
  })
}

export function useMyPermissionsQuery() {
  return useQuery({
    queryKey: queryKeys.files.myPermissions(),
    queryFn: () => permissionsAPI.getMyPermissions(),
    select: (response) => response.data,
  })
}

export function useMySentPermissionsQuery() {
  return useQuery({
    queryKey: queryKeys.files.mySentPermissions(),
    queryFn: async () => {
      const response = await permissionsAPI.getMySentPermissions()
      return response.data
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

export function useDeletedFilesQuery(params?: { page?: number; limit?: number; showAll?: boolean }) {
  return useQuery({
    queryKey: queryKeys.files.deleted(params),
    queryFn: () => filesAPI.getDeletedFiles(params),
    select: (response) => response.data,
  })
}

export function useDownloadFileMutation() {
  return useMutation({
    mutationFn: (fileId: string) => filesAPI.downloadFile(fileId),
    onSuccess: (blob, fileId) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileId
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      addNotification('success', 'Download Started', 'Your file is downloading')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to download file'
      addNotification('error', 'Download Failed', message)
    },
  })
}

export function useVersionHistoryQuery(fileId: string) {
  return useQuery({
    queryKey: queryKeys.files.versions(fileId),
    queryFn: () => filesAPI.getVersions(fileId),
    select: (response) => response.data,
    enabled: !!fileId,
  })
}

export function useRollbackVersionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileId, versionNumber }: { fileId: string; versionNumber: number }) =>
      filesAPI.rollback(fileId, versionNumber),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.detail(variables.fileId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.versions(variables.fileId) })
      addNotification('success', 'Version Restored', 'File has been rolled back to selected version.')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to rollback file'
      addNotification('error', 'Rollback Failed', message)
    },
  })
}

export function useSupportedTypesQuery() {
  return useQuery({
    queryKey: queryKeys.files.supportedTypes(),
    queryFn: () => filesAPI.getSupportedTypes(),
    select: (response) => response.data,
  })
}
