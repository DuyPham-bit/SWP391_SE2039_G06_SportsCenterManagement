import { apiRequest } from '../../../shared/api/http.js';

export const payrollApi = {
  getMine: (year, month) => apiRequest(`payroll/me?year=${year}&month=${month}`),
  getReport: (year, month) => apiRequest(`payroll/report?year=${year}&month=${month}`),
  saveStaffPolicy: body => apiRequest('payroll/staff-policy', { method: 'POST', body })
};
