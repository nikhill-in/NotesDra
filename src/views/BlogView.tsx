import React, { useState, useEffect } from 'react';
import { BlogPost, BlogComment, User } from '../types';
import { Heart, MessageSquare, CornerDownRight, Plus, Eye, Share2, ArrowLeft, Send, Check, ShieldAlert, Trash2 } from 'lucide-react';

interface BlogViewProps {
  user: User | null;
  onOpenAuth: () => void;
}

export default function BlogView({ user, onOpenAuth }: BlogViewProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [postComments, setPostComments] = useState<BlogComment[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = () => {
    fetch('/api/blog/posts')
      .then(res => res.json())
      .then(payload => {
        if (payload.success && Array.isArray(payload.data)) {
          setPosts(payload.data);
        }
      })
      .catch(err => console.error('Failed to load blog posts', err));
  };

  const handleSelectPost = (post: BlogPost) => {
    fetch(`/api/blog/posts/${post.slug}`)
      .then(res => res.json())
      .then(payload => {
        if (payload.success && payload.data) {
          setSelectedPost(payload.data);
          setPostComments(payload.data.comments || []);
          // update view count locally in list
          setPosts(prev => prev.map(p => p.id === post.id ? { ...p, view_count: p.view_count + 1 } : p));
        }
      })
      .catch(err => console.error('Failed to load blog details', err));
  };

  const handleLike = (post: BlogPost) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    fetch(`/api/blog/posts/${post.id}/like`, { method: 'POST' })
      .then(res => res.json())
      .then(payload => {
        if (payload.success) {
          const wasLiked = likedPosts[post.id];
          setLikedPosts(prev => ({ ...prev, [post.id]: !wasLiked }));
          
          if (selectedPost && selectedPost.id === post.id) {
            setSelectedPost(prev => prev ? {
              ...prev,
              like_count: wasLiked ? Math.max(0, prev.like_count - 1) : prev.like_count + 1
            } : null);
          }
          
          setPosts(prev => prev.map(p => p.id === post.id ? {
            ...p,
            like_count: wasLiked ? Math.max(0, p.like_count - 1) : p.like_count + 1
          } : p));
        }
      })
      .catch(err => console.error('Like request failed', err));
  };

  const handleAddComment = (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    const text = parentId ? editCommentText : newCommentText;
    if (!text.trim() || !selectedPost) return;

    fetch(`/api/blog/posts/${selectedPost.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, parent_comment_id: parentId })
    })
      .then(res => res.json())
      .then(payload => {
        if (payload.success && payload.data) {
          setPostComments(prev => [...prev, payload.data]);
          if (parentId) {
            setReplyTargetId(null);
            setEditCommentText('');
          } else {
            setNewCommentText('');
          }
        }
      })
      .catch(err => console.error('Failed to post comment', err));
  };

  const handleDeleteComment = (commentId: string) => {
    fetch(`/api/blog/comments/${commentId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(payload => {
        if (payload.success) {
          setPostComments(prev => prev.map(c => c.id === commentId ? { ...c, is_deleted: true, content: 'Comment was removed.' } : c));
        }
      })
      .catch(err => console.error('Comment deletion failed', err));
  };

  const copyShareLink = (post: BlogPost) => {
    const link = `${window.location.origin}/blog/${post.slug}`;
    navigator.clipboard.writeText(link);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || [])));
  const filteredPosts = selectedTag ? posts.filter(p => p.tags?.includes(selectedTag)) : posts;

  return (
    <div className="space-y-6">
      {selectedPost ? (
        /* ==================== SINGLE ARTICLE LAYOUT ==================== */
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Back Action button header */}
          <button 
            onClick={() => { setSelectedPost(null); fetchPosts(); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer select-none"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Article lists
          </button>

          {/* Banner img */}
          <div className="relative h-64 md:h-96 rounded-xl overflow-hidden border border-[#2d3148]">
            <img 
              src={selectedPost.cover_image_url} 
              alt={selectedPost.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-slate-900/40 to-transparent"></div>
            
            {/* Overlay title tags */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex gap-2.5 mb-3">
                {selectedPost.tags?.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-500 text-white shadow-sm border border-indigo-400/20">
                    {t}
                  </span>
                ))}
              </div>
              <h1 className="text-xl md:text-3xl font-display font-bold text-white max-w-3xl leading-snug">
                {selectedPost.title}
              </h1>
            </div>
          </div>

          {/* Metadata counts */}
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-4">
              <span>By <strong>{selectedPost.author_name}</strong></span>
              <span>•</span>
              <span>{new Date(selectedPost.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center gap-4 text-slate-400 select-none">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {selectedPost.view_count} views
              </span>
              <button 
                onClick={() => handleLike(selectedPost)} 
                className={`flex items-center gap-1 font-semibold transition ${likedPosts[selectedPost.id] ? 'text-red-500 font-bold' : 'hover:text-red-400'}`}
              >
                <Heart className={`h-3.5 w-3.5 ${likedPosts[selectedPost.id] ? 'fill-current' : ''}`} />
                {selectedPost.like_count} likes
              </button>
            </div>
          </div>

          {/* Actual content markup body */}
          <div 
            className="prose prose-invert prose-indigo font-normal text-sm md:text-base text-slate-300 leading-relaxed space-y-6 pt-2"
            dangerouslySetInnerHTML={{ __html: selectedPost.content }}
          />

          {/* ================= COMMENT SECTION MODULE ================= */}
          <div className="border-t border-slate-800 pt-8 mt-10 space-y-6">
            <h3 className="text-md font-bold text-slate-200 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-400" />
              Community Discussion ({postComments.length} comments)
            </h3>

            {/* Comment draft drawer */}
            {user ? (
              <form onSubmit={handleAddComment} className="flex gap-3 bg-[#1a1d27] border border-[#2d3148] rounded-xl p-3">
                <textarea 
                  rows={2}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Post a helpful review or comment regarding layouts..."
                  className="w-full bg-transparent border-none outline-none text-xs md:text-sm text-slate-200 placeholder-slate-600 focus:ring-0 resize-none"
                />
                <button 
                  type="submit" 
                  className="p-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition self-end cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="p-4 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl text-center">
                <p className="text-xs text-slate-500">
                  Please <span onClick={onOpenAuth} className="text-indigo-400 font-bold underline cursor-pointer">Login</span> to join this educational discussion feed.
                </p>
              </div>
            )}

            {/* Comments Lists Feed */}
            <div className="space-y-4">
              {postComments.filter(c => !c.parent_comment_id).map(comment => {
                const replies = postComments.filter(repl => repl.parent_comment_id === comment.id);
                return (
                  <div key={comment.id} className="space-y-3">
                    
                    {/* Top Tier comment card */}
                    <div className="p-4 bg-[#1a1d27]/70 border border-[#2d3148] rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-400">{comment.username}</span>
                          {comment.username === 'admin' && (
                            <span className="px-1.5 py-0.2 select-none bg-indigo-500/10 text-[8px] font-bold text-indigo-400 uppercase rounded tracking-wider border border-indigo-900/45">
                              Admin Staff
                            </span>
                          )}
                          <span>•</span>
                          <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {user && !comment.is_deleted && (
                            <button 
                              onClick={() => setReplyTargetId(comment.id)}
                              className="text-[10px] text-indigo-500 hover:underline cursor-pointer font-bold"
                            >
                              Reply
                            </button>
                          )}
                          {user && (comment.user_id === user.id || user.role === 'admin') && !comment.is_deleted && (
                            <button 
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-400 hover:text-red-300 rounded cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className={`text-xs md:text-sm ${comment.is_deleted ? 'text-slate-600 italic' : 'text-slate-300'}`}>
                        {comment.content}
                      </p>
                    </div>

                    {/* Replies drawer logic helper */}
                    {replyTargetId === comment.id && (
                      <form 
                        onSubmit={(e) => handleAddComment(e, comment.id)} 
                        className="flex gap-2 bg-slate-900 border border-slate-800 ml-6 rounded-xl p-2.5 max-w-lg"
                      >
                        <input 
                          type="text"
                          placeholder={`Reply to ${comment.username}...`}
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="w-full bg-solid-bg text-slate-200 outline-none text-xs border-0 px-2"
                        />
                        <button type="submit" className="px-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-[11px] font-bold cursor-pointer">Post</button>
                      </form>
                    )}

                    {/* Nested comment streams (1 Level Deep maximum as per requirement) */}
                    {replies.map(reply => (
                      <div key={reply.id} className="flex gap-2 ml-6 text-xs bg-[#0f1117]/60 p-3 rounded-lg border border-[#2d3148]">
                        <CornerDownRight className="h-3.5 w-3.5 text-slate-600 shrink-0 mt-0.5" />
                        <div className="space-y-1 w-full">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-semibold text-slate-400">{reply.username}</span>
                            {user && (reply.user_id === user.id || user.role === 'admin') && !reply.is_deleted && (
                              <button 
                                onClick={() => handleDeleteComment(reply.id)}
                                className="text-red-400 hover:text-red-300 rounded cursor-pointer"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <p className={`text-xs ${reply.is_deleted ? 'text-slate-600 italic' : 'text-slate-300'}`}>
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ==================== LIST OF DEVEL BLOG ARTICLES ==================== */
        <div className="space-y-6">
          <div className="border-b border-slate-850 pb-5">
            <h1 className="text-2xl md:text-3xl font-display font-medium text-slate-100">
              Pragmatic Design Insights
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Read technical analysis of layout styling engines, database pipelines, and fullstack frameworks compiled by lead architects.
            </p>
          </div>

          {/* Filtering Categories Bar */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs select-none">
            <button 
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full cursor-pointer font-semibold border-0 transition duration-150 ${!selectedTag ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-[#1a1d27] border border-[#2d3148] text-slate-400 hover:text-slate-200'}`}
            >
              All Articles
            </button>
            {allTags.map(tag => (
              <button 
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full cursor-pointer font-semibold border-0 transition duration-150 ${selectedTag === tag ? 'bg-indigo-500 text-white border-indigo-400/20 shadow-md' : 'bg-[#1a1d27] border border-[#2d3148] text-slate-400 hover:text-slate-200'}`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Grid Layout Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
              <div 
                key={post.id} 
                className="bg-[#1a1d27] border border-[#2d3148] rounded-xl overflow-hidden shadow-md flex flex-col group hover:border-indigo-500/30 transition-all duration-300"
              >
                <div className="h-44 relative overflow-hidden bg-[#0f1117]">
                  <img 
                    src={post.cover_image_url} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 flex gap-1 bg-[#1a1d27]/90 p-1 px-2 rounded text-[9px] uppercase tracking-wider font-bold text-indigo-400 border border-[#2d3148]">
                    {post.tags?.[0]}
                  </div>
                </div>

                {/* Card text content */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 
                      onClick={() => handleSelectPost(post)}
                      className="text-slate-200 font-bold text-sm md:text-md leading-snug hover:text-indigo-400 cursor-pointer transition-colors"
                    >
                      {post.title}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                      Deep dive tutorial analyzing structured parameters, layout attributes, and core responsive solutions.
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-[#2d3148]">
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => copyShareLink(post)}
                        className="p-1 hover:text-slate-300 cursor-pointer"
                        title="Copy article link"
                      >
                        {copiedId === post.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Share2 className="h-3 w-3" />}
                      </button>
                      <button 
                        onClick={() => handleLike(post)}
                        className={`flex items-center gap-0.5 ${likedPosts[post.id] ? 'text-red-500 font-bold' : ''}`}
                      >
                        <Heart className="h-3 w-3" />
                        {post.like_count}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
