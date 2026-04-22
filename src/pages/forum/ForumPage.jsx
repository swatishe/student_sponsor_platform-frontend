// src/pages/forum/ForumPage.jsx
// List all discussion threads. Faculty can create new threads.
// All authenticated users can view and click into threads.
// @author sshende

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forumAPI } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/common/Spinner'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'
import { Plus, MessageSquare, Pin, Lock, Search } from 'lucide-react'

export default function ForumPage() {
  const { user }                  = useAuth()
  const navigate                  = useNavigate()
  const [threads,  setThreads]    = useState([])
  const [loading,  setLoading]    = useState(true)
  const [dept,     setDept]       = useState('')
  const [search,   setSearch]     = useState('')

  const load = (department = '') => {
    setLoading(true)
    const params = {}
    if (department) params.department = department
    forumAPI.getThreads(params)
      .then(({ data }) => setThreads(data?.results ?? data ?? []))
      .catch(() => toast.error('Failed to load threads.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const canCreate = user?.role === 'faculty' || user?.role === 'admin'

  const filtered = threads.filter((t) => {
    if (!search.trim()) return true
    return t.title.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="page-enter">
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1>Discussion Forum</h1>
          <p>Faculty-led discussions - share ideas, pitch projects, ask questions.</p>
        </div>
        {canCreate && (
          <Link to="/forum/new" className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Plus size={16} /> New Thread
          </Link>
        )}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
          <input
            type="text"
            placeholder="Search threads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft:38 }}
          />
        </div>
        <input
          type="text"
          placeholder="Filter by department…"
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(dept)}
          className="form-input"
          style={{ width:200 }}
        />
        <button className="btn btn-secondary" onClick={() => load(dept)}>
          Filter
        </button>
        {dept && (
          <button className="btn btn-ghost" onClick={() => { setDept(''); load('') }}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <Spinner text="Loading threads…" />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.length === 0 && (
            <div className="card" style={{ textAlign:'center', padding:48 }}>
              <MessageSquare size={36} style={{ color:'var(--text-muted)', margin:'0 auto 12px' }} />
              <p style={{ color:'var(--text-muted)' }}>
                {canCreate ? 'No threads yet - create the first one!' : 'No threads yet.'}
              </p>
            </div>
          )}
          {filtered.map((t) => (
            <div
              key={t.id}
              className="card"
              style={{ padding:'16px 20px', cursor:'pointer', transition:'border-color 0.15s' }}
              onClick={() => navigate(`/forum/${t.id}`)}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  {/* Title row */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                    {t.is_pinned && (
                      <Pin size={13} style={{ color:'var(--accent-warning)', flexShrink:0 }} />
                    )}
                    {t.is_closed && (
                      <Lock size={13} style={{ color:'var(--text-muted)', flexShrink:0 }} />
                    )}
                    <span style={{ fontWeight:700, fontSize:'1rem', color:'var(--text-primary)' }}>
                      {t.title}
                    </span>
                    {t.is_closed && (
                      <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', background:'rgba(255,255,255,0.06)', padding:'2px 8px', borderRadius:100 }}>
                        Closed
                      </span>
                    )}
                  </div>

                  {/* Meta row */}
                  <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', display:'flex', gap:14, flexWrap:'wrap' }}>
                    <span>by {t.created_by?.first_name} {t.created_by?.last_name}</span>
                    {t.department && <span>· {t.department}</span>}
                    {t.tags && <span>· {t.tags}</span>}
                  </div>
                </div>

                {/* Right side */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.82rem', color:'var(--text-secondary)' }}>
                    <MessageSquare size={13} />
                    {t.post_count} post{t.post_count !== 1 ? 's' : ''}
                  </div>
                  {t.latest_post && (
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textAlign:'right' }}>
                      Last by {t.latest_post.author}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
