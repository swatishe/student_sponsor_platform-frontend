// src/pages/student/SavedProjectsPage.jsx
// Lists all projects the student has saved/bookmarked.
// Student can unsave, apply, or message the sponsor from here.
// @author sshende

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { savedAPI, messagingAPI } from '../../api/services'
import SaveButton from '../../components/common/SaveButton'
import Spinner from '../../components/common/Spinner'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'
import { Bookmark, MessageSquare, ArrowRight, Calendar, Briefcase } from 'lucide-react'

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

  const handleUnsave = (projectId) => {
    // Optimistically remove from list
    setSaved((prev) => prev.filter((s) => s.project.id !== projectId))
  }

  const handleMessage = async (project) => {
    if (!project.created_by?.id) return
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

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Saved Projects</h1>
        <p>Projects you've bookmarked to revisit or apply to later.</p>
      </div>

      {loading ? (
        <Spinner text="Loading saved projects…" />
      ) : saved.length === 0 ? (
        /* Empty state */
        <div className="card" style={{ textAlign:'center', padding:56 }}>
          <Bookmark size={40} style={{ color:'var(--text-muted)', margin:'0 auto 16px', display:'block' }} />
          <h3 style={{ marginBottom:8 }}>No saved projects yet</h3>
          <p style={{ color:'var(--text-muted)', marginBottom:20 }}>
            Browse projects and click the bookmark icon to save ones you're interested in.
          </p>
          <Link to="/student/projects" className="btn btn-primary">
            Browse Projects <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <>
          <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:20 }}>
            {saved.length} saved project{saved.length !== 1 ? 's' : ''}
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {saved.map(({ id: saveId, project, saved_at }) => (
              <div
                key={saveId}
                className="card"
                style={{ padding:'18px 20px' }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14 }}>

                  {/* Left: project info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <Link
                      to={`/student/projects/${project.id}`}
                      style={{ textDecoration:'none' }}
                    >
                      <h3 style={{ fontSize:'1rem', fontWeight:700, color:'var(--text-primary)', marginBottom:6, lineHeight:1.35 }}>
                        {project.title}
                      </h3>
                    </Link>

                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', marginBottom:8 }}>
                      <Badge variant={project.status} />
                      <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', textTransform:'capitalize' }}>
                        <Briefcase size={12} style={{ verticalAlign:'middle', marginRight:3 }} />
                        {project.project_type?.replace('_', ' ')}
                      </span>
                      {project.is_paid && (
                        <span style={{ fontSize:'0.78rem', color:'var(--accent-success)' }}>
                          💰 {project.stipend || 'Paid'}
                        </span>
                      )}
                      {project.deadline && (
                        <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>
                          <Calendar size={12} style={{ verticalAlign:'middle', marginRight:3 }} />
                          Due {new Date(project.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>
                      by {project.created_by?.first_name} {project.created_by?.last_name}
                      {project.tags_list?.length > 0 && (
                        <span style={{ marginLeft:10 }}>
                          · {project.tags_list.slice(0, 4).join(', ')}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:6 }}>
                      Saved {new Date(saved_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Right: action buttons */}
                  <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>

                    <Link
                      to={`/student/projects/${project.id}`}
                      className="btn btn-primary btn-sm"
                      style={{ display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}
                    >
                      View & Apply <ArrowRight size={13} />
                    </Link>

                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ display:'flex', alignItems:'center', gap:5 }}
                      onClick={() => handleMessage(project)}
                    >
                      <MessageSquare size={13} /> Message
                    </button>

                    <SaveButton
                      projectId={project.id}
                      isSaved={true}
                      size="sm"
                      onChange={(newState) => {
                        if (!newState) handleUnsave(project.id)
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
