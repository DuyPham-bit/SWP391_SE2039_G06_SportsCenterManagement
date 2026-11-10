// Real Chrome + built React app; API and payment gateway are local fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { issueBrowserSession, browserCredential } = require('./browser-auth-fixture.cjs');

const frontend = path.resolve(__dirname, '..');
const artifacts = path.join(frontend, '.validation/payment-checkout');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const state = { bookingPosts: 0, creates: 0, pendingReads: 0, callbacks: [], createError: false, pending: [], delayedFailure: null };
const errors = [];
const checks = [];
const pkg = { id: 7, name: 'Gói kiểm thử', price: 100000, durationDays: 30, status: 'Active' };
// Dashboard fixture: one confirmed booking tomorrow (Vietnam date) so it is upcoming and cancellable.
const tomorrow = new Date(Date.now() + 31 * 3600000).toISOString().slice(0, 10);
const dashboardBooking = { id: 301, sessionId: 401, classId: 5, className: 'Lớp dashboard kiểm thử', sessionDate: tomorrow, startTime: '08:00:00',
  endTime: '09:00:00', roomName: 'Phòng dashboard', coachName: 'HLV dashboard', status: 'Booked', sessionStatus: 'Scheduled', bookedAt: '2026-11-01T08:00:00Z' };
// Schedule fixture: a bookable session tomorrow; booking it returns the new booking.
const scheduleSession = { sessionId: 601, classId: 9, className: 'Lớp lịch học kiểm thử', sportName: 'Yoga', sessionDate: tomorrow, startTime: '10:00:00',
  endTime: '11:00:00', coachName: 'HLV lịch học', roomName: 'Phòng lịch học', bookedCount: 2, capacity: 10, sessionStatus: 'Scheduled', isBookable: true, allowWaitlist: false };
