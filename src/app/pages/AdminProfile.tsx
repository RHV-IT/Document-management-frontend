import { useState } from 'react';
import { AdminSidebar } from '../components/AdminSidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { User, Lock, Mail, Building, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../lib/api';

export function AdminProfile() {
  const session = JSON.parse(sessionStorage.getItem('rhv_session') || '{}');
  const sessionUser = session.user || {};

  const initials = sessionUser.name
    ? sessionUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'RH';

  const [formData, setFormData] = useState({
    name: sessionUser.name || '',
    email: sessionUser.email || '',
    staffId: sessionUser.staffId || '',
    department: sessionUser.department || '',
    role: sessionUser.role || 'admin',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.updateProfile({ name: formData.name, email: formData.email });
      const updatedSession = JSON.parse(sessionStorage.getItem('rhv_session') || '{}');
      updatedSession.user = { ...updatedSession.user, name: formData.name, email: formData.email };
      sessionStorage.setItem('rhv_session', JSON.stringify(updatedSession));
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await authApi.changePassword(formData.currentPassword, formData.newPassword);
      toast.success('Password changed successfully');
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.message || 'Password change failed');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar currentPage="profile" />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-3xl">
          <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

          <div className="bg-card rounded-lg border p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-medium">
                {initials}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{formData.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="size-4 text-primary" />
                  <p className="text-sm text-primary font-medium">Administrator</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Staff ID: {formData.staffId}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <User className="size-4 inline mr-2" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="size-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">
                  <Building className="size-4 inline mr-2" />
                  Department
                </Label>
                <Input
                  id="department"
                  value={formData.department}
                  disabled
                  className="bg-muted"
                />
              </div>

              <Button type="submit">Update Profile</Button>
            </form>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">
              <Lock className="size-5 inline mr-2" />
              Change Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground flex items-center justify-center"
                  >
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground flex items-center justify-center"
                  >
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground flex items-center justify-center"
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit">Change Password</Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}