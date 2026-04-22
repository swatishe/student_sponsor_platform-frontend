// src/pages/faculty/FacultyApplicationsReview.jsx
// Faculty view all applicants for their project.
// Actions: Accept, Reject, Under Review, Message student, View student profile.
// @author sshende

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { applicationAPI, projectAPI, messagingAPI, profileAPI } from '../../api/services'
import toast from 'react-hot-toast'
import {
  ArrowLeft, MessageSquare, CheckCircle, XCircle, Eye,
  ChevronDown, ChevronUp, User, BookOpen, Github, Linkedin,
  ExternalLink, Clock,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const STATUS_OPTIONS = ['pending', 'reviewing', 'accepted', 'rejected']

const STATUS_COLORS = {
  pending:   { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24' },
  reviewing: { bg: 'rgba(56,189,248,0.12)',  color: '#38bdf8' },
  accepted:  { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80' },
  rejected:  { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
  withdrawn: { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af' },
}

export default function FacultyApplicationsReview() {
  const { id }    = useParams()   // project ID
  const navigate  = useNavigate()

  const [project,  setProject]  = useState(null)
  const [apps,     setApps]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('')
  const [expanded, setExpanded] = useState(null)   // app id whose profile is shown
  const [profiles, setProfiles] = useState({})     // { studentId: profileData }
  const [loadingProfile, setLoadingProfile] = useState(null)

  useEffect(() => {
    Promise.all([
      projectAPI.getProject(id),
      applicationAPI.getProjectApplications(id),
    ])
      .then(([projRes, appsRes]) => {
        setProject(projRes.data)
        setApps(appsRes.data?.results ?? appsRes.data ?? [])
      })
      .catch(() => toast.error('Failed to load applicants.'))
      .finally(() => setLoading(false))
  }, [id])

  // ── Update application status ─────────────────────────────────────────────
  const handleStatus = async (appId, newStatus) => {
    try {
      await applicationAPI.updateStatus(appId, { status: newStatus })
      setApps((prev) => prev.map((a) => a.id === appId ? { ...a, status: newStatus } : a))
      toast.success(`Application marked as ${newStatus}.`)
    } catch {
      toast.error('Failed to update status.')
    }
  }

  // ── Message student ───────────────────────────────────────────────────────
  const handleMessage = async (studentId) => {
    try {
      const { data } = await messagingAPI.startConversation(
        studentId,
        ''      // ← empty string: opens conversation without sending any message
      )
      navigate(`/messages/${data.id}`)
    } catch {
      toast.error('Could not open conversation.')
    }
  }

  // ── Toggle student profile panel ──────────────────────────────────────────
  const toggleProfile = async (app) => {
    const appId     = app.id
    const studentId = app.student?.id

    if (expanded === appId) {
      setExpanded(null)
      return
    }

    setExpanded(appId)

    // Load profile if not already cached
    if (!profiles[studentId]) {
      setLoadingProfile(studentId)
      try {
        const { data } = await profileAPI.getStudentById(studentId)
        setProfiles((prev) => ({ ...prev, [studentId]: data }))
      } catch {
        toast.error('Could not load student profile.')
      } finally {
        setLoadingProfile(null)
      }
    }
  }

  const filtered = filter ? apps.filter((a) => a.status === filter) : apps

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--text-muted)', padding:40 }}>
      <Clock size={18} /> Loading applicants…
    </div>
  )

  return (
    <div className="page-enter">

      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom:20, display:'flex', alignItems:'center', gap:6 }}>
        <ArrowLeft size={15} /> Back to Projects
      </button>

      <div className="page-header">
        <h1>Applicants — {project?.title}</h1>
        <p>{apps.length} total applicant{apps.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Status filter pills */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {['', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding:'5px 14px', fontSize:'0.82rem' }}
          >
            {s || 'All'} ({s ? apps.filter((a) => a.status === s).length : apps.length})
          </button>
        ))}
      </div>

      {/* Applications list */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:48 }}>
          <User size={36} style={{ color:'var(--text-muted)', margin:'0 auto 12px', display:'block' }} />
          <h3 style={{ color:'var(--text-muted)' }}>
            {filter ? `No "${filter}" applications` : 'No applications yet'}
          </h3>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {filtered.map((app) => {
            const sc      = STATUS_COLORS[app.status] || STATUS_COLORS.pending
            const profile = profiles[app.student?.id]
            const isOpen  = expanded === app.id

            return (
              <div key={app.id} className="card" style={{ padding:'18px 22px' }}>

                {/* ── Top row: student info + actions ── */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14 }}>

                  {/* Left: avatar + name + email + time */}
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12, flex:1, minWidth:0 }}>
                    <div style={{
                      width:42, height:42, borderRadius:10, flexShrink:0,
                      background:'var(--accent-success)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontWeight:700, fontSize:'0.9rem', color:'white',
                    }}>
                      {app.student?.first_name?.[0]}{app.student?.last_name?.[0]}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:2 }}>
                        {app.student?.first_name} {app.student?.last_name}
                      </div>
                      <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', display:'flex', gap:12, flexWrap:'wrap' }}>
                        <span>{app.student?.email}</span>
                        <span>Applied {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: status badge + action buttons */}
                  <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end', flexShrink:0 }}>
                    <span style={{ padding:'3px 12px', borderRadius:'var(--radius-full)', fontSize:'0.78rem', fontWeight:600, background:sc.bg, color:sc.color }}>
                      {app.status}
                    </span>

                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
                      {/* View Profile */}
                      <button
                        className="btn btn-secondary"
                        style={{ padding:'5px 10px', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:5 }}
                        onClick={() => toggleProfile(app)}
                      >
                        <User size={13} />
                        Profile
                        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {/* Message */}
                      <button
                        className="btn btn-secondary"
                        style={{ padding:'5px 10px', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:5 }}
                        onClick={() => handleMessage(app.student?.id)}
                      >
                        <MessageSquare size={13} /> Message
                      </button>

                      {/* Accept */}
                      {app.status !== 'accepted' && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding:'5px 10px', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:5, color:'var(--accent-success)', borderColor:'rgba(34,197,94,0.3)' }}
                          onClick={() => handleStatus(app.id, 'accepted')}
                        >
                          <CheckCircle size={13} /> Accept
                        </button>
                      )}

                      {/* Review */}
                      {app.status === 'pending' && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding:'5px 10px', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:5, color:'var(--accent-info)' }}
                          onClick={() => handleStatus(app.id, 'reviewing')}
                        >
                          <Eye size={13} /> Review
                        </button>
                      )}

                      {/* Reject */}
                      {app.status !== 'rejected' && app.status !== 'withdrawn' && (
                        <button
                          className="btn btn-danger"
                          style={{ padding:'5px 10px', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:5 }}
                          onClick={() => handleStatus(app.id, 'rejected')}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cover letter */}
                {app.cover_letter && (
                  <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(255,255,255,0.03)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border-color)', fontSize:'0.83rem', color:'var(--text-secondary)', lineHeight:1.65 }}>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6, fontWeight:600 }}>
                      Cover Letter
                    </div>
                    {app.cover_letter}
                  </div>
                )}

                {/* ── Student Profile Panel (expanded) ── */}
                {isOpen && (
                  <div style={{ marginTop:14, padding:'16px 18px', background:'rgba(108,99,255,0.05)', borderRadius:'var(--radius-md)', border:'1px solid rgba(108,99,255,0.15)' }}>
                    {loadingProfile === app.student?.id ? (
                      <div style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Loading profile…</div>
                    ) : profile ? (
                      <StudentProfilePanel profile={profile} />
                    ) : (
                      <div style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Profile not available.</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


// ── StudentProfilePanel ───────────────────────────────────────────────────────
// Inline expanded view of a student's profile inside the applicant card.

function StudentProfilePanel({ profile }) {
  const u = profile.user || {}
  const skillsList = profile.skills
    ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <div>
      <div style={{ fontSize:'0.78rem', color:'var(--accent-primary)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>
        Student Profile
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:14 }}>
        {profile.university && (
          <InfoItem icon={<BookOpen size={13} />} label="University" value={profile.university} />
        )}
        {profile.major && (
          <InfoItem icon={<BookOpen size={13} />} label="Major" value={profile.major} />
        )}
        {profile.gpa && (
          <InfoItem icon={null} label="GPA" value={profile.gpa} />
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5, fontWeight:600 }}>Bio</div>
          <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)', lineHeight:1.6, margin:0 }}>{profile.bio}</p>
        </div>
      )}

      {/* Skills */}
      {skillsList.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8, fontWeight:600 }}>Skills</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {skillsList.map((skill) => (
              <span key={skill} style={{ padding:'2px 10px', background:'rgba(108,99,255,0.12)', color:'var(--accent-primary)', borderRadius:'var(--radius-full)', fontSize:'0.78rem', border:'1px solid rgba(108,99,255,0.2)' }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:8 }}>
        {profile.portfolio_url && (
          <a href={profile.portfolio_url} target="_blank" rel="noreferrer"
            className="btn btn-secondary" style={{ padding:'4px 10px', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:5 }}>
            <ExternalLink size={12} /> Portfolio
          </a>
        )}
        {profile.linkedin_url && (
          <a href={profile.linkedin_url} target="_blank" rel="noreferrer"
            className="btn btn-secondary" style={{ padding:'4px 10px', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:5 }}>
            <Linkedin size={12} /> LinkedIn
          </a>
        )}
        {profile.github_url && (
          <a href={profile.github_url} target="_blank" rel="noreferrer"
            className="btn btn-secondary" style={{ padding:'4px 10px', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:5 }}>
            <Github size={12} /> GitHub
          </a>
        )}
        {profile.resume && (
          <a href={profile.resume} target="_blank" rel="noreferrer"
            className="btn btn-primary" style={{ padding:'4px 10px', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:5 }}>
            <Eye size={12} /> Resume
          </a>
        )}
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }) {
  return (
    <div>
      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3, fontWeight:600 }}>
        {label}
      </div>
      <div style={{ fontSize:'0.875rem', color:'var(--text-primary)', display:'flex', alignItems:'center', gap:5 }}>
        {icon && <span style={{ color:'var(--text-muted)' }}>{icon}</span>}
        {value}
      </div>
    </div>
  )
}
