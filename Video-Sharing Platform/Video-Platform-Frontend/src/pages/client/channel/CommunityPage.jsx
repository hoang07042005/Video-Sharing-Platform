import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/vi"; // Import Vietnamese locale
import {
  ArrowLeft,
  Loader2,
  LayoutGrid,
  ImageIcon,
  Video,
  BarChart2,
  Crown,
  Pin,
  ChevronDown,
  MessageCircle,
  ThumbsUp,
  Hash,
  X,
} from "lucide-react";
import CreateCommunityPost from "../../../components/channel/CreateCommunityPost";
import CommunityPostCard from "../../../components/channel/CommunityPostCard";

export default function CommunityPage() {
  const { handle } = useParams();
  const navigate = useNavigate();

  const [channel, setChannel] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isLoadingChannel, setIsLoadingChannel] = useState(true);

  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter state
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("latest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Sidebar state
  const [sidebarData, setSidebarData] = useState(null);

  // 1. Load Channel Info
  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`/api/channels/${handle}`, { headers });
        setChannel(res.data);

        const userHandle = localStorage.getItem("handle");
        if (userHandle && userHandle === res.data.handle) {
          setIsOwner(true);
        } else if (token) {
          try {
            const memberRes = await axios.get(
              `/api/channels/${res.data.id}/membership`,
              { headers },
            );
            setIsMember(memberRes.data.isMember);
          } catch (err) {
            console.error("Lỗi khi kiểm tra hội viên:", err);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Không tìm thấy kênh hoặc có lỗi xảy ra.");
        navigate("/");
      } finally {
        setIsLoadingChannel(false);
      }
    };

    fetchChannel();
  }, [handle, navigate]);

  // 2. Fetch Posts
  const fetchPosts = async (
    pageNum = 1,
    append = false,
    channelId,
    currentSort = sortFilter,
  ) => {
    if (!channelId) return;
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(
        `/api/channels/${channelId}/community?page=${pageNum}&limit=10&filter=${currentSort}`,
        { headers },
      );
      if (res.data.length < 10) {
        setHasMore(false);
      }
      if (append) {
        setPosts((prev) => [...prev, ...res.data]);
      } else {
        setPosts(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (channel?.id) {
      setIsLoadingPosts(true);
      setPage(1);
      setHasMore(true);
      fetchPosts(1, false, channel.id, sortFilter);

      axios
        .get(`/api/channels/${channel.id}/community/sidebar`)
        .then((res) => setSidebarData(res.data))
        .catch((err) => console.error("Error fetching sidebar data", err));
    }
  }, [channel?.id, sortFilter]);

  const loadMore = () => {
    if (!isLoadingPosts && hasMore && channel?.id) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true, channel.id);
    }
  };

  const handlePostCreated = () => {
    setPage(1);
    setHasMore(true);
    fetchPosts(1, false, channel.id, sortFilter);
  };

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const handlePostPinned = () => {
    // Refresh posts and sidebar
    setPage(1);
    setHasMore(true);
    fetchPosts(1, false, channel.id, sortFilter);

    axios
      .get(`/api/channels/${channel.id}/community/sidebar`)
      .then((res) => setSidebarData(res.data))
      .catch((err) => console.error("Error fetching sidebar data", err));
  };

  const handleSidebarUnpin = async (postId, e) => {
    e.stopPropagation(); // Prevent scroll logic
    try {
      const response = await axios.put(
        `/api/channels/${channel.id}/community/${postId}/pin`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success(response.data.message || "Đã bỏ ghim bài viết!");
      handlePostPinned();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi khi bỏ ghim");
    }
  };

  if (isLoadingChannel) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto py-8 px-4 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">
      {/* CỘT TRÁI - Main Content */}
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-4">
            <button
              onClick={() => navigate(`/c/${handle}`)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white hidden md:block"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            Cộng đồng
          </h1>
          <p className="text-gray-400 text-sm md:ml-14">
            Chia sẻ, thảo luận và phát triển cùng nhau
          </p>
        </div>

        {/* Input Box */}
        {(isOwner || isMember) && (
          <CreateCommunityPost
            channelId={channel?.id}
            isOwner={isOwner}
            onPostCreated={handlePostCreated}
          />
        )}

        {/* Filter Bar */}
        <div className="flex items-center justify-between bg-[#151515] p-2 rounded-xl border border-white/5">
          <div className="flex items-center gap-1 min-w-max overflow-x-auto hide-scrollbar flex-1 mr-4">
            <button
              onClick={() => setActiveFilter("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === "all" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <LayoutGrid className="w-4 h-4" />
              Tất cả
            </button>
            <button
              onClick={() => setActiveFilter("image")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === "image" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <ImageIcon className="w-4 h-4" />
              Hình ảnh
            </button>
            <button
              onClick={() => setActiveFilter("video")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === "video" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <Video className="w-4 h-4" />
              Video
            </button>
            <button
              onClick={() => setActiveFilter("poll")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === "poll" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <BarChart2 className="w-4 h-4" />
              Thăm dò
            </button>
            <button
              onClick={() => setActiveFilter("members")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === "members" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <Crown className="w-4 h-4" />
              Chỉ hội viên
            </button>
            <button
              onClick={() => setActiveFilter("pinned")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === "pinned" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <Pin className="w-4 h-4" />
              Đã ghim
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors ml-4 whitespace-nowrap"
            >
              {sortFilter === "latest"
                ? "Mới nhất"
                : sortFilter === "popular"
                  ? "Phổ biến"
                  : "Cũ nhất"}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 py-1">
                <button
                  onClick={() => {
                    setSortFilter("latest");
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm ${sortFilter === "latest" ? "text-purple-400 bg-white/5" : "text-gray-300 hover:bg-white/5"} transition-colors`}
                >
                  Mới nhất
                </button>
                <button
                  onClick={() => {
                    setSortFilter("popular");
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm ${sortFilter === "popular" ? "text-purple-400 bg-white/5" : "text-gray-300 hover:bg-white/5"} transition-colors`}
                >
                  Phổ biến
                </button>
                <button
                  onClick={() => {
                    setSortFilter("oldest");
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm ${sortFilter === "oldest" ? "text-purple-400 bg-white/5" : "text-gray-300 hover:bg-white/5"} transition-colors`}
                >
                  Cũ nhất
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feed */}
        {isLoadingPosts && page === 1 ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-[#151515] rounded-xl border border-white/5">
            <p className="text-lg">Kênh này chưa có bài viết cộng đồng nào.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts
              .filter((post) => {
                if (activeFilter === "all") return true;
                if (activeFilter === "image")
                  return post.images && post.images.length > 0;
                if (activeFilter === "video") return !!post.videoUrl;
                if (activeFilter === "poll")
                  return post.pollOptions && post.pollOptions.length > 0;
                if (activeFilter === "members") return post.isMembersOnly;
                if (activeFilter === "pinned") return false; // Not supported by backend yet
                return true;
              })
              .map((post) => (
                <div key={post.id} id={`post-${post.id}`}>
                  <CommunityPostCard
                    post={post}
                    isOwner={isOwner}
                    onPostDeleted={handlePostDeleted}
                    onPostPinned={handlePostPinned}
                  />
                </div>
              ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={loadMore}
                  className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors text-sm font-medium border border-white/10"
                >
                  Tải thêm
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CỘT PHẢI - Sidebar Widgets */}
      <div className="space-y-4 hidden lg:block">
        {/* Widget 1: Bài viết ghim */}
        <div className="bg-[#151515] rounded-xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Pin className="w-4 h-4 text-red-500 fill-red-500" />
              Bài viết ghim
            </h3>
            {sidebarData?.pinnedPosts?.length > 0 && (
              <button className="text-xs font-medium text-purple-400 hover:text-purple-300">
                Xem tất cả
              </button>
            )}
          </div>

          <div className="space-y-4">
            {sidebarData?.pinnedPosts?.length > 0 ? (
              sidebarData.pinnedPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex gap-3 items-start group cursor-pointer relative"
                  onClick={() => {
                    // Scroll to post logic could be added here
                    const el = document.getElementById(`post-${post.id}`);
                    if (el)
                      el.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                  }}
                >
                  {isOwner && (
                    <button
                      onClick={(e) => handleSidebarUnpin(post.id, e)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
                      title="Bỏ ghim"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  )}
                  <div className="w-32 h-20 rounded-lg bg-purple-900 border border-purple-500/20 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                    {post.pollOptions?.length > 0 ? (
                      <div className="absolute inset-0 bg-purple-900/50 flex flex-col items-center justify-center gap-1 p-2">
                        <BarChart2 className="w-8 h-8 text-purple-300" />
                        <span className="text-[9px] font-bold text-purple-200 uppercase tracking-wider">
                          Bình chọn
                        </span>
                      </div>
                    ) : post.images?.length > 0 ? (
                      <img
                        src={post.images[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : post.videoUrl ? (
                      <Video className="w-6 h-6 text-purple-300" />
                    ) : (
                      <span className="text-[10px] font-bold text-white text-center leading-tight">
                        PINNED
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-200 line-clamp-2 group-hover:text-purple-400 transition-colors">
                      {post.content ||
                        (post.pollOptions?.length > 0
                          ? "Cuộc thăm dò ý kiến"
                          : "Bài viết")}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {post.authorName} •{" "}
                      {moment
                        .utc(post.createdAt)
                        .local()
                        .locale("vi")
                        .fromNow()}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {post.pollOptions?.length > 0 ? (
                        <span className="flex items-center gap-1 text-purple-400 font-medium">
                          <BarChart2 className="w-3 h-3" />{" "}
                          {post.totalVotes || 0} lượt bình chọn
                        </span>
                      ) : (
                        <>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" /> {post.likesCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />{" "}
                            {post.commentsCount}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                Chưa có bài viết ghim nào.
              </p>
            )}
          </div>
        </div>

        {/* Widget 2: Bài viết nổi bật */}
        <div className="bg-[#151515] rounded-xl border border-white/5 p-5">
          <h3 className="text-base font-semibold text-white mb-4">
            Bài viết nổi bật
          </h3>

          <div className="flex gap-4 border-b border-white/10 mb-4">
            <button className="text-sm font-medium text-purple-400 border-b-2 border-purple-400 pb-2">
              Theo lượt thích
            </button>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-300 pb-2 transition-colors hidden">
              Theo bình luận
            </button>
          </div>

          <div className="space-y-4">
            {sidebarData?.featuredByLikes?.length > 0 ? (
              sidebarData.featuredByLikes.map((post, idx) => (
                <div
                  key={post.id}
                  className="flex gap-3 items-center group cursor-pointer"
                  onClick={() => {
                    const el = document.getElementById(`post-${post.id}`);
                    if (el)
                      el.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                  }}
                >
                  <span className="text-xl font-bold text-white/20 w-4">
                    {idx + 1}
                  </span>
                  <div className="w-32 h-20 rounded-lg bg-gray-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Hash className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold text-gray-200 line-clamp-2 group-hover:text-purple-400 transition-colors">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {post.likesCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />{" "}
                        {post.commentsCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Chưa có bài nổi bật.</p>
            )}
          </div>
        </div>

        {/* Widget 3: Chủ đề đang thảo luận */}
        <div className="bg-[#151515] rounded-xl border border-white/5 p-5">
          <h3 className="text-base font-semibold text-white mb-4">
            Chủ đề đang thảo luận
          </h3>
          <div className="flex flex-wrap gap-2">
            {sidebarData?.trendingTopics?.length > 0 ? (
              sidebarData.trendingTopics.map((topic) => (
                <span
                  key={topic.tag}
                  className="px-3 py-1.5 bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 rounded-lg text-sm text-gray-300 cursor-pointer transition-colors border border-white/5"
                >
                  {topic.tag}{" "}
                  <span className="text-gray-500 ml-1 text-xs">
                    {topic.postsCount}
                  </span>
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-500">Chưa có chủ đề nào.</p>
            )}
          </div>
        </div>

        {/* Widget 4: Hoạt động cộng đồng hôm nay */}
        {sidebarData?.todayStats && (
          <div className="bg-[#151515] rounded-xl border border-white/5 p-5">
            <h3 className="text-base font-semibold text-white mb-6">
              Hoạt động cộng đồng hôm nay
            </h3>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <ImageIcon className="w-5 h-5 text-purple-500" />
                <span className="text-lg font-bold text-white w-12">
                  {sidebarData.todayStats.newPosts}
                </span>
                <span className="text-sm font-medium text-gray-400">
                  Bài viết mới
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Video className="w-5 h-5 text-purple-500" />
                <span className="text-lg font-bold text-white w-12">
                  {sidebarData.todayStats.newVideos}
                </span>
                <span className="text-sm font-medium text-gray-400">
                  Video mới
                </span>
              </div>
              <div className="flex items-center gap-4">
                <BarChart2 className="w-5 h-5 text-purple-500" />
                <span className="text-lg font-bold text-white w-12">
                  {sidebarData.todayStats.newPolls}
                </span>
                <span className="text-sm font-medium text-gray-400">
                  Cuộc thăm dò mới
                </span>
              </div>
              <div className="flex items-center gap-4">
                <MessageCircle className="w-5 h-5 text-purple-500" />
                <span className="text-lg font-bold text-white w-12">
                  {sidebarData.todayStats.newComments}
                </span>
                <span className="text-sm font-medium text-gray-400">
                  Bình luận mới
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Widget 5: Thành viên hoạt động */}
        {sidebarData?.activeMembers?.length > 0 && (
          <div className="bg-[#151515] rounded-xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-white">
                Thành viên hoạt động
              </h3>
              <button className="text-xs font-medium text-purple-400 hover:text-purple-300">
                Xem tất cả &gt;
              </button>
            </div>

            <div className="space-y-5">
              {sidebarData.activeMembers.map((member, idx) => {
                const maxPosts = sidebarData.activeMembers[0].postsCount || 1;
                const percentage = Math.round(
                  (member.postsCount / maxPosts) * 100,
                );
                return (
                  <div key={member.userId} className="flex items-center gap-4">
                    <span className="text-lg font-medium text-white/50 w-4">
                      {idx + 1}
                    </span>
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-800 border border-white/10">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center text-sm font-bold text-white ${member.bgColor}`}
                        >
                          {member.initials}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-200 truncate pr-2">
                          {member.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {member.postsCount} bài viết
                          </span>
                          {idx === 0 && (
                            <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
