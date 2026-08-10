import { Navigate, Outlet } from 'react-router-dom';

export default function AdminRoute() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token || role !== 'Admin') {
    // If not logged in or not admin, redirect to home page
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
