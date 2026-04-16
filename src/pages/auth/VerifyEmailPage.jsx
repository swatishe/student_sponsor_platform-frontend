// Handles the email verification link
// On mount, extracts the token from the URL and calls the API to verify it. Shows loading state while waiting, then success or error message based on the response. Provides a link to login or register after verification.
//@author sshende

import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authAPI } from '../../api/services'
import styles from './Auth.module.css'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token          = searchParams.get('token')
  const [status, setStatus]   = useState('loading')  // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found in this URL. Please check the link in your email.')
      return
    }

    authAPI.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        const detail = err?.response?.data?.detail || ''
        if (detail.toLowerCase().includes('expired')) {
          setMessage('This link has expired. Links are valid for 24 hours.')
        } else if (err?.response?.status === 400) {
          setMessage('This link is invalid or has already been used.')
        } else if (!err?.response) {
          setMessage('Cannot reach the server. Check your connection and try again.')
        } else {
          setMessage('Verification failed. Please request a new link.')
        }
      })
  }, [token])

  return (
    <div className={styles.authPage} style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 440, padding: '0 24px' }}>

        {/* Loading */}
        {status === 'loading' && (
          <div className={styles.verifyNotice}>
            <div className={styles.verifyNoticeIcon} style={{ fontSize: '2rem' }}>⏳</div>
            <h2 className={styles.verifyNoticeTitle}>Verifying your email…</h2>
            <p className={styles.verifyNoticeText}>Please wait a moment.</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className={styles.verifyNotice}
            style={{ background: 'rgba(34,197,94,0.07)', borderColor: 'rgba(34,197,94,0.25)' }}>
            <div className={styles.verifyNoticeIcon}
              style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--accent-success)', fontSize: '1.6rem' }}>
              ✓
            </div>
            <h2 className={styles.verifyNoticeTitle} style={{ color: 'var(--accent-success)' }}>
              Email verified!
            </h2>
            <p className={styles.verifyNoticeText}>
              Your account is now active. You can sign in.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: 6 }}>
              Sign In Now →
            </Link>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className={styles.verifyNotice}
            style={{ background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.25)' }}>
            <div className={styles.verifyNoticeIcon}
              style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-danger)', fontSize: '1.4rem' }}>
              ✕
            </div>
            <h2 className={styles.verifyNoticeTitle} style={{ color: 'var(--accent-danger)' }}>
              Verification failed
            </h2>
            <p className={styles.verifyNoticeText}>{message}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
              <Link to="/register" className="btn btn-secondary btn-sm">Register Again</Link>
              <Link to="/login"    className="btn btn-primary  btn-sm">Back to Sign In</Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
