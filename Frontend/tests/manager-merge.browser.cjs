// Exercise the production React app in Chrome. Only the API is a local fixture.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { issueBrowserSession, browserCredential } = require('./browser-auth-fixture.cjs');

const frontend = path.resolve(__dirname, '..');
const artifacts = path.join(frontend, 'tmp/manager-merge');
const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
const errors = [], checks = [], requests = [];
const reportsOnly = process.argv.includes('--reports-only');
const previousDay = new Date(new Date(`${today}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10);
let fixtureRole = 'Manager';
const resetRequests = [], resetConfirmations = [];
const sports = [{ id: 1, name: 'Yoga', status: 'Active' }, { id: 2, name: 'Bơi lội', status: 'Active' }];
const rooms = [{ id: 1, name: 'Phòng kiểm thử', capacity: 30, type: 'Studio', status: 'Active' }];
const coaches = [{ id: 10, fullName: 'Coach Yoga', specialization: 'Yoga', sportIds: [1] }, { id: 11, fullName: 'Coach Bơi', specialization: 'Bơi lội', sportIds: [2] }];
const classes = [
  { id: 1, name: 'Lớp Yoga mới', sportId: 1, sportName: 'Yoga', roomId: 1, roomName: rooms[0].name, capacity: 20, durationMinutes: 60, status: 'Draft', activeScheduleCount: 1 },
  { id: 2, name: 'Lớp đã hủy kiểm thử', sportId: 1, sportName: 'Yoga', capacity: 20, durationMinutes: 60, status: 'Cancelled' }
];
const member = { memberId: 1, userId: 3, memberCode: 'MEM-TEST', fullName: 'Hội viên kiểm thử', email: 'member@example.test', accountStatus: 'Active' };
const staff = { userId: 10, fullName: 'Coach Yoga', email: 'coach@example.test', roleName: 'Coach', status: 'Active', specialization: 'Yoga', sportIds: [1] };
const payrollCoach = { userId: 10, fullName: 'HLV Lương Kiểm Thử', role: 'Coach', employeeCode: 'EMP-PAY-01', centerName: 'Cơ sở kiểm thử',
  baseSalary: 8000000, allowance: 0, commissionPerSession: 150000, targetSessions: 20, completedSessions: 12, sessionBonus: 1800000,
  estimatedTotal: 9800000, policyConfigured: true, effectiveFrom: '2026-11-01', effectiveTo: null };
const roleMatrix = [{ roleId: 2, roleName: 'Coach', permissions: [], availablePermissions: [],
  capabilityIds: ['view_teaching_schedule'], availableCapabilities: ['view_teaching_schedule', 'take_attendance'] }];
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
    if (route === '/api/auth/request-password-reset') { resetRequests.push({ res, body }); return; }
    if (route === '/api/auth/reset-password') { resetConfirmations.push({ res, body }); return; }
    if (route === '/api/auth/login') return json(res, issueBrowserSession(req, res, 'manager-fixture-token'));
    if (browserCredential(req) !== 'manager-fixture-token') return json(res, { message: 'Unauthorized' }, 401);
    if (route === '/api/profile/me') return json(res, { userId: 99, role: fixtureRole, status: 'Active', centerId: fixtureRole === 'Manager' ? 1 : null, fullName: 'Manager kiểm thử', email: 'manager@example.test' });
    if (route === '/api/admin/centers') return json(res, [{ id: 1, name: 'Center test', status: 'Active' }]);
    if (route === '/api/access/me/capabilities') return json(res, ['manage_staff', 'manage_members', 'manage_classes', 'manage_packages', 'assign_coach', 'view_reports']);
    if (route === '/api/notifications/me') return json(res, []);
    if (route === '/api/centers/1/roles') return json(res, roleMatrix);
    if (route === '/api/centers/1/user-permissions') return json(res, [{
      userId: 10, fullName: 'Coach Yoga', roleName: 'Coach', status: 'Active',
      availableCapabilities: ['view_teaching_schedule'], capabilityIds: ['view_teaching_schedule'],
      availablePermissions: [], permissionCodes: [], hasCustomOverride: false
    }]);
    if (route === '/api/centers/1/users/10/permissions' && (req.method === 'PUT' || req.method === 'DELETE')) return json(res, {}, 204);
    if (route === '/api/centers/1/roles/2/user-permissions' && req.method === 'DELETE') return json(res, { resetCount: 1 });
    if (route === '/api/centers/1/roles/2/permissions' && req.method === 'PUT') {
      roleMatrix[0].capabilityIds = body.capabilityIds;
      return json(res, roleMatrix[0]);
    }
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
    if (reportsOnly && route === '/api/reports/revenue') {
      const from = url.searchParams.get('from'), to = url.searchParams.get('to');
      const inRange = day => day >= from && day <= to;
      const gross = (inRange(previousDay) ? 650000 : 0) + (inRange(today) ? 3200000 : 0);
      const refunds = inRange(today) ? 650000 : 0;
      return json(res, { gross, refunds, net: gross - refunds, periods: [] });
    }
    if (route === '/api/reports/revenue') return json(res, { net: 90000, gross: 100000, refunds: 10000, periods: [{ periodStart: today, net: 90000, gross: 100000, refunds: 10000 }] });
    if (route === '/api/reports/revenue-by-sport') return json(res, { allocatedNet: 12345, unallocatedNet: 77655, sports: [{ sportId: 1, sportName: 'Yoga', net: 12345, gross: 12345, refunds: 0, share: 13.7 }] });
    if (route === '/api/reports/membership') return json(res, { totalMembers: 1, activeMembers: 1, newMembers: 1, periods: [{ periodStart: today, newMembers: 1 }] });
    if (route === '/api/reports/classes') return json(res, { currentStatusCounts: { Booked: 4 }, periods: [] });
    if (route === '/api/payroll/report') return json(res, { employees: [payrollCoach] });
    if (route === '/api/payroll/staff-policy' && req.method === 'POST') return json(res, {});
    if (route === '/api/reports/operations') return json(res, {
      totalStaff: 2, activeStaff: 2, managerCount: 1, coachCount: 1, receptionistCount: 0,
      totalRooms: 1, activeRooms: 1, sessionsCount: 1, bookedSeats: 4, capacitySeats: 20, occupancyRate: 20,
      classes: [], sports: [], rooms: [], coaches: []
    });
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
        if (!task) return;
        clearTimeout(task.timeout);
        if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timed out: ${method}`)); }, 12000);
      this.pending.set(id, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id, method, params, sessionId }));
    });
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
  await until(text, () => evaluate(`document.querySelector('main')?.textContent.includes(${JSON.stringify(text)})`)).catch(async error => {
    const diag = await evaluate(`JSON.stringify({ hash: location.hash, main: document.querySelector('main')?.innerText.slice(0, 500), body: document.querySelector('main') ? undefined : document.body.innerText.slice(0, 400) })`).catch(e => String(e));
    throw new Error(`${error.message} ${diag} recentRequests=${JSON.stringify(requests.slice(-6).map(r => `${r.method} ${r.route}`))}`);
  });
  await delay(200);
}
async function closeDialog() {
  await evaluate(`document.querySelector('[role=dialog] button[aria-label="Đóng"]').click()`);
  await until('dialog closed', () => evaluate(`!document.querySelector('[role=dialog]')`));
}

