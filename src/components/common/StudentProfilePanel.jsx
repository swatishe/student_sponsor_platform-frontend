// src/components/common/StudentProfilePanel.jsx
// Reusable expandable student profile panel used in sponsor and faculty application review pages.
// @author sshende

import { BookOpen, Github, Linkedin, ExternalLink, Eye } from 'lucide-react'

export function StudentProfilePanel({ profile }) {
  const skillsList = profile.skills
    ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <div>
      <div style={{ fontSize:'0.78rem', color:'var(--accent-primary)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>
        Student Profile
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:14 }}>
        {profile.university && <InfoItem icon={<BookOpen size={13}/>} label="University" value={profile.university}/>}
        {profile.major      && <InfoItem icon={<BookOpen size={13}/>} label="Major"      value={profile.major}/>}
        {profile.gpa        && <InfoItem icon={null}                  label="GPA"        value={profile.gpa}/>}
      </div>

      {profile.bio && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5, fontWeight:600 }}>Bio</div>
          <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)', lineHeight:1.6, margin:0 }}>{profile.bio}</p>
        </div>
      )}

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

      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:8 }}>
        {profile.portfolio_url && (
          <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding:'4px 10px', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:5 }}>
            <ExternalLink size={12}/> Portfolio
          </a>
        )}
        {profile.linkedin_url && (
          <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding:'4px 10px', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:5 }}>
            <Linkedin size={12}/> LinkedIn
          </a>
        )}
        {profile.github_url && (
          <a href={profile.github_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding:'4px 10px', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:5 }}>
            <Github size={12}/> GitHub
          </a>
        )}
        {profile.resume && (
          <a href={profile.resume} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding:'4px 10px', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:5 }}>
            <Eye size={12}/> Resume
          </a>
        )}
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }) {
  return (
    <div>
      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:'0.875rem', color:'var(--text-primary)', display:'flex', alignItems:'center', gap:5 }}>
        {icon && <span style={{ color:'var(--text-muted)'}}>{icon}</span>}
        {value}
      </div>
    </div>
  )
}