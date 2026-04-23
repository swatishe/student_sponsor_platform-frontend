// src/pages/auth/VerifyEmailPage.jsx
// Route: /verify-email?token=<uuid>
//
// FIX: Now uses HTTP status codes to decide what to show:
//   200 → success
//   404 → token not found (already used / never existed)
//   410 → token expired
//   Previously used message text ("expired" substring) which was unreliable.
//
// Also shows a resend-link form when token is not found or expired.
// @author sshende

import { useState, useEffect, useRef} from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authAPI } from '../../api/services'
import styles from './Auth.module.css'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token          = searchParams.get('token')

  const [status,   setStatus]   = useState('loading') // loading|success|invalid|expired
  const [email,    setEmail]    = useState('')
  const [resending, setResend]  = useState('idle')    // idle|sending|sent|error

  const calledRef = useRef(false)   

  // On mount, verify the email using the token from the URL. Sets status based on API response to determine what message to show. Uses a ref to ensure the effect only runs once, preventing multiple API calls if the component re-renders for any reason.
  useEffect(() => {
    if (calledRef.current) return  
    calledRef.current = true       

    if (!token) {
      setStatus('invalid')
      return
    }

    // Call the API to verify the email. The API response status code determines the outcome:
    authAPI.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        const httpStatus = err?.response?.status
        if (httpStatus === 410) {
          setStatus('expired')       // token found but > 24 hrs old
        } else if (httpStatus === 404) {
          setStatus('invalid')       // token not in DB (used / never existed)
        } else if (!err?.response) {
          setStatus('noserver')      // network error
        } else {
          setStatus('invalid')       // any other error treated as invalid
        }
      })
  }, [token])

  // Handle resending verification email. Updates resend state to show sending status and result.
  const handleResend = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setResend('sending')
    try {
      await authAPI.resendVerification(email.trim().toLowerCase())
      setResend('sent')
    } catch {
      setResend('error')
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <CenteredCard>
        <div style={{ fontSize: '2rem' }}>⏳</div>
        <h2 className={styles.noticeTitle}>Verifying your email…</h2>
        <p className={styles.noticeText}>Please wait a moment.</p>
      </CenteredCard>
    )
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <CenteredCard style={{ background:'rgba(34,197,94,0.07)', borderColor:'rgba(34,197,94,0.25)' }}>
        <div className={styles.noticeIcon}
          style={{ background:'rgba(34,197,94,0.15)', color:'var(--accent-success)', fontSize:'1.5rem' }}>
          ✓
        </div>
        <h2 className={styles.noticeTitle} style={{ color:'var(--accent-success)' }}>
          Email verified!
        </h2>
        <p className={styles.noticeText}>Your account is now active. You can sign in.</p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 6 }}>
          Sign In Now →
        </Link>
      </CenteredCard>
    )
  }

  // ── No server ─────────────────────────────────────────────────────────────
  if (status === 'noserver') {
    return (
      <CenteredCard style={{ background:'rgba(245,158,11,0.07)', borderColor:'rgba(245,158,11,0.25)' }}>
        <div style={{ fontSize:'1.8rem' }}>🔌</div>
        <h2 className={styles.noticeTitle}>Cannot reach server</h2>
        <p className={styles.noticeText}>Check your internet connection and try clicking the link again.</p>
        <Link to="/login" className="btn btn-secondary btn-sm" style={{ marginTop: 6 }}>
          Back to Sign In
        </Link>
      </CenteredCard>
    )
  }

  // ── Expired (410) — token was valid but > 24 hrs ──────────────────────────
  if (status === 'expired') {
    return (
      <CenteredCard style={{ background:'rgba(239,68,68,0.07)', borderColor:'rgba(239,68,68,0.25)' }}>
        <div className={styles.noticeIcon}
          style={{ background:'rgba(239,68,68,0.15)', color:'var(--accent-danger)', fontSize:'1.3rem' }}>
          ⏰
        </div>
        <h2 className={styles.noticeTitle} style={{ color:'var(--accent-danger)' }}>
          Link expired
        </h2>
        <p className={styles.noticeText}>
          This verification link expired after 24 hours. Enter your email below to get a new one.
        </p>
        <ResendForm
          email={email} setEmail={setEmail}
          onSubmit={handleResend} state={resending}
        />
        <Link to="/login" style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginTop: 8 }}>
          Back to Sign In
        </Link>
      </CenteredCard>
    )
  }

  // ── Invalid (404) — token not found ──────────────────────────────────────
  return (
    <CenteredCard style={{ background:'rgba(239,68,68,0.07)', borderColor:'rgba(239,68,68,0.25)' }}>
      <div className={styles.noticeIcon}
        style={{ background:'rgba(239,68,68,0.15)', color:'var(--accent-danger)', fontSize:'1.3rem' }}>
        ✕
      </div>
      <h2 className={styles.noticeTitle} style={{ color:'var(--accent-danger)' }}>
        Link not found
      </h2>
      <p className={styles.noticeText}>
        This link is invalid or has already been used. Enter your email to get a new verification link.
      </p>
      <ResendForm
        email={email} setEmail={setEmail}
        onSubmit={handleResend} state={resending}
      />
      <div style={{ display:'flex', gap:10, marginTop:8, flexWrap:'wrap', justifyContent:'center' }}>
        <Link to="/register" className="btn btn-secondary btn-sm">Register Again</Link>
        <Link to="/login"    className="btn btn-primary  btn-sm">Back to Sign In</Link>
      </div>
    </CenteredCard>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CenteredCard({ children, style = {} }) {
  return (
    <div className={styles.authPage} style={{ justifyContent:'center', alignItems:'center' }}>
      <div style={{ width:'100%', maxWidth:460, padding:'0 24px' }}>
        <div className={styles.noticeCard} style={style}>
          {children}
        </div>
      </div>
    </div>
  )
}

function ResendForm({ email, setEmail, onSubmit, state }) {
  if (state === 'sent') {
    return (
      <p style={{ fontSize:'0.875rem', color:'var(--accent-success)', textAlign:'center' }}>
        ✓ New link sent — check your inbox (and spam folder).
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit}
      style={{ width:'100%', display:'flex', flexDirection:'column', gap:8, marginTop:4 }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className={styles.input}
        style={{ textAlign:'center' }}
        disabled={state === 'sending'}
      />
      <button
        type="submit"
        className="btn btn-primary btn-sm"
        disabled={state === 'sending' || !email.trim()}
      >
        {state === 'sending' ? 'Sending…' : 'Send New Link'}
      </button>
      {state === 'error' && (
        <p style={{ fontSize:'0.8rem', color:'var(--accent-danger)', textAlign:'center', margin:0 }}>
          Failed to send. Please try again.
        </p>
      )}
    </form>
  )
}