async function verifyReportPeriods(hash) {
  await route(hash, 'Doanh Thu Theo Bộ Môn');
  await until('report data', () => evaluate(`document.querySelector('main').textContent.includes('12.345')`));
  if (!reportsOnly) assert.equal(await evaluate(`(() => { const section=[...document.querySelectorAll('main section')].find(s=>s.textContent.includes('Xếp Hạng Bộ Môn')); return section.textContent.includes('12.345') && !section.textContent.includes('90.000'); })()`), true);
  await click('Hôm nay', 'document.querySelector("main")');
  await until('daily report', () => requests.some(r => r.route === '/api/reports/revenue' && r.query.from === today && r.query.to === today));
  await until('daily report loaded', () => evaluate(`!document.querySelector('#btn-print-report').disabled`));
  assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('main input[type=date]'), input => input.value)`), [today, today], 'Quick period must update both visible date inputs');
  const printPeriod = () => evaluate(`document.querySelector('main [class~="print:block"]').textContent`);
  assert.ok((await printPeriod()).includes(`${today} → ${today}`), 'Printed header must use the applied daily period');
  const requestCount = requests.filter(r => r.route === '/api/reports/revenue').length;
  await setInput('main input[type=date]', previousDay);
  assert.ok((await printPeriod()).includes(`${today} → ${today}`), 'Unapplied date edits must not change the printed report period');
  assert.equal(await evaluate(`document.querySelector('main').textContent.includes('Thay đổi khoảng ngày chưa được áp dụng.')`), true);
  assert.equal(requests.filter(r => r.route === '/api/reports/revenue').length, requestCount);
  await click('Áp dụng', 'document.querySelector("main")');
  await until('custom report loaded', () => evaluate(`!document.querySelector('#btn-print-report').disabled && document.querySelector('main [class~="print:block"]').textContent.includes(${JSON.stringify(`${previousDay} → ${today}`)})`));
  if (reportsOnly) assert.equal(await evaluate(`document.querySelector('main').textContent.includes('3.200.000đ')`), true);
  await click('Năm nay', 'document.querySelector("main")');
  await until('yearly report loaded', () => evaluate(`!document.querySelector('#btn-print-report').disabled && document.querySelector('main form select').value === 'month'`));
  assert.equal(await evaluate(`document.querySelector('main input[type=date]').value`), `${today.slice(0, 4)}-01-01`);
  await click('Hôm nay', 'document.querySelector("main")');
  await until('daily grouping restored', () => evaluate(`!document.querySelector('#btn-print-report').disabled && document.querySelector('main form select').value === 'day'`));
  if (reportsOnly) assert.equal(await evaluate(`document.querySelector('main').textContent.includes('2.550.000đ')`), true);
  checks.push(`Report controls synchronize dates/grouping and print the applied period: ${hash}`);
  if (!reportsOnly) checks.push('Report rankings show API sport revenue, and the daily filter sends the correct date range');

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
  if (!reportsOnly) {
    await click('Quên mật khẩu?');
    await setInput('[role=dialog] input[type=email]', 'first@example.test');
    await evaluate(`document.querySelector('[role=dialog] form').requestSubmit(); document.querySelector('[role=dialog] form').requestSubmit()`);
    await until('reset request pending', () => resetRequests.length > 0);
    await delay(150);
    assert.equal(resetRequests.length, 1, 'Duplicate reset requests must be prevented');
    assert.equal(await evaluate(`document.querySelector('[role=dialog] input[type=email]').disabled`), true);
    checks.push('Password reset locks the submitted account and prevents duplicate requests');
    await closeDialog();
    await click('Quên mật khẩu?');
    assert.equal(await evaluate(`document.querySelector('[role=dialog] input[type=email]').value`), '');
    json(resetRequests[0].res, { message: 'Earlier request accepted', developmentOtp: null });
    await delay(150);
    assert.equal(await evaluate(`Boolean(document.querySelector('[role=dialog] input[type=email]'))`), true);
    checks.push('Closing reset clears sensitive state and discards a delayed OTP response');
    await setInput('[role=dialog] input[type=email]', 'second@example.test');
    await evaluate(`document.querySelector('[role=dialog] form').requestSubmit()`);
    await until('second reset request', () => resetRequests.length === 2);
    json(resetRequests[1].res, { message: 'Current request accepted', developmentOtp: null });
    await until('OTP form', () => evaluate(`Boolean(document.getElementById('reset-new-password'))`));
    await setInput('[role=dialog] input[type=text]', '123456');
    await setInput('#reset-new-password', 'Valid_Reset42!');
    await setInput('#reset-confirm-password', 'Valid_Reset42!');
    await evaluate(`document.querySelector('[role=dialog] form').requestSubmit(); document.querySelector('[role=dialog] form').requestSubmit()`);
    await until('confirmation pending', () => resetConfirmations.length > 0);
    await delay(150);
    assert.equal(resetConfirmations.length, 1, 'Duplicate confirmations must be prevented');
    assert.equal(resetConfirmations[0].body.email, 'second@example.test');
    assert.equal(await evaluate(`[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent.includes('Quay lại')).disabled`), true);
    await closeDialog();
    await click('Quên mật khẩu?');
    resetConfirmations[0].res.writeHead(204); resetConfirmations[0].res.end();
    await delay(150);
    assert.equal(await evaluate(`Boolean(document.querySelector('[role=dialog] input[type=email]'))`), true);
    assert.equal(await evaluate(`document.getElementById('login-email').value`), '');
    checks.push('Closing during confirmation discards late success and preserves the newly opened dialog');
    await setInput('[role=dialog] input[type=email]', 'third@example.test');
    await evaluate(`document.querySelector('[role=dialog] form').requestSubmit()`);
    await until('third reset request', () => resetRequests.length === 3);
    json(resetRequests[2].res, { message: 'Gateway unavailable', developmentOtp: null }, 503);
    await until('reset retry enabled', () => evaluate(`!document.querySelector('[role=dialog] button[type=submit]').disabled`));
    assert.equal(await evaluate(`document.querySelector('[role=dialog] input[type=email]').value`), 'third@example.test');
    await evaluate(`document.querySelector('[role=dialog] form').requestSubmit()`);
    await until('retry reset request', () => resetRequests.length === 4);
    json(resetRequests[3].res, { message: 'Request accepted', developmentOtp: null });
    await until('retry OTP form', () => evaluate(`Boolean(document.getElementById('reset-new-password'))`));
    await setInput('[role=dialog] input[type=text]', '654321');
    await setInput('#reset-new-password', 'Valid_Reset42!');
    await setInput('#reset-confirm-password', 'Valid_Reset42!');
    await evaluate(`document.querySelector('[role=dialog] form').requestSubmit()`);
    await until('current confirmation', () => resetConfirmations.length === 2);
    resetConfirmations[1].res.writeHead(204); resetConfirmations[1].res.end();
    await until('reset completed', () => evaluate(`!document.querySelector('[role=dialog]') && document.getElementById('login-email').value === 'third@example.test'`));
    checks.push('Reset API errors keep the form retryable, and only the current completion updates login');
  }
  await setInput('#login-email', 'manager@example.test'); await setInput('#login-password', 'TestPassword123!');
  await evaluate(`document.querySelector('button[type=submit]').click()`);
  await until('authenticated', () => evaluate(`location.hash === '#/manager/dashboard'`));
  await until('manager dashboard loaded', () => evaluate(`
    document.querySelector('main')?.textContent.includes('Bảng Điều Hành Trung Tâm') &&
    !document.querySelector('main')?.textContent.includes('Đang tải dữ liệu bảng điều khiển')
  `));
  assert.ok(requests.some(r => r.route === '/api/reports/revenue'), 'Dashboard must request report data');
  checks.push('Manager dashboard leaves its loading state after report data settles');

  if (!reportsOnly) {
    // Shared UI helpers for the manager screens below.
    const mainHas = text => evaluate(`document.querySelector('main').textContent.includes(${JSON.stringify(text)})`);
    const pressIn = async (scope, text) => {
      const find = `[...document.querySelectorAll(${JSON.stringify(scope + ' button')})].find(b => !b.disabled && b.textContent.includes(${JSON.stringify(text)}))`;
      // find and click in one evaluation so a re-render between the two cannot detach the button
      await until(`button ${text}`, () => evaluate(`(() => { const b = ${find}; if (!b) return false; b.click(); return true; })()`));
    };
    const pressInMain = text => pressIn('main', text);
    const pressTitled = async title => {
      await until(`button titled ${title}`, () => evaluate(`(() => { const b = document.querySelector(${JSON.stringify(`main button[title="${title}"]`)}); if (!b) return false; b.click(); return true; })()`));
    };
    const expectDialog = async (title, extra = null) => {
      await until(`dialog ${title}`, () => evaluate(`document.querySelector('[role=dialog]')?.textContent.includes(${JSON.stringify(title)}) === true`));
      if (extra) await until(`dialog shows ${extra}`, () => evaluate(`document.querySelector('[role=dialog]').textContent.includes(${JSON.stringify(extra)})`));
      await closeDialog();
    };

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

    // Members: search, details, lock confirmation and the add-member form render.
    // member search is server-side: submitting the form sends the query to the API
    await setInput('main input[aria-label="Tìm thành viên"]', 'MEM-TEST');
    await evaluate(`document.querySelector('main input[aria-label="Tìm thành viên"]').form.requestSubmit()`);
    await until('member search request', () => requests.some(r => r.route === '/api/centers/1/members' && r.query.query === 'MEM-TEST'));
    await until('member list back', () => mainHas(member.fullName));
    await pressTitled('Xem chi tiết hồ sơ');
    await expectDialog('Hồ sơ chi tiết thành viên', member.memberCode);
    await pressTitled('Tạm khóa tài khoản');
    await expectDialog('Xác nhận trạng thái tài khoản', member.fullName);
    await pressInMain('Thêm thành viên mới');
    await until('add member form', () => evaluate(`Boolean(document.querySelector('[role=dialog] input[placeholder="ví dụ: nguyenvana"]'))`));
    await closeDialog();
    checks.push('Members: search, details, lock confirmation and the add-member form render');

    await route('#/manager/staff', staff.fullName);
    await click('Sửa', 'document.querySelector("main")');
    await until('staff edit', () => evaluate(`Boolean(document.querySelector('[role=dialog] button[aria-pressed]'))`));
    assert.equal(await evaluate(`document.querySelector('[role=dialog] button[aria-pressed]').getAttribute('aria-pressed')`), 'true');
    await evaluate(`document.querySelector('[role=dialog] form').requestSubmit()`);
    await until('staff saved', () => requests.some(r => r.route === '/api/centers/1/staff/10' && r.method === 'PATCH'));
    assert.deepEqual(requests.find(r => r.route === '/api/centers/1/staff/10').body.sportIds, [1]);
    await until('staff dialog closed', () => evaluate(`!document.querySelector('[role=dialog]')`));
    checks.push('Staff screen loads its sport catalog and preserves selected sport IDs when saving');

    // Staff screen: search, details, lock confirmation and both create modes render.
    await until('staff search box', () => evaluate(`Boolean(document.querySelector('main input[aria-label="Tìm nhân viên"]'))`));
    await setInput('main input[aria-label="Tìm nhân viên"]', 'khong-co-nhan-vien');
    await until('staff empty state', () => mainHas('Không tìm thấy nhân viên nào'));
    await setInput('main input[aria-label="Tìm nhân viên"]', '');
    await until('staff list back', () => mainHas(staff.fullName));
    await pressTitled('Xem chi tiết hồ sơ');
    await expectDialog('Hồ sơ chi tiết nhân viên', staff.email);
    await pressTitled('Khóa nhân viên');
    await expectDialog('Xác nhận trạng thái nhân sự', staff.fullName);
    await pressInMain('Thêm nhân viên mới');
    await until('create staff dialog', () => evaluate(`document.querySelector('[role=dialog]')?.textContent.includes('Thêm nhân sự mới vào trung tâm') === true`));
    await pressIn('[role=dialog]', 'Bổ nhiệm từ hội viên có sẵn');
    await pressIn('[role=dialog]', 'Tạo tài khoản trực tiếp');
    await closeDialog();
    checks.push('Staff: search, details, lock confirmation and both create modes render');

    await route('#/manager/classes-rooms', classes[0].name);
    assert.equal(await evaluate(`document.querySelector('main').textContent.includes('Lớp đã hủy kiểm thử')`), false);
    await click('Lịch học', 'document.querySelector("main")');
    await until('weekly calendar', () => evaluate(`Boolean(document.querySelector('[aria-label="Thời khóa biểu hàng tuần"]'))`));
    assert.equal(await evaluate(`document.querySelector('[aria-label="Thời khóa biểu hàng tuần"]').querySelectorAll('h4').length`), 7);
    assert.equal(await evaluate(`/08:00\\s*–\\s*09:00/.test(document.querySelector('[role=dialog]').textContent) && document.querySelector('[role=dialog]').textContent.includes('Phòng kiểm thử')`), true);
    await closeDialog();
    await evaluate(`(() => { const b=[...document.querySelectorAll('main button')].find(b=>b.textContent.includes('Lớp đã hủy')); b.click(); })()`);
    await until('cancelled tab', () => evaluate(`document.querySelector('main').textContent.includes('Lớp đã hủy kiểm thử')`));
    await click('Mở lại lớp', 'document.querySelector("main")');
    await click('Mở lại thành bản nháp', 'document.querySelector("[role=dialog]")');
    await until('restored', () => classes[1].status === 'Draft');
    checks.push('Cancelled classes have a separate tab, can be restored, and schedules render all seven weekdays');

    // Every tab, view mode, filter and create dialog of the classes & rooms screen renders and responds.
    await pressInMain('Lớp đào tạo');
    await until('active classes tab', () => mainHas(classes[0].name));
    await until('class search box', () => evaluate(`Boolean(document.querySelector('main input[placeholder^="Tìm theo tên lớp"]'))`)).catch(async error => {
      throw new Error(`${error.message} inputs=${await evaluate(`JSON.stringify([...document.querySelectorAll('input')].map(i => i.placeholder))`)}`);
    });
    await setInput('main input[placeholder^="Tìm theo tên lớp"]', 'khong-co-lop-nao');
    await until('search hides classes', async () => !(await mainHas(classes[0].name)));
    await setInput('main input[placeholder^="Tìm theo tên lớp"]', '');
    await until('search cleared', () => mainHas(classes[0].name));
    await evaluate(`document.querySelector('main button[title="Chế độ bảng dữ liệu"]').click()`);
    await until('table view', () => evaluate(`document.querySelector('main table')?.textContent.includes(${JSON.stringify(classes[0].name)}) === true`));
    await evaluate(`document.querySelector('main button[title="Chế độ thẻ trực quan"]').click()`);
    await until('card view', () => evaluate(`!document.querySelector('main table')`));
    await pressInMain('Mở lớp đào tạo mới');
    await expectDialog('Mở Lớp Đào Tạo Mới');
    await pressInMain('Phòng tập & Sân bãi');
    await until('rooms tab', () => mainHas(rooms[0].name));
    await pressInMain('Thêm phòng / Sân mới');
    await expectDialog('Thêm Phòng Tập / Sân Bãi');
    await pressInMain('Bộ môn thể thao');
    await until('sports tab', () => mainHas(sports[1].name));
    await pressInMain('Thêm bộ môn thể thao');
    await expectDialog('Thêm Bộ Môn Thể Thao Mới');
    checks.push('Classes & rooms: tabs, search, card/table views and the class, room and sport dialogs all render');

    // Draft classes are listed under the "pending publication" tab, separate from published ones.
    await route('#/manager/coach-assignment', 'Lớp chờ công bố');
    await evaluate(`[...document.querySelectorAll('main [aria-selected]')].find(b => b.textContent.includes('Lớp chờ công bố')).click()`);
    await until(classes[0].name, () => evaluate(`document.querySelector('main').textContent.includes(${JSON.stringify(classes[0].name)})`));
    await setInput('main input', classes[0].name);
    await until('assignment search applied', () => evaluate(`!document.querySelector('main').textContent.includes('Lớp đã hủy kiểm thử')`));
    await click('Phân công ngay', 'document.querySelector("main")');
    await until('assignment dialog', () => evaluate(`Boolean(document.querySelector('[role=dialog] select'))`));
    assert.equal(await evaluate(`document.querySelector('[role=dialog] option[value="11"]')`), null);
    assert.equal(await evaluate(`Boolean(document.querySelector('[role=dialog] option[value="10"]'))`), true);
    assert.equal(await evaluate(`document.querySelectorAll('[role=dialog]').length`), 1);
    await evaluate(`document.querySelector('[role=dialog] form').requestSubmit()`);
    await until('coach assigned', () => classes[0].coachId === 10);
    assert.equal(requests.find(r => r.route === '/api/classes/1/coaches').body.replacePrimary, true);
    checks.push('Coach assignment opens one modal, filters out incompatible coaches, and retains replacePrimary');

    await route('#/manager/reports', 'Doanh Thu Theo Bộ Môn');
    await until('report data', () => evaluate(`document.querySelector('main').textContent.includes('12.345')`));
    assert.equal(await evaluate(`(() => { const section=[...document.querySelectorAll('main section')].find(s=>s.textContent.includes('Xếp Hạng Bộ Môn')); return section.textContent.includes('12.345') && !section.textContent.includes('90.000'); })()`), true);
    // A single-day report is requested through the custom range form (quick filters start at 30 days).
    await evaluate(`(() => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      for (const input of document.querySelectorAll('main form input[type=date]')) { set.call(input, ${JSON.stringify(today)}); input.dispatchEvent(new Event('input', { bubbles: true })); } })()`);
    await click('Áp dụng', 'document.querySelector("main form")');
    await until('daily report', () => requests.some(r => r.route === '/api/reports/revenue' && r.query.from === today && r.query.to === today));
    checks.push('Report rankings show API sport revenue, and the daily filter sends the correct date range');

    // Every detail table tab renders its own table, and a quick period filter reloads the report.
    for (const [tab, title] of [
      ['🥋 Danh sách Bộ môn', 'Thông số chi tiết từng bộ môn thể thao'],
      ['🏟️ Bảng Sân & Phòng', 'Chi tiết hiệu suất từng sân & phòng tập'],
      ['🧑‍🏫 Hiệu suất HLV', 'Khối lượng giảng dạy và tỷ lệ lấp đầy theo HLV'],
      ['📋 Lịch sử & Đăng ký', 'Bảng đối soát doanh thu theo kỳ'],
      ['🏅 Bảng Lớp học', 'Chi tiết thứ hạng từng lớp học']
    ]) {
      await pressInMain(tab);
      await until(`report table ${tab}`, () => mainHas(title));
    }
    const revenueCalls = requests.filter(r => r.route === '/api/reports/revenue').length;
    await pressInMain('Năm nay');
    await until('yearly report', () => requests.filter(r => r.route === '/api/reports/revenue').length > revenueCalls);
    // The report also requests the previous period (for growth rates), so look for the current-year call among the new ones.
    const yearlyCalls = requests.filter(r => r.route === '/api/reports/revenue').slice(revenueCalls);
    assert.ok(yearlyCalls.some(r => r.query.from === `${today.slice(0, 4)}-01-01` && r.query.to === today), 'Yearly filter must request revenue from 1 January');
    checks.push('Reports: all five detail tables render and the yearly quick filter reloads from 1 January');


    // Role and permission configuration is admin-only (#/admin/roles-permissions); managers must not reach it.
    const permissionRequestsBefore = requests.filter(r => r.route.includes('/permissions')).length;
    await evaluate(`location.hash = '#/manager/roles-permissions'`);
    await until('manager roles route unavailable', () => evaluate(`document.body.innerText.includes('404') && !document.querySelector('main input[type=checkbox]')`));
    assert.equal(requests.filter(r => r.route.includes('/permissions')).length, permissionRequestsBefore);
    checks.push('Managers can no longer open role and permission configuration, which is admin-only');
  }
  if (reportsOnly) {
    await until('dashboard net revenue', () => evaluate(`document.querySelector('main').textContent.includes('3.200.000đ')`));
    assert.equal(await evaluate(`document.querySelector('main').textContent.includes('Tổng thu 3.850.000đ · Hoàn 650.000đ')`), true);
    checks.push('Dashboard displays the complete collection/refund breakdown for the applied period');
  }
  await verifyReportPeriods('#/manager/reports');

  if (!reportsOnly) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true }, session);
    for (const [hash, text] of [['members', member.fullName], ['staff', staff.fullName], ['classes-rooms', classes[0].name], ['coach-assignment', 'Lớp chờ công bố'], ['reports', 'Doanh Thu Theo Bộ Môn'], ['packages', 'Gói']]) await route(`#/manager/${hash}`, text);
    checks.push('All six affected manager routes render at a mobile viewport');
  }
  if (reportsOnly) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true }, session);
    await verifyReportPeriods('#/manager/reports');
    checks.push('Manager report controls work at mobile size');
    fixtureRole = 'Admin';
    await cdp.send('Page.navigate', { url: `${origin}/?audit=admin#/admin/reports` }, session);
    await until('admin report', () => evaluate(`document.querySelector('main')?.textContent.includes('Phạm vi báo cáo hệ thống') && document.querySelector('#btn-print-report') && !document.querySelector('#btn-print-report').disabled`));
    await verifyReportPeriods('#/admin/reports');
    await evaluate(`(() => { const input = document.querySelector('select[aria-label="Cơ sở báo cáo"]'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(input, '1'); input.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await until('admin single center', () => evaluate(`document.querySelector('main')?.textContent.includes('Về tổng quan hệ thống') && !document.querySelector('#btn-print-report').disabled`));
    await verifyReportPeriods('#/admin/reports');
    checks.push('Admin system and individual-center reports use the applied period and refund totals');
  }
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
