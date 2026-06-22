import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsAPI, Department, ConfidentialityLevel, ConfidentialityLevelConfig } from '@/services/api/settings'
import { addNotification } from '@/components/notifications/NotificationCenter'

export function useDepartmentsQuery(includeInactive = false) {
  return useQuery({
    queryKey: ['settings', 'departments', includeInactive],
    queryFn: async () => {
      try {
        const response = await settingsAPI.getDepartments({ includeInactive })
        return response.data.departments || []
      } catch (error) {
        console.error('Failed to fetch departments:', error)
        return []
      }
    },
  })
}

export function useConfidentialityLevelsQuery() {
  return useQuery({
    queryKey: ['settings', 'confidentiality-levels'],
    queryFn: async () => {
      try {
        const response = await settingsAPI.getConfidentialityLevels()
        return response.data.confidentialityLevels || []
      } catch (error) {
        console.error('Failed to fetch confidentiality levels:', error)
        return []
      }
    },
  })
}

export function useConfidentialityLevelsConfigQuery() {
  return useQuery<{ label: string; value: string }[]>({
    queryKey: ['config', 'confidentiality-levels'],
    queryFn: async () => {
      try {
        const config = await settingsAPI.getConfidentialityLevelsConfig()

        if (!config || !config.levels) {
          return []
        }

        // Transform the API response into the expected format
        const transformed = config.levels.map((level: any) => ({
          value: level,
          label: config.descriptions?.[level] || String(level).replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
        }))


        return transformed
      } catch (error) {
        console.error('Failed to fetch confidentiality levels config:', error)
        return []
      }
    },
  })
}

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; code: string; description?: string }) => settingsAPI.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'departments'] })
      addNotification('success', 'Success', 'Department created successfully')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      addNotification('error', 'Error', err.response?.data?.message || 'Failed to create department')
    },
  })
}

export function useUpdateDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; code?: string; description?: string; isActive?: boolean } }) =>
      settingsAPI.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'departments'] })
      addNotification('success', 'Success', 'Department updated successfully')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      addNotification('error', 'Error', err.response?.data?.message || 'Failed to update department')
    },
  })
}

export function useDeleteDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => settingsAPI.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'departments'] })
      addNotification('success', 'Success', 'Department deleted successfully')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      addNotification('error', 'Error', err.response?.data?.message || 'Failed to delete department')
    },
  })
}

export function useCreateConfidentialityLevelMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; description?: string; level: number }) => 
      settingsAPI.createConfidentialityLevel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'confidentiality-levels'] })
      addNotification('success', 'Success', 'Confidentiality level created successfully')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      addNotification('error', 'Error', err.response?.data?.message || 'Failed to create confidentiality level')
    },
  })
}

export function useUpdateConfidentialityLevelMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; level?: number } }) => 
      settingsAPI.updateConfidentialityLevel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'confidentiality-levels'] })
      addNotification('success', 'Success', 'Confidentiality level updated successfully')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      addNotification('error', 'Error', err.response?.data?.message || 'Failed to update confidentiality level')
    },
  })
}

export function useDeleteConfidentialityLevelMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => settingsAPI.deleteConfidentialityLevel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'confidentiality-levels'] })
      addNotification('success', 'Success', 'Confidentiality level deleted successfully')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      addNotification('error', 'Error', err.response?.data?.message || 'Failed to delete confidentiality level')
    },
  })
}

export function useInitializeSettingsMutation() {
  return useMutation({
    mutationFn: () => settingsAPI.initializeSettings(),
    onSuccess: (response) => {
      addNotification('success', 'Success', response.message || 'Settings initialized successfully')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      addNotification('error', 'Error', err.response?.data?.message || 'Failed to initialize settings')
    },
  })
}