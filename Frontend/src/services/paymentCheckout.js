const READY = 'scms:payment-ready';
const ACKNOWLEDGED = 'scms:payment-acknowledged';
const RETURNED = 'scms:payment-returned';

export function openPaymentCheckout(onReturn) {
  const allowedOrigins = new Set([
    window.location.origin,
    new URL(import.meta.env.VITE_API_BASE_URL || '/api', window.location.origin).origin
  ]);
  if (['localhost', '127.0.0.1'].includes(window.location.hostname) && ['3003', '3004', '54162'].includes(window.location.port)) {
    for (const port of ['3003', '3004', '54162']) {
      allowedOrigins.add(`${window.location.protocol}//${window.location.hostname}:${port}`);
    }
  }

  // Open during the click, before awaiting the API, to avoid popup blocking.
  const popup = window.open('about:blank', '_blank', 'popup,width=1000,height=760');
  if (!popup) throw new Error('Trình duyệt đang chặn cửa sổ thanh toán. Vui lòng cho phép cửa sổ bật lên rồi thử lại.');
  popup.document.title = 'Đang kết nối cổng thanh toán';
  popup.document.body.textContent = 'Đang kết nối cổng thanh toán…';

  let active = true;
  const dispose = () => {
    active = false;
    window.removeEventListener('message', handleMessage);
    window.clearInterval(timer);
    popup.close();
  };
  const finish = result => {
    if (!active) return;
    dispose();
    window.focus();
    onReturn(result);
  };
  const handleMessage = event => {
    // A different tab or gateway page must not complete this checkout.
    if (!active || event.source !== popup || !allowedOrigins.has(event.origin)) return;
    if (event.data?.type === READY) {
      popup.postMessage({ type: ACKNOWLEDGED }, event.origin);
    } else if (event.data?.type === RETURNED) {
      finish({ cancelled: event.data.cancelled === true, failed: event.data.failed === true });
    }
  };
  window.addEventListener('message', handleMessage);
  const timer = window.setInterval(() => {
    if (popup.closed) finish({ closed: true });
  }, 500);

  return {
    navigate(url) {
      if (!active || popup.closed) return false;
      const target = new URL(url);
      if (!['https:', 'http:'].includes(target.protocol)) throw new Error('Địa chỉ cổng thanh toán không hợp lệ.');
      popup.location.replace(target.href);
      return true;
    },
    dispose
  };
}

export function notifyPaymentReturn({ cancelled, failed }) {
  const opener = window.opener;
  if (!opener || opener.closed) return () => {};
  const handleMessage = event => {
    if (event.source !== opener || event.data?.type !== ACKNOWLEDGED) return;
    // Send only UI hints to the original tab; it reloads authoritative API data.
    opener.postMessage({ type: RETURNED, cancelled, failed }, event.origin);
  };
  window.addEventListener('message', handleMessage);
  // The initial handshake contains no credentials or transaction details.
  const announce = () => opener.postMessage({ type: READY }, '*');
  announce();
  const timer = window.setInterval(announce, 500);
  return () => {
    window.removeEventListener('message', handleMessage);
    window.clearInterval(timer);
  };
}
