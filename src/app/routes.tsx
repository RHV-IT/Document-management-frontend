import { createBrowserRouter, Navigate } from 'react-router';
import { SignIn } from './pages/SignIn';
import { MyDocuments } from './pages/MyDocuments';
import { RecentFiles } from './pages/RecentFiles';
import { Profile } from './pages/Profile';
import { AdminProfile } from './pages/AdminProfile';
import { ManageUsers } from './pages/ManageUsers';
import { ActivityLog } from './pages/ActivityLog';
import { Archives } from './pages/Archives';
import { Departments } from './pages/Departments';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SignIn />,
  },
  {
    path: '/documents',
    element: (
      <ProtectedRoute>
        <MyDocuments />
      </ProtectedRoute>
    ),
  },
  {
    path: '/recent',
    element: (
      <ProtectedRoute>
        <RecentFiles />
      </ProtectedRoute>
    ),
  },
  {
    path: '/archives',
    element: (
      <ProtectedRoute>
        <Archives />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/profile',
    element: (
      <AdminRoute>
        <AdminProfile />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <AdminRoute>
        <ManageUsers />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/activity',
    element: (
      <AdminRoute>
        <ActivityLog />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/departments',
    element: (
      <AdminRoute>
        <Departments />
      </AdminRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);