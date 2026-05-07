'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import { cn } from '@/lib/utils'
import { debug } from '@/lib/debug'
import {
  Home, FileText, Upload, Trash2, Users, BarChart3, Settings,
  LogOut, Activity, Scan, Layers, User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { GlowCircle } from '@/components/ui/glow-circle'

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

  const visibleItems = NAV_ITEMS.filter((item) => canAccess(item.roles))

  debug.render('DashboardSidebar', `user=${user?.name}, visibleItems=${visibleItems.length}`)

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
    <aside className="w-72 bg-white border-r border-gray-200/50 flex flex-col h-full shadow-sm">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Image src="/images/rhv-white.png" alt="DMS" width={24} height={24} className="object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">DMS</h1>
            <p className="text-xs text-gray-500">Document Management</p>
          </div>
        </div>
      </div>

      {/* User Card */}
      {user && (
        <div className="p-4 mx-4 mt-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100/50">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{user?.name || 'User'}</p>
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', getRoleBadgeColor(user?.role || 'user'))}>
                 {user?.role === 'admin' ? 'Administrator' : user?.role === 'hod' ? 'Head of Dept' : 'User'}
              </span>
            </div>
          </div>
            {user?.department && (
              <p className="text-xs text-gray-500 mt-2 pl-13">{user.department!}</p>
            )}
        </div>
      )}

      <Separator className="my-4 mx-4 bg-gray-100" />

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          Menu
        </div>
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <div className={cn(
                'p-1.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-white/20'
                  : 'bg-gray-100 group-hover:bg-blue-100'
              )}>
                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600')} />
              </div>
               <div className="flex-1">
                 <p className={cn('font-medium text-sm', isActive ? 'text-white' : 'text-gray-700')}>
                   {item.label}
                 </p>
                 <p className={cn('text-xs', isActive ? 'text-blue-100' : 'text-gray-400')}>
                   {item.description}
                 </p>
               </div>
               <GlowCircle isActive={isActive} />
            </Link>
          )
        })}
      </nav>

      <Separator className="mx-4 bg-gray-100" />

      {/* Logout */}
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4 mr-3" />
          <span className="font-medium">Logout</span>
        </Button>

        <p className="text-xs text-gray-400 text-center mt-3">
          DMS v2.0 • RHV Edition
        </p>
      </div>
    </aside>
  )
}