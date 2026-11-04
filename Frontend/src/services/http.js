import { assertAuthVersion, beginAuthOperation, getAuthVersion, setAuthUser } from './authState.js';
import { fixMojibake } from './encodingHelper.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
const SESSION_STORAGE_KEY = 'scms.auth.tab.v1';

function restoreSession() {
  try {
    // Remove JWTs persisted by older builds. Only a non-secret selector survives reloads.
    globalThis.sessionStorage?.removeItem('scms.auth.token.v1');
    const id = globalThis.sessionStorage?.getItem(SESSION_STORAGE_KEY);
    if (/^[a-f0-9]{32}$/.test(id || '')) return id;
    globalThis.sessionStorage?.removeItem(SESSION_STORAGE_KEY);
  } catch { /* Storage may be disabled. */ }
  return null;
}

// The JWT remains in a server-issued HttpOnly cookie, selected separately for each tab.
let activeSession = restoreSession();

export function getApiUrl(path) {
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}

export function getApiSession() {
  return activeSession;
}

export function createApiSession() {
  return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function setApiSession(id) {
  beginAuthOperation();
  if (!id || id !== activeSession) setAuthUser(null);
  activeSession = id || null;
  try {
    if (activeSession) globalThis.sessionStorage?.setItem(SESSION_STORAGE_KEY, activeSession);
    else globalThis.sessionStorage?.removeItem(SESSION_STORAGE_KEY);
  } catch { /* The current login remains usable if storage is blocked. */ }
}

export function clearApiSession() {
  setApiSession(null);
}

export function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

export async function apiRequest(path, { method = 'GET', body, session = getApiSession(), headers = {}, signal, timeoutMs } = {}) {
  const authVersion = getAuthVersion();
  const requestHeaders = new Headers(headers);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isFormData) requestHeaders.set('Content-Type', 'application/json');
  if (session) requestHeaders.set('X-SCMS-Session', session);

  const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
  const effectiveTimeout = timeoutMs ?? (isMutation ? 30000 : 15000);

  const timeoutController = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timeoutId = null;
  let abortCleanup = null;
  let requestSignal = signal;

  if (timeoutController) {
    timeoutId = setTimeout(() => {
      timeoutController.abort(new DOMException('Request timeout', 'TimeoutError'));
    }, effectiveTimeout);

    if (signal) {
      if (signal.aborted) {
        clearTimeout(timeoutId);
        throw signal.reason || new DOMException('Aborted', 'AbortError');
      }
      const onAbort = () => timeoutController.abort(signal.reason);
      signal.addEventListener('abort', onAbort, { once: true });
      abortCleanup = () => signal.removeEventListener('abort', onAbort);
    }
    requestSignal = timeoutController.signal;
  }

  let response;
  try {
    response = await fetch(getApiUrl(path), {
      method,
      headers: requestHeaders,
      credentials: 'include',
      body: body === undefined ? undefined : (isFormData ? body : (typeof body === 'string' ? body : JSON.stringify(body))),
      signal: requestSignal
    });
  } catch (cause) {
    if (cause?.name === 'AbortError' && !timeoutController?.signal.aborted) throw cause;
    if (signal?.aborted && (cause?.name === 'AbortError' || cause?.name === 'TimeoutError')) throw cause;
    const error = new Error('Chưa xác định kết quả: Mất kết nối mạng hoặc quá thời gian chờ phản hồi từ hệ thống. Vui lòng kiểm tra lại trước khi thử lại.');
    error.cause = cause;
    error.code = 'COMMON-01';
    error.proposedHandling = 'Thông báo “Chưa xác định kết quả”; kiểm tra trạng thái trước khi thử lại. Tránh tạo hai đăng ký hoặc hai khoản thu.';
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    abortCleanup?.();
  }

  if (response.status === 204) {
    if (session) assertAuthVersion(authVersion);
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const rawPayload = contentType.includes('json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '');
  const payload = typeof fixMojibake === 'function' ? fixMojibake(rawPayload) : rawPayload;

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
    const expiredToken = response.status === 401 && session && session === getApiSession() && authVersion === getAuthVersion() &&
      !publicAuthEndpoints.has(diagnosticPath.toLowerCase());
    if (expiredToken) {
      clearApiSession();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('scms:auth-expired'));
      }
    }
    const message = expiredToken
      ? 'Phiên đăng nhập đã hết hạn hoặc quyền đã bị thu hồi. Vui lòng đăng nhập lại.'
      : payload?.detail || payload?.message || validationErrors || payload?.title ||
        (typeof payload === 'string' && payload) || `Yêu cầu không thể hoàn tất (Mã: ${response.status}). Vui lòng thử lại sau.`;
    const traceSuffix = payload?.traceId ? `, traceId ${payload.traceId}` : '';
    const error = new Error(message);
    error.code = payload?.code || (expiredToken ? 'COMMON-04' : null);
    error.proposedHandling = payload?.proposedHandling || (expiredToken
      ? 'Kiểm tra lại quyền trước thao tác; yêu cầu đăng nhập lại khi cần và không tiếp tục lưu bằng quyền cũ.'
      : null);
    error.isDraftPolicy = Boolean(payload?.isDraftPolicy);
    error.diagnostic = `[${method} /${diagnosticPath}, HTTP ${response.status}${traceSuffix}]`;
    error.status = response.status;
    error.traceId = payload?.traceId;
    error.payload = payload;
    error.retryAfter = response.headers.get('retry-after');
    throw error;
  }

  // Account changes invalidate successful reads too, including delayed body parsing.
  if (session) assertAuthVersion(authVersion);
  return payload;
}
