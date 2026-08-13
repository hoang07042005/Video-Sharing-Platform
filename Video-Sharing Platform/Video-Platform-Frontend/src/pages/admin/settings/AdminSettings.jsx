import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, Shield, Users, Lock, HardDrive, Code, 
  Save, CheckCircle2, Loader2, Upload, PlaySquare
} from 'lucide-react';
import axios from 'axios';

export default function AdminSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const defaultSettings = {
    siteName: 'Video Sharing Platform', siteTitle: 'Video Sharing - Nền tảng chia sẻ video trực tuyến', siteDescription: 'Nền tảng chia sẻ video giải trí hàng đầu Việt Nam', siteKeywords: 'video, giải trí, chia sẻ, âm nhạc, phim ảnh', contactEmail: 'support@videosharing.com', supportPhone: '1900 1234', address: '123 Đường Công Nghệ, Quận 1, TP. HCM', maintenanceMode: false, logoUrl: '/logotrang.png', faviconUrl: '/favicon.ico',
    autoApproveComments: false, profanityFilter: true, autoBlockReportedVideo: true, maxReportThreshold: 10, preModerateVideos: false, contentIdScan: true, limitNewUserComments: true, hateSpeechAi: true,
    storageProvider: 'local', maxUploadSize: 120, maxDuration: 120, allowedExtensions: 'mp4, webm, ogg', maxQuality: '1080p', enableCompression: true, allowDownloads: true, autoGenerateThumbnails: true,
    allowRegistration: true, requireEmailVerification: true, requirePhoneForUploads: false, maxAvatarSize: 5120, maxCoverSize: 10240, enableSocialLogin: true,
    twoFactorAdmin: true, twoFactorAll: false, adminSessionTimeout: 60, userSessionTimeout: 15, maxFailedLogins: 5, enableIpGeoblocking: false,
    emailOnReport: true, emailOnNewUser: true, smtpHost: 'smtp.gmail.com', smtpPort: 587, smtpUser: 'admin@videosharing.com', smtpPass: '********',
    enablePublicApi: false, gaId: 'G-XXXXXXXXXX', fbPixelId: '123456789012345', recaptchaSiteKey: '6LeKbCAAAAAJcZRqyHh71UMIEGNQ_MZjK2kH'
  };

  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    fetchSettings();
  }, []);

  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/admin/settings');
      if (res.data && Object.keys(res.data).length > 0) {
        setSettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (error) {
      console.error('Lỗi khi tải cấu hình:', error);
    }
  };

  const handleFileUpload = async (event, key, setUploadingState) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingState(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.url) {
        handleChange(key, res.data.url);
      }
    } catch (error) {
      console.error('Lỗi khi tải ảnh lên:', error);
      alert('Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploadingState(false);
    }
  };

  const handleToggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  const handleChange = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await axios.put('/api/admin/settings', settings);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Lỗi khi lưu cấu hình:', error);
      alert('Đã xảy ra lỗi khi lưu cấu hình.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full p-2 md:p-2 font-sans text-gray-200">
      
      {/* Nút Lưu Cấu Hình Nổi */}
      <div className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full shadow-[0_4px_20px_rgba(79,70,229,0.5)] font-bold text-sm uppercase tracking-wide transition-all transform hover:-translate-y-1"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
        </button>
      </div>

      {showToast && (
        <div className="fixed top-20 right-6 bg-emerald-500 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in z-50">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium text-sm">Đã lưu cấu hình thành công!</span>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto">
        {/* Grid Bố cục 3 Cột */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-24">
          
          {/* THÔNG TIN WEBSITE */}
          <Card 
            icon={<Globe className="w-5 h-5 text-blue-500" />} 
            iconBg="bg-blue-600/20" 
            title="THÔNG TIN WEBSITE" 
            subtitle="Thông tin cơ bản về website của bạn"
          >
            <div className="space-y-4">
              <InputGroup label="Tên website (Brand name)" value={settings.siteName} onChange={v => handleChange('siteName', v)} />
              <InputGroup label="Tiêu đề SEO (Meta Title)" value={settings.siteTitle} onChange={v => handleChange('siteTitle', v)} />
              <InputGroup label="Mô tả SEO (Meta Description)" value={settings.siteDescription} onChange={v => handleChange('siteDescription', v)} />
              <InputGroup label="Từ khóa SEO" value={settings.siteKeywords} onChange={v => handleChange('siteKeywords', v)} />
              
              <div className="flex gap-2 items-center">
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-[12px] text-gray-400 w-8">Logo</span>
                  <div className="h-10 w-24 bg-black rounded flex items-center justify-center overflow-hidden border border-white/5 p-1">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-orange-500 font-bold text-xs flex items-center gap-1">Video<span className="text-white">Sharing</span><PlaySquare className="w-3 h-3 text-orange-500 fill-orange-500"/></span>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={(e) => handleFileUpload(e, 'logoUrl', setIsUploadingLogo)} />
                  <button 
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="h-10 w-10 bg-[#1A202C] hover:bg-[#2D3748] rounded flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Upload className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[12px] text-gray-400 w-14">Favicon</span>
                  <div className="h-10 w-10 bg-black rounded flex items-center justify-center overflow-hidden border border-white/5 p-1">
                    {settings.faviconUrl ? (
                      <img src={settings.faviconUrl} alt="Favicon" className="w-full h-full object-contain" />
                    ) : (
                      <PlaySquare className="w-5 h-5 text-orange-500 fill-orange-500"/>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" ref={faviconInputRef} onChange={(e) => handleFileUpload(e, 'faviconUrl', setIsUploadingFavicon)} />
                  <button 
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={isUploadingFavicon}
                    className="h-10 w-10 bg-[#1A202C] hover:bg-[#2D3748] rounded flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {isUploadingFavicon ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Upload className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-[12px] text-gray-400">Email liên hệ</label>
                <input 
                  type="text" value={settings.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)}
                  className="w-2/3 bg-[#0B0F19] rounded-md px-3 py-2 text-[13px] text-gray-200 border border-transparent focus:border-slate-700 outline-none" 
                />
              </div>
            </div>
          </Card>

          {/* TÀI KHOẢN & PHÂN QUYỀN */}
          <Card 
            icon={<Users className="w-5 h-5 text-emerald-500" />} 
            iconBg="bg-emerald-600/20" 
            title="TÀI KHOẢN & PHÂN QUYỀN" 
            subtitle="Cài đặt đăng ký và phân quyền người dùng"
          >
            <div className="space-y-3">
              <ToggleRow label="Mở đăng ký thành viên" checked={settings.allowRegistration} onChange={() => handleToggle('allowRegistration')} color="purple" />
              <ToggleRow label="Đăng nhập qua mạng xã hội" checked={settings.enableSocialLogin} onChange={() => handleToggle('enableSocialLogin')} color="purple" />
              <ToggleRow label="Bắt buộc xác thực Email" checked={settings.requireEmailVerification} onChange={() => handleToggle('requireEmailVerification')} color="white" />
              <ToggleRow label="Bắt buộc số điện thoại để Upload" checked={settings.requirePhoneForUploads} onChange={() => handleToggle('requirePhoneForUploads')} color="white" />
              <ToggleRow label="Bật xác thực 2 bước (2FA) cho Admin" checked={settings.twoFactorAdmin} onChange={() => handleToggle('twoFactorAdmin')} color="purple" />
              
              <div className="grid grid-cols-2 gap-4 pt-6">
                <InputGroup label="Max Avatar (KB)" value={settings.maxAvatarSize} onChange={v => handleChange('maxAvatarSize', v)} />
                <InputGroup label="Max Cover (KB)" value={settings.maxCoverSize} onChange={v => handleChange('maxCoverSize', v)} />
              </div>
            </div>
          </Card>

          {/* KIỂM DUYỆT & BỘ LỌC */}
          <Card 
            icon={<Shield className="w-5 h-5 text-red-500" />} 
            iconBg="bg-red-600/20" 
            title="KIỂM DUYỆT & BỘ LỌC" 
            subtitle="Thiết lập kiểm duyệt nội dung và tự động"
          >
            <div className="space-y-3">
              <ToggleRow label="Duyệt video tự động" checked={!settings.preModerateVideos} onChange={() => handleToggle('preModerateVideos')} color="purple" />
              <ToggleRow label="Duyệt bình luận tự động" checked={settings.autoApproveComments} onChange={() => handleToggle('autoApproveComments')} color="white" />
              <ToggleRow label="Tự động khóa video bị báo cáo" checked={settings.autoBlockReportedVideo} onChange={() => handleToggle('autoBlockReportedVideo')} color="purple" />
              <ToggleRow label="Bộ lọc từ ngữ thô tục" checked={settings.profanityFilter} onChange={() => handleToggle('profanityFilter')} color="purple" />
              <InlineInput label="Ngưỡng báo cáo (lượt)" value={settings.maxReportThreshold} onChange={v => handleChange('maxReportThreshold', v)} width="w-24" />
              <ToggleRow label="AI phát hiện ngôn từ thù ghét" checked={settings.hateSpeechAi} onChange={() => handleToggle('hateSpeechAi')} color="purple" />
              <ToggleRow label="Quét Content ID bản quyền" checked={settings.contentIdScan} onChange={() => handleToggle('contentIdScan')} color="purple" />
            </div>
          </Card>

          {/* BẢO MẬT & TƯỜNG LỬA */}
          <Card 
            icon={<Lock className="w-5 h-5 text-purple-500" />} 
            iconBg="bg-purple-600/20" 
            title="BẢO MẬT & TƯỜNG LỬA" 
            subtitle="Bảo vệ hệ thống và chống tấn công"
          >
            <div className="space-y-3">
              <ToggleRow label="Bảo trì hệ thống (Maintenance Mode)" checked={settings.maintenanceMode} onChange={() => handleToggle('maintenanceMode')} color="white" />
              <InlineInput label="Giới hạn đăng nhập sai" value={settings.maxFailedLogins} onChange={v => handleChange('maxFailedLogins', v)} suffix="lần" width="w-16" />
              <ToggleRow label="Chặn IP quốc gia (GeoBlocking)" checked={settings.enableIpGeoblocking} onChange={() => handleToggle('enableIpGeoblocking')} color="white" />
              <ToggleRow label="Chặn IP tấn công" checked={true} onChange={() => {}} color="green" />
              <div className="pt-4 space-y-3">
                <InlineInput label="Timeout Admin (phút)" value={settings.adminSessionTimeout} onChange={v => handleChange('adminSessionTimeout', v)} width="w-16" />
                <InlineInput label="Timeout User (phút)" value={settings.userSessionTimeout} onChange={v => handleChange('userSessionTimeout', v)} width="w-16" />
              </div>
            </div>
          </Card>

          {/* LƯU TRỮ & MEDIA */}
          <Card 
            icon={<HardDrive className="w-5 h-5 text-blue-500" />} 
            iconBg="bg-blue-600/20" 
            title="LƯU TRỮ & MEDIA" 
            subtitle="Cấu hình lưu trữ và xử lý video"
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-3">
                <SelectGroup 
                  label="Nhà cung cấp máy chủ" value={settings.storageProvider} onChange={v => handleChange('storageProvider', v)} 
                  options={[{value:'local', label:'Máy chủ nội bộ (Local Disk)'}, {value:'aws', label:'Amazon S3'}]} 
                />
                <InputGroup label="Giới hạn Upload (MB)" value={settings.maxUploadSize} onChange={v => handleChange('maxUploadSize', v)} />
                <SelectGroup 
                  label="Định dạng cho phép" value={settings.allowedExtensions} onChange={v => handleChange('allowedExtensions', v)}
                  options={[{value:'mp4, webm, ogg', label:'mp4, webm, ogg'}]} 
                />
                <SelectGroup 
                  label="Độ phân giải tối đa (Transcoding)" value={settings.maxQuality} onChange={v => handleChange('maxQuality', v)} 
                  options={[{value:'1080p', label:'1080p (Full HD)'}, {value:'720p', label:'720p (HD)'}]} 
                />
              </div>
              <div className="space-y-3">
                <InputGroup label="Max Cover (KB)" value={settings.maxCoverSize} onChange={v => handleChange('maxCoverSize', v)} />
                <InputGroup label="H/D" value={"1080"} onChange={()=>{}} />
                <div className="pt-2 space-y-3">
                  <ToggleRow label="Nén video tự động (H.264)" checked={settings.enableCompression} onChange={() => handleToggle('enableCompression')} color="green" />
                  <ToggleRow label="Tạo ảnh Thumbnail" checked={settings.autoGenerateThumbnails} onChange={() => handleToggle('autoGenerateThumbnails')} color="green" />
                  <ToggleRow label="Cho phép tải xuống video" checked={settings.allowDownloads} onChange={() => handleToggle('allowDownloads')} color="white" />
                </div>
              </div>
            </div>
          </Card>

          {/* DỊCH VỤ & TÍCH HỢP */}
          <Card 
            icon={<Code className="w-5 h-5 text-cyan-500" />} 
            iconBg="bg-cyan-600/20" 
            title="DỊCH VỤ & TÍCH HỢP" 
            subtitle="Email, SMTP và các dịch vụ tích hợp"
          >
            <div className="space-y-3">
              <ToggleRow label="Email báo cáo vi phạm" checked={settings.emailOnReport} onChange={() => handleToggle('emailOnReport')} color="green" />
              <ToggleRow label="Email đăng ký mới" checked={settings.emailOnNewUser} onChange={() => handleToggle('emailOnNewUser')} color="green" />
              
              <div className="pt-2">
                <label className="text-[13px] text-gray-300">Cấu hình SMTP</label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[12px] text-gray-400 w-12">Host</label>
                    <input type="text" value={settings.smtpHost} onChange={e => handleChange('smtpHost', e.target.value)} className="bg-[#0B0F19] px-2 py-1.5 text-[12px] rounded border border-transparent flex-1 outline-none focus:border-slate-700" />
                    <label className="text-[12px] text-gray-400">Port</label>
                    <input type="text" value={settings.smtpPort} onChange={e => handleChange('smtpPort', e.target.value)} className="bg-[#0B0F19] px-2 py-1.5 text-[12px] rounded border border-transparent w-16 text-center outline-none focus:border-slate-700" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[12px] text-gray-400 w-12">Username</label>
                    <input type="text" value={settings.smtpUser} onChange={e => handleChange('smtpUser', e.target.value)} className="bg-[#0B0F19] px-2 py-1.5 text-[12px] rounded border border-transparent flex-1 outline-none focus:border-slate-700" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[12px] text-gray-400 w-12">Password</label>
                    <input type="password" value={settings.smtpPass} onChange={e => handleChange('smtpPass', e.target.value)} className="bg-[#0B0F19] px-2 py-1.5 text-[12px] rounded border border-transparent flex-1 outline-none focus:border-slate-700" />
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <ToggleRow label="Bật Public API" checked={settings.enablePublicApi} onChange={() => handleToggle('enablePublicApi')} color="white" />
                <InlineInput label="Google Analytics ID" value={settings.gaId} onChange={v => handleChange('gaId', v)} width="w-48" />
                <InlineInput label="reCAPTCHA Site Key" value={settings.recaptchaSiteKey} onChange={v => handleChange('recaptchaSiteKey', v)} width="w-56" />
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}

// Subcomponents

function Card({ icon, iconBg, title, subtitle, children }) {
  return (
    <div className="bg-[#131722] rounded-xl border border-white/5 p-6 shadow-md flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">{title}</h3>
          <p className="text-[12px] text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function InputGroup({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] text-gray-400">{label}</label>
      <input 
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0B0F19] rounded-md px-3 py-2 text-[13px] text-gray-200 border border-transparent focus:border-slate-700 outline-none transition-colors"
      />
    </div>
  );
}

function SelectGroup({ label, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] text-gray-400">{label}</label>
      <select 
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0B0F19] rounded-md px-3 py-2 text-[13px] text-gray-200 border border-transparent focus:border-slate-700 outline-none transition-colors cursor-pointer appearance-none"
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function InlineInput({ label, value, onChange, width = 'w-24', suffix = '' }) {
  return (
    <div className="flex items-center justify-between py-1">
      <label className="text-[13px] text-gray-300">{label}</label>
      <div className="flex items-center gap-2">
        <input 
          type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className={`${width} bg-[#0B0F19] rounded-md px-3 py-1.5 text-[13px] text-gray-200 text-center border border-transparent focus:border-slate-700 outline-none`}
        />
        {suffix && <span className="text-[13px] text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange, color = 'purple' }) {
  const activeBg = 
    color === 'purple' ? 'bg-[#8B5CF6]' : 
    color === 'green' ? 'bg-[#10B981]' : 
    'bg-gray-400';

  return (
    <div className="flex items-center justify-between py-1.5">
      <label className="text-[13px] text-gray-300 cursor-pointer select-none" onClick={onChange}>{label}</label>
      <button 
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${checked ? activeBg : 'bg-slate-700'}`}
      >
        <span className={`pointer-events-none mt-[2px] ml-[2px] inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-[16px]' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
