import { Navigate } from 'react-router';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const session = sessionStorage.getItem('rhv_session');
  
  if (!session) return <Navigate to="/" replace />;

  const userData = JSON.parse(session);

  // If they aren't an admin, send them back to the normal documents page
  if (userData.user?.role !== 'admin') {
    return <Navigate to="/documents" replace />;
  }

  return <>{children}</>;
}