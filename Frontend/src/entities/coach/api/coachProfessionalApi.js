import { apiRequest } from '../../../shared/api/http.js';

export const coachProfessionalApi = {
  getWorkspace: ({ from, to } = {}) => {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    return apiRequest(`coaches/me/professional${query.size ? `?${query}` : ''}`);
  },
  getKpi: (year, month) => apiRequest(`coaches/me/kpi?year=${year}&month=${month}`),
  getLeaveReplacementOptions: (startAt, endAt, { signal } = {}) => {
    const query = new URLSearchParams({ startAt, endAt });
    return apiRequest(`coaches/me/leave-replacement-options?${query}`, { signal });
  },
  createEvent: body => apiRequest('coaches/me/work-events', { method: 'POST', body }),
  changeEvent: (id, status, reason = null) => apiRequest(`coaches/me/work-events/${id}/status`, { method: 'PATCH', body: { status, reason } }),
  requestLeave: body => apiRequest('coaches/me/leave-requests', { method: 'POST', body }),
  saveHealthRecord: body => apiRequest('coaches/me/member-health-records', { method: 'POST', body }),
  saveExercise: body => apiRequest('coaches/me/exercises', { method: 'POST', body }),
  saveHomework: body => apiRequest('coaches/me/homework', { method: 'POST', body }),
  reviewHomework: (id, body) => apiRequest(`coaches/me/homework-submissions/${id}`, { method: 'PATCH', body }),
  saveNutrition: body => apiRequest('coaches/me/nutrition-plans', { method: 'POST', body }),
  getMessages: (coachId, memberId) => apiRequest(`coaches/me/members/${memberId}/messages?coachId=${coachId}`),
  sendMessage: body => apiRequest('coaches/me/messages', { method: 'POST', body }),
  broadcast: body => apiRequest('coaches/me/broadcasts', { method: 'POST', body }),
  bookResource: body => apiRequest('coaches/me/resource-bookings', { method: 'POST', body }),
  cancelResource: id => apiRequest(`coaches/me/resource-bookings/${id}`, { method: 'DELETE' }),
  reportIssue: body => apiRequest('coaches/me/equipment-issues', { method: 'POST', body })
};
