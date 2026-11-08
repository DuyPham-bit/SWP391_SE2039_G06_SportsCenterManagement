import { apiRequest } from '../../../shared/api/http.js';

export const adminApi = {
  getOverview: () => apiRequest('admin/overview'),
  getCenters: () => apiRequest('admin/centers'),
  createCenter: body => apiRequest('admin/centers', { method: 'POST', body }),
  updateCenter: (id, body) => apiRequest(`admin/centers/${Number(id)}`, { method: 'PATCH', body }),
  getManagers: () => apiRequest('admin/managers'),
  createManager: body => apiRequest('admin/managers', { method: 'POST', body }),
  updateManager: (id, body) => apiRequest(`admin/managers/${Number(id)}`, { method: 'PATCH', body }),
  getAccounts: ({ role = '', status = '', query = '', page = 1, pageSize = 50 } = {}) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    if (query.trim()) params.set('query', query.trim());
    return apiRequest(`admin/accounts?${params}`);
  },
  lockAccount: (id, reason) => apiRequest(`admin/accounts/${Number(id)}/lock`, { method: 'POST', body: { reason } }),
  unlockAccount: (id, reason) => apiRequest(`admin/accounts/${Number(id)}/unlock`, { method: 'POST', body: { reason } }),
  revokeSessions: (id, reason) => apiRequest(`admin/accounts/${Number(id)}/revoke-sessions`, { method: 'POST', body: { reason } }),
  deleteAccount: (id, reason) => apiRequest(`admin/accounts/${Number(id)}`, { method: 'DELETE', body: { reason } })
};
