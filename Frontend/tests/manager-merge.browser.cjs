// Exercise the production React app in Chrome. Only the API is a local fixture.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

const frontend = path.resolve(__dirname, '..');
const artifacts = path.join(frontend, 'tmp/manager-merge');
const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
const errors = [], checks = [], requests = [];
const sports = [{ id: 1, name: 'Yoga', status: 'Active' }, { id: 2, name: 'Bơi lội', status: 'Active' }];
const rooms = [{ id: 1, name: 'Phòng kiểm thử', capacity: 30, type: 'Studio', status: 'Active' }];
const coaches = [{ id: 10, fullName: 'Coach Yoga', specialization: 'Yoga', sportIds: [1] }, { id: 11, fullName: 'Coach Bơi', specialization: 'Bơi lội', sportIds: [2] }];
const classes = [
  { id: 1, name: 'Lớp Yoga mới', sportId: 1, sportName: 'Yoga', roomId: 1, roomName: rooms[0].name, capacity: 20, durationMinutes: 60, status: 'Draft', activeScheduleCount: 1 },
  { id: 2, name: 'Lớp đã hủy kiểm thử', sportId: 1, sportName: 'Yoga', capacity: 20, durationMinutes: 60, status: 'Cancelled' }
];
const member = { memberId: 1, userId: 3, memberCode: 'MEM-TEST', fullName: 'Hội viên kiểm thử', email: 'member@example.test', accountStatus: 'Active' };
const staff = { userId: 10, fullName: 'Coach Yoga', email: 'coach@example.test', roleName: 'Coach', status: 'Active', specialization: 'Yoga', sportIds: [1] };
let subscriptionFailure = true, browser, socket, cdp, origin;

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
    if (route === '/api/auth/login') return json(res, { accessToken: 'manager-fixture-token' });
    if (req.headers.authorization !== 'Bearer manager-fixture-token') return json(res, { message: 'Unauthorized' }, 401);
    if (route === '/api/profile/me') return json(res, { userId: 99, role: 'Manager', status: 'Active', centerId: 1, fullName: 'Manager kiểm thử', email: 'manager@example.test' });
    if (route === '/api/access/me/capabilities') return json(res, ['manage_staff', 'manage_members', 'manage_classes', 'manage_packages', 'assign_coach', 'view_reports']);
    if (route === '/api/notifications/me') return json(res, []);
    if (route === '/api/centers/1/audit-logs') return json(res, { items: [], totalCount: 0, pageSize: 50 });
    if (route === '/api/centers/1/members') return json(res, { items: [member], totalCount: 1, pageSize: 20 });
    if (route === '/api/centers/1/members/1' && req.method === 'PATCH') { Object.assign(member, body); return json(res, member); }
    if (route === '/api/members/1/subscriptions') return subscriptionFailure ? json(res, { message: 'Lỗi lịch sử kiểm thử' }, 503)
      : json(res, [{ subscriptionId: 1, packageName: 'Gói kiểm thử', price: 123456, durationDays: 30, status: 'Active', startDate: today, endDate: today, createdAt: `${today}T08:00:00Z` }]);
    if (route === '/api/centers/1/staff') return json(res, { items: [staff], totalCount: 1, pageSize: 100 });
    if (route === '/api/centers/1/staff/10' && req.method === 'PATCH') { Object.assign(staff, body); return json(res, staff); }
    if (route === '/api/centers/1/classes/all') return json(res, classes);
    if (route === '/api/centers/1/rooms') return json(res, rooms);
    if (route === '/api/centers/1/sports' || route === '/api/centers/1/sports/all') return json(res, sports);
    if (route === '/api/centers/1/coaches') return json(res, coaches);
    if (route === '/api/classes/2/restore') { classes[1].status = 'Draft'; return json(res, classes[1]); }
    if (route === '/api/classes/1/schedules') return json(res, [{ id: 1, dayOfWeek: 1, startTime: '08:00:00', endTime: '09:00:00', roomId: 1, status: 'Active', startDate: today, endDate: today }]);
    if (route === '/api/classes/1/coaches') { classes[0].coachId = body.coachId; classes[0].coachName = 'Coach Yoga'; return json(res, {}); }
    if (route === '/api/centers/1/membership-packages' || route === '/api/centers/1/membership-packages/all') return json(res, []);
    if (route === '/api/reports/revenue') return json(res, { net: 90000, gross: 100000, refunds: 10000, periods: [{ periodStart: today, net: 90000, gross: 100000, refunds: 10000 }] });
    if (route === '/api/reports/revenue-by-sport') return json(res, { allocatedNet: 12345, unallocatedNet: 77655, sports: [{ sportId: 1, sportName: 'Yoga', net: 12345, gross: 12345, refunds: 0, share: 13.7 }] });
    if (route === '/api/reports/membership') return json(res, { totalMembers: 1, activeMembers: 1, newMembers: 1, periods: [{ periodStart: today, newMembers: 1 }] });
    if (route === '/api/reports/classes') return json(res, { currentStatusCounts: { Booked: 4 }, periods: [] });
    if (route === '/api/reports/checkins') return json(res, { count: 0 });
    if (route === '/api/class-sessions') return json(res, { items: [{ sessionId: 1, classId: 1, className: classes[0].name, sportName: 'Yoga', roomId: 1, capacity: 20, bookedCount: 4, sessionDate: today }], totalCount: 1, pageSize: 100 });
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
let session;
async function evaluate(expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true }, session);
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function click(label, scope = 'document') {
  await evaluate(`(() => { const button = [...${scope}.querySelectorAll('button')].find(b => !b.disabled && b.textContent.trim().endsWith(${JSON.stringify(label)})); if (!button) throw Error('Missing button: ' + ${JSON.stringify(label)}); button.click(); })()`);
}
async function setInput(selector, value) {
  await evaluate(`(() => { const input = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
}
async function route(hash, text) {
  await evaluate(`location.hash = ${JSON.stringify(hash)}`);
  await until(text, () => evaluate(`document.querySelector('main')?.textContent.includes(${JSON.stringify(text)})`));
  await delay(200);
}
async function closeDialog() {
  await evaluate(`document.querySelector('[role=dialog] button[aria-label="Đóng"]').click()`);
  await until('dialog closed', () => evaluate(`!document.querySelector('[role=dialog]')`));
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
  await setInput('#login-email', 'manager@example.test'); await setInput('#login-password', 'TestPassword123!');
  await evaluate(`document.querySelector('button[type=submit]').click()`);
  await until('authenticated', () => evaluate(`location.hash === '#/manager/dashboard'`));

  await route('#/manager/members', member.fullName);
  await click('Sửa', 'document.querySelector("main")');
  await until('member edit', () => evaluate(`Boolean(document.querySelector('[role=dialog] input[name=email]'))`));
  assert.equal(await evaluate(`document.querySelector('[role=dialog] input[name=email]').readOnly`), true);
  await evaluate(`document.querySelector('[role=dialog] form').requestSubmit()`);
  await until('member saved', () => requests.some(r => r.route === '/api/centers/1/members/1' && r.method === 'PATCH'));
  assert.equal(Object.hasOwn(requests.find(r => r.route === '/api/centers/1/members/1').body, 'email'), false);
  await until('member dialog closed', () => evaluate(`!document.querySelector('[role=dialog]')`));
  checks.push('Editing a member keeps email read-only and omits it from the API payload');
  await until('member list refreshed', () => evaluate(`Boolean(document.querySelector('main button[title*="lịch sử"]'))`));
  await evaluate(`document.querySelector('main button[title*="lịch sử"]').click()`);
  await until('history error', () => evaluate(`document.querySelector('[role=dialog]')?.textContent.includes('Lỗi lịch sử kiểm thử')`));
  subscriptionFailure = false; await click('Thử lại', 'document.querySelector("[role=dialog]")');
  await until('history retry', () => evaluate(`document.querySelector('[role=dialog]')?.textContent.includes('Gói kiểm thử')`));
  await closeDialog(); checks.push('Subscription history renders errors and retries successfully');

  await route('#/manager/staff', staff.fullName);
  await click('Sửa', 'document.querySelector("main")');
  await until('staff edit', () => evaluate(`Boolean(document.querySelector('[role=dialog] button[aria-pressed]'))`));
  assert.equal(await evaluate(`document.querySelector('[role=dialog] button[aria-pressed]').getAttribute('aria-pressed')`), 'true');
  await evaluate(`document.querySelector('[role=dialog] form').requestSubmit()`);
  await until('staff saved', () => requests.some(r => r.route === '/api/centers/1/staff/10' && r.method === 'PATCH'));
  assert.deepEqual(requests.find(r => r.route === '/api/centers/1/staff/10').body.sportIds, [1]);
  await until('staff dialog closed', () => evaluate(`!document.querySelector('[role=dialog]')`));
  checks.push('Staff screen loads its sport catalog and preserves selected sport IDs when saving');

  await route('#/manager/classes-rooms', classes[0].name);
  assert.equal(await evaluate(`document.querySelector('main').textContent.includes('Lớp đã hủy kiểm thử')`), false);
  await click('Lịch học', 'document.querySelector("main")');
  await until('weekly calendar', () => evaluate(`Boolean(document.querySelector('[aria-label="Lịch học theo tuần"]'))`));
  assert.equal(await evaluate(`document.querySelector('[aria-label="Lịch học theo tuần"]').querySelectorAll('h4').length`), 7);
  assert.equal(await evaluate(`document.querySelector('[role=dialog]').textContent.includes('08:00–09:00') && document.querySelector('[role=dialog]').textContent.includes('Phòng kiểm thử')`), true);
  await closeDialog();
  await evaluate(`(() => { const b=[...document.querySelectorAll('main button')].find(b=>b.textContent.includes('Lớp đã hủy')); b.click(); })()`);
  await until('cancelled tab', () => evaluate(`document.querySelector('main').textContent.includes('Lớp đã hủy kiểm thử')`));
  await click('Mở lại lớp', 'document.querySelector("main")');
  await click('Mở lại thành bản nháp', 'document.querySelector("[role=dialog]")');
  await until('restored', () => classes[1].status === 'Draft');
  checks.push('Cancelled classes have a separate tab, can be restored, and schedules render all seven weekdays');

  await route('#/manager/coach-assignment', classes[0].name);
  await setInput('main input', classes[0].name);
  await until('assignment search applied', () => evaluate(`!document.querySelector('main').textContent.includes('Lớp đã hủy kiểm thử')`));
  await click('Phân công ngay', 'document.querySelector("main")');
  await until('assignment dialog', () => evaluate(`Boolean(document.querySelector('[role=dialog] select'))`));
  assert.equal(await evaluate(`document.querySelector('[role=dialog] option[value="11"]').disabled`), true);
  assert.equal(await evaluate(`document.querySelectorAll('[role=dialog]').length`), 1);
  await evaluate(`document.querySelector('[role=dialog] form').requestSubmit()`);
  await until('coach assigned', () => classes[0].coachId === 10);
  assert.equal(requests.find(r => r.route === '/api/classes/1/coaches').body.replacePrimary, true);
  checks.push('Coach assignment opens one modal, disables incompatible coaches, and retains replacePrimary');

  await route('#/manager/reports', 'Doanh Thu Theo Bộ Môn');
  await until('report data', () => evaluate(`document.querySelector('main').textContent.includes('12.345')`));
  assert.equal(await evaluate(`(() => { const section=[...document.querySelectorAll('main section')].find(s=>s.textContent.includes('Biểu Đồ Xếp Hạng Bộ Môn')); return section.textContent.includes('12.345') && !section.textContent.includes('90.000'); })()`), true);
  await click('Hôm nay', 'document.querySelector("main")');
  await until('daily report', () => requests.some(r => r.route === '/api/reports/revenue' && r.query.from === today && r.query.to === today));
  checks.push('Report rankings show API sport revenue, and the daily filter sends the correct date range');

  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true }, session);
  for (const [hash, text] of [['members', member.fullName], ['staff', staff.fullName], ['classes-rooms', classes[0].name], ['coach-assignment', classes[0].name], ['reports', 'Doanh Thu Theo Bộ Môn'], ['packages', 'Gói']]) await route(`#/manager/${hash}`, text);
  checks.push('All six affected manager routes render at a mobile viewport');
  assert.deepEqual(errors, []);
  checks.push('No uncaught JavaScript exceptions or unexpected API endpoints');
  fs.writeFileSync(path.join(artifacts, 'report.json'), JSON.stringify({ checks, errors, api: 'Local fixtures; no live backend used', viewport: [375, 812] }, null, 2));
  console.log(`PASS: ${checks.length} browser checks\n${checks.map(check => `- ${check}`).join('\n')}`);
})().catch(async error => {
  console.error(error.stack);
  console.error(JSON.stringify({ checks, errors, lastRequests: requests.slice(-6), dialog: cdp && session ? await evaluate(`document.querySelector('[role=dialog]')?.textContent`).catch(() => '') : '' }, null, 2));
  process.exitCode = 1;
}).finally(async () => {
  if (cdp) { await cdp.send('Browser.close').catch(() => {}); socket.close(); }
  if (browser && browser.exitCode === null) browser.kill();
  server.closeAllConnections(); server.close();
});
