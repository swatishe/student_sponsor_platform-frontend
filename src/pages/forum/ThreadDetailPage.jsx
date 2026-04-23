// src/pages/forum/ThreadDetailPage.jsx
// View a thread and all its posts. Students can post and reply.
// Faculty/admin can close the thread. Admin can flag posts.
// @author sshende

import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { forumAPI } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/common/Spinner'
import Avatar from '../../components/common/Avatar'
import toast from 'react-hot-toast'
import {
  Flag, Trash2, MessageSquare, Lock, ChevronDown, ChevronUp, Send,
} from 'lucide-react'

// Thread detail page component. Fetches thread details and posts on mount. Displays thread info, list of posts with replies, and a form to add new posts. Allows post deletion and flagging for admins, and thread management for owners/admins.
export default function ThreadDetailPage() {
  const { id }          = useParams()
  const { user }        = useAuth()
  const navigate        = useNavigate()
  const bottomRef       = useRef(null)

  const [thread,  setThread]  = useState(null)
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)

  // Fetch thread details and posts from the API. Called on component mount and whenever the thread ID changes. The thread details and posts are stored in state, and a loading state is used to show a spinner while fetching.
  const load = () => {
    Promise.all([
      forumAPI.getThread(id),
      forumAPI.getPosts(id),
    ])
      .then(([tRes, pRes]) => {
        setThread(tRes.data)
        setPosts(pRes.data?.results ?? pRes.data ?? [])
      })
      .catch(() => toast.error('Failed to load thread.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  // Handle adding a new post to the thread. Validates input, calls API to create the post, and refreshes the post list on success. Also scrolls to the bottom of the thread to show the new post.
  const handlePost = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setPosting(true)
    try {
      await forumAPI.createPost(id, { content: content.trim() })
      setContent('')
      load()
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 200)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to post.')
    } finally {
      setPosting(false)
    }
  }

  // Handle deleting a post with confirmation. Calls API to delete the post and refreshes the post list on success.
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return
    try {
      await forumAPI.deletePost(postId)
      toast.success('Post deleted.')
      load()
    } catch { toast.error('Failed to delete post.') }
  }

  // Handle flagging or unflagging a post for admin review. Calls API to toggle the flagged status and refreshes the post list on success.
  const handleFlagPost = async (postId) => {
    try {
      const { data } = await forumAPI.flagPost(postId)
      toast.success(data.is_flagged ? 'Post flagged.' : 'Flag removed.')
      load()
    } catch { toast.error('Failed to flag post.') }
  }

  // Handle deleting the thread with confirmation. Calls API to delete the thread and navigates back to the forum page on success.
  const handleDeleteThread = async () => {
    if (!window.confirm(`Delete thread "${thread.title}"?`)) return
    try {
      await forumAPI.deleteThread(id)
      toast.success('Thread deleted.')
      navigate('/forum')
    } catch { toast.error('Failed to delete thread.') }
  }

  // Handle closing or reopening the thread. Calls API to toggle the closed status and refreshes the thread details on success.
  const handleToggleClose = async () => {
    try {
      await forumAPI.updateThread(id, { is_closed: !thread.is_closed })
      toast.success(thread.is_closed ? 'Thread reopened.' : 'Thread closed.')
      load()
    } catch { toast.error('Failed to update thread.') }
  }

  const isOwner   = thread?.created_by?.id === user?.id
  const canManage = isOwner || user?.role === 'admin'
  const isAdmin   = user?.role === 'admin'
  const isClosed  = thread?.is_closed

  if (loading) return <Spinner text="Loading thread…" />
  if (!thread)  return <p style={{ color:'var(--text-muted)', padding:40 }}>Thread not found.</p>

  // Main render of the thread detail page, including thread header with title, description, and metadata, list of posts with replies, and a form to add new posts if the thread is not closed. Admins have options to manage the thread and posts.
  return (
    <div className="page-enter" style={{ maxWidth:780, margin:'0 auto' }}>

      {/* Back link */}
      <Link to="/forum" style={{ fontSize:'0.875rem', color:'var(--text-muted)', display:'inline-block', marginBottom:20 }}>
        ← Back to Forum
      </Link>

      {/* Thread header */}
      <div className="card" style={{ marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:8 }}>
              {isClosed && <Lock size={14} style={{ color:'var(--text-muted)' }} />}
              <h2 style={{ fontSize:'1.3rem', fontWeight:700, margin:0 }}>{thread.title}</h2>
              {isClosed && (
                <span style={{ fontSize:'0.72rem', background:'rgba(255,255,255,0.07)', color:'var(--text-muted)', padding:'2px 8px', borderRadius:100 }}>
                  Closed
                </span>
              )}
            </div>
            {thread.description && (
              <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem', marginBottom:10, lineHeight:1.6 }}>
                {thread.description}
              </p>
            )}
            <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', display:'flex', gap:14, flexWrap:'wrap' }}>
              <span>by {thread.created_by?.first_name} {thread.created_by?.last_name}</span>
              {thread.department && <span>· {thread.department}</span>}
              {thread.tags && <span>· {thread.tags}</span>}
              <span>· {posts.length} post{posts.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Thread actions (owner or admin) */}
          {canManage && (
            <div style={{ display:'flex', gap:8, flexShrink:0 }}>
              <button
                className="btn btn-secondary"
                style={{ padding:'6px 12px', fontSize:'0.8rem' }}
                onClick={handleToggleClose}
                title={isClosed ? 'Reopen thread' : 'Close thread'}
              >
                {isClosed ? 'Reopen' : 'Close'}
              </button>
              <button
                className="btn btn-danger"
                style={{ padding:'6px 10px' }}
                onClick={handleDeleteThread}
                title="Delete thread"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Posts */}
      <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:24 }}>
        {posts.length === 0 && (
          <div className="card" style={{ textAlign:'center', padding:36 }}>
            <MessageSquare size={32} style={{ color:'var(--text-muted)', margin:'0 auto 10px' }} />
            <p style={{ color:'var(--text-muted)' }}>No posts yet. Be the first to contribute!</p>
          </div>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            user={user}
            isAdmin={isAdmin}
            threadId={id}
            isClosed={isClosed}
            onDelete={handleDeletePost}
            onFlag={handleFlagPost}
            onReplyAdded={load}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* New post input */}
      {!isClosed ? (
        <div className="card">
          <h3 style={{ fontSize:'0.95rem', marginBottom:14 }}>Add a Post</h3>
          <form onSubmit={handlePost}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="form-input"
              rows={4}
              placeholder="Share your idea, question, or comment…"
              disabled={posting}
            />
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={posting || !content.trim()}
                style={{ display:'flex', alignItems:'center', gap:6 }}
              >
                <Send size={14} />
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ textAlign:'center', padding:20 }}>
          <Lock size={16} style={{ color:'var(--text-muted)', marginBottom:6 }} />
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>
            This thread is closed. No new posts can be added.
          </p>
        </div>
      )}
    </div>
  )
}


// ── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({ post, user, isAdmin, threadId, isClosed, onDelete, onFlag, onReplyAdded }) {
  const [showReplies, setShowReplies] = useState(false)
  const [replies,     setReplies]     = useState([])
  const [loadingR,    setLoadingR]    = useState(false)
  const [replyText,   setReplyText]   = useState('')
  const [posting,     setPosting]     = useState(false)

  const isAuthor = post.author?.id === user?.id
  const canDelete = isAuthor || isAdmin

  const loadReplies = () => {
    setLoadingR(true)
    forumAPI.getReplies(post.id)
      .then(({ data }) => setReplies(data?.results ?? data ?? []))
      .finally(() => setLoadingR(false))
  }

  const toggleReplies = () => {
    if (!showReplies) loadReplies()
    setShowReplies((p) => !p)
  }

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setPosting(true)
    try {
      await forumAPI.createReply(post.id, { content: replyText.trim() })
      setReplyText('')
      loadReplies()
      onReplyAdded()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to post reply.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div
      className="card"
      style={{
        padding:'14px 18px',
        borderLeft: post.is_flagged ? '3px solid var(--accent-danger)' : undefined,
        opacity:    post.is_flagged ? 0.75 : 1,
      }}
    >
      {/* Post header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Avatar user={post.author} size={32} radius={8} />
          <div>
            <div style={{ fontWeight:600, fontSize:'0.875rem' }}>
              {post.author?.first_name} {post.author?.last_name}
            </div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
              {new Date(post.created_at).toLocaleString()}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          {post.is_flagged && (
            <span style={{ fontSize:'0.7rem', color:'var(--accent-danger)', background:'rgba(239,68,68,0.1)', padding:'2px 8px', borderRadius:100 }}>
              Flagged
            </span>
          )}
          {isAdmin && (
            <button
              className="btn btn-secondary"
              style={{ padding:'4px 8px', fontSize:'0.75rem' }}
              onClick={() => onFlag(post.id)}
              title={post.is_flagged ? 'Remove flag' : 'Flag post'}
            >
              <Flag size={12} />
            </button>
          )}
          {canDelete && (
            <button
              className="btn btn-danger"
              style={{ padding:'4px 8px' }}
              onClick={() => onDelete(post.id)}
              title="Delete post"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Post content */}
      <p style={{ fontSize:'0.9rem', color:'var(--text-primary)', lineHeight:1.65, margin:0 }}>
        {post.content}
      </p>

      {/* Replies toggle */}
      <div style={{ marginTop:12, borderTop:'1px solid var(--border-color)', paddingTop:10 }}>
        <button
          className="btn btn-ghost"
          style={{ padding:'4px 0', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:5 }}
          onClick={toggleReplies}
        >
          <MessageSquare size={13} />
          {post.reply_count > 0
            ? `${post.reply_count} repl${post.reply_count !== 1 ? 'ies' : 'y'}`
            : 'Reply'}
          {showReplies ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showReplies && (
          <div style={{ marginTop:10, paddingLeft:16, borderLeft:'2px solid var(--border-color)' }}>
            {loadingR && <Spinner text="" />}
            {replies.map((r) => (
              <div key={r.id} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <Avatar user={r.author} size={24} radius={6} />
                  <span style={{ fontWeight:600, fontSize:'0.8rem' }}>
                    {r.author?.first_name} {r.author?.last_name}
                  </span>
                  <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                  {(r.author?.id === user?.id || isAdmin) && (
                    <button
                      className="btn btn-danger"
                      style={{ padding:'2px 6px', marginLeft:'auto' }}
                      onClick={() => onDelete(r.id)}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
                <p style={{ fontSize:'0.875rem', color:'var(--text-primary)', margin:0, lineHeight:1.55 }}>
                  {r.content}
                </p>
              </div>
            ))}

            {/* Reply input */}
            {!isClosed && (
              <form onSubmit={handleReply} style={{ display:'flex', gap:8, marginTop:10 }}>
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply…"
                  className="form-input"
                  style={{ flex:1, padding:'8px 12px', fontSize:'0.875rem' }}
                  disabled={posting}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding:'8px 14px' }}
                  disabled={posting || !replyText.trim()}
                >
                  <Send size={13} />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
