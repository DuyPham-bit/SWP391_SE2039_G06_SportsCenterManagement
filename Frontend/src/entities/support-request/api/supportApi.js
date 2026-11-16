import { apiRequest } from '../../../shared/api/http.js';

export const supportApi = {
  getMine: ({ status = '', page = 1 } = {}) => {
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (status) params.set('status', status);
    return apiRequest(`support-requests/me?${params.toString()}`);
  },
  get: id => apiRequest(`support-requests/me/${Number(id)}`),
  submit: ({ subject, description, priority }) => apiRequest('support-requests/me', {
    method: 'POST', body: { subject: subject.trim(), description: description.trim(), priority: priority || 'Normal' }
  }),
  reply: (id, message) => apiRequest(`support-requests/me/${Number(id)}/messages`, {
    method: 'POST', body: { message: message.trim() }
  })
};
