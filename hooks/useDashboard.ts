import { useQuery } from '@tanstack/react-query'
import { dashboardAPI, DashboardStats, RecentFile, RecentActivity } from '@/services/api/dashboard'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardAPI.getStats(),
    select: (response) => response.data,
  })
}

export function useRecentFiles() {
  return useQuery({
    queryKey: ['dashboard', 'recent-files'],
    queryFn: () => dashboardAPI.getRecentFiles(),
    select: (response) => response.data,
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => dashboardAPI.getRecentActivity(),
    select: (response) => response.data,
  })
}