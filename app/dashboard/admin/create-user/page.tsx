'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft, User, Mail, Building2, Lock, Shield, Loader2 } from 'lucide-react'
import { addNotification } from '@/components/notifications/NotificationCenter'
import { authAPI } from '@/services/api/auth'
import { settingsAPI } from '@/services/api/settings'
import Link from 'next/link'
import { ResponsiveContainer } from '@/components/ResponsiveContainer'
import { ConfidentialityLevelSelect } from '@/components/ui/ConfidentialityLevelSelect'
import { useAuth } from '@/hooks/useAuth'

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(2, 'Password must be at least 2 characters'),
  department: z.string().min(1, 'Please select a department'),
  role: z.enum(['admin', 'hod', 'user'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full system access' },
  { value: 'hod', label: 'Head of Department', description: 'Department-level access' },
  { value: 'user', label: 'User', description: 'Standard access' },
]

export default function CreateUserPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [confidentialityLevel, setConfidentialityLevel] = useState('')

  // Fetch departments from API
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => settingsAPI.getDepartments(),
  })

  const departments = departmentsData?.data?.departments || []

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  })

  const onSubmit = async (data: CreateUserFormData) => {
    // Validate confidentiality level separately
    if (!confidentialityLevel) {
      addNotification('error', 'Validation Error', 'Please select a confidentiality level')
      return
    }

    setIsLoading(true)
    try {
      const response = await authAPI.register({
        name: data.name.toUpperCase(),
        email: data.email,
        password: data.password,
        department: data.department.toUpperCase(),
        confidentialityLevel,
      })

      if (response.success || response.data) {
        addNotification('success', 'User Created', `${data.name} has been added to the system.`)
        setConfidentialityLevel('')
        router.push('/dashboard/admin/users')
      } else {
        addNotification('error', 'Creation Failed', 'Failed to create user account.')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An error occurred'
      addNotification('error', 'Creation Failed', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ResponsiveContainer>
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard/admin/users"
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create New User</h1>
            <p className="text-muted-foreground mt-1">Add a new account to the system</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl">
          <div className="bg-card rounded-lg border border-border p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    {...register('name')}
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive font-medium">● {errors.name.message}</p>
                )}
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="john@rhv.com"
                    {...register('email')}
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive font-medium">● {errors.email.message}</p>
                )}
              </div>

              {/* Department Select */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">Department</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                    <select
                      {...register('department')}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none bg-card"
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept.code}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.department && (
                    <p className="text-sm text-destructive font-medium">● {errors.department.message}</p>
                  )}
                </div>

                {/* Role Select */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">Role</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                    <select
                      {...register('role')}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none bg-card"
                    >
                      <option value="">Select role</option>
                      {ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.role && (
                    <p className="text-sm text-destructive font-medium">● {errors.role.message}</p>
                  )}
                </div>
              </div>

              {/* Confidentiality Level Select */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Confidentiality Level</label>
                <ConfidentialityLevelSelect
                  value={confidentialityLevel}
                  onValueChange={setConfidentialityLevel}
                  userRole={user?.role}
                  placeholder="Select confidentiality level"
                  className="w-full"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Temporary Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Generate secure password"
                    {...register('password')}
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <p className="text-xs text-muted-foreground">User will be required to change this on first login.</p>
                {errors.password && (
                  <p className="text-sm text-destructive font-medium">● {errors.password.message}</p>
                )}
              </div>

              {/* Role Descriptions */}
              <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Role Permissions:</p>
                {ROLES.map((role) => (
                  <div key={role.value} className="text-sm">
                    <p className="font-medium text-foreground">{role.label}</p>
                    <p className="text-muted-foreground">{role.description}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2.5 border border-border rounded-lg hover:bg-secondary transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  )
}
