import { Navigate } from 'react-router';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Check if our 'ID card' exists in the browser
  const session = sessionStorage.getItem('rhv_session');

  if (!session) {
    // No session? Go back to the lobby (Sign In)
    return <Navigate to="/signin" replace />;
  }

  // Session exists? Come on in!
  return <>{children}</>;
}