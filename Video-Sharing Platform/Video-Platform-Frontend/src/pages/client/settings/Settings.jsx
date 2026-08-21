import { useState, useEffect } from 'react';
import { Settings2, Star, Users, Bell, Shield, Palette, MonitorPlay, ChevronRight, User, Loader2, Key } from 'lucide-react';
import axios from 'axios';

// ----- Custom Toggle Component -----
function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none cursor-pointer ${
        checked ? 'bg-[#FF5722]' : 'bg-[#3A3A3A]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ----- Settings Item Component -----
function SettingItem({ icon: Icon, iconColor = 'text-gray-400', title, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 px-5 rounded-xl hover:bg-white/5 transition-colors group">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 shrink-0 ${iconColor}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{title}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ----- Main Settings Page -----
export default function Settings() {
  const [activeTab, setActiveTab] = useState('account');
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('userSettings');
      return saved ? JSON.parse(saved) : {
        showJoinButton: true,
        showCommunityButton: true,
      };
    } catch {
      return { showJoinButton: true, showCommunityButton: true };
    }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const [profileData, setProfileData] = useState({
    fullName: '',
    phoneNumber: '',
    bio: '',
    dateOfBirth: '',
    channelName: '',
    handle: '',
    description: ''
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // For password change
  const [isPwdLoading, setIsPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data) {
          setProfileData({
            fullName: res.data.fullName || '',
            phoneNumber: res.data.phoneNumber || '',
            bio: res.data.bio || '',
            dateOfBirth: res.data.dateOfBirth ? res.data.dateOfBirth.split('T')[0] : '',
            channelName: res.data.channelName || '',
            handle: res.data.handle || '',
            description: res.data.description || ''
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin tài khoản:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsProfileLoading(true);
    setProfileMsg({ type: '', text: '' });
    try {
      await axios.put('/api/auth/profile', profileData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfileMsg({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      
      // Update local storage items if needed
      if (profileData.handle) localStorage.setItem('handle', profileData.handle);
    } catch (error) {
      setProfileMsg({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.' });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const oldPwd = e.target.oldPassword.value;
    const newPwd = e.target.newPassword.value;
    const confirmPwd = e.target.confirmPassword.value;
    
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }
    
    setIsPwdLoading(true);
    setPwdMsg({ type: '', text: '' });
    try {
      await axios.post('/api/auth/change-password', 
        { oldPassword: oldPwd, newPassword: newPwd },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setPwdMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      e.target.reset();
    } catch (error) {
      setPwdMsg({ type: 'error', text: error.response?.data?.message || 'Lỗi khi đổi mật khẩu.' });
    } finally {
      setIsPwdLoading(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Thông tin tài khoản', icon: User, color: 'text-[#FF5722]' },
    { id: 'channel', label: 'Hiển thị kênh', icon: Star, color: 'text-yellow-400' },
    { id: 'notifications', label: 'Thông báo', icon: Bell, color: 'text-purple-400' },
    { id: 'appearance', label: 'Giao diện', icon: Palette, color: 'text-pink-400' },
    { id: 'security', label: 'Bảo mật', icon: Shield, color: 'text-green-400' },
    { id: 'about', label: 'Về ứng dụng', icon: MonitorPlay, color: 'text-red-400' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F] min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5722] to-[#FA5A5A] flex items-center justify-center shadow-lg">
            <Settings2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Cài đặt</h1>
            <p className="text-sm text-gray-500">Tuỳ chỉnh trải nghiệm của bạn</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar Menu */}
          <div className="w-full lg:w-1/4 shrink-0">
            <div className="bg-[#161616] border border-white/8 rounded-2xl p-2 sticky top-24 shadow-xl">
              <div className="space-y-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all cursor-pointer group ${
                        isActive 
                          ? 'bg-white/10 shadow-md' 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-white/10' : 'bg-transparent group-hover:bg-white/5'}`}>
                        <tab.icon className={`w-4.5 h-4.5 ${isActive ? tab.color : 'text-gray-500 group-hover:' + tab.color}`} />
                      </div>
                      <span className={`text-sm font-medium flex-1 text-left ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                        {tab.label}
                      </span>
                      {isActive && <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="bg-[#161616] border border-white/8 rounded-2xl overflow-hidden shadow-xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                  <User className="w-6 h-6 text-[#FF5722]" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Thông tin tài khoản</h2>
                    <p className="text-sm text-gray-500">Quản lý thông tin cá nhân và chi tiết kênh của bạn</p>
                  </div>
                </div>
                
                {profileMsg.text && (
                  <div className={`mb-6 p-4 rounded-xl text-sm border flex items-center gap-3 ${profileMsg.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}>
                    {profileMsg.text}
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Họ và tên</label>
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                        className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF5722] focus:bg-[#252525] transition-all"
                        placeholder="Nhập họ và tên..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Số điện thoại</label>
                      <input
                        type="tel"
                        value={profileData.phoneNumber}
                        onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                        className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF5722] focus:bg-[#252525] transition-all"
                        placeholder="Nhập số điện thoại..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Ngày sinh</label>
                      <input
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                        className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF5722] focus:bg-[#252525] transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Mã định danh (Handle)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                        <input
                          type="text"
                          value={profileData.handle}
                          onChange={(e) => setProfileData({...profileData, handle: e.target.value})}
                          className="w-full bg-[#202020] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-[#FF5722] focus:bg-[#252525] transition-all"
                          placeholder="Mã định danh..."
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Tên kênh (Channel Name)</label>
                    <input
                      type="text"
                      value={profileData.channelName}
                      onChange={(e) => setProfileData({...profileData, channelName: e.target.value})}
                      className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF5722] focus:bg-[#252525] transition-all"
                      placeholder="Tên kênh của bạn..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Tiểu sử cá nhân (Bio)</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF5722] focus:bg-[#252525] transition-all resize-none h-24"
                      placeholder="Giới thiệu một chút về bản thân..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Mô tả kênh (Channel Description)</label>
                    <textarea
                      value={profileData.description}
                      onChange={(e) => setProfileData({...profileData, description: e.target.value})}
                      className="w-full bg-[#202020] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF5722] focus:bg-[#252525] transition-all resize-none h-24"
                      placeholder="Mô tả về nội dung kênh của bạn..."
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/5">
                    <button
                      type="submit"
                      disabled={isProfileLoading}
                      className="bg-[#FF5722] hover:bg-[#F4511E] text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-70 shadow-lg shadow-[#FF5722]/20 hover:shadow-[#FF5722]/40"
                    >
                      {isProfileLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Channel Tab */}
            {activeTab === 'channel' && (
              <div className="bg-[#161616] border border-white/8 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 md:p-8 border-b border-white/10 flex items-center gap-3">
                  <Star className="w-6 h-6 text-yellow-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Hiển thị trang kênh</h2>
                    <p className="text-sm text-gray-500">Quản lý các nút chức năng trên trang kênh của bạn</p>
                  </div>
                </div>
                <div className="p-2">
                  <SettingItem
                    icon={Star}
                    iconColor="text-yellow-400"
                    title='Nút "Hội viên"'
                    description="Hiển thị nút Hội viên trên trang kênh của người khác để họ có thể đăng ký hội viên."
                  >
                    <Toggle
                      checked={settings.showJoinButton}
                      onChange={val => updateSetting('showJoinButton', val)}
                    />
                  </SettingItem>
                  <div className="mx-5 border-t border-white/5" />
                  <SettingItem
                    icon={Users}
                    iconColor="text-blue-400"
                    title='Nút "Cộng đồng"'
                    description="Hiển thị nút Cộng đồng trên trang kênh giúp khán giả tương tác dễ hơn."
                  >
                    <Toggle
                      checked={settings.showCommunityButton}
                      onChange={val => updateSetting('showCommunityButton', val)}
                    />
                  </SettingItem>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-[#161616] border border-white/8 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 md:p-8 border-b border-white/10 flex items-center gap-3">
                  <Bell className="w-6 h-6 text-purple-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Thông báo</h2>
                    <p className="text-sm text-gray-500">Quản lý cách bạn nhận thông báo</p>
                  </div>
                </div>
                <div className="p-2">
                  <SettingItem
                    icon={Bell}
                    iconColor="text-purple-400"
                    title="Thông báo video mới"
                    description="Nhận thông báo khi kênh bạn theo dõi đăng video mới."
                  >
                    <span className="text-xs text-[#FF5722] border border-[#FF5722]/30 bg-[#FF5722]/10 px-3 py-1.5 rounded-full">Sắp ra mắt</span>
                  </SettingItem>
                  <div className="mx-5 border-t border-white/5" />
                  <SettingItem
                    icon={Users}
                    iconColor="text-green-400"
                    title="Thông báo bình luận"
                    description="Nhận thông báo khi có người bình luận vào video của bạn."
                  >
                    <span className="text-xs text-[#FF5722] border border-[#FF5722]/30 bg-[#FF5722]/10 px-3 py-1.5 rounded-full">Sắp ra mắt</span>
                  </SettingItem>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="bg-[#161616] border border-white/8 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 md:p-8 border-b border-white/10 flex items-center gap-3">
                  <Palette className="w-6 h-6 text-pink-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Giao diện</h2>
                    <p className="text-sm text-gray-500">Thay đổi cách ứng dụng hiển thị</p>
                  </div>
                </div>
                <div className="p-2">
                  <SettingItem
                    icon={Palette}
                    iconColor="text-pink-400"
                    title="Chế độ tối (Dark Mode)"
                    description="Giao diện tối giúp giảm mỏi mắt và tiết kiệm pin."
                  >
                    <span className="text-xs font-medium text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1.5 rounded-full">Đang bật</span>
                  </SettingItem>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-[#161616] border border-white/8 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                  <Shield className="w-6 h-6 text-green-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Bảo mật tài khoản</h2>
                    <p className="text-sm text-gray-500">Bảo vệ tài khoản của bạn bằng mật khẩu mạnh</p>
                  </div>
                </div>

                <div className="bg-[#202020] border border-white/5 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Key className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-white">Đổi mật khẩu</h3>
                  </div>

                  {pwdMsg.text && (
                    <div className={`mb-6 p-4 rounded-xl text-sm border flex items-center gap-3 ${pwdMsg.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}>
                      {pwdMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Mật khẩu cũ</label>
                      <input 
                        type="password" 
                        name="oldPassword"
                        placeholder="••••••••"
                        className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF5722] focus:bg-[#1A1A1A] transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Mật khẩu mới</label>
                      <input 
                        type="password" 
                        name="newPassword"
                        placeholder="••••••••"
                        className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF5722] focus:bg-[#1A1A1A] transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Xác nhận mật khẩu mới</label>
                      <input 
                        type="password" 
                        name="confirmPassword"
                        placeholder="••••••••"
                        className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#FF5722] focus:bg-[#1A1A1A] transition-all"
                        required
                        onPaste={(e) => {
                          e.preventDefault();
                          setPwdMsg({ type: 'error', text: 'Vui lòng tự nhập lại mật khẩu, không sử dụng copy-paste.' });
                        }}
                      />
                    </div>
                    <div className="pt-2">
                      <button 
                        type="submit"
                        disabled={isPwdLoading}
                        className="w-full bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {isPwdLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                        Cập nhật mật khẩu
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="bg-[#161616] border border-white/8 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 md:p-8 border-b border-white/10 flex items-center gap-3">
                  <MonitorPlay className="w-6 h-6 text-red-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Về ứng dụng</h2>
                    <p className="text-sm text-gray-500">Thông tin về phiên bản và bản quyền</p>
                  </div>
                </div>
                <div className="p-2">
                  <SettingItem
                    icon={MonitorPlay}
                    iconColor="text-red-400"
                    title="Tên ứng dụng"
                    description="Video Sharing Platform"
                  >
                    <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">v1.0.0</span>
                  </SettingItem>
                  <div className="mx-5 border-t border-white/5" />
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-400 mb-2">Bản quyền © 2026. Mọi quyền được bảo lưu.</p>
                    <p className="text-xs text-gray-600">Được thiết kế với trải nghiệm tốt nhất cho nhà sáng tạo và khán giả.</p>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
