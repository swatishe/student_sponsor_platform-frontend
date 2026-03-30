// src/pages/auth/ResetPasswordPage.jsx
// Step 2 of password reset: user clicks the emailed link → sets new password.
// URL: /reset-password?token=<uuid>

import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authAPI } from '../../api/services'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import styles from './Auth.module.css'

export default function ResetPasswordPage() {
  const [searchParams]            = useSearchParams()
  const navigate                  = useNavigate()
  const token                     = searchParams.get('token')

  const [form, setForm]           = useState({ password: '', password2: '' })
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [status, setStatus]       = useState('form') // form | success | invalid

  // Validate token exists in URL
  useEffect(() => {
    if (!token) setStatus('invalid')
  }, [token])

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setError('')
  }

  const validate = () => {
    if (!form.password)             { setError('Please enter a new password.'); return false }
    if (form.password.length < 8)   { setError('Password must be at least 8 characters.'); return false }
    if (form.password !== form.password2) { setError('Passwords do not match.'); return false }
    return true
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError('')

    try {
      await authAPI.resetPassword({ token, password: form.password, password2: form.password2 })
      setStatus('success')
    } catch (err) {
      const data = err?.response?.data
      if (err?.response?.status === 400) {
        if (data?.token || data?.detail?.toLowerCase().includes('invalid') || data?.detail?.toLowerCase().includes('expired')) {
          setStatus('invalid')
        } else if (data?.password) {
          setError(Array.isArray(data.password) ? data.password[0] : data.password)
        } else {
          setError(data?.detail || 'Reset failed. Please request a new link.')
        }
      } else if (!err?.response) {
        setError('Unable to reach the server. Check your connection.')
      } else {
        setError('Reset failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Token missing or invalid ─────────────────────────────────────────────
  if (status === 'invalid') {
    return (
      <div className={styles.authPage} style={{ justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 440, padding: '0 24px' }}>
          <div className={styles.verifyNotice} style={{ background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.25)' }}>
            <div className={styles.verifyNoticeIcon} style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--accent-danger)' }}>
              <XCircle size={28} />
            </div>
            <h2 className={styles.verifyNoticeTitle} style={{ color: 'var(--accent-danger)' }}>Link expired or invalid</h2>
            <p className={styles.verifyNoticeText}>
              This password reset link has expired or already been used. Links are valid for 1 hour.
            </p>
            <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: 8 }}>
              Request a New Link
            </Link>
            <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className={styles.authPage} style={{ justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 440, padding: '0 24px' }}>
          <div className={styles.verifyNotice}>
            <div className={styles.verifyNoticeIcon}>
              <CheckCircle size={28} />
            </div>
            <h2 className={styles.verifyNoticeTitle}>Password reset!</h2>
            <p className={styles.verifyNoticeText}>
              Your password has been updated successfully. You can now sign in with your new password.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: 8 }}>
              Sign In Now →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Reset form ────────────────────────────────────────────────────────────
  return (
    <div className={styles.authPage}>
      <div className={styles.panel}>
        <div className={styles.panelContent}>
          <div className={styles.panelBrand}>
            <div className={styles.panelLogo}>S</div>
            <div>
              <div className={styles.panelBrandName}>Student Sponsor Platform</div>
              <div className={styles.panelBrandSub}>Connecting talent with opportunity</div>
            </div>
          </div>
          <h1 className={styles.panelHeading}>
            Create a new<br/><span>password.</span>
          </h1>
          <p className={styles.panelDesc}>
            Choose a strong password that you haven't used before.
          </p>
        </div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formBox}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Set new password</h2>
            <p className={styles.formSubtitle}>Must be at least 8 characters.</p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={16} className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="new-pass">New Password</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="new-pass"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  autoFocus
                  className={`form-input ${styles.inputWithIcon} ${styles.inputWithIconRight} ${error ? 'error' : ''}`}
                  disabled={loading}
                />
                <button type="button" className={styles.inputSuffixBtn}
                  onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-pass">Confirm New Password</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="confirm-pass"
                  type={showPass ? 'text' : 'password'}
                  name="password2"
                  value={form.password2}
                  onChange={onChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className={`form-input ${styles.inputWithIcon} ${error ? 'error' : ''}`}
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
              {loading
                ? <><span style={{ width:16, height:16, border:'2px solid rgba(26,39,68,0.4)', borderTopColor:'var(--navy-dark)', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/> Resetting…</>
                : 'Reset Password'
              }
            </button>
          </form>

          <p className={styles.switchText}>
            Remembered it? <Link to="/login">Sign in →</Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
