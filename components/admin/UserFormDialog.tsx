'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, User as UserIcon, Mail, Lock, Building2, Shield } from 'lucide-react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useAuth } from '@/hooks/useAuth'
import { useDepartmentsQuery } from '@/hooks/useSettings'
import { useUpdateUserMutation, useRequestEditMutation } from '@/hooks/useUsers'
import { authAPI } from '@/services/api/auth'
import { addNotification } from '@/components/notifications/NotificationCenter'
import { isHodRole } from '@/lib/roles'
import { RoleSelect } from './RoleSelect'
import { DepartmentMultiSelect, DepartmentOption } from './DepartmentMultiSelect'
import { DepartmentAccessCard } from './DepartmentAccessCard'
import { UserCreatedDialog, CreatedUserInfo } from './UserCreatedDialog'

const CONFIDENTIALITY_ORDER: Record<string, number> = { public: 0, internal: 1, confidential: 2, highly_confidential: 3 }

const userFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.'),
  password: z.string().min(2, 'Password must be at least 2 characters').optional().or(z.literal('')),
  role: z.enum(['admin', 'hod', 'user'], { errorMap: () => ({ message: 'Please select a valid role' }) }),
})
type UserFormData = z.infer<typeof userFormSchema>

export interface EditableUser {
  _id?: string
  id?: string
  name: string
  email: string
  role: string
  department: string
  departments?: string[]
  profiles?: { _id?: string; department: string; isPrimary: boolean; confidentialityLevels?: string[] }[]
}

interface UserFormDialogProps {
  mode: 'create' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: EditableUser | null
}

