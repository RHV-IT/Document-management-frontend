'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft, User, Mail, Building2, Lock, Shield, Loader2, Users, Crown, Briefcase, X, Check } from 'lucide-react'
import { addNotification } from '@/components/notifications/NotificationCenter'
import { authAPI } from '@/services/api/auth'
import { settingsAPI } from '@/services/api/settings'
import Link from 'next/link'
import { ResponsiveContainer } from '@/components/ResponsiveContainer'
import { ConfidentialityLevelSelect } from '@/components/ui/ConfidentialityLevelSelect'
import { useAuth } from '@/hooks/useAuth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(2, 'Password must be at least 2 characters'),
  role: z.enum(['admin', 'hod', 'user'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

const ROLE_OPTIONS = [
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Full system access and management',
    color: '#ef4444',
    icon: Crown
  },
  {
    value: 'hod',
    label: 'Manager',
    description: 'Department-level access and oversight',
    color: '#8b5cf6',
    icon: Briefcase
  },
  {
    value: 'user',
    label: 'Standard User',
    description: 'Regular access to assigned functions',
    color: '#10b981',
    icon: Users
  },
]

interface DepartmentOption {
  _id: string
  name: string
  code: string
  description?: string
  isActive: boolean
}

function MultiDepartmentSelect({ value, onValueChange, departments, placeholder = "Select departments" }: {
  value: string[]
  onValueChange: (value: string[]) => void
  departments: DepartmentOption[]
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDepartment = (deptCode: string) => {
    if (value.includes(deptCode)) {
      onValueChange(value.filter(d => d !== deptCode))
    } else {
      onValueChange([...value, deptCode])
    }
  }

  const removeDepartment = (deptCode: string) => {
    onValueChange(value.filter(d => d !== deptCode))
  }

  const selectedDepts = departments.filter(d => value.includes(d.code))

  return (
    <div className="relative">
      <div
        className="w-full min-h-12 px-4 py-2.5 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all bg-white cursor-pointer flex flex-wrap items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedDepts.length === 0 ? (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        ) : (
          selectedDepts.map(dept => (
            <span
              key={dept._id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100"
            >
              <span className="font-semibold">{dept.code}</span>
              <span className="text-blue-400">·</span>
              <span>{dept.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeDepartment(dept.code) }}
                className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-200 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
        <div className="ml-auto shrink-0">
          <svg className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          <div className="p-2">
            {departments.length === 0 ? (
              <div className="px-4 py-6 text-gray-400 text-sm text-center">No departments available</div>
            ) : (
              departments.map(dept => {
                const isSelected = value.includes(dept.code)
                return (
                  <div
                    key={dept._id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => toggleDepartment(dept.code)}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${isSelected ? 'bg-blue-600 border-blue-600 scale-110' : 'border-gray-300'}`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{dept.code}</span>
                        <span className="font-medium text-gray-900 text-sm truncate">{dept.name}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-blue-600 text-xs font-medium">Selected</span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function RoleSelect({ value, onValueChange, placeholder = "Select role", className = "" }: {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((role) => {
          const IconComponent = role.icon
          return (
            <SelectItem key={role.value} value={role.value}>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${role.color}20` }}
                >
                  <IconComponent className="h-4 w-4" style={{ color: role.color }} />
                </div>
                <div>
                  <div className="font-medium">{role.label}</div>
                  <div className="text-xs text-muted-foreground">{role.description}</div>
                </div>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

export default function CreateUserPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [confidentialityLevel, setConfidentialityLevel] = useState('')
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState('')

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => settingsAPI.getDepartments(),
  })

  const departments: DepartmentOption[] = departmentsData?.data || []

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  })

  const handleRoleChange = (value: string) => {
    setSelectedRole(value)
    setValue('role', value as 'admin' | 'hod' | 'user', { shouldValidate: true })
  }

  const onSubmit = async (data: CreateUserFormData) => {
    if (selectedDepartments.length === 0) {
      addNotification('error', 'Validation Error', 'Please select at least one department')
      return
    }

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
        department: selectedDepartments[0].toUpperCase(),
        departments: selectedDepartments.map(d => d.toUpperCase()),
        role: data.role,
        confidentialityLevel,
      })

      if (response.success || response.data) {
        addNotification('success', 'User Created', `${data.name} has been added to ${selectedDepartments.length} department(s).`)
        setConfidentialityLevel('')
        setSelectedDepartments([])
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
      <div className="flex-1 bg-gradient-to-br from-gray-50/80 to-gray-100/50 overflow-auto">
        <div className="border-b border-border/40 bg-white/60 backdrop-blur-sm p-8">
          <div className="flex items-center gap-6 mb-2">
            <Link
              href="/dashboard/admin/users"
              className="p-3 hover:bg-white/80 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Create New User
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Add a new team member to the system</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-xl shadow-gray-900/5 p-8">
              <div className="flex items-center justify-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                  <User className="w-10 h-10" />
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter full name"
                        {...register('name')}
                        className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                          <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="user@company.com"
                        {...register('email')}
                        className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                          <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Organization & Access</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 w-full">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        Department(s)
                        <span className="text-xs text-blue-600 font-normal">(multiple allowed)</span>
                      </label>
                      <MultiDepartmentSelect
                        value={selectedDepartments}
                        onValueChange={setSelectedDepartments}
                        departments={departments}
                        placeholder="Select departments"
                      />
                      {selectedDepartments.length === 0 && (
                        <p className="text-xs text-gray-400">Select one or more departments for this user</p>
                      )}
                    </div>

                    <div className="space-y-3 w-full">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        Role
                      </label>
                      <RoleSelect
                        value={selectedRole}
                        onValueChange={handleRoleChange}
                        placeholder="Select role"
                        className="h-12 w-full"
                      />
                      {errors.role && (
                        <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                          <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                          {errors.role.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <Lock className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Security & Access</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 w-full h-full">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        Confidentiality Level
                      </label>
                      <ConfidentialityLevelSelect
                        value={confidentialityLevel}
                        onValueChange={setConfidentialityLevel}
                        userRole={user?.role}
                        placeholder="Select level"
                        className="h-fit w-full"
                        showRestrictionNote
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-gray-500" />
                        Temporary Password
                      </label>
                      <input
                        type="password"
                        placeholder="Enter secure password"
                        {...register('password')}
                        className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                      />
                      <p className="text-xs text-gray-500">User will be required to change this on first login</p>
                      {errors.password && (
                        <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                          <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-100 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-3 w-3 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-blue-900">Role Permissions Guide</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ROLE_OPTIONS.map((role) => {
                      const IconComponent = role.icon
                      return (
                        <div key={role.value} className="bg-white/60 rounded-lg p-4 border border-blue-100/50">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${role.color}20` }}
                            >
                              <IconComponent className="h-3 w-3" style={{ color: role.color }} />
                            </div>
                            <span className="font-medium text-gray-900 text-sm">{role.label}</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{role.description}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-8 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-8 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg shadow-blue-500/25"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating User...
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4" />
                        Create User
                      </>
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