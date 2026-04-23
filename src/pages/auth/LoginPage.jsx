// src/pages/auth/LoginPage.jsx
// Login page with email/password form, validation, and error handling. On successful login, redirects to dashboard. Provides link to registration page. Uses AuthContext for login function and state management.
//@author sshende

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import styles from './Auth.module.css'

// Login page component. Manages form state, handles submission with validation and error handling, and renders the login form with a decorative left panel.
export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [form, setForm]         = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')      // ← inline error, not toast

  //  Handle input changes by updating form state and clearing any existing error messages.
  const handleChange = (e) => {
    setError('')   // clear error when user types
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Handle form submission: validate input, call login function from context, and navigate on success. Show inline error messages for validation and API errors.
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      // Show error inline — toast disappears and doesn't prevent navigation
      const status = err?.response?.status
      if (status === 401 || status === 400) {
        setError('Invalid email or password. Please try again.')
      } else if (!err?.response) {
        setError('Cannot reach the server. Check your connection.')
      } else {
        setError(err.response?.data?.detail || 'Sign in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

// Main render of the login page, including left panel with branding and right panel with login form. Shows inline error messages and handles loading state.
  return (
    <div className={styles.authPage}>
      {/* Left decorative panel */}
      <div className={styles.panel}>
        <div className={styles.panelContent}>
          <h1>Student Sponsor<br />Platform</h1>
          <p>Connect students with industry sponsors and faculty. Build your future, one project at a time.</p>
          <div className={styles.dots}><span /><span /><span /></div>
        </div>
      </div>

      {/* Right form */}
      <div className={styles.formSide}>
        <div className={styles.formBox}>
          <div className={styles.formHeader}>
            <div className={styles.iconWrap}><LogIn size={24} /></div>
            <h2>Sign In</h2>
            <p>Enter your credentials to continue</p>
          </div>

          {/* Inline error banner — persistent, visible immediately */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              background: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: 8,
              color: '#fca5a5',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: 16,
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@university.edu"
                  required
                  className={`form-input ${styles.paddedInput} ${error ? 'error' : ''}`}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className={`form-input ${styles.paddedInput} ${styles.paddedRight} ${error ? 'error' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass((p) => !p)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 16 }}>
              <Link to="/forgot-password" style={{ fontSize: '0.90rem', color: 'var(--text-muted)' }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className={styles.switchLink}>
            Don't have an account?{' '}
            <Link to="/register">Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
