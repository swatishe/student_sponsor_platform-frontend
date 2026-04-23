// src/context/AuthContext.jsx
// Global authentication state provider.
// Provides user info, login/logout functions, and role-based flags. On mount, checks localStorage for tokens and tries to restore session.
// Uses React Context to make auth state accessible throughout the app. Handles token storage and session restoration.
//@author sshende
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api/services'
import toast from 'react-hot-toast'

// Create a React Context for authentication state and functions.
const AuthContext = createContext(null)
//  AuthProvider component to wrap the app and provide auth state/functions to children
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on first mount
  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      fetchCurrentUser()
    } else {
      setLoading(false)
    }
  }, [])

  // Fetch current user info using stored access token. If it fails (e.g. token expired), clear tokens and user state.
  const fetchCurrentUser = async () => {
    try {
      const { data } = await authAPI.getMe()
      setUser(data)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setLoading(false)
    }
  }

  // Login function: calls API, stores tokens, and fetches user info to update state.
  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login(email, password)
    localStorage.setItem('access_token',  data.access)
    localStorage.setItem('refresh_token', data.refresh)
    await fetchCurrentUser()
  }, [])

  // Logout function: calls API to invalidate refresh token, clears tokens and user state.
  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token')
    try { if (refresh) await authAPI.logout(refresh) } catch { /* ignore */ }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    toast.success('Signed out.')
  }, [])

  // Value provided to context consumers, including user info, loading state, auth functions, and role flags.
  const value = {
    user, loading, login, logout, fetchCurrentUser,
    isStudent: user?.role === 'student',
    isSponsor: user?.role === 'sponsor',
    isFaculty: user?.role === 'faculty',
    isAdmin:   user?.role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to consume the AuthContext. Ensures it's used within an AuthProvider.
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
