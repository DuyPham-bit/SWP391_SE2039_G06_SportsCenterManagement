/**
 * Centralized API Endpoint Constants for SCMS
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: 'auth/login',
    REGISTER: 'auth/register',
    LOGOUT: 'auth/logout',
    CURRENT_USER: 'auth/me',
    GOOGLE_LOGIN: 'auth/google-login',
    VERIFY_EMAIL: 'auth/verify-email',
    RESEND_VERIFICATION: 'auth/resend-verification',
    FORGOT_PASSWORD: 'auth/forgot-password',
    RESET_PASSWORD: 'auth/reset-password',
    CHANGE_PASSWORD: 'auth/change-password'
  },
  PROFILE: {
    ME: 'profile/me',
    UPDATE: 'profile/update',
    UPDATE_AVATAR: 'profile/avatar'
  },
  CATALOG: {
    CENTERS: 'publiccatalog/centers',
    SPORTS: 'publiccatalog/sports',
    ROOMS: 'publiccatalog/rooms',
    CLASSES: 'publiccatalog/classes',
    PRICING: 'publiccatalog/pricing'
  },
  BOOKINGS: {
    MINE: 'members/me/session-bookings',
    WAITLIST: 'members/me/session-waitlist',
    CANCEL_WAITLIST: id => `members/me/session-waitlist/${id}`,
    BOOK_FOR_MEMBER: (memberId, sessionId) => `members/${memberId}/class-sessions/${sessionId}/bookings`,
    CANCEL_FOR_MEMBER: (memberId, bookingId) => `members/${memberId}/session-bookings/${bookingId}`,
    MEMBER_BOOKINGS: memberId => `members/${memberId}/session-bookings`
  },
  COACH: {
    ME_SESSIONS: 'coaches/me/sessions',
    ROSTER: sessionId => `coaches/me/sessions/${sessionId}/members`,
    ATTENDANCE: sessionId => `coaches/me/sessions/${sessionId}/attendance`,
    PROGRESS: 'coaches/me/progress'
  },
  NOTIFICATIONS: {
    MINE: 'notifications/mine',
    MARK_READ: id => `notifications/${id}/read`,
    MARK_ALL_READ: 'notifications/read-all',
    SEND: centerId => `centers/${centerId}/notifications`
  },
  PAYMENTS: {
    CHECKOUT: 'payments/checkout',
    PACKAGES: 'payments/packages',
    INVOICES: 'invoices',
    REFUNDS: 'payments/refunds'
  },
  MEDIA: {
    LIST: 'media',
    UPLOAD: 'media/upload',
    DELETE: id => `media/${id}`
  },
  CLASSES: {
    LIST: 'classes',
    DETAIL: id => `classes/${id}`,
    SCHEDULES: id => `classes/${id}/schedules`,
    ENROLLMENTS: 'classes/enrollments'
  },
  MEMBERS: {
    LIST: 'members',
    LOOKUP: 'members/lookup',
    CHECK_IN: 'members/check-in',
    DETAIL: id => `members/${id}`
  }
};

export default API_ENDPOINTS;

