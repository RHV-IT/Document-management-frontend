import { FileText, Clock, LogOut, Archive } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import logo from '../assets/rhv-logo.png';

interface SidebarProps {
  currentPage: 'documents' | 'recent' | 'profile' | 'archives';
}

export function Sidebar({ currentPage }: SidebarProps) {
  const navigate = useNavigate();

  const session = JSON.parse(sessionStorage.getItem('rhv_session') || '{}');
  const user = session.user || {};
  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'RH';

  // THE FIXED LOGOUT FUNCTION
  const handleSignOut = () => {
    sessionStorage.clear(); 
    toast.success('Signed out successfully');
    window.location.href = '/'; 
  };

  const menuItems = [
    { icon: FileText, label: 'My Documents', active: currentPage === 'documents', path: '/documents' },
    { icon: Clock, label: 'Recent Files', active: currentPage === 'recent', path: '/recent' },
    { icon: Archive, label: 'Archives', active: currentPage === 'archives', path: '/archives' },
  ];

  return (
    <aside className="w-64 h-screen border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <img src={logo} alt="RHV Logo" className="h-8 object-contain" />
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <div className="mb-4">
          <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase">Main</p>
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                item.active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              <item.icon className="size-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t space-y-2">
        <button
          onClick={() => navigate('/profile')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            currentPage === 'profile' ? 'bg-primary text-white' : 'hover:bg-accent'
          }`}
        >
          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
            {initials}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">{user.name || 'Staff'}</p>
            <p className={`text-xs ${currentPage === 'profile' ? 'text-white/70' : 'text-muted-foreground'}`}>
              {user.department} &middot; {user.staffId}
            </p>
          </div>
        </button>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-destructive"
        >
          <LogOut className="size-5" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}