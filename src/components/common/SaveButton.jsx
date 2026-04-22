// src/components/common/SaveButton.jsx
// Reusable bookmark toggle button.
// Props:
//   projectId  — project ID to save/unsave
//   isSaved    — current saved state (boolean)
//   onChange   — callback(newSavedState) after toggle
//   size       — 'sm' | 'md' (default 'md')
// @author sshende

import { useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { savedAPI } from '../../api/services'
import toast from 'react-hot-toast'

export default function SaveButton({ projectId, isSaved: initialSaved, onChange, size = 'md' }) {
  const [saved,   setSaved]   = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  const iconSize  = size === 'sm' ? 14 : 16
  const padStyle  = size === 'sm'
    ? { padding: '4px 8px',  fontSize: '0.78rem' }
    : { padding: '8px 14px', fontSize: '0.875rem' }

  const toggle = async (e) => {
    e.preventDefault()   // prevent any parent <Link> navigation
    e.stopPropagation()
    if (loading) return

    setLoading(true)
    try {
      if (saved) {
        await savedAPI.unsave(projectId)
        setSaved(false)
        toast.success('Removed from saved projects.')
        onChange?.(false)
      } else {
        await savedAPI.save(projectId)
        setSaved(true)
        toast.success('Project saved!')
        onChange?.(true)
      }
    } catch {
      toast.error('Could not update saved projects.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? 'Remove from saved' : 'Save project'}
      className={saved ? 'btn btn-secondary' : 'btn btn-ghost'}
      style={{
        ...padStyle,
        display:     'inline-flex',
        alignItems:  'center',
        gap:         5,
        color:       saved ? 'var(--accent-primary)' : 'var(--text-muted)',
        borderColor: saved ? 'var(--accent-primary)' : undefined,
        transition:  'all 0.15s',
        opacity:     loading ? 0.6 : 1,
      }}
    >
      {saved
        ? <BookmarkCheck size={iconSize} />
        : <Bookmark      size={iconSize} />
      }
      {size !== 'sm' && (saved ? 'Saved' : 'Save')}
    </button>
  )
}
