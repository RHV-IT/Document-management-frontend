'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import { useAccessControl } from '@/hooks/useAccessControl'
import { cn } from '@/lib/utils'
import { debug } from '@/lib/debug'
import {
  Home, FileText, Upload, Trash2, Users, BarChart3, Settings,
  LogOut, Activity, Scan, Layers, User, Shield, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { GlowCircle } from '@/components/ui/glow-circle'
import { ScannerStatus } from '@/components/ScannerStatus'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const NAV_ITEMS = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: Home,
    roles: ['user', 'hod', 'admin'],
    description: 'Dashboard overview',
  },
  {
    label: 'My Profile',
    href: '/dashboard/profile',
    icon: User,
    roles: ['user', 'hod', 'admin'],
    description: 'View your profile',
  },
  {
    label: 'My Files',
    href: '/dashboard/files',
    icon: FileText,
    roles: ['user', 'hod', 'admin'],
    description: 'Manage your files',
  },
  {
    label: 'Upload',
    href: '/dashboard/upload',
    icon: Upload,
    roles: ['user', 'hod', 'admin'],
    description: 'Upload files (single, bulk, scan)',
  },
  {
    label: 'Scanner Guide',
    href: '/dashboard/scanner-user-guide',
    icon: Scan,
    roles: ['user', 'hod', 'admin'],
    description: 'Step-by-step scanner instructions',
  },
  {
    label: 'Recycle Bin',
    href: '/dashboard/recycle-bin',
    icon: Trash2,
    roles: ['user', 'hod', 'admin'],
    description: 'Deleted files',
  },
  {
    label: 'Audit Logs',
    href: '/dashboard/admin/audit-log',
    icon: Activity,
    roles: ['admin'],
    description: 'System audit trail',
  },
  {
    label: 'Users',
    href: '/dashboard/admin/users',
    icon: Users,
    roles: ['admin', 'hod'],
    description: 'Manage users',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin'],
    description: 'System settings',
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, canAccess, logout } = useAuth()
  const { clearanceBadge } = useAccessControl()

  const [collapsed, setCollapsed] = useState(false)

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) setCollapsed(saved === 'true')
  }, [])

  const toggleCollapse = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', String(newState))
  }

  const visibleItems = NAV_ITEMS.filter((item) => canAccess(item.roles))

  debug.render('DashboardSidebar', `user=${user?.name}, visibleItems=${visibleItems.length}, collapsed=${collapsed}`)

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'hod':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <aside
      className={cn(
        "bg-white border-r border-gray-200/60 flex flex-col h-full shadow-sm transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        collapsed ? "w-20" : "w-72"
      )}
    >
       {/* Logo Section - Futuristic & Compact */}
       <div className={cn("border-b border-gray-100/70 flex items-center", collapsed ? "p-4 justify-center" : "p-6")}>
         <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 ring-1 ring-blue-500/20">
             <Image src="/images/rhv-logo.png" alt="RHV DMS" width={24} height={24} className="object-contain" />
           </div>
           {!collapsed && (
             <div className="transition-opacity duration-200">
               <h1 className="text-[24px] font-bold tracking-[-0.5px] text-gray-900">
                 Document management System
               </h1>
             </div>
           )}
         </div>
       </div>

      {/* User Card - Modern & Adaptive */}
      {user && (
        <div className={cn("mx-3 mt-4 transition-all", collapsed ? "px-2" : "px-3")}>
          <div className={cn(
            "flex items-center gap-3 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/80 p-3 shadow-sm",
            collapsed && "justify-center p-2"
          )}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-inner flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm truncate leading-tight">{user?.name || 'User'}</p>
                <span className={cn('inline-flex items-center px-2 py-px rounded-md text-[10px] font-medium border mt-1', getRoleBadgeColor(user?.role || 'user'))}>
                  {user?.role === 'admin' ? 'Admin' : user?.role === 'hod' ? 'HOD' : 'User'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <Separator className="my-4 mx-3 bg-gray-100/70" />

      {/* Navigation - Futuristic & Clean */}
      <nav className="flex-1 px-2.5 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[1.5px] px-4 mb-1.5">
            Navigation
          </div>
        )}

        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl transition-all duration-200 relative overflow-hidden",
                collapsed ? "px-3 py-3 justify-center" : "px-3.5 py-2.5",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
              )}
            >
              {/* Active left accent (futuristic) */}
              {isActive && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] bg-white rounded-r-full" />
              )}

              <div className={cn(
                "flex items-center justify-center rounded-xl transition-all flex-shrink-0",
                collapsed ? "w-9 h-9" : "w-8 h-8",
                isActive
                  ? "bg-white/15 text-white"
                  : "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600"
              )}>
                <Icon className={cn("transition-transform group-hover:scale-110", collapsed ? "h-4.5 w-4.5" : "h-4 w-4")} />
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium text-[13.5px] tracking-[-0.1px]", isActive ? "text-white" : "text-gray-800")}>
                    {item.label}
                  </p>
                  <p className={cn("text-xs mt-px leading-none", isActive ? "text-blue-100/90" : "text-gray-400")}>
                    {item.description}
                  </p>
                </div>
              )}

              {isActive && !collapsed && <GlowCircle isActive />}
            </Link>
          )

          return collapsed ? (
            <TooltipProvider key={item.href}>
              <Tooltip>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : linkContent
        })}
      </nav>

      <div className="mt-auto">
        <Separator className="mx-3 bg-gray-100/70" />

        {/* Clearance + Collapse Toggle Row */}
        <div className={cn("px-3 py-3 flex items-center", collapsed ? "justify-center" : "justify-between")}>
          {user && (
            <div className="flex items-center gap-2 text-xs">
              <Shield className="h-3.5 w-3.5 text-gray-400" />
              {!collapsed && <span className="text-[10px] font-medium text-gray-500 tracking-wider">CLEARANCE</span>}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`px-2 py-px rounded-lg text-[10px] font-semibold border cursor-help ${clearanceBadge.color}`}>
                      {clearanceBadge.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs max-w-[210px]">
                    Your highest accessible confidentiality level
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Premium Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="h-10 w-10 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all active:scale-95"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
        </div>

        {/* Scanner Status */}
        <div className={cn("px-3 pb-2", collapsed && "flex justify-center")}>
          <ScannerStatus collapsed={collapsed} />
        </div>

        {/* Logout */}
        <div className="p-3">
          <Button
            variant="ghost"
            onClick={() => logout()}
            className={cn(
              "w-full text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all rounded-2xl h-10",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
          >
            <LogOut className={cn("h-4 w-4", !collapsed && "mr-3")} />
            {!collapsed && <span className="font-medium text-sm">Logout</span>}
          </Button>
        </div>

        {!collapsed && (
          <p className="text-center text-[10px] text-gray-400 pb-3 tracking-wider font-mono">
            RHV DMS • 2026
          </p>
        )}
      </div>
    </aside>
  )
}
