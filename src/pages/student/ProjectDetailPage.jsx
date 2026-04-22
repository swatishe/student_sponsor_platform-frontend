// src/pages/student/ProjectDetailPage.jsx
// Project detail page for students — shows full project info, sponsor details, and options to apply or message the sponsor. Fetches project data on mount and handles loading and error states. If the student has already applied, it shows the application status instead of the apply button. Also includes a form for submitting a cover letter when applying.
//@author sshende

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectAPI, applicationAPI, messagingAPI, savedAPI } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import SaveButton from '../../components/common/SaveButton'
import toast from 'react-hot-toast'
import { Calendar, Briefcase, DollarSign, Users, ArrowLeft, Send, MessageSquare, CheckCircle, Clock } from 'lucide-react'

export default function ProjectDetailPage() {
  const { id }       = useParams()
  const { user }     = useAuth()
  const navigate     = useNavigate()

  const [project,     setProject]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [applied,     setApplied]     = useState(false)
  const [applying,    setApplying]    = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [showForm,    setShowForm]    = useState(false)
  const [isSaved,     setIsSaved]     = useState(false)

  useEffect(() => {
    const fetches = [projectAPI.getProject(id)]
    // Only check saved state for students
    if (user?.role === 'student') {
      fetches.push(savedAPI.isSaved(id))
    }

    Promise.all(fetches)
      .then(([projRes, savedRes]) => {
        setProject(projRes.data)
        if (savedRes) setIsSaved(savedRes.data?.saved ?? false)
      })
      .catch(() => toast.error('Project not found.'))
      .finally(() => setLoading(false))
  }, [id, user])

  const handleApply = async () => {
    setApplying(true)
    try {
      await applicationAPI.apply({ project_id: id, cover_letter: coverLetter })
      setApplied(true)
      setShowForm(false)
      toast.success('Application submitted!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to apply.')
    } finally {
      setApplying(false)
    }
  }

  const handleMessage = async () => {
    if (!project?.created_by?.id) return
    try {
      const { data } = await messagingAPI.startConversation(
        project.created_by.id,
        `Hi, I'm interested in your project: "${project.title}"`
      )
      navigate(`/messages/${data.id}`)
    } catch {
      toast.error('Could not start conversation.')
    }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--text-muted)', padding:40 }}>
      <Clock size={20} /> Loading project…
    </div>
  )
  if (!project) return (
    <div style={{ textAlign:'center', padding:60 }}>
      <h3 style={{ color:'var(--text-muted)' }}>Project not found.</h3>
    </div>
  )

  const isStudent = user?.role === 'student'

  return (
    <div style={{ maxWidth:760, margin:'0 auto' }}>

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="btn btn-ghost"
        style={{ display:'flex', alignItems:'center', gap:6, marginBottom:20, fontSize:'0.875rem' }}
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Main card */}
      <div className="card" style={{ marginBottom:20 }}>

        {/* Title row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14, marginBottom:16 }}>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:8 }}>{project.title}</h1>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              <span className={`badge badge-${project.status}`}>{project.status}</span>
              <span style={{ fontSize:'0.82rem', color:'var(--text-secondary)', textTransform:'capitalize' }}>
                <Briefcase size={13} style={{ verticalAlign:'middle', marginRight:4 }} />
                {project.project_type?.replace('_', ' ')}
              </span>
              {project.is_paid && (
                <span style={{ fontSize:'0.82rem', color:'var(--accent-success)' }}>
                  <DollarSign size={13} style={{ verticalAlign:'middle' }} />
                  {project.stipend || 'Paid'}
                </span>
              )}
              {project.deadline && (
                <span style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>
                  <Calendar size={13} style={{ verticalAlign:'middle', marginRight:3 }} />
                  Deadline: {new Date(project.deadline).toLocaleDateString()}
                </span>
              )}
              {project.max_applicants > 0 && (
                <span style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>
                  <Users size={13} style={{ verticalAlign:'middle', marginRight:3 }} />
                  Up to {project.max_applicants} applicants
                </span>
              )}
            </div>
          </div>

          {/* Save button — students only */}
          {isStudent && (
            <SaveButton
              projectId={project.id}
              isSaved={isSaved}
              onChange={setIsSaved}
            />
          )}
        </div>

        {/* Description */}
        <h3 style={{ fontSize:'0.9rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
          About this project
        </h3>
        <p style={{ lineHeight:1.75, color:'var(--text-primary)', marginBottom:20, whiteSpace:'pre-wrap' }}>
          {project.description}
        </p>

        {/* Requirements */}
        {project.requirements && (
          <>
            <h3 style={{ fontSize:'0.9rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
              Requirements
            </h3>
            <p style={{ lineHeight:1.75, color:'var(--text-primary)', marginBottom:20, whiteSpace:'pre-wrap' }}>
              {project.requirements}
            </p>
          </>
        )}

        {/* Tags */}
        {project.tags_list?.length > 0 && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
            {project.tags_list.map((tag) => (
              <span key={tag} style={{ padding:'3px 10px', background:'rgba(108,99,255,0.1)', color:'var(--accent-primary)', borderRadius:'var(--radius-full)', fontSize:'0.78rem', border:'1px solid rgba(108,99,255,0.2)' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Posted by */}
        <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', borderTop:'1px solid var(--border-color)', paddingTop:14 }}>
          Posted by <strong style={{ color:'var(--text-primary)' }}>{project.created_by?.first_name} {project.created_by?.last_name}</strong>
          {project.created_by?.role && (
            <span style={{ marginLeft:6 }}>· {project.created_by.role}</span>
          )}
        </div>
      </div>

      {/* ── Action area — students only ── */}
      {isStudent && project.status === 'open' && (
        <div className="card">
          {applied ? (
            <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--accent-success)' }}>
              <CheckCircle size={20} />
              <span style={{ fontWeight:600 }}>Application submitted! We'll notify you of any updates.</span>
            </div>
          ) : showForm ? (
            <>
              <h3 style={{ marginBottom:14, fontSize:'1rem' }}>Cover Letter <span style={{ color:'var(--text-muted)', fontWeight:400 }}>(optional)</span></h3>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Briefly explain why you're a great fit for this project…"
                className="form-input"
                rows={5}
                style={{ marginBottom:14 }}
              />
              <div style={{ display:'flex', gap:10 }}>
                <button
                  className="btn btn-primary"
                  onClick={handleApply}
                  disabled={applying}
                  style={{ display:'flex', alignItems:'center', gap:6 }}
                >
                  <Send size={14} />
                  {applying ? 'Submitting…' : 'Submit Application'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <button
                className="btn btn-primary"
                style={{ display:'flex', alignItems:'center', gap:6 }}
                onClick={() => setShowForm(true)}
              >
                <Send size={14} /> Apply Now
              </button>
              <button
                className="btn btn-secondary"
                style={{ display:'flex', alignItems:'center', gap:6 }}
                onClick={handleMessage}
              >
                <MessageSquare size={14} /> Message Sponsor
              </button>
              <SaveButton
                projectId={project.id}
                isSaved={isSaved}
                onChange={setIsSaved}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
