import { useState, useEffect } from 'react';
import { AdminSidebar } from '../components/AdminSidebar';
import { Button } from '../components/ui/button';
import { Plus, Edit, UserX, Trash2 } from 'lucide-react';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { User } from '../types';
import { usersApi } from '../lib/api';
import { toast } from 'sonner';

export function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: Omit<User, 'id' | 'dateAdded' | 'status'>) => {
    try {
      const newUser = await usersApi.create(userData as any);
      setUsers((prev) => [newUser, ...prev]);
      toast.success(`Account created for ${newUser.name}. Default password is their Staff ID.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
      throw err;
    }
  };

  const handleEditUser = async (userId: string, data: Partial<User>) => {
    try {
      const updatedUser = await usersApi.update(userId, data as any);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...updatedUser } : u));
      toast.success('User updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
      throw err;
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const { status } = await usersApi.toggleStatus(userId);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status } : u));
      toast.success(`User ${status === 'active' ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Permanently delete "${userName}"? This cannot be undone. Their uploaded documents will remain.`)) return;
    try {
      await usersApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success(`"${userName}" has been permanently deleted`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar currentPage="users" />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2>Manage Users</h2>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="size-4 mr-2" />
              Create User
            </Button>
          </div>

          <div className="bg-card rounded-lg border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Email</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Staff ID</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Role</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Department</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Date Added</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                              {getInitials(user.name)}
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3 text-sm">{user.staffId}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 'Staff'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{user.department}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(user.dateAdded).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setUserToEdit(user); setIsEditModalOpen(true); }}
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title="Edit user"
                            >
                              <Edit className="size-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user.id)}
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              <UserX className="size-4 text-amber-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title="Permanently delete"
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateUser={handleCreateUser}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        user={userToEdit}
        onClose={() => { setIsEditModalOpen(false); setUserToEdit(null); }}
        onEditUser={handleEditUser}
      />
    </div>
  );
}