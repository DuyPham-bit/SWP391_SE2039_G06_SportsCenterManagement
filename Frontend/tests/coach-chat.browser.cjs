// Run the real React app against an isolated HTTP API fixture; no live data is changed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

const frontend = path.resolve(__dirname, '..');
const artifacts = path.join(frontend, 'tmp/coach-chat');
const clients = [
  { id: 21, userId: 121, fullName: 'Học viên đầu tiên' },
  { id: 22, userId: 122, fullName: 'Học viên nhắn tin' }
];
const coaches = [{ id: 10, userId: 110, fullName: 'HLV kiểm thử' }, { id: 11, userId: 111, fullName: 'HLV khác' }];
const messages = [{ id: 1, coachId: 10, memberId: 22, senderUserId: 122, content: 'alo HLV Nam', createdAt: '2026-10-22T15:00:15Z' }];
const requests = [], errors = [], checks = [];
const token = role => `fixture.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, role })).toString('base64url')}.fixture`;
const coachToken = token('Coach'), memberToken = token('Member');
let browser, socket, session, cdp, failMessages = false, failSend = false;

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
    const isMember = req.headers.authorization === `Bearer ${memberToken}`;
    requests.push({ route, method: req.method, body });
    if (route === '/api/profile/me') return json(res, { userId: isMember ? 122 : 110, role: isMember ? 'Member' : 'Coach', status: 'Active', centerId: 1, fullName: isMember ? clients[1].fullName : coaches[0].fullName });
    if (route === '/api/access/me/capabilities') return json(res, [isMember ? 'use_coach_portal' : 'manage_coach_workspace']);
    if (route === '/api/members/me') return json(res, { memberId: 22 });
    if (route === '/api/members/22/subscriptions') return json(res, []);
    if (route === '/api/notifications/me') return json(res, [{ id: 91, title: 'Tin nhắn mới từ chương trình huấn luyện', content: isMember ? 'HLV trả lời học viên' : 'alo HLV Nam', notificationType: 'CoachChat', senderId: isMember ? 110 : 122, createdAt: '2026-10-22T15:00:15Z', isRead: true }]);
    if (route.endsWith('/read') || route.endsWith('/read-all')) return json(res, {}, 204);
    if (route === '/api/coaches/me/professional') return json(res, {
      profile: { id: 10, userId: 110, fullName: coaches[0].fullName }, clients,
      threads: [{ memberId: 22, unread: 1 }], kpi: {}, events: [], classSessions: [], leaves: [],
      exercises: [], homework: [], nutritionPlans: [], resources: [], rooms: [], reviews: []
    });
    if (route === '/api/members/me/coach-portal') return json(res, {
      member: { id: 22, userId: 122 }, coaches: [...coaches].reverse(), events: [], assignments: [], nutritionPlans: [], foodDiary: [], reviews: []
    });
    if (req.method === 'GET' && route.endsWith('/messages')) {
      if (failMessages) return json(res, { message: 'Không tải được hội thoại kiểm thử' }, 503);
      const memberId = isMember ? 22 : Number(route.match(/members\/(\d+)/)[1]);
      const coachId = isMember ? Number(route.match(/coaches\/(\d+)/)[1]) : 10;
      return json(res, messages.filter(x => x.memberId === memberId && x.coachId === coachId));
    }
    if (req.method === 'POST' && (route === '/api/coaches/me/messages' || route === '/api/members/me/coach-messages')) {
      if (failSend) return json(res, { message: 'Không gửi được tin kiểm thử' }, 503);
      const message = { ...body, id: messages.length + 1, senderUserId: isMember ? 122 : 110, createdAt: new Date().toISOString() };
      messages.push(message); return json(res, { id: message.id });
    }
    errors.push(`Unexpected API: ${req.method} ${route}`);
    return json(res, { message: 'Unexpected fixture endpoint' }, 404);
  }
  if (route === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  const file = path.join(artifacts, 'dist', route.startsWith('/assets/') ? route : 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8');
  let content = fs.readFileSync(file);
  if (file.endsWith('.html')) content = content.toString().replace(/<script src="https:[^"]+"><\/script>/g, '')
    .replace(/<link[^>]+https:[^>]+>/g, '').replace('tailwind.config =', 'window.tailwind = {}; tailwind.config =');
  res.end(content);
});
class CDP {
  constructor(ws) {
    this.id = 0; this.pending = new Map();
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const task = this.pending.get(message.id); this.pending.delete(message.id);
        if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
      this.pending.set(id, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject: error => { clearTimeout(timeout); reject(error); } });
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
async function evaluate(expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true }, session);
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function clickText(text) {
  await evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(x => !x.disabled && x.textContent.includes(${JSON.stringify(text)})); if (!button) throw Error('Missing button'); button.click(); })()`);
}
async function typeMessage(value) {
  await evaluate(`(() => { const input = document.querySelector('main form input[placeholder]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
}

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  if (!process.argv.includes('--skip-build')) {
    const build = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', path.join(artifacts, 'dist')], {
      cwd: frontend, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, VITE_API_BASE_URL: '/api', VITE_GOOGLE_CLIENT_ID: '' }
    });
    let output = ''; build.stdout.on('data', chunk => output += chunk); build.stderr.on('data', chunk => output += chunk);
    assert.equal(await new Promise((resolve, reject) => { build.on('exit', resolve); build.on('error', reject); }), 0, output);
  }
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
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
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `if (location.origin === ${JSON.stringify(origin)} && !sessionStorage.getItem('scms.auth.token.v1')) sessionStorage.setItem('scms.auth.token.v1', ${JSON.stringify(coachToken)});` }, session);
  await cdp.send('Page.navigate', { url: `${origin}/#/coach/professional?tab=communication&senderUserId=122` }, session);
  await until('coach reply composer and notified student', () => evaluate(`Boolean(document.querySelector('input[placeholder="Nhập tin nhắn hướng dẫn, nhắc nhở học viên..."]')) && document.querySelector('main').textContent.includes('alo HLV Nam')`));
  assert.equal(await evaluate(`document.querySelector('main select').value`), '22');
  checks.push('Direct chat link opens the reply composer and selects the notified student');
  await typeMessage('HLV trả lời học viên');
  await evaluate(`document.querySelector('main form').requestSubmit()`);
  await until('coach reply rendered', () => evaluate(`document.querySelector('main').textContent.includes('HLV trả lời học viên')`));
  assert.deepEqual(requests.find(x => x.route === '/api/coaches/me/messages').body, { coachId: 10, memberId: 22, content: 'HLV trả lời học viên' });
  checks.push('Coach reply uses the existing scoped API and appears in conversation history');
  await evaluate(`document.querySelector('button[aria-label="Thông báo"]').click()`);
  await clickText('Tin nhắn mới từ chương trình huấn luyện');
  await until('notification closes', () => evaluate(`document.querySelector('button[aria-label="Thông báo"]').getAttribute('aria-expanded') === 'false'`));
  checks.push('Previously read chat notifications still open the conversation and close the dropdown');
  failSend = true;
  await typeMessage('Nội dung giữ lại khi lỗi');
  await evaluate(`document.querySelector('main form').requestSubmit()`);
  await until('send error surfaced', () => evaluate(`document.body.textContent.includes('Không gửi được tin kiểm thử')`));
  assert.equal(await evaluate(`document.querySelector('main form input[placeholder]').value`), 'Nội dung giữ lại khi lỗi');
  failSend = false;
  checks.push('Failed sends show an error and preserve the draft for retry');
  failMessages = true;
  await evaluate(`(() => { const select = document.querySelector('main select'); select.value = '21'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await until('load error surfaced', () => evaluate(`document.querySelector('main').textContent.includes('Không tải được hội thoại kiểm thử')`));
  assert.equal(await evaluate(`document.querySelector('main').textContent.includes('alo HLV Nam')`), false);
  failMessages = false;
  checks.push('Switching students clears old history and displays loading failures');
  await evaluate(`sessionStorage.setItem('scms.auth.token.v1', ${JSON.stringify(memberToken)}); location.hash = '#/member/coach-portal'; location.reload()`);
  await until('member portal', () => evaluate(`document.querySelector('main')?.textContent.includes('HLV')`));
  await evaluate(`document.querySelector('button[aria-label="Thông báo"]').click()`);
  await clickText('Tin nhắn mới từ chương trình huấn luyện');
  await until('member reply conversation', () => evaluate(`Boolean(document.querySelector('input[placeholder="Nhắn HLV..."]')) && document.querySelector('main').textContent.includes('HLV trả lời học viên')`));
  assert.equal(await evaluate(`document.querySelector('main select').value`), '10');
  await typeMessage('Học viên phản hồi tiếp');
  await evaluate(`document.querySelector('main form').requestSubmit()`);
  await until('member reply rendered', () => evaluate(`document.querySelector('main').textContent.includes('Học viên phản hồi tiếp')`));
  checks.push('Member notification selects the replying coach and supports a reply in the same thread');
  await evaluate(`(() => { const select = document.querySelector('main select'); select.value = '11'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await until('different coach selected', () => evaluate(`location.hash.includes('senderUserId=111') && !document.querySelector('main').textContent.includes('HLV trả lời học viên')`));
  await evaluate(`document.querySelector('button[aria-label="Thông báo"]').click()`);
  await clickText('Tin nhắn mới từ chương trình huấn luyện');
  await until('notification reselects original coach', () => evaluate(`document.querySelector('main select').value === '10' && document.querySelector('main').textContent.includes('HLV trả lời học viên')`));
  checks.push('Opening the notification again after switching coaches restores the correct conversation');
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(artifacts, 'report.json'), JSON.stringify({ checks, errors, api: 'Isolated fixtures; live backend not used' }, null, 2));
  console.log(`PASS: ${checks.length} browser checks\n${checks.map(x => `- ${x}`).join('\n')}`);
})().catch(async error => {
  console.error(error.stack);
  console.error(JSON.stringify({ checks, errors, lastRequests: requests.slice(-6), page: cdp && session ? await evaluate(`document.querySelector('main')?.textContent.slice(0, 1200)`).catch(() => '') : '' }, null, 2));
  process.exitCode = 1;
}).finally(async () => {
  if (cdp) { await cdp.send('Browser.close').catch(() => {}); socket.close(); }
  if (browser && browser.exitCode === null) browser.kill();
  server.closeAllConnections(); server.close();
});
