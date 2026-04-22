// src/components/layout/AppLayout.jsx
// Top navbar: logo left, icon+label nav center, Me avatar right.
// Mobile: hamburger toggles dropdown with nav + profile + logout.
// Page content rendered via <Outlet />. Uses React Router for navigation and context for auth state.
// @author sshende

import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Briefcase, FileText,
  MessageSquare, User, Users, LogOut,
  Menu, X, ChevronDown, FolderOpen, ClipboardList,  MessagesSquare, Bookmark,
} from 'lucide-react'
import { roleColor, initials } from '../../utils/helpers'
import styles from './AppLayout.module.css'

// Nav items per role — Profile is intentionally removed from here
const NAV = {
  student: [
    { to: '/student/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/projects',     icon: Briefcase,       label: 'Projects' },
    { to: '/student/applications', icon: FileText,        label: 'Applications' },
    { to: '/messages',             icon: MessageSquare,   label: 'Messages' },
    { to: '/forum',                icon: MessagesSquare,  label: 'Forum' },

  ],
  sponsor: [
    { to: '/sponsor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/sponsor/projects',  icon: Briefcase,       label: 'My Projects' },
    { to: '/messages',          icon: MessageSquare,   label: 'Messages' },
  ],
  faculty: [
    { to: '/faculty/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/faculty/projects',  icon: Briefcase,       label: 'My Projects' },
    { to: '/messages',          icon: MessageSquare,   label: 'Messages' },
    { to: '/forum',             icon: MessagesSquare,  label: 'Forum'  },

  ],
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users',     icon: Users,            label: 'Users' },
    { to: '/admin/projects',     icon: FolderOpen,      label: 'Projects' },
    { to: '/admin/activity-log', icon: ClipboardList,   label: 'Activity' },
    { to: '/forum',           icon: MessagesSquare,   label: 'Forum' },
    { to: '/messages',        icon: MessageSquare,    label: 'Messages' },

  ],
}

// Profile route per role — opens via Me dropdown
const PROFILE_ROUTE = {
  student: '/student/profile',
  sponsor: '/sponsor/profile',
  faculty: '/faculty/profile',
  admin:   null,
}

export default function AppLayout() {
  const { user, logout }            = useAuth()
  const navigate                    = useNavigate()
  const [meOpen, setMeOpen]         = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const meRef                       = useRef(null)

  const navItems    = NAV[user?.role] || []
  const rColor      = roleColor(user?.role)
  const profilePath = PROFILE_ROUTE[user?.role]
  const handleSavedNav = () => {
  setMeOpen(false)
  navigate('/student/saved')
  }

  // Close Me dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (meRef.current && !meRef.current.contains(e.target)) {
        setMeOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setMeOpen(false)
    await logout()
    navigate('/login')
  }

  const handleProfileNav = () => {
    setMeOpen(false)
    if (profilePath) navigate(profilePath)
  }

  return (
    <div className={styles.layout}>

      {/* ── Top Navbar ── */}
      <header className={styles.navbar}>

        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoIcon} style={{ background: rColor }}>S</span>
          <span className={styles.logoText}>SSP</span>
        </div>

        {/* Desktop nav: icon above label*/}
        <nav className={styles.navLinks} aria-label="Main navigation">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} className={styles.navIcon} strokeWidth={isActive ? 2.5 : 1.75} />
                  <span className={styles.navLabel}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right: Me dropdown + mobile toggle */}
        <div className={styles.navRight}>

          {/* Me button */}
          <div className={styles.meWrap} ref={meRef}>
            <button
              className={`${styles.meBtn} ${meOpen ? styles.meBtnOpen : ''}`}
              onClick={() => setMeOpen((p) => !p)}
              aria-expanded={meOpen}
            >
              <div className={styles.meAvatar} style={{ background: rColor }}>
                {initials(user?.first_name, user?.last_name)}
              </div>
              <span className={styles.meLabel}>Me</span>
              <ChevronDown
                size={13}
                className={`${styles.meChevron} ${meOpen ? styles.meChevronOpen : ''}`}
              />
            </button>

            {/* Me dropdown menu */}
            {meOpen && (
              <div className={styles.meDropdown}>
                <div className={styles.meDropdownHeader}>
                  <div className={styles.meDropdownAvatar} style={{ background: rColor }}>
                    {initials(user?.first_name, user?.last_name)}
                  </div>
                  <div className={styles.meDropdownInfo}>
                    <span className={styles.meDropdownName}>
                      {user?.first_name} {user?.last_name}
                    </span>
                    <span className={styles.meDropdownEmail}>{user?.email}</span>
                    <span className={`badge badge-${user?.role}`}>{user?.role}</span>
                  </div>
                </div>

                <div className={styles.meDropdownDivider} />

                {profilePath && (
                  <button className={styles.meDropdownItem} onClick={handleProfileNav}>
                    <User size={15} />
                    View Profile
                  </button>
                )}
                {user?.role === 'student' && (
                  <button
                    className={styles.meDropdownItem}
                    onClick={handleSavedNav}
                  >
                    <Bookmark size={15} />
                    Saved Projects
                  </button>
                )}

                <div className={styles.meDropdownDivider} />

                <button className={styles.meDropdownLogout} onClick={handleLogout}>
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className={styles.mobileToggle}
            onClick={() => setMobileOpen((p) => !p)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* ── Mobile dropdown nav ── */}
      {mobileOpen && (
        <div className={styles.mobileNav}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ''}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          {profilePath && (
            <NavLink
              to={profilePath}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ''}`
              }
            >
              <User size={18} />
              My Profile
            </NavLink>
          )}
          <div className={styles.mobileDivider} />
          <button className={styles.mobileLogout} onClick={handleLogout}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      )}

      {/* ── Page content ── */}
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
