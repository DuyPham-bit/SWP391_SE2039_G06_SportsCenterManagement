import { apiRequest } from '../../../shared/api/http.js';

export const aiApi = {
  chat: (message, conversationId = null) => apiRequest('ai/chat', { method: 'POST', body: { message, conversationId } }),
  getMessages: id => apiRequest('ai/conversations/'+id+'/messages'),
  /** Latest assistant conversation stored in the DB: { conversationId, messages: [{ id, sender, text, createdAt }] }. */
  getLatest: ({ signal } = {}) => apiRequest('ai/conversations/latest', { signal })
};
