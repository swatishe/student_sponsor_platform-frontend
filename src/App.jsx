// src/App.jsx
// Root component — AuthProvider + all route definitions.
// Uses React Router for client-side routing and wraps everything in the AuthProvider to provide authentication state throughout the app. Defines a PrivateRoute component to protect routes that require authentication and role-based access. The AppRoutes component contains all the route definitions for public and protected pages, including dashboards, project listings, profile pages, and messaging. The HomeRedirect component redirects authenticated users to their respective dashboards based on their role.
//@author sshende
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Spinner from './components/common/Spinner'

// Layout
import AppLayout from './components/layout/AppLayout'

// Auth
import LoginPage    from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage  from './pages/auth/ResetPasswordPage'


// Student
import StudentDashboard  from './pages/student/StudentDashboard'
import ProjectsPage      from './pages/student/ProjectsPage'
import ProjectDetailPage from './pages/student/ProjectDetailPage'
import MyApplications    from './pages/student/MyApplications'
import StudentProfile    from './pages/student/StudentProfile'

// Sponsor
import SponsorDashboard   from './pages/sponsor/SponsorDashboard'
import ManageProjects     from './pages/sponsor/ManageProjects'
import ProjectForm        from './pages/sponsor/ProjectForm'
import ApplicationsReview from './pages/sponsor/ApplicationsReview'
import SponsorProfile from './pages/sponsor/SponsorProfile'


// Faculty
import FacultyDashboard from './pages/faculty/FacultyDashboard'
import FacultyProjects  from './pages/faculty/FacultyProjects'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers     from './pages/admin/AdminUsers'
import AdminProjects    from './pages/admin/AdminProjects'
import AdminActivityLog from './pages/admin/AdminActivityLog'

// Messaging
import MessagingPage from './pages/messaging/MessagingPage'

// ── Guards ──────────────────────────────────────────────────────────────
function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner size="lg" text="Loading…" />
  if (!user)   return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner size="lg" text="Loading…" />
  if (!user)   return <Navigate to="/login" replace />
  const map = { student:'/student/dashboard', sponsor:'/sponsor/dashboard', faculty:'/faculty/dashboard', admin:'/admin/dashboard' }
  return <Navigate to={map[user.role] || '/login'} replace />
}

// ── Routes ───────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      <Route path="/"         element={<HomeRedirect />} />

      {/* Authenticated shell */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>

        {/* Student */}
        <Route path="/student/dashboard"      element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} />
        <Route path="/student/projects"       element={<PrivateRoute roles={['student']}><ProjectsPage /></PrivateRoute>} />
        <Route path="/student/projects/:id"   element={<PrivateRoute roles={['student']}><ProjectDetailPage /></PrivateRoute>} />
        <Route path="/student/applications"   element={<PrivateRoute roles={['student']}><MyApplications /></PrivateRoute>} />
        <Route path="/student/profile"        element={<PrivateRoute roles={['student']}><StudentProfile /></PrivateRoute>} />

        {/* Sponsor */}
        <Route path="/sponsor/dashboard"                   element={<PrivateRoute roles={['sponsor']}><SponsorDashboard /></PrivateRoute>} />
        <Route path="/sponsor/projects"                    element={<PrivateRoute roles={['sponsor']}><ManageProjects /></PrivateRoute>} />
        <Route path="/sponsor/projects/new"                element={<PrivateRoute roles={['sponsor']}><ProjectForm /></PrivateRoute>} />
        <Route path="/sponsor/projects/:id/edit"           element={<PrivateRoute roles={['sponsor']}><ProjectForm /></PrivateRoute>} />
        <Route path="/sponsor/projects/:id/applicants"     element={<PrivateRoute roles={['sponsor']}><ApplicationsReview /></PrivateRoute>} />
        <Route path="/sponsor/profile"                     element={<PrivateRoute roles={['sponsor']}><SponsorProfile /></PrivateRoute>}/>

        {/* Faculty */}
        <Route path="/faculty/dashboard"               element={<PrivateRoute roles={['faculty']}><FacultyDashboard /></PrivateRoute>} />
        <Route path="/faculty/projects"                element={<PrivateRoute roles={['faculty']}><FacultyProjects /></PrivateRoute>} />
        <Route path="/faculty/projects/new"            element={<PrivateRoute roles={['faculty']}><ProjectForm /></PrivateRoute>} />
        <Route path="/faculty/projects/:id/edit"       element={<PrivateRoute roles={['faculty']}><ProjectForm /></PrivateRoute>} />
        <Route path="/faculty/projects/:id/applicants" element={<PrivateRoute roles={['faculty']}><ApplicationsReview /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users"     element={<PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>} />
        <Route path="/admin/projects"     element={<AdminProjects />} />
        <Route path="activity-log" element={<AdminActivityLog />} />
        



        {/* Messaging — all roles */}
        <Route path="/messages"          element={<MessagingPage />} />
        <Route path="/messages/:convId"  element={<MessagingPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
