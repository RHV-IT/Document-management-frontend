import { useQuery } from '@tanstack/react-query'
import { dashboardAPI, DashboardStats, RecentFile, RecentActivity } from '@/services/api/dashboard'
import { queryKeys } from '@/lib/query-keys'

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardAPI.getStats(),
    select: (response) => response.data,
  })
}

export function useRecentFiles() {
  return useQuery({
    queryKey: queryKeys.dashboard.recentFiles(),
    queryFn: () => dashboardAPI.getRecentFiles(),
    select: (response) => response.data,
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: queryKeys.dashboard.recentActivity(),
    queryFn: () => dashboardAPI.getRecentActivity(),
    select: (response) => response.data,
  })
}