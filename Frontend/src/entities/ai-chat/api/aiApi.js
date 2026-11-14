import { apiRequest } from '../../../shared/api/http.js';

export const aiApi = {
  /** `language` is only a hint for ambiguous messages; the AI replies in the language the member writes in. */
  chat: (message, conversationId = null, language = null) =>
    apiRequest('ai/chat', { method: 'POST', body: { message, conversationId, language } }),
  getMessages: id => apiRequest('ai/conversations/'+id+'/messages'),
  /** Latest assistant conversation stored in the DB: { conversationId, messages: [{ id, sender, text, createdAt }] }. */
  getLatest: ({ signal } = {}) => apiRequest('ai/conversations/latest', { signal })
};
