// src/components/common/SponsorFacultyProfileModal.jsx
// Modal for students to view a sponsor or faculty member's profile from a project listing.
// @author sshende

import { useEffect, useState } from 'react'
import { profileAPI } from '../../api/services'
import { X, Globe, Clock } from 'lucide-react'

export default function SponsorFacultyProfileModal({ user, onClose }) {
  // `user` is the created_by object from the project — has id, role, first_name, last_name, email
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const fetch = user.role === 'sponsor'
      ? profileAPI.getSponsorById(user.id)    // GET /api/v1/users/sponsors/<id>/
      : profileAPI.getFacultyById(user.id)    // GET /api/v1/users/faculty/<id>/
    fetch
      .then(({ data }) => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose() }

  return (
    <div onClick={handleBackdrop} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto', position: 'relative', padding: '24px 28px' }}>
        <button onClick={onClose} className="btn btn-secondary"
          style={{ position: 'absolute', top: 16, right: 16, padding: '4px 8px' }}>
          <X size={15}/>
        </button>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', padding: '20px 0' }}>
            <Clock size={16}/> Loading profile…
          </div>
        ) : !profile ? (
          <p style={{ color: 'var(--text-muted)' }}>Profile not available.</p>
        ) : user.role === 'sponsor' ? (
          <SponsorBody profile={profile}/>
        ) : (
          <FacultyBody profile={profile}/>
        )}
      </div>
    </div>
  )
}

function SponsorBody({ profile }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: 'var(--accent-warning)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '1rem', color: 'white',
        }}>
          {profile.company_name?.[0]}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{profile.company_name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{profile.industry}</div>
        </div>
      </div>
      {profile.description && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 14 }}>{profile.description}</p>
      )}
      {profile.website && (
        <a href={profile.website} target="_blank" rel="noreferrer"
          className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Globe size={12}/> Website
        </a>
      )}
    </>
  )
}

function FacultyBody({ profile }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: 'var(--accent-info)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '1rem', color: 'white',
        }}>
          {profile.user?.first_name?.[0]}{profile.user?.last_name?.[0]}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
            {profile.user?.first_name} {profile.user?.last_name}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{profile.department} · {profile.university}</div>
        </div>
      </div>
      {profile.bio && (
        <div style={{ marginBottom: 14 }}>
          <SectionLabel>Bio</SectionLabel>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{profile.bio}</p>
        </div>
      )}
      {profile.research_interests && (
        <div>
          <SectionLabel>Research Interests</SectionLabel>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{profile.research_interests}</p>
        </div>
      )}
    </>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, fontWeight: 600 }}>
      {children}
    </div>
  )
}
