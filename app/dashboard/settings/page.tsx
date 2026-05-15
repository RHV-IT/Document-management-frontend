'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuthContext } from '@/contexts/auth'
import { useUpdateProfileMutation, useChangePasswordMutation } from '@/hooks/useAuth'
import { useDepartmentsQuery, useConfidentialityLevelsConfigQuery, useCreateDepartmentMutation, useDeleteDepartmentMutation, useInitializeSettingsMutation } from '@/hooks/useSettings'
import { SkeletonLoader } from '@/components/loaders/SkeletonLoader'
import { addNotification } from '@/components/notifications/NotificationCenter'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  User, Lock, Bell, Shield, Building2, FileLock2,
  Save, RefreshCw, CheckCircle, AlertCircle, Settings as SettingsIcon,
  Eye, EyeOff, Monitor, Download,
  Trash2,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ResponsiveContainer } from '@/components/ResponsiveContainer'

export default function SettingsPage() {
  const { user, canAccess, isLoading: authLoading } = useAuthContext()
  const isAdmin = user?.role === 'admin' || user?.role === 'Admin' || user?.role === 'ADMIN'
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get initial tab from URL query param, default to 'profile'
  const defaultTab = useMemo(() => {
    const tab = searchParams.get('tab')
    const validTabs = ['profile', 'security', 'notifications', 'scanner', 'departments', 'confidentiality']
    if (tab && validTabs.includes(tab)) {
      return tab
    }
    return 'profile'
  }, [searchParams])

  // Initialize form state from user, update when user changes
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
  })

  const [selectedLevels, setSelectedLevels] = useState<string[]>(user?.confidentialityLevels || [])

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
      })
      setSelectedLevels(user.confidentialityLevels || [])
    }
  }, [user])

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfileMutation()
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePasswordMutation()

  const { data: departments, isLoading: departmentsLoading, error: departmentsError } = useDepartmentsQuery()
  const { data: confidentialityLevels, isLoading: levelsLoading, error: levelsError } = useConfidentialityLevelsConfigQuery()
  const createDepartment = useCreateDepartmentMutation()
  const deleteDepartment = useDeleteDepartmentMutation()
  const initializeSettings = useInitializeSettingsMutation()

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const togglePassword = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }



  const [newDepartment, setNewDepartment] = useState({ name: '', code: '', description: '' })


  // Controlled tab state synced with URL
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Update activeTab when defaultTab (from URL) changes
  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Update URL without reload
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({
      name: profileData.name,
      department: profileData.department,
    })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification('error', 'Error', 'Passwords do not match')
      return
    }
    changePassword({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    })
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  const handleAddDepartment = () => {
    if (!newDepartment.name.trim()) {
      addNotification('error', 'Error', 'Department name is required')
      return
    }
    if (!newDepartment.code.trim()) {
      addNotification('error', 'Error', 'Department code is required')
      return
    }
    createDepartment.mutate({
      name: newDepartment.name.toUpperCase(),
      code: newDepartment.code.toUpperCase(),
      description: newDepartment.description,
    })
    setNewDepartment({ name: '', code: '', description: '' })
  }



  const handleInitialize = () => {
    initializeSettings.mutate()
  }

  if (authLoading || !user) {
    return (
      <div className="flex-1 p-8 bg-gray-50/50 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <SkeletonLoader type="card" className="h-32" />
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer>
      <div className="flex-1 p-8 bg-gray-50/50 overflow-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account and system settings</p>
        </div>

        <div className="max-w-4xl">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="bg-white border p-1 h-auto flex flex-wrap gap-1">
              <TabsTrigger value="profile" className="gap-2 cursor-pointer data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2 cursor-pointer data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Lock className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2 cursor-pointer data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              {/* Scanner tab visible to all users */}
              <TabsTrigger value="scanner" className="gap-2 cursor-pointer data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Monitor className="h-4 w-4" />
                Scanner
              </TabsTrigger>
              {isAdmin && (
                <>
                  <TabsTrigger value="departments" className="gap-2 cursor-pointer data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                    <Building2 className="h-4 w-4" />
                    Departments
                  </TabsTrigger>
                  <TabsTrigger value="confidentiality" className="gap-2 cursor-pointer data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                    <FileLock2 className="h-4 w-4" />
                    Confidentiality
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Profile Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-lg">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <Badge className="mt-1 bg-blue-100 text-blue-700">{user?.role}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="name">Full Name</FieldLabel>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value.toUpperCase() })}
                          className="focus:ring-blue-500 focus:border-blue-500"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="department">Department</FieldLabel>
                        <Input
                          id="department"
                          value={profileData.department}
                          onChange={(e) => setProfileData({ ...profileData, department: e.target.value.toUpperCase() })}
                          className="focus:ring-blue-500 focus:border-blue-500"
                        />
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="email">Email Address</FieldLabel>
                      <Input id="email" value={profileData.email} disabled className="bg-gray-50" />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </Field>

                    <Field>
                      <FieldLabel>My Confidentiality Levels</FieldLabel>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {confidentialityLevels && confidentialityLevels.length > 0 ? (
                          confidentialityLevels.map((level) => {
                            const isAssigned = selectedLevels.includes(level.value)
                            return (
                              <Badge
                                key={level.value}
                                className={cn(
                                  isAssigned
                                    ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300'
                                    : 'bg-gray-100 text-gray-500'
                                )}
                              >
                                {isAssigned ? `${level.label} ✓` : level.label}
                              </Badge>
                            )
                          })
                        ) : (
                          <p className="text-sm text-gray-500">No confidentiality levels configured</p>
                        )}
                      </div>
                    </Field>

                    <Button type="submit" disabled={isUpdatingProfile} className="cursor-pointer bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="mt-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Security Settings</CardTitle>
                  <CardDescription>Manage your password and security options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-gray-400" />
                      Change Password
                    </h3>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                      <Field>
                        <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
                        <div className="flex gap-2">
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, currentPassword: e.target.value })
                            }
                            required
                            className="flex-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => togglePassword('current')}
                            className="shrink-0"
                          >
                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                        <div className="flex gap-2">
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            required
                            className="flex-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => togglePassword('new')}
                            className="shrink-0"
                          >
                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                        <div className="flex gap-2">
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                            }
                            required
                            className="flex-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => togglePassword('confirm')}
                            className="shrink-0"
                          >
                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </Field>

                      <Button type="submit" disabled={isChangingPassword} className="cursor-pointer bg-blue-600 hover:bg-blue-700">
                        <Lock className="h-4 w-4 mr-2" />
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </form>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      Session Management
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      You are currently logged in. Your session will expire after 30 minutes of inactivity.
                    </p>
                    <Button variant="outline" className="cursor-pointer">
                      Logout from All Devices
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="mt-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Notification Preferences</CardTitle>
                  <CardDescription>Control how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">File Sharing</p>
                        <p className="text-sm text-gray-500">Get notified when files are shared with you</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Version Updates</p>
                        <p className="text-sm text-gray-500">Get notified when files are updated</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Security Alerts</p>
                        <p className="text-sm text-gray-500">Get notified about account security</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scanner Tab */}
            {(isAdmin || user?.role === 'scanner_admin') && (
              <TabsContent value="scanner" className="mt-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-blue-600" />
                      Scanner Agent
                    </CardTitle>
                    <CardDescription>Install and configure the desktop scanner agent</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <Monitor className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                        <h4 className="text-lg font-semibold text-gray-900">Scanner Agent Setup</h4>
                        <p className="text-sm text-gray-500">Get up and running in 4 simple steps</p>
                      </div>

                      {/* Step 1 */}
                      <div className="relative">
                        <div className="absolute -left-4 top-6 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-4 ring-blue-50">1</div>
                        <div className="ml-12 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                          <h5 className="font-semibold text-gray-900 mb-2">Download the Installer</h5>
                          <p className="text-sm text-gray-600 mb-3">Click below to download the scanner setup file directly from the server</p>
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.4.213:5000'}/api/v1/scanner/auto-install-download`}
                            download="scanner-setup.bat"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                          >
                            <Download className="h-4 w-4" />
                            Download scanner-setup.bat
                          </a>
                          <p className="text-xs text-gray-500 mt-2">File size: ~50 KB</p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="relative">
                        <div className="absolute -left-4 top-6 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-4 ring-blue-50">2</div>
                        <div className="ml-12 bg-white border border-gray-200 rounded-xl p-5">
                          <h5 className="font-semibold text-gray-900 mb-2">Run the Installer</h5>
                          <p className="text-sm text-gray-600 mb-3">Double-click the downloaded file and enter your account credentials when prompted</p>
                          <div className="bg-gray-50 p-3 rounded-lg font-mono text-xs text-gray-700 border border-gray-200">
                            <p>1. Double-click <strong>scanner-setup.bat</strong></p>
                            <p>2. Enter your email: <em className="text-blue-600">you@company.com</em></p>
                            <p>3. Enter your password</p>
                            <p>4. Wait for "Setup Complete!"</p>
                            <p>5. Press any key to exit</p>
                          </div>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="relative">
                        <div className="absolute -left-4 top-6 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-4 ring-blue-50">3</div>
                        <div className="ml-12 bg-white border border-gray-200 rounded-xl p-5">
                          <h5 className="font-semibold text-gray-900 mb-2">Start the Agent</h5>
                          <p className="text-sm text-gray-600 mb-3">Launch the agent and let it run in the background</p>
                          <div className="bg-gray-50 p-3 rounded-lg font-mono text-xs text-gray-700 border border-gray-200">
                            <p>1. Navigate to the installation folder</p>
                            <p>2. Double-click <strong>agent.bat</strong></p>
                            <p>3. Minimize the window (keep it running)</p>
                          </div>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="relative">
                        <div className="absolute -left-4 top-6 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-4 ring-blue-50">4</div>
                        <div className="ml-12 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                          <h5 className="font-semibold text-gray-900 mb-2">Enable Auto-Start</h5>
                          <p className="text-sm text-gray-600 mb-3">When prompted, press <kbd className="px-2 py-0.5 bg-white border border-green-300 rounded text-xs font-mono">Y</kbd> to start the agent automatically on login</p>
                          <div className="flex items-center gap-2 text-green-700 font-medium">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>All set! Agent will start with Windows</span>
                          </div>
                        </div>
                      </div>

                      {/* Important Info Box */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                        <h5 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Where to Scan
                        </h5>
                        <p className="text-sm text-amber-800 mb-2">
                          Save your scanned documents to:
                        </p>
                        <code className="block bg-amber-100 px-3 py-2 rounded font-mono text-amber-900 text-sm mb-2">
                          C:\Users\[YourName]\Documents\Scan
                        </code>
                        <p className="text-xs text-amber-700">
                          The agent monitors this folder and uploads files automatically. Supports: PDF, JPG, PNG, TIFF, BMP (max 50 MB)
                        </p>
                      </div>

                      {/* Troubleshooting */}
                      <details className="bg-gray-50 border border-gray-200 rounded-xl">
                        <summary className="px-5 py-3 font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
                          Troubleshooting & Support
                        </summary>
                        <div className="px-5 pb-5 space-y-3 text-sm">
                          <div className="pt-3 border-t border-gray-200">
                            <h6 className="font-medium text-gray-900 mb-2">Common Issues</h6>
                            <ul className="space-y-2 text-gray-600">
                              <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span><strong>Login fails:</strong> Verify your email and password are correct</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span><strong>Not uploading:</strong> Ensure agent.bat is running (check system tray)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span><strong>File too large:</strong> Maximum file size is 50 MB</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span><strong>Auto-start not working:</strong> Copy agent.bat to Windows Startup folder (Win+R → <code className="bg-gray-100 px-1 rounded">shell:startup</code>)</span>
                              </li>
                            </ul>
                          </div>
                          <div className="pt-3 border-t border-gray-200">
                            <h6 className="font-medium text-gray-900 mb-2">Logs</h6>
                            <p className="text-gray-600">Check <code className="bg-gray-100 px-1 rounded">scanner.log</code> in the agent folder for detailed error messages.</p>
                          </div>
                          <div className="pt-3 border-t border-gray-200">
                            <h6 className="font-medium text-gray-900 mb-2">Need Help?</h6>
                            <p className="text-gray-600">Contact IT support with:</p>
                            <ul className="mt-1 space-y-1 text-gray-600">
                              <li>• Your computer name</li>
                              <li>• The error message</li>
                              <li>• Screenshot of the agent window</li>
                            </ul>
                          </div>
                        </div>
                      </details>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Departments Tab - Admin Only */}
            {isAdmin && (
              <TabsContent value="departments" className="mt-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-blue-600" />
                          Departments
                        </CardTitle>
                        <CardDescription>Manage organization departments</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleInitialize}
                        className="cursor-pointer"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Initialize Defaults
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add new department */}
                    <div className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                      <Input
                        placeholder="Department name"
                        value={newDepartment.name}
                        onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value.toUpperCase() })}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Code (e.g. HR)"
                        value={newDepartment.code}
                        onChange={(e) => setNewDepartment({ ...newDepartment, code: e.target.value.toUpperCase() })}
                        className="w-28"
                      />
                      <Input
                        placeholder="Description (optional)"
                        value={newDepartment.description}
                        onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleAddDepartment}
                        disabled={createDepartment.isPending}
                        className="cursor-pointer bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>

                    {/* Departments list */}
                    {departmentsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
                            <SkeletonLoader type="circle" className="h-10 w-10" />
                            <div className="flex-1">
                              <SkeletonLoader type="text" className="h-4 w-32" />
                              <SkeletonLoader type="text" className="h-3 w-48 mt-1" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : departmentsError ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
                        <p className="text-red-500">Failed to load departments</p>
                        <p className="text-sm text-gray-500 mt-1">{(departmentsError as Error).message}</p>
                      </div>
                    ) : departments && departments.length > 0 ? (
                      <div className="space-y-2">
                        {departments.map((dept, index) => (
                          <div
                            key={dept._id}
                            className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow animate-slide-in-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                                {dept.code}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{dept.name}</p>
                                {dept.description && (
                                  <p className="text-sm text-gray-500">{dept.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={dept.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                                {dept.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => deleteDepartment.mutate(dept._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No departments found</p>
                        <p className="text-sm text-gray-400">Click "Initialize Defaults" to create default departments</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Confidentiality Levels Tab - Admin Only */}
            {isAdmin && (
              <TabsContent value="confidentiality" className="mt-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <FileLock2 className="h-5 w-5 text-blue-600" />
                      Confidentiality Levels
                    </CardTitle>
                    <CardDescription>Manage file confidentiality classifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Note: Levels are managed via backend configuration */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <p className="text-sm text-blue-700 font-medium">Configuration Managed</p>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Confidentiality levels are configured in the backend and fetched from the config API.
                      </p>
                    </div>

                    {/* Levels list */}
                    {levelsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex items-center gap-3 p-4 border rounded-lg">
                            <SkeletonLoader type="circle" className="h-10 w-10" />
                            <div className="flex-1">
                              <SkeletonLoader type="text" className="h-4 w-32" />
                              <SkeletonLoader type="text" className="h-3 w-48 mt-1" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : levelsError ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
                        <p className="text-red-500">Failed to load confidentiality levels</p>
                        <p className="text-sm text-gray-500 mt-1">{(levelsError as Error).message}</p>
                      </div>
                    ) : confidentialityLevels && confidentialityLevels.length > 0 ? (
                      <div className="space-y-2">
                        {confidentialityLevels
                          .sort((a, b) => {
                            const order = ['public', 'internal', 'confidential', 'highly_confidential']
                            return order.indexOf(a.value) - order.indexOf(b.value)
                          })
                          .map((level, index) => (
                            <div
                              key={level.value}
                              className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow animate-slide-in-up"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white',
                                  level.value === 'public' && 'bg-green-500',
                                  level.value === 'internal' && 'bg-blue-500',
                                  level.value === 'confidential' && 'bg-orange-500',
                                  level.value === 'highly_confidential' && 'bg-red-600'
                                )}>
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{level.label}</p>
                                  <p className="text-sm text-gray-500">Value: {level.value}</p>
                                </div>
                              </div>
                              {/* Remove delete button since config API is read-only */}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileLock2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No confidentiality levels found</p>
                        <p className="text-sm text-gray-400">Click "Initialize Defaults" to create default levels</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

      </div>
    </ResponsiveContainer>
  )
}