// src/pages/faculty/FacultyProfile.jsx
// Faculty can view and update their own profile:
// department, university, bio, research_interests.
// @author sshende

import { useState, useEffect } from 'react'
import { profileAPI } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Save, User, BookOpen, Building2 } from 'lucide-react'

export default function FacultyProfile() {
  const { user } = useAuth()

  const [form, setForm] = useState({
    department:          '',
    university:          '',
    bio:                 '',
    research_interests:  '',
  })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    profileAPI.getFacultyProfile()
      .then(({ data }) => {
        setForm({
          department:         data.department          || '',
          university:         data.university          || '',
          bio:                data.bio                 || '',
          research_interests: data.research_interests  || '',
        })
      })
      .catch(() => toast.error('Failed to load profile.'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await profileAPI.updateFacultyProfile(form)
      toast.success('Profile saved!')
    } catch {
      toast.error('Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--text-muted)', padding:40 }}>
      <User size={18} /> Loading profile…
    </div>
  )

  const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="page-enter" style={{ maxWidth:720 }}>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Keep your profile up to date. Students can see your research interests when viewing your projects.</p>
      </div>

      {/* Identity card (read-only) */}
      <div className="card" style={{ marginBottom:24, display:'flex', alignItems:'center', gap:20 }}>
        <div style={{
          width:64, height:64, borderRadius:16, flexShrink:0,
          background:'var(--accent-info)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:800, fontSize:'1.3rem', color:'white',
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontWeight:700, fontSize:'1.15rem', marginBottom:4 }}>
            {user?.first_name} {user?.last_name}
          </div>
          <div style={{ fontSize:'0.85rem', color:'var(--text-muted)', display:'flex', gap:14, flexWrap:'wrap' }}>
            <span>{user?.email}</span>
            <span style={{ padding:'2px 10px', background:'rgba(56,189,248,0.1)', color:'var(--accent-info)', borderRadius:'var(--radius-full)', fontSize:'0.75rem', fontWeight:600 }}>
              Faculty
            </span>
          </div>
        </div>
      </div>

      {/* Editable profile form */}
      <div className="card">
        <form onSubmit={handleSubmit}>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div className="form-group">
              <label className="form-label">Department</label>
              <div style={{ position:'relative' }}>
                <BookOpen size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
                <input
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="form-input"
                  style={{ paddingLeft:38 }}
                  placeholder="e.g. Computer Science"
                  disabled={saving}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">University / Institution</label>
              <div style={{ position:'relative' }}>
                <Building2 size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
                <input
                  name="university"
                  value={form.university}
                  onChange={handleChange}
                  className="form-input"
                  style={{ paddingLeft:38 }}
                  placeholder="e.g. University of Maryland"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              className="form-input"
              rows={4}
              placeholder="Brief description of your academic background and interests…"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Research Interests</label>
            <textarea
              name="research_interests"
              value={form.research_interests}
              onChange={handleChange}
              className="form-input"
              rows={3}
              placeholder="e.g. Machine Learning, Human-Computer Interaction, Data Privacy…"
              disabled={saving}
            />
            <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:4, display:'block' }}>
              Shown on your project listings to help students find relevant research.
            </span>
          </div>

          <div style={{ display:'flex', gap:12, marginTop:8 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ display:'flex', alignItems:'center', gap:6 }}
            >
              <Save size={15} />
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
