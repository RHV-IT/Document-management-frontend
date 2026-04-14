import { useState, useEffect } from 'react';
import { AdminSidebar } from '../components/AdminSidebar';
import { FileText, Upload, Download, Trash2, UserPlus } from 'lucide-react';
import { activityApi } from '../lib/api';
import { toast } from 'sonner';

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  // We change this to accept both so TypeScript doesn't complain
  timestamp: Date | string; 
  type: 'upload' | 'download' | 'delete' | 'user_created' | 'other';
}

export function ActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await activityApi.getAll();
      setActivities(data);
    } catch (err: any) {
      toast.error('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'upload': return <Upload className="size-5 text-green-600" />;
      case 'download': return <Download className="size-5 text-blue-600" />;
      case 'delete': return <Trash2 className="size-5 text-red-600" />;
      case 'user_created': return <UserPlus className="size-5 text-purple-600" />;
      default: return <FileText className="size-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar currentPage="activity" />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-6">Activity Log</h2>

          <div className="bg-card rounded-lg border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading activity...</div>
            ) : activities.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No activity recorded yet</div>
            ) : (
              <div className="divide-y">
                {activities.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>{' '}
                          <span className="text-muted-foreground">{activity.action}</span>{' '}
                          <span className="font-medium">{activity.target}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {/* We wrap it in new Date() to ensure it can be formatted */}
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
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