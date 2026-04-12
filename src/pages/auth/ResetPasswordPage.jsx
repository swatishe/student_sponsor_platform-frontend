// src/pages/auth/ResetPasswordPage.jsx
//
// Route:  /reset-password?token=<uuid>
// Flow:   Validate token → form → POST confirm → success or error card.
//
// API:    POST /api/v1/users/password-reset/confirm/  { token, password, password2 }
// States: 'form' | 'success' | 'invalid'

import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authAPI } from '../../api/services'
import styles from './Auth.module.css'

export default function ResetPasswordPage() {
  const [searchParams]          = useSearchParams()
  const token                   = searchParams.get('token')

  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [status,    setStatus]    = useState('form')  // 'form' | 'success' | 'invalid'

  // No token in URL → immediately show invalid
  useEffect(() => {
    if (!token) setStatus('invalid')
  }, [token])

  // ── client-side validate ─────────────────────────────────────────────────
  const validate = () => {
    if (!password)             { setError('Please enter a new password.'); return false }
    if (password.length < 8)   { setError('Password must be at least 8 characters.'); return false }
    if (password !== password2) { setError('Passwords do not match.'); return false }
    return true
  }

  // ── submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError('')

    try {
      await authAPI.resetPassword({ token, password, password2 })
      setStatus('success')
    } catch (err) {
      const s    = err?.response?.status
      const data = err?.response?.data

      if (s === 400) {
        // Check if it's a token error vs a password error
        const detail = data?.detail || ''
        if (
          detail.toLowerCase().includes('invalid') ||
          detail.toLowerCase().includes('expired')
        ) {
          setStatus('invalid')
          return
        }
        // Password validation error from Django
        const pwErr = data?.password
        if (pwErr) {
          setError(Array.isArray(pwErr) ? pwErr[0] : pwErr)
        } else {
          setError(detail || 'Reset failed. Please try again.')
        }
      } else if (!err?.response) {
        setError('Cannot reach the server. Check your internet connection.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── invalid / expired token ──────────────────────────────────────────────
  if (status === 'invalid') {
    return (
      <div className={styles.authPage}>
        <LeftPanel
          heading={<>Link <span>expired.</span></>}
          sub="Reset links are single-use and expire after 1 hour."
        />
        <div className={styles.formSide}>
          <div className={styles.formBox}>
            <div className={styles.noticeCard} style={{
              background: 'rgba(239,68,68,0.07)',
              borderColor: 'rgba(239,68,68,0.25)',
            }}>
              <div className={styles.noticeIcon} style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--accent-danger)' }}>
                ✕
              </div>
              <h2 className={styles.noticeTitle} style={{ color: 'var(--accent-danger)' }}>
                Link expired or invalid
              </h2>
              <p className={styles.noticeText}>
                This reset link has already been used or has expired.
                Reset links are valid for 1 hour.
              </p>
              <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: 8 }}>
                Request a New Link
              </Link>
              <Link to="/login" className={styles.secondaryLink} style={{ marginTop: 10 }}>
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── success ──────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className={styles.authPage}>
        <LeftPanel
          heading={<>Password <span>updated!</span></>}
          sub="Your account is secured with your new password."
        />
        <div className={styles.formSide}>
          <div className={styles.formBox}>
            <div className={styles.noticeCard}>
              <div className={styles.noticeIcon} style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--accent-success)' }}>
                ✓
              </div>
              <h2 className={styles.noticeTitle} style={{ color: 'var(--accent-success)' }}>
                Password reset!
              </h2>
              <p className={styles.noticeText}>
                Your password was updated successfully. You can now sign in with your new password.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ marginTop: 8 }}>
                Sign In Now →
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── reset form ────────────────────────────────────────────────────────────
  return (
    <div className={styles.authPage}>
      <LeftPanel
        heading={<>Set a new<br /><span>password.</span></>}
        sub="Choose something strong. At least 8 characters with a number or uppercase letter."
      />

      <div className={styles.formSide}>
        <div className={styles.formBox}>

          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>New password</h2>
            <p className={styles.formSubtitle}>Enter and confirm your new password below.</p>
          </div>

          {/* Inline error — persistent until user types */}
          {error && (
            <div className={styles.inlineError} role="alert">
              <span className={styles.inlineErrorIcon}>⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="rp-pw1">
                New Password
              </label>
              <div className={styles.inputWrap}>
                <input
                  id="rp-pw1"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  autoFocus
                  className={`${styles.input} ${styles.inputHasToggle} ${error ? styles.inputError : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  className={styles.pwToggle}
                  onClick={() => setShowPw(p => !p)}
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="rp-pw2">
                Confirm Password
              </label>
              <input
                id="rp-pw2"
                type={showPw ? 'text' : 'password'}
                value={password2}
                onChange={(e) => { setPassword2(e.target.value); setError('') }}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? <Spinner /> : 'Reset Password'}
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

// ── Shared sub-components ─────────────────────────────────────────────────────

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
        animation: 'rp-spin 0.7s linear infinite',
      }} />
      Resetting…
      <style>{`@keyframes rp-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
