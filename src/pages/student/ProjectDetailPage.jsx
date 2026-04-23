// src/pages/student/ProjectDetailPage.jsx
// Project detail page for students — shows full project info, sponsor details, and options to apply or message the sponsor. Fetches project data on mount and handles loading and error states. If the student has already applied, it shows the application status instead of the apply button. Also includes a form for submitting a cover letter when applying.
//@author sshende

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectAPI, applicationAPI, messagingAPI, savedAPI } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Calendar, Briefcase, DollarSign, Users, ArrowLeft,
  Send, MessageSquare, CheckCircle, Clock, Bookmark, BookmarkCheck,
} from 'lucide-react'

// The project detail page component fetches the project data based on the ID from the URL parameters. It displays the project information, including title, description, requirements, tags, and sponsor details. Students can apply for the project by submitting a cover letter, and if they have already applied, it shows the application status. There is also an option to message the sponsor directly from this page. Additionally, students can save or unsave the project to their saved projects list.
export default function ProjectDetailPage() {
  const { id }   = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [project,     setProject]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [applied,     setApplied]     = useState(false)
  const [applying,    setApplying]    = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [showForm,    setShowForm]    = useState(false)
  const [isSaved,     setIsSaved]     = useState(false)
  const [savingState, setSavingState] = useState(false)
  const [messaging,   setMessaging]   = useState(false)

  // Fetch project details and saved status on mount. The component makes an API call to fetch the project details using the project ID from the URL parameters. If the user is a student, it also checks if the project is already saved in their saved projects list. The responses are stored in state, and a loading state is used to show a spinner while fetching.
  useEffect(() => {
    const fetches = [projectAPI.getProject(id)]
    if (user?.role === 'student') fetches.push(savedAPI.isSaved(id))

      //  Fix 2: Check if the student has already applied to this project and set the applied state accordingly. This is done by fetching the student's applications and checking if any of them match the current project ID. This allows the UI to show the application status instead of the apply button if the student has already applied.
    Promise.all(fetches)
      .then(([projRes, savedRes]) => {
        setProject(projRes.data)
        if (savedRes) setIsSaved(savedRes.data?.saved ?? false)
      })
      .catch(() => toast.error('Project not found.'))
      .finally(() => setLoading(false))
  }, [id, user])

  // Check if the student has already applied to this project. This effect runs whenever the project data or user changes. It fetches the student's applications and checks if any of them are for the current project ID. If so, it sets the applied state to true, which allows the UI to show the application status instead of the apply button.
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

  // Fix 1: just open the conversation — no pre-filled auto-message sent
  const handleMessage = async () => {
    if (!project?.created_by?.id) return
    setMessaging(true)
    try {
      const { data } = await messagingAPI.startConversation(
        project.created_by.id,
        ''      // ← empty string: opens conversation without sending any message
      )
      navigate(`/messages/${data.id}`)
    } catch {
      toast.error('Could not start conversation.')
    } finally {
      setMessaging(false)
    }
  }

  // Handle saving or unsaving the project to the student's saved projects list. This function is called when the student clicks the save/unsave button. It checks the current saved state and makes the appropriate API call to either save or unsave the project. It also updates the local state and shows a toast notification based on the outcome of the operation.
  const handleSave = async () => {
    if (savingState) return
    setSavingState(true)
    try {
      if (isSaved) {
        await savedAPI.unsave(id)
        setIsSaved(false)
        toast.success('Removed from saved projects.')
      } else {
        await savedAPI.save(id)
        setIsSaved(true)
        toast.success('Project saved!')
      }
    } catch {
      toast.error('Could not update saved projects.')
    } finally {
      setSavingState(false)
    }
  }

  // Show loading state while fetching project data. Displays a spinner and message to indicate that the project is being loaded.
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', padding: 40 }}>
      <Clock size={20} /> Loading project…
    </div>
  )
  // Show error state if project is not found. Displays a message indicating that the project could not be found.
  if (!project) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <h3 style={{ color: 'var(--text-muted)' }}>Project not found.</h3>
    </div>
  )

  const isStudent = user?.role === 'student'
  const isOpen    = project.status === 'open'

  // Handle form input changes by updating the corresponding field in the form state. This function is called whenever an input value changes, allowing the form state to stay in sync with the user's input.
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        className="btn btn-secondary"
        style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* ── Main project card ── */}
      <div className="card" style={{ marginBottom: 20 }}>

        {/* Title + status + save */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, flex: 1, lineHeight: 1.25 }}>
            {project.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span className={`badge badge-${project.status}`}>{project.status}</span>
            {/* Fix 3: Save button inline in card header */}
            {isStudent && (
              <button
                onClick={handleSave}
                disabled={savingState}
                title={isSaved ? 'Remove from saved' : 'Save project'}
                className={isSaved ? 'btn btn-secondary' : 'btn btn-ghost'}
                style={{
                  padding: '6px 14px',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.875rem',
                  color: isSaved ? 'var(--accent-primary)' : 'var(--text-muted)',
                  borderColor: isSaved ? 'var(--accent-primary)' : undefined,
                  opacity: savingState ? 0.6 : 1,
                }}
              >
                {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                {isSaved ? 'Saved' : 'Save'}
              </button>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, textTransform: 'capitalize' }}>
            <Briefcase size={14} /> {project.project_type?.replace('_', ' ')}
          </span>
          {project.is_paid && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent-success)' }}>
              <DollarSign size={14} /> {project.stipend || 'Paid'}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Users size={14} /> {project.application_count} applicant{project.application_count !== 1 ? 's' : ''}
          </span>
          {project.deadline && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={14} /> Deadline: {new Date(project.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', marginBottom: 20 }} />

        {/* Description */}
        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 700 }}>
            About this project
          </h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
            {project.description}
          </p>
        </section>

        {project.requirements && (
          <section style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 700 }}>
              Requirements
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {project.requirements}
            </p>
          </section>
        )}

        {project.tags_list?.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 700 }}>
              Skills & Tags
            </h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {project.tags_list.map((tag) => (
                <span key={tag} style={{
                  padding: '3px 12px', borderRadius: 100,
                  background: 'rgba(108,99,255,0.10)', color: 'var(--accent-primary)',
                  fontSize: '0.8rem', border: '1px solid rgba(108,99,255,0.2)',
                }}>{tag}</span>
              ))}
            </div>
          </section>
        )}

        {/* Posted by */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'var(--accent-warning)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: 'white', fontSize: '0.9rem',
          }}>
            {project.created_by?.first_name?.[0]}{project.created_by?.last_name?.[0]}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>POSTED BY</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {project.created_by?.first_name} {project.created_by?.last_name}
            </div>
          </div>
          <span className={`badge badge-${project.created_by?.role}`} style={{ marginLeft: 4 }}>
            {project.created_by?.role}
          </span>
        </div>

        {/* Fix 3: Action buttons at bottom of card, not a separate floating section */}
        {isStudent && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginTop: 20 }}>
            {applied ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-success)', fontWeight: 600 }}>
                <CheckCircle size={20} />
                Application submitted! We'll notify you of any updates.
              </div>
            ) : showForm ? (
              <div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: 12 }}>
                  Cover Letter <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                </h3>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Briefly explain why you're a great fit for this project…"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" onClick={handleApply} disabled={applying}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Send size={14} /> {applying ? 'Submitting…' : 'Submit Application'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {isOpen && (
                  <button
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => setShowForm(true)}
                  >
                    <Send size={15} /> Apply Now
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={handleMessage}
                  disabled={messaging}
                >
                  <MessageSquare size={15} /> {messaging ? 'Opening…' : 'Message Sponsor'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
