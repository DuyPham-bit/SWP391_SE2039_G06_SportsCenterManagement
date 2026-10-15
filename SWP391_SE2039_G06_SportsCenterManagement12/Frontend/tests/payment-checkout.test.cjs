const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function fixture({ blocked = false } = {}) {
  const listeners = new Map();
  const timers = new Set();
  const messages = [];
  const returned = [];
  const popup = {
    closed: false,
    document: { title: '', body: {} },
    location: { replace(url) { popup.url = url; } },
    close() { popup.closed = true; },
    postMessage(data, origin) { messages.push({ data, origin }); }
  };
  const window = {
    location: new URL('http://localhost:3004/#/member/packages'),
    open() { return blocked ? null : popup; },
    focus() { window.focused = true; },
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type); },
    setInterval(callback) { timers.add(callback); return callback; },
    clearInterval(callback) { timers.delete(callback); }
  };
  const source = fs.readFileSync(path.join(__dirname, '../src/services/paymentCheckout.js'), 'utf8')
    .replaceAll('export function ', 'function ')
    .replaceAll('import.meta.env.VITE_API_BASE_URL', 'undefined');
  const context = vm.createContext({ window, URL, Set });
  vm.runInContext(`${source}\nglobalThis.checkout = { openPaymentCheckout, notifyPaymentReturn };`, context);
  return { window, popup, listeners, timers, messages, returned, ...context.checkout };
}

test('checkout preserves the original document and rejects messages from other tabs or origins', () => {
  const f = fixture();
  const checkout = f.openPaymentCheckout(result => f.returned.push(result));
  checkout.navigate('https://gateway.example/checkout');
  assert.equal(f.window.location.href, 'http://localhost:3004/#/member/packages');
  assert.equal(f.popup.url, 'https://gateway.example/checkout');
  const receive = f.listeners.get('message');
  receive({ source: {}, origin: f.window.location.origin, data: { type: 'scms:payment-returned' } });
  receive({ source: f.popup, origin: 'https://gateway.example', data: { type: 'scms:payment-returned' } });
  assert.equal(f.returned.length, 0);
  assert.equal(f.popup.closed, false);
  receive({ source: f.popup, origin: 'http://localhost:54162', data: { type: 'scms:payment-ready' } });
  assert.equal(f.messages[0].origin, 'http://localhost:54162');
  receive({ source: f.popup, origin: 'http://localhost:54162', data: { type: 'scms:payment-returned', cancelled: true } });
  assert.equal(f.returned[0].cancelled, true);
  assert.equal(f.popup.closed, true);
  assert.equal(f.window.focused, true);
  assert.equal(f.listeners.size, 0);
  assert.equal(f.timers.size, 0);
});

test('blocked popups fail before creating a checkout', () => {
  const f = fixture({ blocked: true });
  assert.throws(() => f.openPaymentCheckout(() => {}), /chặn cửa sổ thanh toán/);
  assert.equal(f.timers.size, 0);
});

test('manual close returns once; disposed checkouts cannot navigate after logout', () => {
  const f = fixture();
  const checkout = f.openPaymentCheckout(result => f.returned.push(result));
  f.popup.closed = true;
  [...f.timers][0]();
  assert.equal(f.returned.length, 1);
  assert.equal(f.returned[0].closed, true);
  assert.equal(checkout.navigate('https://gateway.example/checkout'), false);
  assert.equal(f.popup.url, undefined);
});

test('failed API cleanup closes the blank popup without pretending a payment completed', () => {
  const f = fixture();
  const checkout = f.openPaymentCheckout(result => f.returned.push(result));
  checkout.dispose();
  assert.equal(f.popup.closed, true);
  assert.equal(f.returned.length, 0);
  assert.equal(f.listeners.size, 0);
  assert.equal(f.timers.size, 0);
  assert.equal(checkout.navigate('https://gateway.example/checkout'), false);
});

test('checkout rejects script URLs', () => {
  const f = fixture();
  const checkout = f.openPaymentCheckout(() => {});
  assert.throws(() => checkout.navigate('javascript:alert(1)'), /không hợp lệ/);
  checkout.dispose();
});

test('return handshake sends UI hints only to the actual opener after acknowledgement', () => {
  const f = fixture();
  f.window.opener = f.popup;
  const dispose = f.notifyPaymentReturn({ cancelled: true, failed: false });
  assert.equal(f.messages.length, 1);
  assert.equal(f.messages[0].data.type, 'scms:payment-ready');
  const receive = f.listeners.get('message');
  receive({ source: {}, origin: 'https://other.example', data: { type: 'scms:payment-acknowledged' } });
  assert.equal(f.messages.length, 1);
  receive({ source: f.popup, origin: 'http://localhost:3004', data: { type: 'scms:payment-acknowledged' } });
  assert.equal(f.messages[1].origin, 'http://localhost:3004');
  assert.equal(f.messages[1].data.cancelled, true);
  dispose();
  assert.equal(f.listeners.size, 0);
  assert.equal(f.timers.size, 0);
});