export function UserFormDialog({ mode, open, onOpenChange, user }: UserFormDialogProps) {
  const isMobile = useIsMobile()
  const { user: currentUser } = useAuth()
  const isManager = isHodRole(currentUser?.role)
  const currentUserDept = currentUser?.department || ''
  const queryClient = useQueryClient()

  const { data: departmentsData } = useDepartmentsQuery()
  const departments: DepartmentOption[] = departmentsData || []

  const { mutate: updateUser, isPending: isUpdating } = useUpdateUserMutation()
  const { mutate: requestEdit, isPending: isRequestingEdit } = useRequestEditMutation()
  const [isCreating, setIsCreating] = useState(false)
  const isPending = isUpdating || isRequestingEdit || isCreating
  const [createdResult, setCreatedResult] = useState<CreatedUserInfo | null>(null)

  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [primaryDepartment, setPrimaryDepartment] = useState<string | null>(null)
  const [confidentialityByDept, setConfidentialityByDept] = useState<Record<string, string[]>>({})

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({ resolver: zodResolver(userFormSchema) })

  const roleValue = watch('role')

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && user) {
      reset({ name: user.name, email: user.email, role: user.role as UserFormData['role'], password: '' })
      if (user.profiles && user.profiles.length > 0) {
        const depts = user.profiles.map((p) => p.department)
        setSelectedDepartments(depts)
        setPrimaryDepartment(user.profiles.find((p) => p.isPrimary)?.department || depts[0])
        const map: Record<string, string[]> = {}
        user.profiles.forEach((p) => {
          map[p.department] = p.confidentialityLevels || []
        })
        setConfidentialityByDept(map)
      } else {
        const depts = user.departments && user.departments.length > 0 ? user.departments : user.department ? [user.department] : []
        setSelectedDepartments(depts)
        setPrimaryDepartment(user.department || depts[0] || null)
        setConfidentialityByDept(Object.fromEntries(depts.map((d) => [d, []])))
      }
    } else {
      reset({ name: '', email: '', role: '' as any, password: '' })
      setSelectedDepartments([])
      setPrimaryDepartment(null)
      setConfidentialityByDept({})
    }
  }, [open, mode, user, reset])

  const handleDepartmentsChange = (next: string[]) => {
    setSelectedDepartments(next)
    setConfidentialityByDept((prev) => {
      const updated: Record<string, string[]> = {}
      next.forEach((d) => {
        updated[d] = prev[d] || []
      })
      return updated
    })
    setPrimaryDepartment((prev) => (prev && next.includes(prev) ? prev : next[0] || null))
  }

  const onSubmit = async (data: UserFormData) => {
    if (isPending) return
    if (selectedDepartments.length === 0) {
      addNotification('error', 'Validation Error', 'Please select at least one department')
      return
    }
    if (mode === 'create' && !data.password) {
      addNotification('error', 'Validation Error', 'Please enter a temporary password')
      return
    }

    const profiles = selectedDepartments.map((dept) => ({
      department: dept,
      isPrimary: dept === primaryDepartment,
      confidentialityLevels: confidentialityByDept[dept] || [],
    }))

    const primaryLevels = (primaryDepartment ? confidentialityByDept[primaryDepartment] : []) || []
    const sortedLevels = [...primaryLevels].filter(Boolean).sort((a, b) => (CONFIDENTIALITY_ORDER[a] ?? 99) - (CONFIDENTIALITY_ORDER[b] ?? 99))
    const highestLevel = sortedLevels.length > 0 ? sortedLevels[sortedLevels.length - 1] : ''

    if (mode === 'create') {
      setIsCreating(true)
      try {
        const response = await authAPI.register({
          name: data.name,
          email: data.email,
          password: data.password!,
          department: primaryDepartment || selectedDepartments[0],
          departments: selectedDepartments,
          role: data.role,
          confidentialityLevel: highestLevel || undefined,
          confidentialityLevels: highestLevel ? [highestLevel] : [],
          profiles,
        })
        if (response.success || response.data) {
          queryClient.invalidateQueries({ queryKey: ['users'] })
          const createdUser = response.data?.user
          // Backend reports delivery via either `emailSent` (synchronous result) or
          // `emailQueued` (email handed off to an async delivery queue) depending on
          // the endpoint/config — treat either explicit `true` as a success signal.
          const emailSent =
            typeof response.emailSent === 'boolean'
              ? response.emailSent
              : typeof response.emailQueued === 'boolean'
                ? response.emailQueued
                : false
          setCreatedResult({
            userId: createdUser?._id || createdUser?.id,
            name: data.name,
            email: data.email,
            tempPassword: data.password!,
            department: primaryDepartment || selectedDepartments[0],
            role: data.role,
            emailSent,
          })
          onOpenChange(false)
        } else {
          addNotification('error', 'Creation Failed', 'Failed to create user account.')
        }
      } catch (error: any) {
        addNotification('error', 'Creation Failed', error.response?.data?.message || 'An error occurred')
      } finally {
        setIsCreating(false)
      }
      return
    }

    if (!user) return
    const userId = user._id || user.id!
    if (isManager) {
      const deptSameAsHod = selectedDepartments.length === 1 && selectedDepartments[0] === currentUserDept
      requestEdit(
        {
          userId,
          data: {
            name: data.name,
            email: data.email,
            ...(deptSameAsHod && primaryDepartment ? { department: primaryDepartment } : {}),
            departments: selectedDepartments,
          },
        },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      updateUser(
        {
          userId,
          data: {
            name: data.name,
            email: data.email,
            department: primaryDepartment || undefined,
            departments: selectedDepartments,
            role: data.role,
            confidentialityLevel: highestLevel || undefined,
            confidentialityLevels: highestLevel ? [highestLevel] : [],
            profiles,
          },
        },
        { onSuccess: () => onOpenChange(false) }
      )
    }
  }

  const title = mode === 'create' ? 'Create User' : 'Edit User'
  const description = mode === 'create' ? 'Add a new team member to the system' : 'Update user information and permissions'
  const submitLabel =
    mode === 'create' && isCreating
      ? 'Creating User...'
      : isManager && mode === 'edit'
        ? 'Send Request'
        : mode === 'create'
          ? 'Create User'
          : 'Save Changes'

  const body = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Left column */}
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Basic Information</h3>

          {mode === 'edit' && user && (
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}

          {isManager && mode === 'edit' && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>As a Manager, name and email edits will be sent as a request to the administrator for approval. Department can only be changed if it matches yours.</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="user-name" className="flex items-center gap-1.5 text-xs font-medium">
                <UserIcon className="h-3.5 w-3.5" />
                Full Name
              </Label>
              <Input id="user-name" {...register('name')} placeholder="Enter full name" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-email" className="flex items-center gap-1.5 text-xs font-medium">
                <Mail className="h-3.5 w-3.5" />
                Email Address
              </Label>
              <Input
                id="user-email"
                type="email"
                aria-invalid={!!errors.email}
                {...register('email')}
                placeholder="user@company.com"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {mode === 'create' && (
              <div className="space-y-1.5">
                <Label htmlFor="user-password" className="flex items-center gap-1.5 text-xs font-medium">
                  <Lock className="h-3.5 w-3.5" />
                  Temporary Password
                </Label>
                <Input id="user-password" type="password" {...register('password')} placeholder="Enter secure password" />
                <p className="text-[11px] text-muted-foreground">User will be required to change this on first login</p>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
            )}

            {!isManager && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium">
                  <Shield className="h-3.5 w-3.5" />
                  Role
                </Label>
                <RoleSelect value={roleValue || ''} onValueChange={(v) => setValue('role', v as any, { shouldValidate: true })} />
                {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
              </div>
            )}
          </div>
        </div>

        <div>
          <Label className="flex items-center gap-1.5 text-xs font-medium mb-2">
            <Building2 className="h-3.5 w-3.5" />
            Department Assignment
          </Label>
          <DepartmentMultiSelect departments={departments} value={selectedDepartments} onChange={handleDepartmentsChange} />
          {selectedDepartments.length === 0 && <p className="text-xs text-muted-foreground mt-1.5">Select one or more departments for this user</p>}
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Department Access</h3>
        {selectedDepartments.length === 0 ? (
          <div className="flex items-center justify-center text-center text-sm text-muted-foreground border border-dashed rounded-xl p-8">
            Select departments on the left to configure access per department.
          </div>
        ) : (
          <div className="space-y-3 max-h-[420px] lg:max-h-none overflow-y-auto lg:overflow-visible pr-1">
            {selectedDepartments.map((dept, index) => (
              <DepartmentAccessCard
                key={dept}
                department={dept}
                isPrimary={dept === primaryDepartment}
                onSetPrimary={() => setPrimaryDepartment(dept)}
                confidentialityLevels={confidentialityByDept[dept] || []}
                onConfidentialityLevelsChange={(levels) => setConfidentialityByDept((prev) => ({ ...prev, [dept]: levels }))}
                defaultOpen={index < 3}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const footer = (
    <>
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
        Cancel
      </Button>
      <Button type="submit" form="user-form" disabled={isPending} className="gap-2">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </>
  )

  const handleCreateAnother = () => {
    setCreatedResult(null)
    reset({ name: '', email: '', role: '' as any, password: '' })
    setSelectedDepartments([])
    setPrimaryDepartment(null)
    setConfidentialityByDept({})
    onOpenChange(true)
  }

  const createdDialog = (
    <UserCreatedDialog
      result={createdResult}
      onCreateAnother={handleCreateAnother}
      onClose={() => setCreatedResult(null)}
    />
  )

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="h-[95dvh] max-h-[95dvh] flex flex-col">
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto min-h-0">
              {body}
            </form>
            <DrawerFooter className="flex-row justify-end border-t">{footer}</DrawerFooter>
          </DrawerContent>
        </Drawer>
        {createdDialog}
      </>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[980px] max-h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b shrink-0">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto min-h-0">
            {body}
          </form>
          <DialogFooter className="p-4 border-t shrink-0">{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
      {createdDialog}
    </>
  )
}

export default UserFormDialog
