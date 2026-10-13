// Real Chrome + built React app; API and payment gateway are local fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const frontend = path.resolve(__dirname, '..');
const artifacts = path.join(frontend, '.validation/payment-checkout');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const state = { creates: 0, pendingReads: 0, callbacks: [], createError: false, pending: [], delayedFailure: null };
const errors = [];
const checks = [];
const pkg = { id: 7, name: 'Gói kiểm thử', price: 100000, durationDays: 30, status: 'Active' };
let appOrigin, apiOrigin, chrome, cdp;

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const api = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', appOrigin || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url, apiOrigin);
  const route = url.pathname;
  if (route === '/checkout') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<button id="cancel" onclick="location.href='${apiOrigin}/payment-result?cancel=true&orderCode=123'">Hủy thanh toán</button>`);
    return;
  }
  if (route === '/payment-result' || route.startsWith('/assets/')) return serveApp(req, res);
  if (route === '/api/auth/login') return json(res, { accessToken: 'fixture-member-token' });
  if (route.includes('/callback') || route.endsWith('-callback')) {
    state.callbacks.push(route);
    return json(res, { success: true, message: 'Đã xác nhận bằng API kiểm thử.' });
  }
  if (req.headers.authorization !== 'Bearer fixture-member-token') return json(res, { message: 'Unauthorized' }, 401);
  if (route === '/api/profile/me') return json(res, { userId: 1, role: 'Member', status: 'Active', centerId: 1, fullName: 'Hội viên kiểm thử', email: 'member@example.test' });
  if (route === '/api/members/me') return json(res, { memberId: 1 });
  if (route === '/api/access/me/capabilities') return json(res, []);
  if (route === '/api/centers/1/membership-packages') return json(res, [pkg]);
  if (route === '/api/payments/my-pending-invoices') { state.pendingReads += 1; return json(res, state.pending); }
  if (/\/api\/payments\/create-(vnpay|momo|payos)-url$/.test(route)) {
    state.creates += 1;
    if (state.createError) return json(res, { message: 'Cổng thanh toán kiểm thử tạm dừng.' }, 503);
    if (state.delayedFailure) {
      const delayedFailure = state.delayedFailure;
      state.delayedFailure = null;
      await delayedFailure;
      return json(res, { message: 'Phản hồi lỗi của lần thanh toán cũ.' }, 503);
    }
    state.pending = [{ invoiceNumber: 'SC-TEST', packageId: 7, packageName: pkg.name, amount: pkg.price }];
    await delay(100);
    return json(res, { paymentUrl: `${apiOrigin}/checkout` });
  }
  if (route.endsWith('/subscriptions') || route === '/api/notifications/me') return json(res, []);
  errors.push(`Unexpected API route: ${route}`);
  return json(res, { message: 'Unknown fixture endpoint' }, 404);
});

function serveApp(req, res) {
  const route = new URL(req.url, 'http://fixture').pathname;
  if (route === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  const file = path.join(artifacts, 'dist', route.startsWith('/assets/') ? route : 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8');
  let content = fs.readFileSync(file);
  if (file.endsWith('.html')) {
    // Keep the fixture offline; styles are irrelevant to navigation assertions.
    content = content.toString().replace(/<script src="https:[^"]+"><\/script>/g, '')
      .replace(/<link[^>]+https:[^>]+>/g, '').replace('tailwind.config =', 'window.tailwind = {}; tailwind.config =');
  }
  res.end(content);
}
const app = http.createServer(serveApp);
const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

class CDP {
  constructor(socket) {
    this.socket = socket;
    this.sequence = 0;
    this.pending = new Map();
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const task = this.pending.get(message.id);
        if (!task) return;
        this.pending.delete(message.id);
        if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') {
        errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }
  async attach(targetId) {
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    await this.send('Runtime.enable', {}, sessionId);
    await this.send('Page.enable', {}, sessionId);
    return sessionId;
  }
  async evaluate(session, expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true }, session);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
}

async function until(label, predicate) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) { if (await predicate()) return; await delay(100); }
  throw new Error(`Timed out: ${label}`);
}
async function buttons(session, label) {
  return cdp.evaluate(session, `(() => { const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(label)}); if (!button) throw new Error('Button not found: ' + ${JSON.stringify(label)}); button.click(); })()`);
}
async function pages() {
  return (await cdp.send('Target.getTargets')).targetInfos.filter(target => target.type === 'page');
}
async function checkout(session) {
  await buttons(session, state.pending.length ? 'Tiếp Tục Thanh Toán' : 'Đăng Ký Gói Này');
  await until('checkout confirmation', () => cdp.evaluate(session, `document.body.textContent.includes('Xác Nhận Thanh Toán')`));
  await buttons(session, 'Xác Nhận Thanh Toán');
}

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  await listen(app);
  appOrigin = `http://127.0.0.1:${app.address().port}`;
  await listen(api);
  apiOrigin = `http://127.0.0.1:${api.address().port}`;
  const build = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', path.join(artifacts, 'dist')], {
    cwd: frontend, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, VITE_API_BASE_URL: `${apiOrigin}/api`, VITE_GOOGLE_CLIENT_ID: '' }
  });
  let buildOutput = '';
  build.stdout.on('data', data => { buildOutput += data; });
  build.stderr.on('data', data => { buildOutput += data; });
  const buildExit = await new Promise((resolve, reject) => { build.on('exit', resolve); build.on('error', reject); });
  assert.equal(buildExit, 0, buildOutput);
  const browser = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const profile = path.join(artifacts, `chrome-${Date.now()}`);
  chrome = spawn(browser, ['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  const activePort = path.join(profile, 'DevToolsActivePort');
  await until('Chrome debugging port', () => fs.existsSync(activePort));
  const port = fs.readFileSync(activePort, 'utf8').split('\n')[0].trim();
  const browserInfo = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const socket = new WebSocket(browserInfo.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  cdp = new CDP(socket);
  const { targetId } = await cdp.send('Target.createTarget', { url: `${appOrigin}/#/login` });
  const session = await cdp.attach(targetId);
  await until('login form', () => cdp.evaluate(session, `Boolean(document.getElementById('login-email'))`));
  await cdp.evaluate(session, `(() => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (const [id, value] of [['login-email', 'member@example.test'], ['login-password', 'TestPassword123!']]) {
      const input = document.getElementById(id); set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await cdp.evaluate(session, `document.querySelector('button[type=submit]').click()`);
  await until('authenticated dashboard', () => cdp.evaluate(session, `location.hash === '#/member/dashboard'`));
  await cdp.evaluate(session, `location.hash = '#/member/packages'`);
  await until('package list', () => cdp.evaluate(session, `document.body.textContent.includes('Gói kiểm thử')`));
  await cdp.evaluate(session, `window.__originalPaymentDocument = true`);
  await checkout(session);
  await until('gateway navigation', async () => (await pages()).some(page => page.url === `${apiOrigin}/checkout`));
  assert.equal(await cdp.evaluate(session, `location.hash`), '#/member/packages', 'Checkout must preserve the authenticated package page');
  checks.push('Opening checkout preserves the original document and route');
  const gateway = (await pages()).find(page => page.url === `${apiOrigin}/checkout`);
  const paymentSession = await cdp.attach(gateway.targetId);
  const readsBeforeCancel = state.pendingReads;
  await cdp.evaluate(paymentSession, `document.getElementById('cancel').click()`);
  await until('cancel returns to original tab', async () => !(await pages()).some(page => page.targetId === gateway.targetId));
  await until('pending invoices refreshed', () => state.pendingReads > readsBeforeCancel);
  assert.equal(await cdp.evaluate(session, `window.__originalPaymentDocument && location.hash === '#/member/packages' && !document.querySelector('#login-email')`), true);
  assert.equal(await cdp.evaluate(session, `document.body.textContent.includes('Đã hủy thanh toán')`), true);
  checks.push('Cancel on a different callback origin closes checkout and retains login');
  assert.equal(state.callbacks.length, 0);
  checks.push('PayOS cancellation does not claim payment success or invoke another gateway');

  const createsBeforeBlock = state.creates;
  await cdp.evaluate(session, `window.__realOpen = window.open; window.open = () => null`);
  await checkout(session);
  assert.equal(state.creates, createsBeforeBlock);
  assert.equal(await cdp.evaluate(session, `document.body.textContent.includes('chặn cửa sổ thanh toán')`), true);
  await cdp.evaluate(session, `window.open = window.__realOpen`);
  checks.push('Popup blocking is reported before creating a payment');

  state.createError = true;
  await buttons(session, 'Xác Nhận Thanh Toán');
  await until('gateway API failure', () => cdp.evaluate(session, `document.body.textContent.includes('Cổng thanh toán kiểm thử tạm dừng.')`));
  assert.equal((await pages()).filter(page => page.openerId === targetId).length, 0);
  state.createError = false;
  checks.push('Gateway API errors close the blank checkout and retain the package page');

  await buttons(session, 'Xác Nhận Thanh Toán');
  await until('retry gateway', async () => (await pages()).some(page => page.url === `${apiOrigin}/checkout`));
  const manual = (await pages()).find(page => page.url === `${apiOrigin}/checkout`);
  const readsBeforeClose = state.pendingReads;
  await cdp.send('Target.closeTarget', { targetId: manual.targetId });
  await until('manual close refresh', () => state.pendingReads > readsBeforeClose);
  assert.equal(await cdp.evaluate(session, `window.__originalPaymentDocument && location.hash === '#/member/packages'`), true);
  checks.push('Manually closing checkout preserves login and refreshes invoices');

  let releaseOldFailure;
  state.delayedFailure = new Promise(resolve => { releaseOldFailure = resolve; });
  const createsBeforeDelay = state.creates;
  await checkout(session);
  await until('delayed create started', () => state.creates > createsBeforeDelay);
  const oldBlank = (await pages()).find(page => page.openerId === targetId);
  await cdp.send('Target.closeTarget', { targetId: oldBlank.targetId });
  await until('retry enabled after closing blank popup', () => cdp.evaluate(session, `[...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Xác Nhận Thanh Toán' && !b.disabled)`));
  await buttons(session, 'Xác Nhận Thanh Toán');
  await until('replacement checkout loaded', async () => (await pages()).some(page => page.url === `${apiOrigin}/checkout`));
  const replacement = (await pages()).find(page => page.url === `${apiOrigin}/checkout`);
  releaseOldFailure();
  await delay(600);
  assert.equal((await pages()).some(page => page.targetId === replacement.targetId), true, 'Late error from an old checkout must not close the new checkout');
  const readsBeforeReplacementClose = state.pendingReads;
  await cdp.send('Target.closeTarget', { targetId: replacement.targetId });
  await until('replacement close refreshes', () => state.pendingReads > readsBeforeReplacementClose);
  checks.push('A late response from a closed checkout cannot interfere with its replacement');

  for (const [provider, query, callback] of [
    ['VNPay', 'vnp_ResponseCode=00&vnp_TxnRef=fixture', '/api/payments/vnpay-callback'],
    ['MoMo', 'resultCode=0&transId=fixture', '/api/payments/momo-callback'],
    ['PayOS', 'orderCode=123&status=PAID', null]
  ]) {
    await checkout(session);
    await until(`${provider} gateway`, async () => (await pages()).some(page => page.url === `${apiOrigin}/checkout`));
    const target = (await pages()).find(page => page.url === `${apiOrigin}/checkout`);
    const childSession = await cdp.attach(target.targetId);
    const readsBeforeReturn = state.pendingReads;
    const callbacksBefore = state.callbacks.length;
    const returnOrigin = provider === 'PayOS' ? appOrigin : apiOrigin;
    await cdp.send('Page.navigate', { url: `${returnOrigin}/payment-result?${query}` }, childSession);
    await until(`${provider} returns`, async () => !(await pages()).some(page => page.targetId === target.targetId));
    await until(`${provider} refreshes`, () => state.pendingReads > readsBeforeReturn);
    assert.equal(await cdp.evaluate(session, `window.__originalPaymentDocument && location.hash === '#/member/packages'`), true);
    if (callback) assert.equal(state.callbacks.at(-1), callback); else assert.equal(state.callbacks.length, callbacksBefore);
    checks.push(`${provider} return preserves login and respects backend verification`);
  }

  assert.equal(await cdp.evaluate(session, `Object.keys(sessionStorage).length === 0 && !JSON.stringify(localStorage).includes('fixture-member-token')`), true);
  checks.push('JWT is not persisted to browser storage');
  const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' }, session);
  fs.writeFileSync(path.join(artifacts, 'returned-packages.png'), Buffer.from(screenshot.data, 'base64'));
  assert.deepEqual(errors, []);
  checks.push('No JavaScript exceptions or unexpected API requests');
  fs.writeFileSync(path.join(artifacts, 'report.json'), JSON.stringify({ checks, errors }, null, 2));
  console.log(`PASS: ${checks.length} browser checks\n${checks.map(check => `- ${check}`).join('\n')}`);
})().catch(error => { console.error(error.stack); process.exitCode = 1; }).finally(async () => {
  if (cdp) { await cdp.send('Browser.close').catch(() => {}); cdp.socket.close(); }
  if (chrome && chrome.exitCode === null) chrome.kill();
  api.closeAllConnections(); app.closeAllConnections(); api.close(); app.close();
});
