// src/pages/auth/ForgotPasswordPage.jsx
// Route:  /forgot-password
// FIX:    LeftPanel uses panelContent h1/p — matches existing Auth.module.css

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../../api/services'
import styles from './Auth.module.css'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed)                       { setError('Please enter your email address.'); return }
    if (!/\S+@\S+\.\S+/.test(trimmed)) { setError('Please enter a valid email address.'); return }

    setLoading(true)
    setError('')
    try {
      await authAPI.requestPasswordReset(trimmed)
      setSent(true)
    } catch (err) {
      if (!err?.response || err.response.status >= 500) {
        setError('Server error. Please try again in a moment.')
      } else {
        setSent(true)   // always show success for 4xx (anti-enumeration)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Confirmation card ─────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className={styles.authPage}>
        <LeftPanel
          heading="Check your email."
          sub="If an account is registered with that address, the reset link is on its way."
        />
        <div className={styles.formSide}>
          <div className={styles.formBox}>
            <div className={styles.noticeCard}>
              <div className={styles.noticeIcon} style={{ background:'rgba(34,197,94,0.12)', color:'var(--accent-success)' }}>✉️</div>
              <h2 className={styles.noticeTitle}>Reset link sent!</h2>
              <p className={styles.noticeText}>
                We sent an email to{' '}
                <strong style={{ color:'var(--accent-primary)' }}>{email.trim()}</strong>
                {' '}with a password reset link.
              </p>
              <p className={styles.noticeHint}>Didn't receive it? Check your spam folder. The link expires in 1 hour.</p>
              <Link to="/login" className="btn btn-primary" style={{ marginTop: 8 }}>Back to Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Request form ──────────────────────────────────────────────────────────
  return (
    <div className={styles.authPage}>
      <LeftPanel
        heading="Forgot your password?"
        sub="Enter your email and we'll send a reset link instantly."
      />
      <div className={styles.formSide}>
        <div className={styles.formBox}>

          <Link to="/login" className={styles.backLink}>← Back to Sign In</Link>

          <div className={styles.formHeader}>
            <h2>Reset Password</h2>
            <p>Enter the email you registered with.</p>
          </div>

          {error && (
            <div className={styles.inlineError} role="alert">
              <span className={styles.inlineErrorIcon}>⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="fp-email">Email Address</label>
              <input
                id="fp-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="you@university.edu"
                autoComplete="email"
                autoFocus
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                disabled={loading}
              />
            </div>

            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? <><Spinner />Sending…</> : 'Send Reset Link'}
            </button>
          </form>

          <p className={styles.switchLink}>
            Remembered it? <Link to="/login">Sign in →</Link>
          </p>

        </div>
      </div>
    </div>
  )
}

function LeftPanel({ heading, sub }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelContent}>
        <h1>{heading}</h1>
        <p>{sub}</p>
        <div className={styles.dots}><span /><span /><span /></div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <span style={{
      width: 15, height: 15, borderRadius: '50%',
      border: '2px solid rgba(17,27,51,0.3)', borderTopColor: '#111b33',
      display: 'inline-block', animation: 'fp2-spin 0.7s linear infinite', marginRight: 6,
    }}>
      <style>{`@keyframes fp2-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  )
}
