import { Navigate, Outlet } from 'react-router-dom';

export default function AdminRoute() {
  const token = localStorage.getItem('token');
  const roles = JSON.parse(localStorage.getItem('roles') || '[]');

  if (!token || !roles.includes('Admin')) {
    // If not logged in or not admin, redirect to home page
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
