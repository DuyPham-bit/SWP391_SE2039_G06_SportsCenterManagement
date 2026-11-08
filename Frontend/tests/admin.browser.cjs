// Exercise the production React app in Chrome as a system Admin. Only the API is a local fixture.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { issueBrowserSession, browserCredential } = require('./browser-auth-fixture.cjs');

const frontend = path.resolve(__dirname, '..');
const artifacts = path.join(frontend, 'tmp/admin');
const errors = [], checks = [], requests = [];
const overview = { activeCenterCount: 1, activeManagerCount: 1, lockedAccountCount: 0, totalAccountCount: 12 };
const centers = [{ id: 1, name: 'Cơ sở kiểm thử Admin', address: '1 Đường Kiểm Thử', phone: '0900000001', email: 'center@example.test', status: 'Active', createdAt: '2026-10-01T00:00:00Z' }];
const managers = [{ id: 5, fullName: 'Manager Admin Kiểm Thử', username: 'manager.admin', email: 'mgr@example.test', centerId: 1, centerName: centers[0].name, status: 'Active', lastLoginAt: null }];
const account = { id: 30, username: 'member.can.khoa', email: 'lock@example.test', role: 'Member', status: 'Active', centerName: centers[0].name, lastLoginAt: null, lockedUntil: null };
let browser, socket, cdp, origin, session;

