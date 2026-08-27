import { useState, useEffect } from 'react';
import axios from 'axios';
import { Outlet } from 'react-router-dom';
import MaintenancePage from '../../../pages/error/MaintenancePage';
import { Loader2 } from 'lucide-react';

export default function MaintenanceGuard() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/admin/settings/public');
        if (res.data && res.data.maintenanceMode !== undefined) {
          const isMaintenance = res.data.maintenanceMode === true || res.data.maintenanceMode === "true";
          setMaintenanceMode(isMaintenance);
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#FF5722] animate-spin" />
      </div>
    );
  }

  // Lấy role từ localStorage để kiểm tra quyền Admin
  const rolesStr = localStorage.getItem('roles');
  const roles = rolesStr ? JSON.parse(rolesStr) : [];
  const isAdmin = roles.includes('Admin');

  // Nếu đang bảo trì và không phải Admin -> hiển thị trang bảo trì
  if (maintenanceMode && !isAdmin) {
    return <MaintenancePage />;
  }

  // Nếu bình thường hoặc là Admin -> render component con (các route client)
  return <Outlet />;
}
