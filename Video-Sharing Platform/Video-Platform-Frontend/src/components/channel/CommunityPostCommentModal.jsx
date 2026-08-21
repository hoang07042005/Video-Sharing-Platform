import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, ThumbsUp, X, ChevronDown, ChevronUp, Play } from 'lucide-react';

const EMOJI_LIST = ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾','❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝'];

// A single comment component (supports replies visually)
const CommentItem = ({ comment, postId, onReply, onLikeToggle, isReply = false, replyIndex = 0, isLastReply = false }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const fetchReplies = async () => {
    try {
      setLoadingReplies(true);
      const res = await axios.get(`/api/community/${postId}/comments?parentId=${comment.id}`);
      setReplies(res.data);
      setShowReplies(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleToggleReplies = () => {
    if (showReplies) {
      setShowReplies(false);
    } else {
      if (replies.length === 0) fetchReplies();
      else setShowReplies(true);
    }
  };

  return (
    <div className={`relative mb-4 ${isReply ? 'ml-10 z-0' : ''}`}>
      {isReply && (
        <>
          {/* 1. NÉT NỐI LÊN TRÊN */}
          {replyIndex === 0 && (
            <div className="absolute top-[-16px] left-[-24px] w-[1px] h-[16px] bg-white/20 z-0"></div>
          )}

          {/* 2. DÂY CONG RẼ NHÁNH */}
          <div className="absolute top-0 left-[-24px] w-[24px] h-[16px] border-l-[1.5px] border-b-[1.5px] border-white/20 rounded-bl-[16px] z-0"></div>
          
          {/* 3. DÂY DỌC XUYÊN SUỐT */}
          {!isLastReply && (
            <div className="absolute top-[16px] left-[-24px] w-[1.5px] h-[calc(100%-4px)] bg-white/20 z-0"></div>
          )}
          
          {/* 4. Chấm tròn điểm nhấn */}
          <div className="absolute top-[13.5px] left-[-2.5px] w-[5px] h-[5px] rounded-full bg-white/20 z-0"></div>
        </>
      )}

      <div className={`flex gap-3 relative z-10`}>
        <img
          src={comment.userAvatarUrl || `https://ui-avatars.com/api/?name=${comment.userName}`}
          alt={comment.userName}
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-white">{comment.userName}</span>
          <span className="text-xs text-white/50">
            {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
          </span>
        </div>
        <p className="text-sm text-white/90 mb-2 whitespace-pre-wrap">{comment.content}</p>
        
        <div className="flex items-center gap-4 text-xs text-white/50 font-semibold">
          <button
            onClick={() => onLikeToggle(comment.id, !comment.isLikedByMe)}
            className={`flex items-center gap-1 hover:text-white transition ${comment.isLikedByMe ? 'text-blue-500' : ''}`}
          >
            <ThumbsUp size={14} className={comment.isLikedByMe ? 'fill-blue-500' : ''} />
            <span>{comment.likesCount > 0 ? comment.likesCount : 'Thích'}</span>
          </button>
          
          <button 
            onClick={() => onReply(comment)}
            className="hover:text-white transition"
          >
            Trả lời
          </button>
        </div>

        {/* Replies toggle */}
        {comment.repliesCount > 0 && !isReply && (
          <div className="mt-2">
            <button
              onClick={handleToggleReplies}
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-semibold transition"
            >
              {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showReplies ? 'Ẩn' : `Xem ${comment.repliesCount} câu trả lời`}
            </button>
          </div>
        )}

        {/* Render Replies */}
        {showReplies && (
          <div className="mt-4">
            {loadingReplies && <div className="text-xs text-white/50 mb-2">Đang tải...</div>}
            {replies.map((reply, index) => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                postId={postId}
                onReply={onReply}
                onLikeToggle={onLikeToggle}
                isReply={true} 
                replyIndex={index}
                isLastReply={index === replies.length - 1}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};


const CommunityPostCommentModal = ({ post, onClose, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
  const emojiRef = useRef(null);

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/community/${post.id}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = async (commentId, isLike) => {
    try {
      const res = await axios.post(`/api/community/comments/${commentId}/like`, { isLike }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Update local state (simplistic update, ideally we find it in the tree)
      const updateTree = (list) => {
        return list.map(c => {
          if (c.id === commentId) {
            return { ...c, likesCount: res.data.likesCount, isLikedByMe: isLike };
          }
          return c;
        });
      };
      setComments(updateTree(comments));
    } catch (err) {
      console.error('Lỗi khi like bình luận', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      await axios.post(`/api/community/${post.id}/comments`, {
        content: inputValue,
        parentCommentId: replyingTo?.id || null
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setInputValue('');
      setReplyingTo(null);
      fetchComments(); // Re-fetch to get updated list
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error('Lỗi khi gửi bình luận', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] w-full max-w-2xl max-h-[100vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-bold text-white">Bình luận bài viết</h2>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white bg-white/5 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Post Preview */}
          <div className="p-4 border-b border-white/10 bg-[#1a1a1a]">
            <div className="flex gap-3 items-start mb-2">
              <img 
                src={post.authorAvatarUrl || post.channelAvatarUrl || `https://ui-avatars.com/api/?name=${post.authorName || post.channelName}`}
                className="w-10 h-10 rounded-full object-cover shrink-0" 
                alt="Author" 
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-white mb-0.5">
                  {post.authorName ? (
                    <>
                      {post.authorName} <span className="text-gray-400 text-xs font-normal">đã đăng lên</span> {post.channelName}
                    </>
                  ) : (
                    post.channelName
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
            
            <p className="text-sm text-white/90 whitespace-pre-wrap mb-3">{post.content}</p>
            
            {/* Media Container */}
            {(post.images?.length > 0 || post.videoUrl) && (
              <div className="w-full max-h-[300px] rounded-lg overflow-hidden border border-white/10 relative">
                {post.images?.length > 0 ? (
                  <img src={post.images[0]} alt="Media" className="w-full max-h-[300px] object-cover" />
                ) : (
                  <div className="w-full max-h-[300px] bg-black relative flex items-center justify-center">
                    <video src={post.videoUrl} className="w-full max-h-[300px] object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                      </div>
                    </div>
                  </div>
                )}
                {post.images?.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                    + {post.images.length - 1} ảnh
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comments List */}
          <div className="p-4">
            {loading ? (
              <div className="text-center text-white/50 py-10">Đang tải bình luận...</div>
            ) : comments.length === 0 ? (
              <div className="text-center text-white/50 py-10">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
            ) : (
            comments.map(comment => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                postId={post.id}
                onReply={(c) => {
                  setReplyingTo(c);
                  inputRef.current?.focus();
                }}
                onLikeToggle={handleLikeToggle}
              />
            ))
          )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-2 border-t border-white/10 shrink-0 bg-[#1a1a1a]">
          {replyingTo && (
            <div className="flex items-center justify-between bg-white/5 rounded-t-lg px-3 py-2 text-xs text-white/70">
              <span>Đang trả lời <strong>{replyingTo.userName}</strong></span>
              <button onClick={() => setReplyingTo(null)} className="hover:text-white"><X size={14} /></button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="relative flex items-center px-2 py-1">
            
            {/* Avatar */}
            <img 
              src={localStorage.getItem('avatar') || `https://ui-avatars.com/api/?name=${localStorage.getItem('handle') || 'User'}`}
              alt="My Avatar"
              className="w-8 h-8 rounded-full object-cover shrink-0 mr-3"
            />

            <input 
              ref={inputRef}
              type="text" 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Thêm bình luận..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-white/40"
            />

            <div className="flex items-center gap-2 ml-2" ref={emojiRef}>
              <button 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-white/50 hover:text-white transition"
              >
                😀
              </button>
              
              {showEmojiPicker && (
                <div className="absolute bottom-14 right-0 bg-[#222] border border-white/10 rounded-xl p-2 w-64 shadow-2xl z-50">
                  <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                    {EMOJI_LIST.map(emoji => (
                      <button 
                        key={emoji} 
                        type="button"
                        onClick={() => {
                          setInputValue(prev => prev + emoji);
                          inputRef.current?.focus();
                        }}
                        className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded text-lg cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={!inputValue.trim()}
                className={`p-2 transition ${inputValue.trim() ? 'text-blue-500 hover:text-blue-400' : 'text-white/30'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default CommunityPostCommentModal;
