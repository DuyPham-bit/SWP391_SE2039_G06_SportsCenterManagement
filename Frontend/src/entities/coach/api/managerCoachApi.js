import { apiRequest } from '../../../shared/api/index.js';

export const managerCoachApi = {
  getWorkspace: () => apiRequest('manager/coach-operations'),
  reviewLeave: (id, body) => apiRequest(`manager/coach-operations/leaves/${id}`, { method: 'PATCH', body }),
  createResource: body => apiRequest('manager/coach-operations/resources', { method: 'POST', body }),
  resolveIssue: (id, body) => apiRequest(`manager/coach-operations/equipment-issues/${id}`, { method: 'PATCH', body })
};
