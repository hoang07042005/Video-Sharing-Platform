import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadVideoForm } from './UploadVideoForm';

export default function StudioUpload({ isShortType = false }) {
  const navigate = useNavigate();
  const handle = localStorage.getItem('handle');

  const handleUploadSuccess = () => {
    if (handle) {
      navigate(`/c/${handle}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F] p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">
          {isShortType ? 'Tạo video ngắn' : 'Tạo video mới'}
        </h1>
        <UploadVideoForm 
          onUploadSuccess={handleUploadSuccess} 
          isShortType={isShortType} 
        />
      </div>
    </div>
  );
}
