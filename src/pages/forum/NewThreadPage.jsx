// src/pages/forum/NewThreadPage.jsx
// Faculty (and admin) only — create a new discussion thread.
// @author sshende

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { forumAPI } from '../../api/services'
import toast from 'react-hot-toast'

const VISIBILITY_OPTIONS = [
  { value: 'all',        label: 'All Users' },
  { value: 'students',   label: 'Students Only' },
  { value: 'department', label: 'Department Only' },
]

export default function NewThreadPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title:       '',
    description: '',
    department:  '',
    tags:        '',
    visibility:  'all',
  })
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required.'); return }
    setLoading(true)
    try {
      const { data } = await forumAPI.createThread(form)
      toast.success('Thread created!')
      navigate(`/forum/${data.id}`)
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to create thread.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-enter" style={{ maxWidth:680, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <Link to="/forum" style={{ fontSize:'0.875rem', color:'var(--text-muted)' }}>
          ← Back to Forum
        </Link>
      </div>

      <div className="page-header">
        <h1>New Discussion Thread</h1>
        <p>Create a thread for students to pitch ideas and ask questions.</p>
      </div>

      <div className="card">
        <form onSubmit={onSubmit}>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              className="form-input"
              placeholder="e.g. Capstone Project Ideas — Spring 2026"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Prompt</label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              className="form-input"
              rows={4}
              placeholder="Provide context or a guiding question for students…"
              disabled={loading}
            />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                name="department"
                value={form.department}
                onChange={onChange}
                className="form-input"
                placeholder="e.g. Computer Science"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tags</label>
              <input
                name="tags"
                value={form.tags}
                onChange={onChange}
                className="form-input"
                placeholder="e.g. AI, capstone, research"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Visibility</label>
            <select
              name="visibility"
              value={form.visibility}
              onChange={onChange}
              className="form-input"
              disabled={loading}
            >
              {VISIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display:'flex', gap:12, marginTop:8 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating…' : 'Create Thread'}
            </button>
            <Link to="/forum" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
