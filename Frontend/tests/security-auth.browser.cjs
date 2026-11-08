// Real Chrome + production authentication client; API accounts are isolated local fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { apiEntry, SRC: API_SRC } = require('./helpers/apiSources.cjs');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { build } = require('esbuild');

const artifacts = path.resolve(__dirname, '../tmp/security-auth');
const accounts = new Map();
let bundle, chrome, socket, cdp;
const json = (res, body, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
const server = http.createServer(async (req, res) => {
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html');
    return res.end('<script type="module">import {authApi} from "/client.js"; window.auth = authApi;</script>');
  }
  if (req.url === '/client.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(bundle); }
  if (req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }
  const id = req.headers['x-scms-session'];
  const name = `scms.session.${id}`;
  if (req.url === '/api/auth/login') {
    assert.match(id, /^[a-f0-9]{32}$/);
    let body = ''; for await (const chunk of req) body += chunk;
    const email = JSON.parse(body).email;
    const account = { userId: Number(email[0]), email, role: 'Manager', fullName: `Account ${email[0]}` };
    const value = `fixture-${id}`;
    accounts.set(value, account);
    res.setHeader('Set-Cookie', `${name}=${value}; HttpOnly; SameSite=Strict; Path=/api`);
    return json(res, { accessToken: null });
  }
  if (req.url === '/api/auth/logout') {
    res.setHeader('Set-Cookie', `${name}=; Max-Age=0; HttpOnly; SameSite=Strict; Path=/api`);
    res.writeHead(204); return res.end();
  }
  const cookie = (req.headers.cookie || '').split('; ').find(item => item.startsWith(`${name}=`));
  const account = cookie && accounts.get(cookie.slice(name.length + 1));
  if (!id || !account) return json(res, { message: 'Unauthorized' }, 401);
  if (req.url === '/api/profile/me') return json(res, account);
  if (req.url === '/api/access/me/capabilities') return json(res, []);
  return json(res, {}, 404);
});

class CDP {
  constructor() {
    this.next = 0; this.pending = new Map();
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      const task = this.pending.get(message.id);
      if (!task) return;
      clearTimeout(task.timer); this.pending.delete(message.id);
      if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message.result);
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.next;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
      this.pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }
  async evaluate(sessionId, expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(label, condition) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) { if (await condition()) return; await delay(100); }
  throw new Error(`Timed out: ${label}`);
}
async function reload(session) {
  await cdp.send('Page.reload', {}, session);
  await delay(250);
  await until('client after reload', () => cdp.evaluate(session, 'Boolean(window.auth)'));
}

(async () => {
  bundle = (await build({ stdin: { contents: apiEntry(), resolveDir: API_SRC, loader: 'js' },
    bundle: true, write: false, format: 'esm', define: { 'import.meta.env': '{}' } })).outputFiles[0].text;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  fs.mkdirSync(artifacts, { recursive: true });
  const profile = path.join(artifacts, `chrome-${Date.now()}`);
  chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    ['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check',
      '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  await until('Chrome', () => fs.existsSync(path.join(profile, 'DevToolsActivePort')));
  const port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim();
  const info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  socket = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  cdp = new CDP();
  async function openTab() {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Page.navigate', { url: origin }, sessionId);
    await until('auth client', () => cdp.evaluate(sessionId, 'Boolean(window.auth)'));
    return sessionId;
  }
  const first = await openTab(), second = await openTab();
  const login = (session, id) => cdp.evaluate(session, `auth.login('${id}@example.test', 'Browser_Audit42!').then(result => result.user.id)`);
  const current = session => cdp.evaluate(session, 'auth.getCurrentUser().then(user => user?.id ?? null)');
  assert.equal(await login(first, 1), 1); assert.equal(await login(second, 2), 2);
  await reload(first); await reload(second);
  assert.equal(await current(first), 1); assert.equal(await current(second), 2);
  console.log('PASS Chrome: different accounts survive F5 in two tabs sharing cookies.');
  for (const session of [first, second]) {
    assert.equal(await cdp.evaluate(session, 'document.cookie.includes("scms.session.")'), false);
    assert.equal(await cdp.evaluate(session, 'sessionStorage.length'), 1);
    assert.match(await cdp.evaluate(session, 'sessionStorage.getItem("scms.auth.tab.v1")'), /^[a-f0-9]{32}$/);
  }
  const { cookies } = await cdp.send('Storage.getCookies');
  assert.equal(cookies.filter(c => c.name.startsWith('scms.session.') && c.httpOnly && c.sameSite === 'Strict').length, 2);
  console.log('PASS Chrome: JWT cookies are HttpOnly; storage contains only tab selectors.');
  const duplicate = await openTab();
  const originalId = await cdp.evaluate(first, 'sessionStorage.getItem("scms.auth.tab.v1")');
  await cdp.evaluate(duplicate, `sessionStorage.setItem('scms.auth.tab.v1', '${originalId}')`);
  await reload(duplicate); assert.equal(await current(duplicate), 1);
  assert.equal(await login(duplicate, 3), 3); assert.equal(await current(first), 1);
  console.log('PASS Chrome: logging into a copied tab does not replace the original account.');
  await cdp.evaluate(first, 'auth.logout(); true');
  await until('logout cookie removed', async () => !(await cdp.send('Storage.getCookies')).cookies.some(c => c.name === `scms.session.${originalId}`));
  await reload(first); await reload(second);
  assert.equal(await current(first), null); assert.equal(await current(second), 2);
  console.log('PASS Chrome: logout removes only its tab session.');
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(async () => {
  if (cdp) await cdp.send('Browser.close').catch(() => {});
  socket?.close(); chrome?.kill(); server.closeAllConnections(); server.close();
});
