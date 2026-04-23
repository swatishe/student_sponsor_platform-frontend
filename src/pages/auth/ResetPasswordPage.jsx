// src/pages/auth/ResetPasswordPage.jsx
// Route:  /reset-password?token=<uuid>
// FIX:    LeftPanel now uses only CSS classes that exist in Auth.module.css
//         (panelContent h1/p instead of panelHeading/panelDesc/panelBrand*)

import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authAPI } from '../../api/services'
import styles from './Auth.module.css'

// Forgot password page. User enters their email to receive a password reset link. Shows confirmation message after submission
export default function ResetPasswordPage() {
  const [searchParams]          = useSearchParams()
  const token                   = searchParams.get('token')
  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [status,    setStatus]    = useState('form')  // form | success | invalid

  useEffect(() => {
    if (!token) setStatus('invalid')
  }, [token])

  // Validate password input before submission. Checks for presence, length, and match between password and confirmation fields. Sets error messages accordingly.
  const validate = () => {
    if (!password)              { setError('Please enter a new password.'); return false }
    if (password.length < 8)    { setError('Password must be at least 8 characters.'); return false }
    if (password !== password2) { setError('Passwords do not match.'); return false }
    return true
  }

  //  Handle form submission: validate input, call API to reset password, and show success message or errors. Handles specific error cases for invalid/expired token and password validation errors from the API.
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
        const detail = data?.detail || ''
        if (detail.toLowerCase().includes('invalid') || detail.toLowerCase().includes('expired')) {
          setStatus('invalid')
          return
        }
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

  // ── Invalid / expired token ───────────────────────────────────────────────
  if (status === 'invalid') {
    return (
      <div className={styles.authPage}>
        <LeftPanel heading="Link expired." sub="Reset links are single-use and expire after 1 hour." />
        <div className={styles.formSide}>
          <div className={styles.formBox}>
            <div className={styles.noticeCard} style={{ background:'rgba(239,68,68,0.07)', borderColor:'rgba(239,68,68,0.25)' }}>
              <div className={styles.noticeIcon} style={{ background:'rgba(239,68,68,0.12)', color:'var(--accent-danger)' }}>✕</div>
              <h2 className={styles.noticeTitle} style={{ color:'var(--accent-danger)' }}>Link expired or invalid</h2>
              <p className={styles.noticeText}>This reset link has already been used or has expired. Links are valid for 1 hour.</p>
              <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: 8 }}>Request a New Link</Link>
              <Link to="/login" className={styles.secondaryLink} style={{ marginTop: 10 }}>Back to Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className={styles.authPage}>
        <LeftPanel heading="Password updated!" sub="Your account is secured with your new password." />
        <div className={styles.formSide}>
          <div className={styles.formBox}>
            <div className={styles.noticeCard}>
              <div className={styles.noticeIcon} style={{ background:'rgba(34,197,94,0.12)', color:'var(--accent-success)' }}>✓</div>
              <h2 className={styles.noticeTitle} style={{ color:'var(--accent-success)' }}>Password reset!</h2>
              <p className={styles.noticeText}>Your password was updated. You can now sign in.</p>
              <Link to="/login" className="btn btn-primary" style={{ marginTop: 8 }}>Sign In Now →</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Reset form ────────────────────────────────────────────────────────────
  return (
    <div className={styles.authPage}>
      <LeftPanel heading="Set a new password." sub="At least 8 characters with a number or uppercase letter." />
      <div className={styles.formSide}>
        <div className={styles.formBox}>

          <div className={styles.formHeader}>
            <h2>New Password</h2>
            <p>Enter and confirm your new password below.</p>
          </div>

          {error && (
            <div className={styles.inlineError} role="alert">
              <span className={styles.inlineErrorIcon}>⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="rp-pw1">New Password</label>
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
                <button type="button" className={styles.pwToggle}
                  onClick={() => setShowPw(p => !p)} tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="rp-pw2">Confirm Password</label>
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

            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? <><Spinner />Resetting…</> : 'Reset Password'}
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

// ── LeftPanel uses panelContent h1/p — matches the existing CSS ──────────────
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
      display: 'inline-block', animation: 'rp2-spin 0.7s linear infinite', marginRight: 6,
    }}>
      <style>{`@keyframes rp2-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  )
}
