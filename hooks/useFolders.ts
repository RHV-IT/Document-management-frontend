import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { foldersAPI, FolderItem, CreateFolderPayload, UpdateFolderPayload } from '@/services/api/folders'
import { queryKeys } from '@/lib/query-keys'
import { addNotification } from '@/components/notifications/NotificationCenter'

export function useFoldersQuery(params?: { parentFolderId?: string | null; search?: string }) {
  return useQuery({
    queryKey: queryKeys.folders.list(params),
    queryFn: () => foldersAPI.getFolders(params),
    select: (response) => response.data,
  })
}

export function useFolderQuery(folderId: string) {
  return useQuery({
    queryKey: queryKeys.folders.detail(folderId),
    queryFn: () => foldersAPI.getFolder(folderId),
    select: (response) => response.data,
    enabled: !!folderId,
  })
}

export function useFolderTreeQuery() {
  return useQuery({
    queryKey: queryKeys.folders.tree(),
    queryFn: () => foldersAPI.getFolderTree(),
    select: (response) => response.data,
  })
}

export function useFolderContentsQuery(folderId: string | null) {
  return useQuery({
    queryKey: queryKeys.folders.contents(folderId || ''),
    queryFn: () => foldersAPI.getFolderContents(folderId!),
    select: (response) => response.data,
    enabled: !!folderId,
  })
}

export function useCreateFolderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFolderPayload) => foldersAPI.createFolder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
      addNotification('success', 'Folder Created', 'Your folder has been created successfully.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create folder'
      addNotification('error', 'Creation Failed', message)
    },
  })
}

export function useUpdateFolderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ folderId, payload }: { folderId: string; payload: UpdateFolderPayload }) =>
      foldersAPI.updateFolder(folderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      addNotification('success', 'Folder Updated', 'Folder has been updated successfully.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update folder'
      addNotification('error', 'Update Failed', message)
    },
  })
}

export function useDeleteFolderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (folderId: string) => foldersAPI.deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
      addNotification('success', 'Folder Deleted', 'Folder has been deleted successfully.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete folder'
      addNotification('error', 'Delete Failed', message)
    },
  })
}

export function useMoveFolderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ folderId, targetFolderId }: { folderId: string; targetFolderId: string | null }) =>
      foldersAPI.moveFolder({ folderId, targetFolderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      addNotification('success', 'Folder Moved', 'Folder has been moved successfully.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to move folder'
      addNotification('error', 'Move Failed', message)
    },
  })
}

export function useMoveFileToFolderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fileId, targetFolderId }: { fileId: string; targetFolderId: string | null }) =>
      foldersAPI.moveFileToFolder({ fileId, targetFolderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
      addNotification('success', 'File Moved', 'File has been moved successfully.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to move file'
      addNotification('error', 'Move Failed', message)
    },
  })
}

export function useBulkMoveFilesToFolderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fileIds, targetFolderId }: { fileIds: string[]; targetFolderId: string | null }) =>
      foldersAPI.bulkMoveFilesToFolder({ fileIds, targetFolderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
      addNotification('success', 'Files Moved', 'Files have been moved successfully.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to move files'
      addNotification('error', 'Move Failed', message)
    },
  })
}

export function useCopyFileToFolderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fileId, folderId }: { fileId: string; folderId: string | null }) =>
      foldersAPI.copyFileToFolder({ fileId, folderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
      addNotification('success', 'File Copied', 'File has been copied successfully.')
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to copy file'
      addNotification('error', 'Copy Failed', message)
    },
  })
}
