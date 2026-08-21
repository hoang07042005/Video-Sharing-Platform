import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ThumbsUp, MessageSquare, MoreVertical, Trash2, Heart, Share2, ChevronLeft, ChevronRight, X, Play, Pin } from "lucide-react";
import moment from "moment";
import "moment/dist/locale/vi";
import CommunityPostCommentModal from "./CommunityPostCommentModal";

moment.locale("vi");

export default function CommunityPostCard({ post, isOwner, onPostDeleted, onPostPinned }) {
  const [isLiked, setIsLiked] = useState(post.isLikedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.commentsCount);
  const [showOptions, setShowOptions] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [myVote, setMyVote] = useState(post.myVoteOptionId);
  const [pollOptions, setPollOptions] = useState(post.pollOptions || []);
  const [totalVotes, setTotalVotes] = useState(post.totalVotes || 0);
  
  // Combine media: images first, then video (or vice versa, let's do images then video)
  const mediaItems = React.useMemo(() => {
    const items = [];
    if (post.images) {
      post.images.forEach(img => items.push({ type: 'image', url: img }));
    }
    if (post.videoUrl) {
      items.push({ type: 'video', url: post.videoUrl });
    }
    return items;
  }, [post.images, post.videoUrl]);

  // Media orientation state
  const [primaryOrientation, setPrimaryOrientation] = useState('portrait'); // Default to portrait for better collage

  // LIGHTBOX STATE
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    if (mediaItems?.length > 0) {
      const firstMedia = mediaItems[0];
      if (firstMedia.type === 'image') {
        const img = new Image();
        const checkOrientation = () => {
          // Use portrait layout even for slightly wide images or squares
          setPrimaryOrientation(img.height >= (img.width * 0.85) ? 'portrait' : 'landscape');
        };
        img.onload = checkOrientation;
        img.src = firstMedia.url;
        if (img.complete) {
          checkOrientation();
        }
      } else if (firstMedia.type === 'video') {
        const vid = document.createElement('video');
        vid.onloadedmetadata = () => {
          setPrimaryOrientation(vid.videoHeight >= (vid.videoWidth * 0.85) ? 'portrait' : 'landscape');
        };
        vid.src = firstMedia.url;
      }
    }
  }, [mediaItems]);

  const openLightbox = (index) => {
    setActiveMediaIndex(index);
    setIsLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = "auto";
  };

  const nextMedia = (e) => {
    e.stopPropagation();
    setActiveMediaIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevMedia = (e) => {
    e.stopPropagation();
    setActiveMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const handleLike = async () => {
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
    
    try {
      const token = localStorage.getItem("token");
      await axios.post(`/api/community/${post.id}/like`, { isLike: !wasLiked }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (err) {
      console.error(err);
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
    }
  };
  
  const handleVote = async (optionId) => {
    if (myVote === optionId) return;
    
    const prevVote = myVote;
    setMyVote(optionId);
    
    const updatedOptions = pollOptions.map(opt => {
      let votesCount = opt.votesCount;
      if (opt.id === prevVote) votesCount--;
      if (opt.id === optionId) votesCount++;
      return { ...opt, votesCount };
    });
    
    const newTotalVotes = totalVotes + (prevVote ? 0 : 1);
    setTotalVotes(newTotalVotes);
    
    updatedOptions.forEach(opt => {
      opt.votePercentage = newTotalVotes > 0 ? Math.round((opt.votesCount / newTotalVotes) * 100) : 0;
    });
    setPollOptions(updatedOptions);
    
    try {
      const token = localStorage.getItem("token");
      await axios.post(`/api/community/poll/${optionId}/vote`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (err) {
      console.error(err);
    }
  };
  
  const handlePin = async () => {
    try {
      const response = await axios.put(`/api/channels/${post.channelId}/community/${post.id}/pin`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success(response.data.message || (post.isPinned ? "Đã bỏ ghim bài viết!" : "Đã ghim bài viết!"));
      setShowOptions(false);
      if (onPostPinned) onPostPinned();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi khi ghim bài viết");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Bạn có chắc muốn xóa bài viết này?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/api/community/${post.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (onPostDeleted) onPostDeleted(post.id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const displayName = post.authorName || post.channelName;
  const isMemberPost = !!post.authorName;
  const avatarUrl = isMemberPost 
    ? (post.authorAvatarUrl || `https://ui-avatars.com/api/?name=${displayName}`) 
    : (post.channelAvatarUrl || `https://ui-avatars.com/api/?name=${displayName}`);
  
  return (
    <>
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-white/10 mb-4 hover:border-white/20 transition-colors">
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-3 items-center">
            {post.authorName ? (
              <img 
                src={avatarUrl} 
                alt={displayName} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <Link to={`/channel/${post.channelHandle}`}>
                <img 
                  src={avatarUrl} 
                  alt={displayName} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              </Link>
            )}
            
            <div>
              {post.authorName ? (
                <div className="font-semibold text-white">
                  {displayName}
                </div>
              ) : (
                <Link to={`/c/${post.authorHandle || post.channelHandle}`} className="font-semibold text-gray-200 hover:text-white transition-colors">
                  {post.authorName}
                </Link>
              )}
              
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <span className="text-gray-500 text-xs">{moment.utc(post.createdAt).local().locale('vi').fromNow()}</span>
                {post.isPinned && (
                  <span className="ml-2 text-xs text-red-400 font-medium flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full">
                    <Pin className="w-3 h-3 fill-red-400" /> Đã ghim
                  </span>
                )}
                {post.isMembersOnly && (
                  <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide">
                    HỘI VIÊN
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {isOwner && (
            <div className="relative">
              <button onClick={() => setShowOptions(!showOptions)} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10">
                <MoreVertical className="w-5 h-5" />
              </button>
              {showOptions && (
                <div className="absolute right-0 mt-1 w-36 bg-[#2a2a2a] rounded-lg shadow-xl border border-white/10 py-1 z-10">
                  <button onClick={handlePin} className="w-full flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-white/5 text-sm transition-colors">
                    <Pin className="w-4 h-4" /> {post.isPinned ? "Bỏ ghim" : "Ghim bài"}
                  </button>
                  <button onClick={handleDelete} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-white/5 text-sm transition-colors">
                    <Trash2 className="w-4 h-4" /> Xóa bài
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <p className="text-gray-200 mb-3 whitespace-pre-line text-sm leading-relaxed">{post.content}</p>
        
        {/* Media Grid */}
        {mediaItems.length > 0 && (
          <div className="mb-4 rounded-lg overflow-hidden border border-white/10">
            {mediaItems.length === 1 && (
              <div 
                onClick={() => openLightbox(0)}
                className="relative bg-black max-h-[450px] flex items-center justify-center cursor-pointer group"
              >
                {mediaItems[0].type === 'image' ? (
                  <img src={mediaItems[0].url} alt="" className="max-w-full max-h-[450px] object-contain group-hover:brightness-90 transition-all" />
                ) : (
                  <div className="relative w-full h-full max-h-[450px] flex items-center justify-center group-hover:brightness-90 transition-all">
                    <video src={mediaItems[0].url} className="w-full max-h-[450px] object-contain" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm">
                        <Play className="w-10 h-10 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {mediaItems.length === 2 && (
              <div className="grid grid-cols-2 gap-1 bg-gray-900">
                {mediaItems.map((media, idx) => (
                  <div key={idx} onClick={() => openLightbox(idx)} className="relative h-64 md:h-72 cursor-pointer group">
                    {media.type === 'image' ? (
                      <img src={media.url} alt="" className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center group-hover:brightness-90 transition-all">
                        <video src={media.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm">
                            <Play className="w-8 h-8 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {mediaItems.length === 3 && (
              primaryOrientation === 'portrait' ? (
                <div className="grid grid-cols-2 gap-1 bg-gray-900 h-[20rem] md:h-[24rem] rounded-lg overflow-hidden border border-white/10">
                  <div onClick={() => openLightbox(0)} className="relative h-full cursor-pointer group">
                    {mediaItems[0].type === 'image' ? (
                      <img src={mediaItems[0].url} alt="" className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center group-hover:brightness-90 transition-all">
                        <video src={mediaItems[0].url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm">
                            <Play className="w-8 h-8 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-rows-2 gap-1 h-full">
                    {mediaItems.slice(1, 3).map((media, idx) => (
                      <div key={idx + 1} onClick={() => openLightbox(idx + 1)} className="relative w-full h-full cursor-pointer group">
                        {media.type === 'image' ? (
                          <img src={media.url} alt="" className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
                        ) : (
                          <div className="relative w-full h-full flex items-center justify-center group-hover:brightness-90 transition-all">
                            <video src={media.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm">
                                <Play className="w-8 h-8 text-white fill-white" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1 bg-gray-900 h-[20rem] md:h-[24rem] rounded-lg overflow-hidden border border-white/10">
                  <div onClick={() => openLightbox(0)} className="relative h-[60%] cursor-pointer group">
                    {mediaItems[0].type === 'image' ? (
                      <img src={mediaItems[0].url} alt="" className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center group-hover:brightness-90 transition-all">
                        <video src={mediaItems[0].url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm">
                            <Play className="w-8 h-8 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1 h-[40%]">
                    {mediaItems.slice(1, 3).map((media, idx) => (
                      <div key={idx + 1} onClick={() => openLightbox(idx + 1)} className="relative w-full h-full cursor-pointer group">
                        {media.type === 'image' ? (
                          <img src={media.url} alt="" className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
                        ) : (
                          <div className="relative w-full h-full flex items-center justify-center group-hover:brightness-90 transition-all">
                            <video src={media.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm">
                                <Play className="w-8 h-8 text-white fill-white" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
            
            {mediaItems.length === 4 && (
              <div className="grid grid-cols-2 gap-1 bg-gray-900 rounded-lg overflow-hidden border border-white/10">
                {mediaItems.map((media, idx) => (
                  <div key={idx} onClick={() => openLightbox(idx)} className="relative h-36 md:h-44 cursor-pointer group">
                    {media.type === 'image' ? (
                      <img src={media.url} alt="" className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center group-hover:brightness-90 transition-all">
                        <video src={media.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm">
                            <Play className="w-8 h-8 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {mediaItems.length >= 5 && (
              primaryOrientation === 'portrait' ? (
                <div className="flex gap-1 h-[20rem] md:h-[24rem] bg-gray-900 rounded-lg overflow-hidden border border-white/10">
                  {/* Left side (40% width) - 1 tall image */}
                  <div 
                    className="w-[40%] h-full relative cursor-pointer group"
                    onClick={() => openLightbox(0)}
                  >
                    {mediaItems[0].type === 'image' ? (
                      <img src={mediaItems[0].url} alt="" className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center group-hover:brightness-90 transition-all">
                        <video src={mediaItems[0].url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm">
                            <Play className="w-10 h-10 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right side (60% width) */}
                  <div className="w-[60%] flex flex-col gap-1">
                    {/* Top right - 1 wide image */}
                    <div 
                      className="h-[60%] relative cursor-pointer group"
                      onClick={() => openLightbox(1)}
                    >
                      {mediaItems[1].type === 'image' ? (
                        <img src={mediaItems[1].url} alt="" className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center group-hover:brightness-90 transition-all">
                          <video src={mediaItems[1].url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm">
                              <Play className="w-8 h-8 text-white fill-white" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Bottom right - 3 small images */}
                    <div className="h-[40%] grid grid-cols-3 gap-1">
                      {mediaItems.slice(2, 5).map((media, idx) => (
                        <div 
                          key={idx + 2} 
                          onClick={() => openLightbox(idx + 2)} 
                          className="relative h-full cursor-pointer group"
                        >
                          {media.type === 'image' ? (
                            <img src={media.url} alt="" className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
                          ) : (
                            <div className="relative w-full h-full flex items-center justify-center group-hover:brightness-90 transition-all">
                              <video src={media.url} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-black/50 p-1 rounded-full backdrop-blur-sm">
                                  <Play className="w-5 h-5 text-white fill-white" />
                                </div>
                              </div>
                            </div>
                          )}
                          {idx === 2 && mediaItems.length > 5 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center transition-all group-hover:bg-black/70">
                              <span className="text-white text-xl md:text-2xl font-bold">+{mediaItems.length - 5}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1 bg-gray-900 h-[20rem] md:h-[24rem] rounded-lg overflow-hidden border border-white/10">
                  {/* Top row - 2 images */}
                  <div className="flex gap-1 h-[60%] w-full">
                    {mediaItems.slice(0, 2).map((media, idx) => (
                      <div key={idx} onClick={() => openLightbox(idx)} className="relative w-1/2 h-full cursor-pointer group">
                        {media.type === 'image' ? (
                          <img src={media.url} alt="" className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
                        ) : (
                          <div className="relative w-full h-full flex items-center justify-center group-hover:brightness-90 transition-all">
                            <video src={media.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm">
                                <Play className="w-8 h-8 text-white fill-white" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Bottom row - 3 images */}
                  <div className="flex gap-1 h-[40%] w-full">
                    {mediaItems.slice(2, 5).map((media, idx) => (
                      <div key={idx + 2} onClick={() => openLightbox(idx + 2)} className="relative w-1/3 h-full cursor-pointer group">
                        {media.type === 'image' ? (
                          <img src={media.url} alt="" className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
                        ) : (
                          <div className="relative w-full h-full flex items-center justify-center group-hover:brightness-90 transition-all">
                            <video src={media.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-black/50 p-1 rounded-full backdrop-blur-sm">
                                <Play className="w-6 h-6 text-white fill-white" />
                              </div>
                            </div>
                          </div>
                        )}
                        {idx === 2 && mediaItems.length > 5 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white text-xl font-bold">+{mediaItems.length - 5}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
        
        {/* Poll */}
        {pollOptions && pollOptions.length > 0 && (
          <div className="mb-4 space-y-2">
            {pollOptions.map((opt) => (
              <div 
                key={opt.id} 
                onClick={() => handleVote(opt.id)}
                className="relative h-10 rounded overflow-hidden border border-white/10 flex items-center cursor-pointer group"
              >
                {myVote ? (
                  <>
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-white/10 transition-all duration-500" 
                      style={{ width: `${opt.votePercentage}%` }}
                    ></div>
                    <div className="relative z-10 px-3 w-full flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-white">{opt.optionText}</span>
                        {myVote === opt.id && <Heart className="w-3 h-3 fill-white text-white" />}
                      </div>
                      <span className="text-gray-400">{opt.votePercentage}%</span>
                    </div>
                  </>
                ) : (
                  <div className="px-3 w-full text-sm text-white group-hover:bg-white/5 h-full flex items-center transition-colors">
                    {opt.optionText}
                  </div>
                )}
              </div>
            ))}
            {myVote && <div className="text-xs text-gray-400">{totalVotes} lượt bình chọn</div>}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-6 text-gray-400 mt-2 pt-2 border-t border-white/10">
          <button onClick={handleLike} className="flex items-center gap-1.5 hover:text-white transition-colors group">
            <ThumbsUp className={`w-5 h-5 ${isLiked ? "fill-purple-500 text-purple-500" : "group-hover:text-purple-400"}`} />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>
          <button onClick={() => setShowCommentModal(true)} className="flex items-center gap-1.5 hover:text-white transition-colors group cursor-pointer">
            <MessageSquare className="w-5 h-5 group-hover:text-blue-400" />
            <span className="text-sm font-medium">{localCommentsCount}</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-white transition-colors group ml-auto">
            <Share2 className="w-5 h-5 group-hover:text-white" />
          </button>
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      {isLightboxOpen && mediaItems.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <button 
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-[60]"
          >
            <X className="w-6 h-6" />
          </button>

          {mediaItems.length > 1 && (
            <>
              <button 
                onClick={prevMedia}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors z-[60]"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={nextMedia}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors z-[60]"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            {mediaItems[activeMediaIndex].type === 'image' ? (
              <img 
                src={mediaItems[activeMediaIndex].url} 
                alt="Fullscreen Media" 
                className="max-w-full max-h-[90vh] object-contain select-none"
              />
            ) : (
              <video 
                src={mediaItems[activeMediaIndex].url} 
                controls 
                autoPlay
                className="max-w-full max-h-[90vh]"
              />
            )}
          </div>
          
          {mediaItems.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium tracking-widest">
              {activeMediaIndex + 1} / {mediaItems.length}
            </div>
          )}
        </div>
      )}
      
      {showCommentModal && (
        <CommunityPostCommentModal 
          post={post}
          onClose={() => setShowCommentModal(false)}
          onCommentAdded={() => setLocalCommentsCount(prev => prev + 1)}
        />
      )}
    </>
  );
}
