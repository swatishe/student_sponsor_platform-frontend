// src/pages/messaging/MessagingPage.jsx
// Real-time chat using WebSocket (with REST fallback).
// Shows list of conversations, message history, and input for new messages. Updates in real-time when new messages arrive. Uses messagingAPI for REST calls and WebSocket for live updates. Handles conversation selection and message sending.
//@author sshende
// src/pages/messaging/MessagingPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { messagingAPI, userSearchAPI } from '../../api/services'   // ← add userSearchAPI
import { useAuth } from '../../context/AuthContext'
import Avatar from '../../components/common/Avatar'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'
import { Send, MessageSquare, Search, ArrowLeft, Trash2, UserPlus, X } from 'lucide-react'  // ← add Trash2, UserPlus, X
import { format, formatDistanceToNow } from 'date-fns'
import styles from './Messaging.module.css'

const WS_BASE = import.meta.env.VITE_WS_URL
  || import.meta.env.VITE_API_URL?.replace('https://', 'wss://').replace('http://', 'ws://')
  || ''

export default function MessagingPage() {
  const { convId }  = useParams()
  const { user }    = useAuth()
  const navigate    = useNavigate()

  const [conversations, setConversations] = useState([])
  const [messages, setMessages]           = useState([])
  const [activeConv, setActiveConv]       = useState(null)
  const [input, setInput]                 = useState('')
  const [loading, setLoading]             = useState(true)
  const [convSearch, setConvSearch]       = useState('')

  // ── NEW: new-conversation modal state ──
  const [showNewMsg, setShowNewMsg]       = useState(false)
  const [userQuery, setUserQuery]         = useState('')
  const [userResults, setUserResults]     = useState([])
  const [searching, setSearching]         = useState(false)

  const wsRef     = useRef(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // ── Load conversations ────────────────────────────────────────────────
  useEffect(() => {
    messagingAPI.getConversations()
      .then(({ data }) => {
        const convs = data?.results ?? data ?? []
        setConversations(convs)
        if (convId) {
          const found = convs.find((c) => String(c.id) === String(convId))
          if (found) openConversation(found)
        }
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll to bottom ─────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── NEW: search users with debounce ──────────────────────────────────
  useEffect(() => {
    if (!userQuery.trim()) { setUserResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await userSearchAPI.search(userQuery)
        setUserResults(data?.results ?? data ?? [])
      } finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [userQuery])

  // ── Open conversation ─────────────────────────────────────────────────
  const openConversation = useCallback(async (conv) => {
    setActiveConv(conv)
    navigate(`/messages/${conv.id}`, { replace: true })

    if (wsRef.current) { wsRef.current.close(1000); wsRef.current = null }

    const { data } = await messagingAPI.getMessages(conv.id)
    setMessages(data?.results ?? data ?? [])

    const token = localStorage.getItem('access_token')
    const ws = new WebSocket(`${WS_BASE}/ws/chat/${conv.id}/?token=${token}`)

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'message') {
          setMessages((prev) => {
            if (prev.find((m) => m.id === payload.message_id)) return prev
            return [...prev, {
              id: payload.message_id,
              content: payload.content,
              created_at: payload.created_at,
              is_read: false,
              sender: { id: payload.sender_id, first_name: payload.sender_name?.split(' ')[0] || '', last_name: payload.sender_name?.split(' ').slice(1).join(' ') || '' },
            }]
          })
          setConversations((prev) => {
            const updated = prev.map((c) =>
              c.id === conv.id ? { ...c, updated_at: new Date().toISOString(), last_message: { content: payload.content } } : c
            )
            return [...updated].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          })
        }
      } catch { /* non-JSON */ }
    }

    ws.onerror = () => console.error('[WS] connection error')
    wsRef.current = ws
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [navigate])

  useEffect(() => () => wsRef.current?.close(1000), [])

  // ── NEW: start conversation from user search ──────────────────────────
  const startConversationWith = async (targetUser) => {
    setShowNewMsg(false)
    setUserQuery('')
    setUserResults([])
    try {
      const { data } = await messagingAPI.startConversation(targetUser.id, '')
      // Refresh conversation list then open the new/existing conv
      const { data: convData } = await messagingAPI.getConversations()
      const convs = convData?.results ?? convData ?? []
      setConversations(convs)
      const conv = convs.find((c) => String(c.id) === String(data.id))
      if (conv) openConversation(conv)
    } catch {
      // fallback: open by navigating
      navigate(`/messages/${data?.id}`)
    }
  }

  // ── NEW: delete conversation ──────────────────────────────────────────
  const handleDelete = async (e, convId) => {
    e.stopPropagation()  // don't open the conversation
    if (!confirm('Delete this conversation? This cannot be undone.')) return
    try {
      await messagingAPI.deleteConversation(convId)
      setConversations((prev) => prev.filter((c) => c.id !== convId))
      if (activeConv?.id === convId) {
        setActiveConv(null)
        setMessages([])
        navigate('/messages', { replace: true })
      }
    } catch {
      // silent fail — conversation stays in list
    }
  }

  const sendMessage = useCallback(async () => {
    const content = input.trim()
    if (!content || !activeConv) return
    setInput('')
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: content }))
    } else {
      try {
        const { data } = await messagingAPI.sendMessage(activeConv.id, content)
        setMessages((prev) => [...prev, data])
      } catch { setInput(content) }
    }
  }, [input, activeConv])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const otherParticipant = (conv) => conv.participants?.find((p) => p.id !== user?.id)

  const filteredConvs = conversations.filter((c) => {
    const other = otherParticipant(c)
    return `${other?.first_name} ${other?.last_name}`.toLowerCase().includes(convSearch.toLowerCase())
  })

  return (
    <div className={styles.container}>

      {/* ── Conversations sidebar ── */}
      <div className={`${styles.sidebar} ${activeConv ? styles.hideMobile : ''}`}>
        <div className={styles.sidebarHeader}>
          {/* CHANGED: header row with title + new message button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Messages</h2>
            <button
              className="btn btn-primary"
              style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => setShowNewMsg(true)}
            >
              <UserPlus size={13} /> New
            </button>
          </div>
          <div style={{ position: 'relative', marginTop: 10 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Search…" value={convSearch} onChange={(e) => setConvSearch(e.target.value)}
              className="form-input" style={{ paddingLeft: 30, fontSize: '0.82rem', padding: '7px 7px 7px 30px' }} />
          </div>
        </div>

        <div className={styles.convList}>
          {loading
            ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading…</div>
            : filteredConvs.length === 0
              ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {conversations.length === 0 ? 'No conversations yet' : 'No results'}
                </div>
              : filteredConvs.map((conv) => {
                  const other    = otherParticipant(conv)
                  const isActive = activeConv?.id === conv.id
                  return (
                    <button key={conv.id} onClick={() => openConversation(conv)}
                      className={`${styles.convItem} ${isActive ? styles.convActive : ''}`}>
                      <Avatar user={other} size={40} radius={10} />
                      <div className={styles.convInfo}>
                        <div className={styles.convName}>
                          {other?.first_name} {other?.last_name}
                          {conv.unread_count > 0 && <span className={styles.unreadBadge}>{conv.unread_count}</span>}
                        </div>
                        {/* CHANGED: show role badge under name */}
                        <div style={{ marginBottom: 2 }}><Badge variant={other?.role} /></div>
                        <div className={styles.convPreview}>{conv.last_message?.content || 'No messages yet'}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                        <div className={styles.convTime}>
                          {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: false })}
                        </div>
                        {/* NEW: delete button */}
                        <button
                          onClick={(e) => handleDelete(e, conv.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center' }}
                          title="Delete conversation"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </button>
                  )
                })
          }
        </div>
      </div>

      {/* ── Chat panel — completely unchanged ── */}
      <div className={`${styles.chat} ${!activeConv ? styles.hideMobile : ''}`}>
        {activeConv ? (
          <>
            <div className={styles.chatHeader}>
              <button className={styles.backBtn} onClick={() => { setActiveConv(null); navigate('/messages') }}>
                <ArrowLeft size={18} />
              </button>
              {(() => {
                const other = otherParticipant(activeConv)
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar user={other} size={38} radius={10} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{other?.first_name} {other?.last_name}</div>
                      <Badge variant={other?.role} />
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className={styles.messages}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '40px 20px' }}>
                  Start the conversation below ↓
                </div>
              )}
              {messages.map((msg) => {
                const isMine = msg.sender?.id === user?.id
                return (
                  <div key={msg.id} className={`${styles.bubble} ${isMine ? styles.mine : styles.theirs}`}>
                    {!isMine && (
                      <div className={styles.senderName}>{msg.sender?.first_name} {msg.sender?.last_name}</div>
                    )}
                    <div className={styles.bubbleContent}>{msg.content}</div>
                    <div className={styles.bubbleTime}>{format(new Date(msg.created_at), 'h:mm a')}</div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div className={styles.inputBar}>
              <textarea ref={inputRef} className={styles.messageInput}
                placeholder="Type a message… (Enter to send)" value={input}
                onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} rows={1} />
              <button className={`btn btn-primary ${styles.sendBtn}`} onClick={sendMessage} disabled={!input.trim()}>
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.emptyChat}>
            <MessageSquare size={48} style={{ opacity: 0.18, marginBottom: 16 }} />
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the list, or start one from a project page.</p>
          </div>
        )}
      </div>

      {/* ── NEW: New Message Modal ── */}
      {showNewMsg && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowNewMsg(false)}>
          <div style={{
            background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: 24, width: 400, maxWidth: '90vw',
          }} onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>New Message</h3>
              <button onClick={() => setShowNewMsg(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Search input */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                autoFocus
                type="text"
                placeholder="Search by name or email…"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 32, width: '100%' }}
              />
            </div>

            {/* Results */}
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {searching && (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Searching…</div>
              )}
              {!searching && userQuery && userResults.length === 0 && (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No users found</div>
              )}
              {!searching && !userQuery && (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Type a name to search all users</div>
              )}
              {userResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startConversationWith(u)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 8px', background: 'none', border: 'none',
                    borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Avatar user={u} size={36} radius={8} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {u.first_name} {u.last_name}
                    </div>
                    <Badge variant={u.role} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}