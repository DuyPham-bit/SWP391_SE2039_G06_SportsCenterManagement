import { apiRequest } from '../../../shared/api/http.js';

export const aiApi = {
  chat: (message, conversationId = null) => apiRequest('ai/chat', { method: 'POST', body: { message, conversationId } }),
  getMessages: id => apiRequest('ai/conversations/'+id+'/messages')
};
