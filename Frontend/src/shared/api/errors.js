/**
 * Chuẩn hóa đối tượng lỗi HTTP cho toàn bộ hệ sinh thái SCMS.
 * Đảm bảo debug luôn có status, endpoint, traceId và thông điệp thân thiện.
 */
export class HttpError extends Error {
  constructor(message, { status = 500, endpoint = '', traceId = null, code = null, proposedHandling = null, payload = null } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.endpoint = endpoint;
    this.traceId = traceId;
    this.code = code;
    this.proposedHandling = proposedHandling;
    this.payload = payload;
    this.diagnostic = `[${endpoint || 'API'}, HTTP ${status}${traceId ? `, traceId ${traceId}` : ''}]`;
  }
}

export function isHttpError(error) {
  return error instanceof HttpError || (error && typeof error.status === 'number' && 'diagnostic' in error);
}

export function formatErrorMessage(error, defaultMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.') {
  if (!error) return defaultMessage;
  if (typeof error === 'string') return error;
  return error.message || error.detail || error.title || defaultMessage;
}

