// src/pages/auth/ForgotPasswordPage.jsx
//
// Route:  /forgot-password
// Flow:   User enters email → backend sends reset link → show confirmation.
//
// API:    POST /api/v1/users/password-reset/  { email }
//         Always returns 200 (anti-enumeration — never reveals if email exists).

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../../api/services'
import styles from './Auth.module.css'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [sent,    setSent]    = useState(false)   // true → show confirmation card

  // ── submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }
    if (!/\S+@\S+\.\S+/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await authAPI.requestPasswordReset(trimmed)
      setSent(true)                    // always show success
    } catch (err) {
      // Only show error for network failures or 5xx — never for 4xx
      // (backend always returns 200; this branch is rare)
      if (!err?.response || err.response.status >= 500) {
        setError('Server error. Please try again in a moment.')
      } else {
        setSent(true)                  // treat any 4xx as success too
      }
    } finally {
      setLoading(false)
    }
  }

  // ── confirmation card ────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className={styles.authPage}>
        <LeftPanel
          heading={<>Check your<br /><span>email.</span></>}
          sub="If an account is registered with that address, the reset link is on its way."
        />

        <div className={styles.formSide}>
          <div className={styles.formBox}>
            <div className={styles.noticeCard}>
              <div className={styles.noticeIcon} style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--accent-success)' }}>
                ✉️
              </div>
              <h2 className={styles.noticeTitle}>Reset link sent!</h2>
              <p className={styles.noticeText}>
                We sent an email to{' '}
                <strong style={{ color: 'var(--gold)' }}>{email.trim()}</strong>
                {' '}with a password reset link.
              </p>
              <p className={styles.noticeHint}>
                Didn't receive it? Check your spam folder. The link expires in 1 hour.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ marginTop: 8 }}>
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── request form ─────────────────────────────────────────────────────────
  return (
    <div className={styles.authPage}>
      <LeftPanel
        heading={<>Forgot your<br /><span>password?</span></>}
        sub="No worries. Enter your email and we'll send you a reset link instantly."
      />

      <div className={styles.formSide}>
        <div className={styles.formBox}>

          <Link to="/login" className={styles.backLink}>
            ← Back to Sign In
          </Link>

          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Reset password</h2>
            <p className={styles.formSubtitle}>
              Enter the email you registered with.
            </p>
          </div>

          {/* Inline error — persistent */}
          {error && (
            <div className={styles.inlineError} role="alert">
              <span className={styles.inlineErrorIcon}>⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="fp-email">
                Email Address
              </label>
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

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? <Spinner /> : 'Send Reset Link'}
            </button>
          </form>

          <p className={styles.switchText}>
            Remembered it?{' '}
            <Link to="/login">Sign in →</Link>
          </p>

        </div>
      </div>
    </div>
  )
}

// ── Shared sub-components ────────────────────────────────────────────────────

function LeftPanel({ heading, sub }) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelContent}>
        <div className={styles.panelBrand}>
          <div>
            <div className={styles.panelBrandName}>Student Sponsor Platform</div>
            <div className={styles.panelBrandSub}>Connecting talent with opportunity</div>
          </div>
        </div>
        <h1 className={styles.panelHeading}>{heading}</h1>
        <p className={styles.panelDesc}>{sub}</p>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <>
      <span style={{
        width: 16, height: 16, borderRadius: '50%',
        border: '2px solid rgba(17,27,51,0.3)',
        borderTopColor: '#111b33',
        display: 'inline-block',
        animation: 'fp-spin 0.7s linear infinite',
      }} />
      Sending…
      <style>{`@keyframes fp-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
