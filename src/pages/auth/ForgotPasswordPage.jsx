// src/pages/auth/ForgotPasswordPage.jsx
// Step 1 of password reset: user enters email, receives reset link.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '../../api/services'
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import styles from './Auth.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [sent, setSent]         = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email address.'); return }

    setLoading(true)
    setError('')

    try {
      await authAPI.requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      // Always show success even if email not found — prevents email enumeration
      // Only show error on server/network failure
      if (!err?.response || err.response.status >= 500) {
        setError('Server error. Please try again in a moment.')
      } else {
        setSent(true)  // 400 still shows success (user may not exist — security)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.panel}>
        <div className={styles.panelContent}>
          <div className={styles.panelBrand}>
            {/* <div className={styles.panelLogo}>S</div> */}
            <div>
              <div className={styles.panelBrandName}>Student Sponsor Platform</div>
              {/* <div className={styles.panelBrandSub}>Connecting talent with opportunity</div> */}
            </div>
          </div>
          <h1 className={styles.panelHeading}>
            Reset your<br/><span>password.</span>
          </h1>
          <p className={styles.panelDesc}>
            Enter your registered email address and we'll send you a secure link to reset your password.
          </p>
        </div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formBox}>

          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 28, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <ArrowLeft size={15} /> Back to Sign In
          </Link>

          {sent ? (
            <div className={styles.verifyNotice}>
              <div className={styles.verifyNoticeIcon}>
                <CheckCircle size={28} />
              </div>
              <h2 className={styles.verifyNoticeTitle}>Reset link sent!</h2>
              <p className={styles.verifyNoticeText}>
                If an account exists for <strong style={{ color: 'var(--gold)' }}>{email}</strong>, you'll receive a password reset link within a few minutes.
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Check your spam folder if it doesn't arrive.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ marginTop: 8 }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Forgot password?</h2>
                <p className={styles.formSubtitle}>Enter your email and we'll send a reset link.</p>
              </div>

              {error && (
                <div className="alert alert-error" role="alert">
                  <AlertCircle size={16} className="alert-icon" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={onSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="reset-email">Email Address</label>
                  <div className={styles.inputWrap}>
                    <Mail size={16} className={styles.inputIcon} />
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                      placeholder="      you@university.edu"
                      autoComplete="email"
                      autoFocus
                      className={`form-input ${styles.inputWithIcon} ${error ? 'error' : ''}`}
                      disabled={loading}
                    />
                  </div>
                </div>

                <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
                  {loading
                    ? <><span style={{ width:16, height:16, border:'2px solid rgba(26,39,68,0.4)', borderTopColor:'var(--navy-dark)', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/> Sending…</>
                    : 'Send Reset Link'
                  }
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
