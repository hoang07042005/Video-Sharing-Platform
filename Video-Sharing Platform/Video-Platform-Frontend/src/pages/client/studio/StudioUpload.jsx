import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UploadVideoForm } from "./UploadVideoForm";
import axios from "axios";
import { Loader2 } from "lucide-react";

export default function StudioUpload({ isShortType = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const handle = localStorage.getItem("handle");
  const [editingVideo, setEditingVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get("edit");
    if (editId) {
      setLoading(true);
      axios
        .get(`/api/videos/${editId}`)
        .then((res) => {
          setEditingVideo(res.data);
        })
        .catch((err) => {
          console.error("Error fetching video to edit:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setEditingVideo(null);
    }
  }, [location.search]);

  const handleUploadSuccess = () => {
    if (handle) {
      navigate(`/c/${handle}`);
    } else {
      navigate("/");
    }
  };

  const handleCancelEdit = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0F0F0F]">
        <Loader2 className="w-8 h-8 text-[#FF4E00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F0F] p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">
          {editingVideo
            ? isShortType || editingVideo.isShort
              ? "Chỉnh sửa video ngắn"
              : "Chỉnh sửa video"
            : isShortType
              ? "Tạo video ngắn"
              : "Tạo video mới"}
        </h1>
        <UploadVideoForm
          onUploadSuccess={handleUploadSuccess}
          isShortType={isShortType || editingVideo?.isShort}
          editingVideo={editingVideo}
          onCancelEdit={handleCancelEdit}
        />
      </div>
    </div>
  );
}
