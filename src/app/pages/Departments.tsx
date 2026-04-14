import { useState, useEffect } from 'react';
import { AdminSidebar } from '../components/AdminSidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { departmentsApi } from '../lib/api';
import { toast } from 'sonner';

interface Department {
  id: string;
  name: string;
  createdAt: Date;
}

export function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDeptName, setNewDeptName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentsApi.getAll();
      setDepartments(data);
    } catch (err: any) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setAdding(true);
    try {
      const dept = await departmentsApi.create(newDeptName.trim());
      setDepartments((prev) => [...prev, dept]);
      setNewDeptName('');
      toast.success(`Department "${dept.name}" added`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add department');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete department "${name}"? This cannot be undone.`)) return;
    try {
      await departmentsApi.delete(id);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      toast.success(`Department "${name}" deleted`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete department');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar currentPage="departments" />

      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-2xl">
          <h2 className="mb-6">Manage Departments</h2>

          {/* Add new department */}
          <div className="bg-card rounded-lg border p-6 mb-6">
            <h3 className="mb-4">Add New Department</h3>
            <form onSubmit={handleAdd} className="flex gap-3">
              <Input
                placeholder="Department name e.g. Cardiology"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={adding || !newDeptName.trim()}>
                <Plus className="size-4 mr-2" />
                {adding ? 'Adding...' : 'Add'}
              </Button>
            </form>
          </div>

          {/* Departments list */}
          <div className="bg-card rounded-lg border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading departments...</div>
            ) : departments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No departments added yet</div>
            ) : (
              <div className="divide-y">
                {departments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                    <span className="text-sm font-medium">{dept.name}</span>
                    <button
                      onClick={() => handleDelete(dept.id, dept.name)}
                      className="p-1.5 hover:bg-muted rounded transition-colors text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}