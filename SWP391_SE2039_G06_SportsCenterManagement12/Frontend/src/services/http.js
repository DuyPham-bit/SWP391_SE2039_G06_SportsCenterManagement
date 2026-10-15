import { beginAuthOperation, getAuthVersion, setAuthUser } from './authState.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
// Memory belongs to this document, so another tab cannot replace its JWT.
let accessToken = null;

export function getApiToken() {
  return accessToken;
}

export function setApiToken(token) {
  beginAuthOperation();
  if (!token || token !== accessToken) setAuthUser(null);
  accessToken = token || null;
}

export function clearApiToken() {
  setApiToken(null);
}

export function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

export async function apiRequest(path, { method = 'GET', body, token = getApiToken(), headers = {}, signal } = {}) {
  const authVersion = getAuthVersion();
  const requestHeaders = new Headers(headers);
  if (body !== undefined) requestHeaders.set('Content-Type', 'application/json');
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/${path.replace(/^\/+/, '')}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal
    });
  } catch (cause) {
    const error = new Error(`Chưa xác định kết quả: Mất kết nối mạng hoặc hết thời gian chờ tới backend (${API_BASE_URL}). Vui lòng kiểm tra trạng thái giao dịch trước khi thử lại.`);
    error.cause = cause;
    error.code = 'COMMON-01';
    error.proposedHandling = 'Thông báo “Chưa xác định kết quả”; kiểm tra trạng thái trước khi thử lại. Tránh tạo hai đăng ký hoặc hai khoản thu.';
    throw error;
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '');

  if (!response.ok) {
    const validationErrors = payload?.errors && Object.values(payload.errors).flat().join(' ');
    const diagnosticPath = path.split('?')[0].replace(/^\/+/, '');
    const publicAuthEndpoints = new Set([
      'auth/login',
      'auth/register',
      'auth/google',
      'auth/request-password-reset',
      'auth/reset-password'
    ]);
    const expiredToken = response.status === 401 && token && token === getApiToken() && authVersion === getAuthVersion() &&
      !publicAuthEndpoints.has(diagnosticPath.toLowerCase());
    if (expiredToken) {
      clearApiToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('scms:auth-expired'));
      }
    }
    const message = expiredToken
      ? 'Phiên đăng nhập đã hết hạn hoặc quyền đã bị thu hồi. Vui lòng đăng nhập lại.'
      : payload?.detail || payload?.message || validationErrors || payload?.title ||
        (typeof payload === 'string' && payload) || `Yêu cầu API thất bại (${response.status}).`;
    const traceSuffix = payload?.traceId ? `, traceId ${payload.traceId}` : '';
    const error = new Error(message);
    error.code = payload?.code || (expiredToken ? 'COMMON-04' : (response.status === 409 ? 'COMMON-03' : null));
    error.proposedHandling = payload?.proposedHandling || (expiredToken
      ? 'Kiểm tra lại quyền trước thao tác; yêu cầu đăng nhập lại khi cần và không tiếp tục lưu bằng quyền cũ.'
      : (response.status === 409
        ? 'Phát hiện dữ liệu đã thay đổi; yêu cầu tải bản mới để đối chiếu, tránh âm thầm ghi đè.'
        : null));
    error.isDraftPolicy = Boolean(payload?.isDraftPolicy);
    error.diagnostic = `[${method} /${diagnosticPath}, HTTP ${response.status}${traceSuffix}]`;
    error.status = response.status;
    error.traceId = payload?.traceId;
    error.payload = payload;
    error.retryAfter = response.headers.get('retry-after');
    throw error;
  }

  return payload;
}
