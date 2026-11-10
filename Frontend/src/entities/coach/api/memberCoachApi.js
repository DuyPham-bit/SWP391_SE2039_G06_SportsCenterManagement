import { apiRequest } from '../../../shared/api/http.js';

export const memberCoachApi = {
  getPortal: () => apiRequest('members/me/coach-portal'),
  respondEvent: (id, status, reason = null) => apiRequest(`members/me/coach-events/${id}/status`, { method: 'PATCH', body: { status, reason } }),
  submitHomework: (id, content) => apiRequest(`members/me/homework/${id}/submission`, { method: 'POST', body: { content } }),
  addFoodDiary: body => apiRequest('members/me/food-diary', { method: 'POST', body }),
  reviewCoach: body => apiRequest('members/me/coach-reviews', { method: 'POST', body }),
  getMessages: (coachId, memberId) => apiRequest(`members/me/coaches/${coachId}/messages?memberId=${memberId}`),
  sendMessage: body => apiRequest('members/me/coach-messages', { method: 'POST', body })
};
