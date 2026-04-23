// src/pages/student/SavedProjectsPage.jsx
// Lists all projects the student has saved/bookmarked.
// Student can unsave, apply, or message the sponsor from here.
// @author sshende

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { savedAPI, messagingAPI } from '../../api/services'
import Spinner from '../../components/common/Spinner'
import toast from 'react-hot-toast'
import {
  Bookmark, MessageSquare, ArrowRight,
  Calendar, Briefcase, BookmarkCheck, ExternalLink,
} from 'lucide-react'

// Fix 1: no auto-message — just open the conversation
// Fix 2: show saved timestamp on each card
// Fix 3: empty state with call to action to browse projects
// Fix 4: Action row — all buttons same height, properly aligned
export default function SavedProjectsPage() {
  const navigate              = useNavigate()
  const [saved,   setSaved]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    savedAPI.getSaved()
      .then(({ data }) => setSaved(data?.results ?? data ?? []))
      .catch(() => toast.error('Failed to load saved projects.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Handle unsaving a project with optimistic UI update. Removes the project from the saved list immediately for a responsive feel, then calls the API to unsave. If the API call fails, it shows an error message and reloads the saved projects to restore the previous state.
  const handleUnsave = async (projectId) => {
    // Optimistic remove
    setSaved((prev) => prev.filter((s) => s.project.id !== projectId))
    try {
      await savedAPI.unsave(projectId)
    } catch {
      toast.error('Could not remove. Please try again.')
      load()  // reload on failure
    }
  }

  // Fix 1: no auto-message — just open the conversation
  const handleMessage = async (project) => {
    if (!project.created_by?.id) return
    try {
      const { data } = await messagingAPI.startConversation(
        project.created_by.id,
        ''    // ← empty: opens chat without sending any message
      )
      navigate(`/messages/${data.id}`)
    } catch {
      toast.error('Could not start conversation.')
    }
  }

  // Note: The page displays a list of saved projects with the project title, status, type, sponsor name, deadline, and tags. Each project card includes buttons to view the project details, message the sponsor, and unsave the project. If there are no saved projects, it shows an empty state with a call to action to browse projects. The page also handles loading state while fetching saved projects from the API.

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Saved Projects</h1>
        <p>Projects you've bookmarked to revisit or apply to later.</p>
      </div>

      {loading ? (
        <Spinner text="Loading saved projects…" />
      ) : saved.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 56 }}>
          <Bookmark size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ marginBottom: 8 }}>No saved projects yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            Browse projects and click the bookmark icon to save ones you're interested in.
          </p>
          <Link to="/student/projects" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Browse Projects <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
            {saved.length} saved project{saved.length !== 1 ? 's' : ''}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {saved.map(({ id: saveId, project, saved_at }) => (
              <div key={saveId} className="card" style={{ padding: '20px 24px' }}>

                {/* Top section: project info */}
                <div style={{ marginBottom: 16 }}>
                  <Link
                    to={`/student/projects/${project.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <h3 style={{
                      fontSize: '1rem', fontWeight: 700,
                      color: 'var(--text-primary)', marginBottom: 8,
                      lineHeight: 1.35,
                    }}>
                      {project.title}
                    </h3>
                  </Link>

                  {/* Meta chips */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                    <span className={`badge badge-${project.status}`}>{project.status}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'capitalize' }}>
                      <Briefcase size={12} />
                      {project.project_type?.replace('_', ' ')}
                    </span>
                    {project.deadline && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} />
                        Due {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    )}
                    {project.is_paid && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-success)' }}>
                        💰 {project.stipend || 'Paid'}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    by {project.created_by?.first_name} {project.created_by?.last_name}
                    {project.tags_list?.length > 0 && (
                      <span style={{ marginLeft: 8 }}>· {project.tags_list.slice(0, 3).join(', ')}</span>
                    )}
                  </div>
                </div>

                {/* Fix 4: Action row — all buttons same height, properly aligned */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  paddingTop: 14,
                  borderTop: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                }}>
                  {/* View & Apply */}
                  <Link
                    to={`/student/projects/${project.id}`}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontSize: '0.875rem', textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} /> View &amp; Apply
                  </Link>

                  {/* Message */}
                  <button
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: '0.875rem' }}
                    onClick={() => handleMessage(project)}
                  >
                    <MessageSquare size={14} /> Message
                  </button>

                  {/* Saved / Unsave */}
                  <button
                    className="btn btn-secondary"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', fontSize: '0.875rem',
                      color: 'var(--accent-primary)',
                      borderColor: 'var(--accent-primary)',
                      marginLeft: 'auto',   // push to right
                    }}
                    onClick={() => handleUnsave(project.id)}
                    title="Remove from saved"
                  >
                    <BookmarkCheck size={14} /> Saved
                  </button>
                </div>

                {/* Saved timestamp */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  Saved {new Date(saved_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
