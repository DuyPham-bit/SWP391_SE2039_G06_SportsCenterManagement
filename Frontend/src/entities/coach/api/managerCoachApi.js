import { apiRequest } from '../../../shared/api/http.js';

export const managerCoachApi = {
  getWorkspace: () => apiRequest('manager/coach-operations'),
  reviewLeave: (id, body) => apiRequest(`manager/coach-operations/leaves/${id}`, { method: 'PATCH', body }),
  saveCompensation: body => apiRequest('manager/coach-operations/compensation', { method: 'POST', body }),
  saveSalesCredit: body => apiRequest('manager/coach-operations/sales-credits', { method: 'POST', body }),
  createResource: body => apiRequest('manager/coach-operations/resources', { method: 'POST', body }),
  resolveIssue: (id, body) => apiRequest(`manager/coach-operations/equipment-issues/${id}`, { method: 'PATCH', body })
};
