import { apiRequest } from '../../../shared/api/http.js';

export const notificationApi = {
  getMine: () => apiRequest('notifications/me'),
  markRead: id => apiRequest('notifications/'+id+'/read', { method: 'PUT' }),
  markAllRead: () => apiRequest('notifications/me/read-all', { method: 'PUT' })
};
