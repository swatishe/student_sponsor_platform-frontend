// Service layer for all API calls, using the configured Axios instance with auth + error handling
// All API service calls organised by domain with verifyEmail + resendVerification to authAPI
//@author sshende
// Note: All API calls return the full Axios response. Callers can access response.data for the payload or handle errors with try/catch.
import api from './axios'

// ── Auth ────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data)             => api.post('/api/v1/users/register/', data),
  login:          (email, password)  => api.post('/api/v1/auth/login/', { email, password }),
  logout:         (refresh)          => api.post('/api/v1/auth/logout/', { refresh }),
  getMe:          ()                 => api.get('/api/v1/users/me/'),
  changePassword:       (data)            => api.post('/api/v1/users/change-password/', data),

  // Email verification
  verifyEmail:        (token) => api.get(`/api/v1/users/verify-email/?token=${token}`),
  resendVerification: (email) => api.post('/api/v1/users/resend-verification/', { email }),

  // Forgot / reset password
  requestPasswordReset: (email) => api.post('/api/v1/users/password-reset/', { email }),
  resetPassword:        (data)  => api.post('/api/v1/users/password-reset/confirm/', data),
}

// ── Profiles ────────────────────────────────────────────────────────────
export const profileAPI = {
  getStudentProfile:    ()     => api.get('/api/v1/users/profile/student/'),
  updateStudentProfile: (data) => api.patch('/api/v1/users/profile/student/', data),
  getSponsorProfile:    ()     => api.get('/api/v1/users/profile/sponsor/'),
  updateSponsorProfile: (data) => api.patch('/api/v1/users/profile/sponsor/', data),
  getFacultyProfile:    ()     => api.get('/api/v1/users/profile/faculty/'),
  updateFacultyProfile: (data) => api.patch('/api/v1/users/profile/faculty/', data),
  getStudentById:       (id)   => api.get(`/api/v1/users/students/${id}/`),
}

// ── Projects ─────────────────────────────────────────────────────────────
export const projectAPI = {
  getProjects:    (params = {}) => api.get('/api/v1/projects/', { params }),
  getProject:     (id)          => api.get(`/api/v1/projects/${id}/`),
  createProject:  (data)        => api.post('/api/v1/projects/', data),
  updateProject:  (id, data)    => api.patch(`/api/v1/projects/${id}/`, data),
  deleteProject:  (id)          => api.delete(`/api/v1/projects/${id}/`),
  getMyProjects:  ()            => api.get('/api/v1/projects/mine/'),
}


// ── Saved Projects ────────────────────────────────────────────────────────────
export const savedAPI = {
  /** GET /api/v1/projects/saved/ — all saved projects for current student */
  getSaved: () => api.get('/api/v1/projects/saved/'),

  /**
   * POST /api/v1/projects/<pk>/save/ — save a project
   * Idempotent: calling again returns 200 { saved: true }
   */
  save: (projectId) => api.post(`/api/v1/projects/${projectId}/save/`),

  /**
   * DELETE /api/v1/projects/<pk>/save/ — unsave a project
   * Idempotent: calling when not saved returns 200 { saved: false }
   */
  unsave: (projectId) => api.delete(`/api/v1/projects/${projectId}/save/`),

  /** GET /api/v1/projects/<pk>/save/ — check if a single project is saved */
  isSaved: (projectId) => api.get(`/api/v1/projects/${projectId}/save/`),
}

// ── Applications ─────────────────────────────────────────────────────────
export const applicationAPI = {
  apply:                  (data)      => api.post('/api/v1/applications/', data),
  getMyApplications:      ()          => api.get('/api/v1/applications/mine/'),
  getProjectApplications: (projectId) => api.get(`/api/v1/applications/project/${projectId}/`),
  updateStatus:           (id, data)  => api.patch(`/api/v1/applications/${id}/status/`, data),
  withdraw:               (id)        => api.delete(`/api/v1/applications/${id}/withdraw/`),
}

// ── Messaging ─────────────────────────────────────────────────────────────
export const messagingAPI = {
  getConversations:  ()                     => api.get('/api/v1/messages/conversations/'),
  startConversation: (recipientId, message) => api.post('/api/v1/messages/start/', { recipient_id: recipientId, message }),
  getMessages:       (convId)               => api.get(`/api/v1/messages/conversations/${convId}/messages/`),
  sendMessage:       (convId, content)      => api.post(`/api/v1/messages/conversations/${convId}/send/`, { content }),
}

// ── Admin ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  getUsers:   (role)     => api.get('/api/v1/users/admin/users/', { params: role ? { role } : {} }),
  updateUser: (id, data) => api.patch(`/api/v1/users/admin/users/${id}/`, data),
  deleteUser: (id)       => api.delete(`/api/v1/users/admin/users/${id}/`),
  getProjects:     (params = {}) => api.get('/api/v1/admin/projects/', { params }),
  deleteProject:   (id)          => api.delete(`/api/v1/admin/projects/${id}/`),
  getActivityLogs: (params = {}) => api.get('/api/v1/admin/activity-logs/', { params }),
}

// ── Forum ─────────────────────────────────────────────────────────────────────
export const forumAPI = {
  // Threads
  getThreads:    (params = {}) => api.get('/api/v1/forum/threads/', { params }),
  getThread:     (id)          => api.get(`/api/v1/forum/threads/${id}/`),
  createThread:  (data)        => api.post('/api/v1/forum/threads/', data),
  updateThread:  (id, data)    => api.patch(`/api/v1/forum/threads/${id}/`, data),
  deleteThread:  (id)          => api.delete(`/api/v1/forum/threads/${id}/`),

  // Posts
  getPosts:      (threadId)       => api.get(`/api/v1/forum/threads/${threadId}/posts/`),
  createPost:    (threadId, data) => api.post(`/api/v1/forum/threads/${threadId}/posts/`, data),
  updatePost:    (id, data)       => api.patch(`/api/v1/forum/posts/${id}/`, data),
  deletePost:    (id)             => api.delete(`/api/v1/forum/posts/${id}/`),
  flagPost:      (id)             => api.patch(`/api/v1/forum/posts/${id}/flag/`),

  // Replies
  getReplies:    (postId)       => api.get(`/api/v1/forum/posts/${postId}/replies/`),
  createReply:   (postId, data) => api.post(`/api/v1/forum/posts/${postId}/replies/`, data),
}

