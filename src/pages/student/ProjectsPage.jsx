// src/pages/student/ProjectsPage.jsx
// Student projects listing page: shows a searchable, filterable list of all available projects. Each project card displays the title, type, sponsor, location, tags, and application count. Students can click on a project to view more details and apply. The page fetches project data from the API with support for search and filters, and handles loading and empty states gracefully.
//@author sshende
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { projectAPI } from '../../api/services'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import Badge from '../../components/common/Badge'
import { timeAgo } from '../../utils/helpers'
import { Search, Briefcase, Calendar, DollarSign, Users } from 'lucide-react'
import styles from './Projects.module.css'

const TYPES = ['','internship','research','part_time','full_time','freelance','capstone']

// The projects page component fetches a list of projects from the API and displays them in a searchable and filterable format. It includes a toolbar with a search input, project type filter, and paid-only toggle. The projects are displayed as cards showing key information, and the page handles loading and empty states appropriately.
export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [type, setType]         = useState('')
  const [paidOnly, setPaid]     = useState(false)

  // Fetch projects from the API with optional search and filters. This function is called on component mount and whenever the search query, project type filter, or paid-only toggle changes. It constructs the API request parameters based on the current state of the search and filters, makes the API call to fetch projects, and updates the state with the response. A loading state is used to show a spinner while fetching.
  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search)  params.search       = search
      if (type)    params.project_type = type
      if (paidOnly) params.is_paid     = true
      const { data } = await projectAPI.getProjects(params)
      setProjects(data?.results ?? data ?? [])
    } finally { setLoading(false) }
  }, [search, type, paidOnly])

  // Debounce the fetchProjects function to avoid making API calls on every keystroke. This effect sets up a debounce timer that calls fetchProjects after a short delay whenever the search query or filters change. If the component unmounts or if the dependencies change before the timer fires, the timer is cleared to prevent unnecessary API calls.
  useEffect(() => {
    const t = setTimeout(fetchProjects, 400)
    return () => clearTimeout(t)
  }, [fetchProjects])

  // Main render of the projects page, including toolbar with search and filters, and list of project cards. Shows loading state while fetching and empty state if no projects are found.
  return (
    <div className="page-enter">
      <div className="page-header">
        <h1>Browse Projects</h1>
        <p>Discover internships, research opportunities, and more.</p>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon}/>
          <input type="text" placeholder="Search projects, skills, keywords…" value={search}
            onChange={e => setSearch(e.target.value)} className={`form-input ${styles.searchInput}`}/>
        </div>
        <div className={styles.filters}>
          <select value={type} onChange={e => setType(e.target.value)} className="form-input" style={{ width:160 }}>
            {TYPES.map(t => <option key={t} value={t}>{t ? t.replace('_',' ') : 'All Types'}</option>)}
          </select>
          <label className={styles.checkLabel}>
            <input type="checkbox" checked={paidOnly} onChange={e => setPaid(e.target.checked)} style={{ accentColor:'var(--accent-primary)' }}/>
            Paid only
          </label>
        </div>
      </div>

      <p style={{ marginBottom:20, color:'var(--text-muted)', fontSize:'0.83rem' }}>
        {loading ? 'Searching…' : `${projects.length} project${projects.length!==1?'s':''} found`}
      </p>

      {loading
        ? <Spinner text="Loading projects…"/>
        : projects.length === 0
          ? <EmptyState icon={Briefcase} title="No projects found" description="Try adjusting your filters or search terms."/>
          : <div className="grid-2">{projects.map(p => <ProjectCard key={p.id} project={p}/>)}</div>
      }
    </div>
  )
}

// Component for rendering individual project cards in the projects listing page. Each card displays the project title, type, sponsor, application count, deadline, and tags. The card is clickable and links to the project detail page. It also shows a badge for the project status and type, and highlights if the project is paid.
function ProjectCard({ project: p }) {
  return (
    <Link to={`/student/projects/${p.id}`} style={{ textDecoration:'none' }}>
      <div className={styles.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:6 }}>
          <h3 className={styles.cardTitle}>{p.title}</h3>
          <Badge variant={p.status}/>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
          <Badge variant="draft" label={p.project_type?.replace('_',' ')} style={{ fontSize:'0.7rem' }}/>
          {p.is_paid && <span style={{ fontSize:'0.7rem', color:'var(--accent-success)', display:'flex', alignItems:'center', gap:3 }}><DollarSign size={11}/>{p.stipend||'Paid'}</span>}
        </div>
        <div className={styles.cardMeta}>
          <span><Briefcase size={13}/> {p.created_by?.first_name} {p.created_by?.last_name}</span>
          <span><Users size={13}/> {p.application_count} applied</span>
          {p.deadline && <span><Calendar size={13}/> {new Date(p.deadline).toLocaleDateString()}</span>}
        </div>
        {p.tags_list?.length > 0 && (
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:12 }}>
            {p.tags_list.slice(0,4).map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
            {p.tags_list.length > 4 && <span className={styles.tag}>+{p.tags_list.length-4}</span>}
          </div>
        )}
        <div className={styles.cardFooter}>
          <span style={{ fontSize:'0.73rem', color:'var(--text-muted)' }}>{timeAgo(p.created_at)}</span>
          <span className={styles.viewLink}>View details →</span>
        </div>
      </div>
    </Link>
  )
}
