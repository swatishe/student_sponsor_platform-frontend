// src/pages/sponsor/ProjectForm.jsx — shared create/edit form for sponsors + faculty
// Form for creating or editing a project. If an ID is present in the URL params, it loads the existing project data for editing; otherwise, it initializes an empty form for creating a new project. The form includes fields for title, description, requirements, project type, status, tags, deadline, and payment details. On submission, it calls the appropriate API endpoint to create or update the project and shows success/error toasts based on the response. After saving, it navigates back to the projects list page.
//@author sshende
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { projectAPI } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/common/Spinner'
import { extractErrors } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Save, ArrowLeft } from 'lucide-react'

const INIT = { title:'', description:'', requirements:'', project_type:'internship', status:'open', is_paid:false, stipend:'', tags:'', max_applicants:0, deadline:'' }

export default function ProjectForm() {
  const { id }   = useParams()
  const isEdit   = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const basePath = user?.role==='faculty' ? '/faculty' : '/sponsor'
  const [form, setForm]     = useState(INIT)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (!isEdit) return
    projectAPI.getProject(id).then(({ data }) => {
      setForm({ title:data.title||'', description:data.description||'', requirements:data.requirements||'', project_type:data.project_type||'internship', status:data.status||'open', is_paid:data.is_paid||false, stipend:data.stipend||'', tags:data.tags||'', max_applicants:data.max_applicants||0, deadline:data.deadline||'' })
    }).finally(() => setLoading(false))
  }, [id, isEdit])
// Note: The onChange handler updates the form state whenever an input changes. It handles both text inputs and checkboxes by checking the input type and updating the state accordingly.
  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(p => ({ ...p, [name]: type==='checkbox' ? checked : value }))
  }
// Note: The form includes fields for title, description, requirements, project type, status, tags, deadline, and payment details. On submission, it calls the appropriate API endpoint to create or update the project and shows success/error toasts based on the response. After saving, it navigates back to the projects list page.
  const onSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (isEdit) { await projectAPI.updateProject(id, form); toast.success('Project updated!') }
      else        { await projectAPI.createProject(form);     toast.success('Project created!') }
      navigate(`${basePath}/projects`)
    } catch (err) { extractErrors(err).forEach(m => toast.error(m)) }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner text="Loading project…"/>

  return (
    <div className="page-enter" style={{ maxWidth:700 }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom:24 }}><ArrowLeft size={16}/>Back</button>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Project' : 'Create New Project'}</h1>
        <p>{isEdit ? 'Update your project details.' : 'Fill in the details to post your project.'}</p>
      </div>
      <form onSubmit={onSubmit}>
        <div className="card" style={{ marginBottom:20 }}>
          <h3 style={{ fontSize:'0.9rem', marginBottom:20, color:'var(--text-secondary)' }}>Basic Info</h3>
          <div className="form-group"><label className="form-label">Project Title *</label><input name="title" value={form.title} onChange={onChange} required className="form-input" placeholder="e.g. Machine Learning Research Intern"/></div>
          <div className="form-group"><label className="form-label">Description *</label><textarea name="description" value={form.description} onChange={onChange} required className="form-input" rows={5} placeholder="Describe the project, responsibilities, and learning outcomes…"/></div>
          <div className="form-group"><label className="form-label">Requirements</label><textarea name="requirements" value={form.requirements} onChange={onChange} className="form-input" rows={3} placeholder="Skills or experience required…"/></div>
        </div>
        <div className="card" style={{ marginBottom:20 }}>
          <h3 style={{ fontSize:'0.9rem', marginBottom:20, color:'var(--text-secondary)' }}>Details</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div className="form-group"><label className="form-label">Project Type</label>
              <select name="project_type" value={form.project_type} onChange={onChange} className="form-input">
                {['internship','research','part_time','full_time','freelance','capstone'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Status</label>
              <select name="status" value={form.status} onChange={onChange} className="form-input">
                {['draft','open','closed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Tags <span style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>(comma-separated)</span></label><input name="tags" value={form.tags} onChange={onChange} className="form-input" placeholder="Python, React, AI, Data Science"/></div>
            <div className="form-group"><label className="form-label">Deadline</label><input name="deadline" value={form.deadline} onChange={onChange} type="date" className="form-input"/></div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:4, flexWrap:'wrap' }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
              <input type="checkbox" name="is_paid" checked={form.is_paid} onChange={onChange} style={{ accentColor:'var(--accent-primary)', width:16, height:16 }}/>
              <span style={{ fontSize:'0.9rem', color:'var(--text-secondary)' }}>Paid opportunity</span>
            </label>
            {form.is_paid && <input name="stipend" value={form.stipend} onChange={onChange} className="form-input" placeholder="e.g. $2,000/month" style={{ maxWidth:200 }}/>}
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}><Save size={16}/>{saving ? 'Saving…' : isEdit ? 'Update Project' : 'Create Project'}</button>
      </form>
    </div>
  )
}