function json(res, body, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://fixture');
  const route = url.pathname;
  if (route.startsWith('/api/')) {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : null;
    requests.push({ route, method: req.method, body, query: Object.fromEntries(url.searchParams) });
    if (route === '/api/auth/login') return json(res, issueBrowserSession(req, res, 'admin-fixture-token'));
    if (browserCredential(req) !== 'admin-fixture-token') return json(res, { message: 'Unauthorized' }, 401);
    if (route === '/api/profile/me') return json(res, { userId: 1, role: 'Admin', status: 'Active', centerId: null, fullName: 'Admin kiểm thử', email: 'admin@example.test' });
    if (route === '/api/access/me/capabilities') return json(res, []);
    if (route === '/api/notifications/me') return json(res, []);
    if (route === '/api/admin/overview') return json(res, overview);
    if (route === '/api/admin/centers' && req.method === 'GET') return json(res, centers);
    if (route === '/api/admin/managers' && req.method === 'GET') return json(res, managers);
    if (route === '/api/admin/accounts' && req.method === 'GET') return json(res, { items: [account], totalCount: 1 });
    if (route === `/api/admin/accounts/${account.id}/lock` && req.method === 'POST') { account.status = 'Disabled'; return json(res, {}); }
    errors.push(`Unexpected API: ${req.method} ${route}`);
    return json(res, { message: 'Unexpected fixture endpoint' }, 404);
  }
  if (route === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  const file = path.join(artifacts, 'dist', route.startsWith('/assets/') ? route : 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8');
  let content = fs.readFileSync(file);
  // Runtime checks work offline and do not depend on third-party fonts or CSS CDN.
  if (file.endsWith('.html')) content = content.toString().replace(/<script src="https:[^"]+"><\/script>/g, '')
    .replace(/<link[^>]+https:[^>]+>/g, '').replace('tailwind.config =', 'window.tailwind = {}; tailwind.config =');
  res.end(content);
});

class CDP {
  constructor(ws) {
    this.sequence = 0; this.pending = new Map();
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const task = this.pending.get(message.id); this.pending.delete(message.id);
        if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params, sessionId })); });
  }
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(label, predicate) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) { if (await predicate()) return; await delay(100); }
  throw new Error(`Timed out: ${label}`);
}
async function evaluate(expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true }, session);
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function setInput(selector, value) {
  await evaluate(`(() => { const input = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
}
const mainHas = text => evaluate(`document.querySelector('main')?.textContent.includes(${JSON.stringify(text)}) === true`);
const dialogHas = text => evaluate(`document.querySelector('[role=dialog]')?.textContent.includes(${JSON.stringify(text)}) === true`);
// find and click in one evaluation so a re-render between the two cannot detach the element
const press = (label, selector) => until(label, () => evaluate(`(() => { const b = ${selector}; if (!b) return false; b.click(); return true; })()`));
const pressText = text => press(`button ${text}`, `[...document.querySelectorAll('main button')].find(b => !b.disabled && b.textContent.includes(${JSON.stringify(text)}))`);
const pressTitled = title => press(`button titled ${title}`, `document.querySelector(${JSON.stringify(`main button[title="${title}"]`)})`);
async function closeDialog() {
  await evaluate(`document.querySelector('[role=dialog] button[aria-label="Đóng"]').click()`);
  await until('dialog closed', () => evaluate(`!document.querySelector('[role=dialog]')`));
}
async function route(hash, text) {
  await evaluate(`location.hash = ${JSON.stringify(hash)}`);
  await until(text, () => mainHas(text)).catch(async error => {
    const diag = await evaluate(`JSON.stringify({ hash: location.hash, main: document.querySelector('main')?.innerText.slice(0, 500) })`).catch(e => String(e));
    throw new Error(`${error.message} ${diag} recentRequests=${JSON.stringify(requests.slice(-6).map(r => `${r.method} ${r.route}`))}`);
  });
}

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const build = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', path.join(artifacts, 'dist')], {
    cwd: frontend, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, VITE_API_BASE_URL: '/api', VITE_GOOGLE_CLIENT_ID: '' }
  });
  let output = ''; build.stdout.on('data', chunk => output += chunk); build.stderr.on('data', chunk => output += chunk);
  const exit = await new Promise((resolve, reject) => { build.on('exit', resolve); build.on('error', reject); });
  assert.equal(exit, 0, output);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  const profile = path.join(artifacts, `chrome-${Date.now()}`);
  browser = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  browser.on('error', error => errors.push(error.message));
  await until('Chrome', () => fs.existsSync(path.join(profile, 'DevToolsActivePort')));
  const port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim();
  const info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  socket = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  cdp = new CDP(socket);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  ({ sessionId: session } = await cdp.send('Target.attachToTarget', { targetId, flatten: true }));
  await cdp.send('Runtime.enable', {}, session); await cdp.send('Page.enable', {}, session);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }, session);
  await cdp.send('Page.navigate', { url: `${origin}/#/login` }, session);
  await until('login', () => evaluate(`Boolean(document.getElementById('login-email'))`));
  await setInput('#login-email', 'admin@example.test'); await setInput('#login-password', 'TestPassword123!');
  await evaluate(`document.querySelector('button[type=submit]').click()`);
  await until('admin dashboard', () => evaluate(`location.hash === '#/admin/dashboard'`));

  await until('overview loaded', () => mainHas('Cơ Sở Thể Thao'));
  // The card labels render before the request reaches the fixture, so wait for the request itself.
  await until('overview requested from the admin API', () => requests.some(r => r.route === '/api/admin/overview'));
  await pressText('+ Thêm Cơ Sở');
  await until('create center dialog', () => dialogHas('Thêm Cơ Sở Thể Thao Mới'));
  await closeDialog();
  checks.push('Admin overview loads from the API and opens the create-center dialog');

  await route('#/admin/centers', centers[0].name);
  await route('#/admin/managers', managers[0].fullName);
  await pressText('+ Cấp Tài Khoản Manager');
  await until('create manager dialog', () => dialogHas('Cấp Tài Khoản Manager'));
  assert.ok(await evaluate(`[...document.querySelectorAll('[role=dialog] select option')].some(o => o.textContent.includes(${JSON.stringify(centers[0].name)}))`), 'the manager form must offer the API centers');
  await closeDialog();
  checks.push('Centers and managers tabs list API records; the manager form offers the centers');

  await route('#/admin/accounts', account.username);
  await pressTitled('Khóa tài khoản');
  await until('lock dialog', () => dialogHas(account.username));
  await setInput('[role=dialog] form input', 'Kiểm thử khóa tài khoản');
  await evaluate(`document.querySelector('[role=dialog] form').requestSubmit()`);
  await until('lock request', () => requests.some(r => r.route === `/api/admin/accounts/${account.id}/lock` && r.method === 'POST'));
  assert.deepEqual(requests.find(r => r.route === `/api/admin/accounts/${account.id}/lock`).body, { reason: 'Kiểm thử khóa tài khoản' });
  checks.push('Locking an account sends the entered reason to the admin API');

  assert.deepEqual(errors, []);
  checks.push('No uncaught JavaScript exceptions or unexpected API endpoints');
  console.log(`PASS: ${checks.length} browser checks\n${checks.map(check => `- ${check}`).join('\n')}`);
})().catch(async error => {
  console.error(error.stack);
  console.error(JSON.stringify({ checks, errors, lastRequests: requests.slice(-6).map(r => `${r.method} ${r.route}`) }, null, 2));
  process.exitCode = 1;
}).finally(async () => {
  if (cdp) { await cdp.send('Browser.close').catch(() => {}); socket.close(); }
  if (browser && browser.exitCode === null) browser.kill();
  server.closeAllConnections(); server.close();
});