let appOrigin, apiOrigin, chrome, cdp;

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const api = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', appOrigin || '*');
  res.setHeader('Access-Control-Allow-Headers', 'X-SCMS-Session, Content-Type, Idempotency-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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
  if (route === '/api/auth/login') return json(res, issueBrowserSession(req, res, 'fixture-member-token'));
  if (route.includes('/callback') || route.endsWith('-callback')) {
    state.callbacks.push(route);
    return json(res, { success: true, message: 'Đã xác nhận bằng API kiểm thử.' });
  }
  if (browserCredential(req) !== 'fixture-member-token') return json(res, { message: 'Unauthorized' }, 401);
  if (route === '/api/profile/me') return json(res, { userId: 1, role: 'Member', status: 'Active', centerId: 1, fullName: 'Hội viên kiểm thử', email: 'member@example.test' });
  if (route === '/api/members/me') return json(res, { memberId: 1 });
  if (route === '/api/access/me/capabilities') return json(res, ['book_class', 'cancel_booking', 'view_my_progress']);
  if (route === '/api/centers/1/membership-packages') return json(res, [pkg]);
  if (route === '/api/payments/my-pending-invoices') { state.pendingReads += 1; return json(res, state.pending); }
  if (/\/api\/payments\/create-(vnpay|momo)-url$/.test(route)) {
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
  if (route === '/api/members/me/session-bookings') return json(res, [dashboardBooking]);
  if (route === '/api/class-sessions') return json(res, { items: [scheduleSession], totalCount: 1, pageSize: 100 });
  if (route === '/api/class-sessions/601/bookings' && req.method === 'POST') { state.bookingPosts += 1; return json(res, { booking: { ...dashboardBooking, id: 302, sessionId: 601, classId: 9, className: scheduleSession.className, startTime: '10:00:00', endTime: '11:00:00' } }); }
  if (route === '/api/members/me/progress' || route === '/api/members/me/training-plans') return json(res, []);
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
  return cdp.evaluate(session, `(() => { const button = [...document.querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(label)})); if (!button) throw new Error('Button not found: ' + ${JSON.stringify(label)}); button.click(); })()`);
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
  await until('login form', () => cdp.evaluate(session, `Boolean(document.getElementById('login-email'))`)).catch(async error => {
    const diag = await cdp.evaluate(session, `JSON.stringify({ href: location.href, ready: document.readyState, body: document.body?.innerHTML.slice(0, 400) })`).catch(e => String(e));
    throw new Error(`${error.message} ${diag} errors=${JSON.stringify(errors)}`);
  });
  await cdp.evaluate(session, `(() => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (const [id, value] of [['login-email', 'member@example.test'], ['login-password', 'TestPassword123!']]) {
      const input = document.getElementById(id); set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await cdp.evaluate(session, `document.querySelector('button[type=submit]').click()`);
  await until('authenticated dashboard', () => cdp.evaluate(session, `location.hash === '#/member/dashboard'`));
  // Member dashboard: upcoming booking, check-in QR dialog and cancel confirmation render.
  const dialogHas = text => cdp.evaluate(session, `document.querySelector('[role=dialog]')?.textContent.includes(${JSON.stringify(text)}) === true`);
  const closeDialog = async () => { await cdp.evaluate(session, `document.querySelector('[role=dialog] button[aria-label="Đóng"]').click()`); await until('dialog closed', () => cdp.evaluate(session, `!document.querySelector('[role=dialog]')`)); };
  await until('dashboard booking', () => cdp.evaluate(session, `document.querySelector('main')?.textContent.includes('Lớp dashboard kiểm thử') === true`)).catch(async error => {
    throw new Error(`${error.message} errors=${JSON.stringify(errors)} main=${await cdp.evaluate(session, `(document.querySelector('main')?.innerHTML || 'NO MAIN').slice(0, 1500)`).catch(e => String(e))}`);
  });
  await until('qr opened', () => cdp.evaluate(session, `(() => { const b = document.querySelector('main [title="Chạm để phóng to mã QR"]'); if (!b) return false; b.click(); return true; })()`));
  await until('qr dialog', () => dialogHas('Mã Số Thẻ Check-in Điện Tử Qua Cổng'));
  await closeDialog();
  await until('cancel opened', () => cdp.evaluate(session, `(() => { const b = [...document.querySelectorAll('main button')].find(b => b.textContent.includes('Hủy ca học')); if (!b) return false; b.click(); return true; })()`));
  await until('cancel dialog', () => dialogHas('Lớp dashboard kiểm thử'));
  await closeDialog();
  checks.push('Member dashboard shows the upcoming booking, the check-in QR dialog and the cancel confirmation');
  // Class schedule: week, month and agenda views render; booking from the agenda posts to the session.
  const pressMain = (label, text) => until(label, () => cdp.evaluate(session, `(() => { const b = [...document.querySelectorAll('main button')].find(b => !b.disabled && b.textContent.includes(${JSON.stringify(text)})); if (!b) return false; b.click(); return true; })()`));
  await cdp.evaluate(session, `location.hash = '#/member/schedule'`);
  await until('schedule page', () => cdp.evaluate(session, `Boolean([...document.querySelectorAll('main button')].find(b => b.textContent.includes('Lịch Biểu')))`));
  await pressMain('month view', 'Tháng');
  await pressMain('agenda view', 'Lịch Biểu');
  await until('agenda session', () => cdp.evaluate(session, `document.querySelector('main').textContent.includes('Lớp lịch học kiểm thử')`));
  await pressMain('book now', 'Đặt Chỗ');
  await until('booking dialog', () => dialogHas('Xác Nhận Giữ Chỗ'));
  await until('confirm booking', () => cdp.evaluate(session, `(() => { const b = [...document.querySelectorAll('[role=dialog] button')].find(b => !b.disabled && b.textContent.includes('Xác Nhận Giữ Chỗ')); if (!b) return false; b.click(); return true; })()`));
  await until('booking request', () => state.bookingPosts > 0);
  await pressMain('week view', 'Tuần (Timetable)');
  checks.push('Class schedule renders week, month and agenda views and books a session from the agenda');
  // Members are redirected in the same tab; the gateway returns to the app origin, where the tab's session selector survives.
  const openPackages = async () => {
    await cdp.evaluate(session, `location.href = ${JSON.stringify(`${appOrigin}/#/member/packages`)}`);
    await until('package list', () => cdp.evaluate(session, `document.body.textContent.includes('Gói kiểm thử') && !document.querySelector('#login-email')`));
  };
  const onGateway = () => cdp.evaluate(session, `location.href === ${JSON.stringify(`${apiOrigin}/checkout`)}`);
  await openPackages();
  const initialPageCount = (await pages()).length;

  state.createError = true;
  await checkout(session);
  await until('gateway API failure', () => cdp.evaluate(session, `document.body.textContent.includes('Cổng thanh toán kiểm thử tạm dừng.')`));
  assert.equal(await cdp.evaluate(session, `location.hash`), '#/member/packages', 'A failed payment link must keep the member on the package page');
  assert.equal((await pages()).length, initialPageCount, 'Member checkout must not open extra windows');
  state.createError = false;
  checks.push('Gateway API errors are shown and keep the member on the package page');

  await openPackages();
  const createsBeforeCheckout = state.creates;
  await checkout(session);
  await until('same-tab gateway navigation', onGateway);
  assert.equal(state.creates, createsBeforeCheckout + 1, 'One confirmation must create exactly one payment link');
  assert.equal((await pages()).length, initialPageCount, 'Member checkout must redirect the current tab instead of opening a popup');
  checks.push('Confirming checkout creates one payment link and redirects the current tab');

  await cdp.evaluate(session, `document.getElementById('cancel').onclick = null; location.href = ${JSON.stringify(`${appOrigin}/payment-result?cancel=true&orderCode=123`)}`);
  await until('cancelled result', () => cdp.evaluate(session, `document.body.textContent.includes('Giao dịch đã bị hủy')`));
  assert.equal(state.callbacks.length, 0, 'Cancellation must not call a gateway verification endpoint');
  await buttons(session, 'Quay lại gói tập');
  await until('back to packages after cancel', () => cdp.evaluate(session, `location.hash === '#/member/packages' && document.body.textContent.includes('Gói kiểm thử') && !document.querySelector('#login-email')`));
  checks.push('Cancelling at the gateway returns to packages with the login intact and claims no payment');

  for (const [provider, query, callback] of [
    ['VNPay', 'vnp_ResponseCode=00&vnp_TxnRef=fixture', '/api/payments/vnpay-callback'],
    ['MoMo', 'resultCode=0&transId=fixture', '/api/payments/momo-callback']
  ]) {
    await openPackages();
    await checkout(session);
    await until(`${provider} gateway`, onGateway);
    const callbacksBefore = state.callbacks.length;
    await cdp.evaluate(session, `location.href = ${JSON.stringify(`${appOrigin}/payment-result?${query}`)}`);
    await until(`${provider} verified`, () => cdp.evaluate(session, `document.body.textContent.includes('Đã xác nhận bằng API kiểm thử.')`));
    assert.equal(state.callbacks.length, callbacksBefore + 1);
    assert.equal(state.callbacks.at(-1), callback);
    await buttons(session, 'Quay lại gói tập');
    await until(`${provider} back to packages`, () => cdp.evaluate(session, `location.hash === '#/member/packages' && !document.querySelector('#login-email')`));
    checks.push(`${provider} return is verified by the backend and keeps the member logged in`);
  }

  // The JWT stays in the HttpOnly cookie; storage may only hold the non-secret per-tab selector and UI state.
  assert.equal(await cdp.evaluate(session, `/^[a-f0-9]{32}$/.test(sessionStorage.getItem('scms.auth.tab.v1') || '')
    && !JSON.stringify({ ...sessionStorage, ...localStorage }).includes('fixture-member-token')`), true);
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
