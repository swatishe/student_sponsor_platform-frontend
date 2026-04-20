// src/pages/admin/AdminProjects.jsx
// Admin project management: view all platform projects, filter by type/status, delete any project.
//@author sshende
import { useState, useEffect } from 'react'
import { adminAPI } from '../../api/services'
import Spinner from '../../components/common/Spinner'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'
import { Trash2, Search } from 'lucide-react'
import { shortDate } from '../../utils/helpers'

const STATUSES = ['', 'open', 'closed', 'draft']
const TYPES    = ['', 'research', 'capstone', 'industry']

export default function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatus] = useState('')
  const [typeFilter, setType]     = useState('')

  const fetchProjects = () => {
    setLoading(true)
    const params = {}
    if (statusFilter) params.status = statusFilter
    if (typeFilter)   params.project_type = typeFilter
    adminAPI.getProjects(params)
      .then(({ data }) => setProjects(data?.results ?? data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [statusFilter, typeFilter])

  const handleDelete = async (id, title) => {
    if (!confirm(`Permanently delete "${title}"? This cannot be undone.`)) return
    try {
      await adminAPI.deleteProject(id)
      toast.success('Project deleted.')
      fetchProjects()
    } catch {
      toast.error('Failed to delete project.')
    }
  }

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.title?.toLowerCase().includes(q) ||
      p.created_by?.first_name?.toLowerCase().includes(q) ||
      p.created_by?.last_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Manage Projects</h1>
        <p>View and remove any project posted on the platform.</p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 38 }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatus(e.target.value)} className="form-input" style={{ width: 150 }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setType(e.target.value)} className="form-input" style={{ width: 150 }}>
          {TYPES.map((t) => <option key={t} value={t}>{t || 'All Types'}</option>)}
        </select>
      </div>

      <p style={{ marginBottom: 14, color: 'var(--text-muted)', fontSize: '0.83rem' }}>
        {filtered.length} project{filtered.length !== 1 ? 's' : ''}
      </p>

      {loading ? (
        <Spinner text="Loading projects…" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((p) => (
            <div key={p.id} className="card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>By {p.created_by?.first_name} {p.created_by?.last_name}</span>
                    <span>{p.project_type}</span>
                    {p.created_at && <span>Posted {shortDate(p.created_at)}</span>}
                    <span>{p.application_count ?? 0} applicants</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <Badge variant={p.status} />
                  <button
                    className="btn btn-danger"
                    style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                    onClick={() => handleDelete(p.id, p.title)}
                    title="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No projects match your filters.</p>
          )}
        </div>
      )}
    </div>
  )
}
