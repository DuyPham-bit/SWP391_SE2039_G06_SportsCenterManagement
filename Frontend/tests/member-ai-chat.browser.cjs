// Member AI chat: history stored in the DB must reappear in a fresh tab / after signing in again.
// Runs the real React build against an isolated HTTP API fixture; no live data is changed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { browserCredential } = require('./browser-auth-fixture.cjs');

const frontend = path.resolve(__dirname, '..');
const artifacts = path.join(frontend, 'tmp/member-ai-chat');
const token = role => `fixture.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, role })).toString('base64url')}.fixture`;
const memberToken = token('Member');
const memberSession = '3'.repeat(32);
// The DB already holds one conversation with an exchange from a previous session.
const dbMessages = [
  { id: 1, sender: 'user', text: 'Câu hỏi cũ đã lưu trong DB', createdAt: '2026-11-10T08:00:00' },
  { id: 2, sender: 'ai', text: 'Câu trả lời cũ đã lưu trong DB', createdAt: '2026-11-10T08:00:05' }
];
const requests = [], errors = [], checks = [];
let browser, socket, session, cdp;

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
    requests.push({ route, method: req.method, body });
    if (browserCredential(req) !== memberToken) return json(res, { message: 'Unauthorized' }, 401);
    if (route === '/api/profile/me') return json(res, { userId: 122, role: 'Member', status: 'Active', centerId: 1, fullName: 'Học viên AI' });
    if (route === '/api/access/me/capabilities') return json(res, ['ask_ai_assistant', 'use_coach_portal']);
    if (route === '/api/members/me') return json(res, { memberId: 22 });
    if (route === '/api/ai/conversations/latest') return json(res, { conversationId: 5, messages: dbMessages });
    if (route === '/api/ai/conversations/5/messages') return json(res, dbMessages);
    if (route === '/api/ai/chat' && req.method === 'POST') {
      const next = dbMessages.length + 1;
      dbMessages.push({ id: next, sender: 'user', text: body.message, createdAt: '2026-11-11T08:00:00' },
        { id: next + 1, sender: 'ai', text: 'Phản hồi mới', createdAt: '2026-11-11T08:00:01' });
      return json(res, { conversationId: 5, reply: 'Phản hồi mới' });
    }
    // Other member-area widgets are irrelevant here; answer with empty data.
    if (req.method === 'GET') return json(res, []);
    return json(res, {}, 204);
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
const bodyHas = text => evaluate(`document.body.textContent.includes(${JSON.stringify(text)})`);
const openPopup = () => evaluate(`window.dispatchEvent(new CustomEvent('SCMS_OPEN_AI_POPUP', { detail: {} }))`);

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
  await cdp.send('Network.setCookie', { name: `scms.session.${memberSession}`, value: memberToken, url: origin, path: '/api', httpOnly: true, sameSite: 'Strict' }, session);
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `if (location.origin === ${JSON.stringify(origin)} && !sessionStorage.getItem('scms.auth.tab.v1')) sessionStorage.setItem('scms.auth.tab.v1', ${JSON.stringify(memberSession)});` }, session);

  for (const [label, hash] of [['member dashboard', '#/member/dashboard'], ['member coach portal', '#/member/coach-portal']]) {
    // Fresh tab: the AI chat cache in sessionStorage is empty, as after logout + login.
    await cdp.send('Page.navigate', { url: `${origin}/${hash}` }, session);
    await until(`${label} loaded`, () => evaluate(`Boolean(document.querySelector('main'))`));
    await evaluate(`Object.keys(sessionStorage).filter(k => k.startsWith('SCMS_MEMBER_AI')).forEach(k => sessionStorage.removeItem(k)); location.reload()`);
    await until(`${label} reloaded`, () => evaluate(`Boolean(document.querySelector('main'))`));
    await until(`${label}: latest conversation requested`, () => requests.some(x => x.route === '/api/ai/conversations/latest'));
    await delay(1500); // let every mount-time effect (user refresh, language, storage sync) settle
    await openPopup();
    await until(`${label}: DB history shown in popup`, () => bodyHas('Câu trả lời cũ đã lưu trong DB'));
    checks.push(`${label}: history stored in the DB is restored in a fresh tab`);
    requests.length = 0;
  }

  // A new question continues the restored conversation instead of starting another one.
  await evaluate(`(() => { const input = [...document.querySelectorAll('input,textarea')].find(x => /AI|hỏi|Hỏi/.test(x.placeholder || '')); const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value').set; setter.call(input, 'Câu hỏi mới'); input.dispatchEvent(new Event('input', { bubbles: true })); input.form ? input.form.requestSubmit() : input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); })()`);
  await until('chat request sent', () => requests.some(x => x.route === '/api/ai/chat'));
  assert.equal(requests.find(x => x.route === '/api/ai/chat').body.conversationId, '5');
  await until('new reply rendered with history', async () => await bodyHas('Phản hồi mới') && await bodyHas('Câu trả lời cũ đã lưu trong DB'));
  checks.push('A new question continues the restored DB conversation');

  // Same-tab reload: the Vietnamese tab cache (welcome text contains "mã thẻ") must be reused, not discarded.
  requests.length = 0;
  await evaluate(`location.reload()`);
  await until('reloaded', () => evaluate(`Boolean(document.querySelector('main'))`));
  await delay(1500);
  await openPopup();
  await until('cached history after reload', async () => await bodyHas('Phản hồi mới') && await bodyHas('Câu trả lời cũ đã lưu trong DB'));
  assert.equal(requests.some(x => x.route === '/api/ai/conversations/latest'), false, 'tab cache should be used without refetching');
  checks.push('Same-tab reload keeps the cached Vietnamese conversation');

  assert.deepEqual(errors, []);
  console.log(`PASS: ${checks.length} browser checks\n${checks.map(x => `- ${x}`).join('\n')}`);
})().catch(async error => {
  console.error(error.stack);
  const state = cdp && session ? await evaluate(`({ welcomeShown: document.body.textContent.includes('Trợ lý Thể thao AI SCMS'),
    aiStorage: Object.fromEntries(Object.keys(sessionStorage).filter(k => k.startsWith('SCMS_MEMBER_AI')).map(k => [k, sessionStorage.getItem(k).slice(0, 160)])) })`).catch(e => e.message) : null;
  console.error(JSON.stringify({ checks, errors, state, lastRequests: requests.slice(-8).map(x => `${x.method} ${x.route}`) }, null, 2));
  process.exitCode = 1;
}).finally(async () => {
  if (cdp) { await cdp.send('Browser.close').catch(() => {}); socket.close(); }
  if (browser && browser.exitCode === null) browser.kill();
  server.closeAllConnections(); server.close();
  // Throwaway Chrome profiles contain Chrome's own API keys; remove them so secret scans stay clean.
  await delay(500);
  for (const dir of fs.existsSync(artifacts) ? fs.readdirSync(artifacts) : []) {
    if (dir.startsWith('chrome-')) fs.rmSync(path.join(artifacts, dir), { recursive: true, force: true, maxRetries: 5 });
  }
});
