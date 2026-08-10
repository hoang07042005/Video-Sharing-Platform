export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-white">Bảng điều khiển Quản trị</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Tổng người dùng</h3>
          <p className="text-4xl font-bold text-white">1,234</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Tổng video</h3>
          <p className="text-4xl font-bold text-white">5,678</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider">Doanh thu tháng</h3>
          <p className="text-4xl font-bold text-green-400">$12,340</p>
        </div>
      </div>
    </div>
  );
}
