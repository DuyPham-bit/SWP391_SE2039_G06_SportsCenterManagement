import {
  apiRequest as baseApiRequest,
  getApiUrl,
  getApiSession,
  setApiSession,
  clearApiSession,
  createApiSession,
  createIdempotencyKey
} from '../../services/http.js';
import { HttpError } from './errors.js';

export {
  getApiUrl,
  getApiSession,
  setApiSession,
  clearApiSession,
  createApiSession,
  createIdempotencyKey
};

/**
 * Standardized apiRequest wrapper that guarantees normalized HttpError with status, endpoint, traceId, and friendly message.
 */
export async function apiRequest(path, options = {}) {
  try {
    return await baseApiRequest(path, options);
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    const status = err?.status || (err?.code === 'COMMON-01' ? 0 : 500);
    const endpoint = options?.method ? `${options.method} /${path.replace(/^\/+/, '')}` : `/${path.replace(/^\/+/, '')}`;
    const traceId = err?.traceId || null;
    const message = err?.message || 'Yêu cầu không thể hoàn tất. Vui lòng thử lại sau.';
    
    const httpError = new HttpError(message, {
      status,
      endpoint,
      traceId,
      code: err?.code,
      proposedHandling: err?.proposedHandling,
      payload: err?.payload
    });
    httpError.cause = err?.cause || err;
    throw httpError;
  }
}

/**
 * Unified HTTP client for feature APIs
 */
export const http = {
  get: (path, options = {}) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) => apiRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options = {}) => apiRequest(path, { ...options, method: 'PUT', body }),
  delete: (path, options = {}) => apiRequest(path, { ...options, method: 'DELETE' }),
  patch: (path, body, options = {}) => apiRequest(path, { ...options, method: 'PATCH', body }),
  request: (path, options = {}) => apiRequest(path, options)
};

export default http;
