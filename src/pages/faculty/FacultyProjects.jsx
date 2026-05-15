// src/pages/faculty/FacultyProjects.jsx — reuses ManageProjects logic
// Faculty projects management page: lists all projects posted by the faculty, with options to edit or delete each project. Shows project title, type, applicant count, and status. Provides a link to create a new project. Reuses the ManageProjects component from the sponsor section since the functionality is similar.
//@author sshende
// src/pages/faculty/FacultyProjects.jsx
//@author sshende

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import ManageProjects from '../sponsor/ManageProjects'
import BrowsePage from './BrowseProjectsPage'

const TABS = [
  { key: 'mine',   label: 'My Projects' },
  { key: 'browse', label: 'Browse Projects' },
]

export default function FacultyProjects() {
  const location = useLocation()                                  
  const [tab, setTab] = useState(location.state?.tab ?? 'mine')

  return (
    <div className="page-enter">
      {/* Tab switcher */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 28,
        borderBottom: '1px solid var(--border-color)',
      }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '8px 20px',
              fontWeight: 600,
              fontSize: '0.9rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: tab === key
                ? '2px solid var(--accent-primary)'
                : '2px solid transparent',
              color: tab === key ? 'var(--accent-primary)' : 'var(--text-muted)',
              marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'mine'   && <ManageProjects />}
      {tab === 'browse' && <BrowsePage />}
    </div>
  )
}
