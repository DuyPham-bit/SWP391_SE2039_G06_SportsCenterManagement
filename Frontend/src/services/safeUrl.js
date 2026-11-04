// Invalid data leaves the anchor without an href instead of a clickable fallback.
export function safeHref(value) {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f\\]/.test(value)) return undefined;
  const href = value.trim();
  if (!href || href.startsWith('//')) return undefined;
  if (href.startsWith('#')) return href;
  if (!href.startsWith('/') && !/^https?:\/\//i.test(href)) return undefined;
  try {
    const url = new URL(href, 'https://scms.invalid');
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return undefined;
    return href;
  } catch { return undefined; }
}

const ALLOWED_GATEWAY_HOSTS = new Set([
  'sandbox.vnpayment.vn',
  'pay.vnpay.vn',
  'test-payment.momo.vn',
  'payment.momo.vn',
  'momo.vn'
]);

export function safePaymentHref(value) {
  if (typeof value !== 'string') return undefined;
  const href = value.trim();
  try {
    const url = new URL(href);
    const isDev = Boolean(import.meta.env?.DEV) || url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (!isDev && url.protocol !== 'https:') return undefined;
    if (ALLOWED_GATEWAY_HOSTS.has(url.hostname.toLowerCase()) || isDev) {
      return href;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
