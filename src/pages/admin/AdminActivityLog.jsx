// src/pages/admin/AdminActivityLog.jsx
// Admin activity log: shows all platform actions (create, update, delete, login, etc.) with actor, resource, and timestamp.
// Supports filtering by action type, resource type, and actor name search.
//@author sshende
import { useState, useEffect, useCallback } from 'react'
import { adminAPI } from '../../api/services'
import Spinner from '../../components/common/Spinner'
import { Search, RefreshCw } from 'lucide-react'
import { shortDate } from '../../utils/helpers'

// Colour-coded action badges matching existing Badge style conventions
const ACTION_COLORS = {
  create:     { bg: 'rgba(34,197,94,0.12)',  color: 'var(--accent-success)' },
  update:     { bg: 'rgba(59,130,246,0.12)', color: 'var(--accent-info)'    },
  delete:     { bg: 'rgba(244,63,94,0.12)',  color: 'var(--accent-danger)'  },
  login:      { bg: 'rgba(168,85,247,0.12)', color: '#a855f7'               },
  logout:     { bg: 'rgba(107,114,128,0.1)', color: 'var(--text-muted)'     },
  deactivate: { bg: 'rgba(234,179,8,0.12)',  color: 'var(--accent-warning)' },
  activate:   { bg: 'rgba(34,197,94,0.12)',  color: 'var(--accent-success)' },
}

const ACTIONS        = ['', 'create', 'update', 'delete', 'login', 'logout', 'deactivate', 'activate']
const RESOURCE_TYPES = ['', 'user', 'project', 'application', 'discussion', 'message']

// Badge component for action types (e.g. create, update, delete, login)  with consistent styling.
function ActionBadge({ action }) {
  const style = ACTION_COLORS[action] ?? { bg: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }
  return (
    <span style={{
      background: style.bg,
      color: style.color,
      fontSize: '0.7rem',
      fontWeight: 700,
      padding: '2px 10px',
      borderRadius: 100,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>
      {action}
    </span>
  )
}

// Main component for the admin activity log page.  Fetches and displays a paginated list of activity logs with filtering options.
export default function AdminActivityLog() {
  const [logs, setLogs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [action, setAction]     = useState('')
  const [resource, setResource] = useState('')
  const [page, setPage]         = useState(1)
  const [hasNext, setHasNext]   = useState(false)

  const fetchLogs = useCallback((reset = false) => {
    setLoading(true)
    const currentPage = reset ? 1 : page
    if (reset) setPage(1)

    const params = { page: currentPage }
    if (action)   params.action        = action
    if (resource) params.resource_type = resource
    if (search)   params.actor         = search

    adminAPI.getActivityLogs(params)
      .then(({ data }) => {
        const results = data?.results ?? data ?? []
        setLogs(reset ? results : (prev) => (currentPage === 1 ? results : [...prev, ...results]))
        setHasNext(!!data?.next)
      })
      .finally(() => setLoading(false))
  }, [page, action, resource, search])

  // Re-fetch on filter change, reset pagination
  useEffect(() => { fetchLogs(true) }, [action, resource])

  // Fetch next page when page increments
  useEffect(() => { if (page > 1) fetchLogs() }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchLogs(true)
  }

  return (
    <div className="page-enter">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Activity Log</h1>
          <p>Audit trail of all platform actions.</p>
        </div>
        <button className="btn btn-secondary" style={{ gap: 6 }} onClick={() => fetchLogs(true)}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ position: 'relative', flex: 1, minWidth: 220, display: 'flex' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Filter by actor name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 38, flex: 1 }}
          />
        </form>
        <select value={action} onChange={(e) => setAction(e.target.value)} className="form-input" style={{ width: 160 }}>
          {ACTIONS.map((a) => <option key={a} value={a}>{a || 'All Actions'}</option>)}
        </select>
        <select value={resource} onChange={(e) => setResource(e.target.value)} className="form-input" style={{ width: 160 }}>
          {RESOURCE_TYPES.map((r) => <option key={r} value={r}>{r || 'All Resources'}</option>)}
        </select>
      </div>

      {loading && logs.length === 0
        ? <Spinner text="Loading activity log…" />
        : (
          <>
            {/* Log table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.length === 0 && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No activity found for these filters.</p>
              )}
              {logs.map((log) => (
                <div key={log.id} className="card" style={{ padding: '12px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {/* Action */}
                    <ActionBadge action={log.action} />

                    {/* Actor */}
                    <div style={{ minWidth: 140 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {log.actor_name ?? `User #${log.actor_id}`}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.actor_role ?? 'unknown role'}</div>
                    </div>

                    {/* What happened */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.description ?? `${log.action} ${log.resource_type} #${log.resource_id}`}
                      </div>
                      {log.resource_type && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {log.resource_type}{log.resource_id ? ` · ID ${log.resource_id}` : ''}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0, textAlign: 'right' }}>
                      {log.timestamp ? shortDate(log.timestamp) : '—'}
                      {log.ip_address && (
                        <div style={{ fontSize: '0.68rem' }}>{log.ip_address}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load more */}
            {hasNext && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                >
                  {loading ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )
      }
    </div>
  )
}
