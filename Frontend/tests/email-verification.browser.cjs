// Real React/Chrome flow with a local API fixture. SQL and delivery are exercised separately by LogicAudit.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

const frontend = path.resolve(__dirname, '..');
const artifacts = path.join(frontend, 'tmp/email-verification');
const dist = path.join(artifacts, 'dist');
const requests = [], checks = [], errors = [];
let browser, socket, cdp, session, failEmail = false;
function json(res, value, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}
const server = http.createServer(async (req, res) => {
  const route = new URL(req.url, 'http://fixture').pathname;
  if (route.startsWith('/api/')) {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : null;
    requests.push({ route, body });
    if (route === '/api/auth/request-email-verification') return json(res, { message: failEmail ? 'Không gửi được email' : 'Kiểm tra hộp thư' }, failEmail ? 503 : 200);
    if (route === '/api/auth/register') {
      if (body.emailOtp !== '123456') return json(res, { message: 'Mã xác thực email không đúng.' }, 400);
      return json(res, { memberCode: 'MB-AUDIT' }, 201);
    }
    if (route === '/api/auth/request-password-reset') return json(res, { message: 'Nếu email tồn tại, mã đã được gửi.', developmentOtp: null });
    if (route === '/api/auth/reset-password') {
      if (body.otp !== '654321') return json(res, { message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.' }, 400);
      res.writeHead(204); return res.end();
    }
    if (route === '/api/auth/login') return json(res, { accessToken: 'browser-fixture-token' });
    if (route === '/api/profile/me') return json(res, { userId: 42, fullName: 'Hội viên kiểm thử', email: 'member@example.test', role: 'Member', status: 'Active', memberCode: 'MB-AUDIT', centerId: 15 });
    if (route === '/api/members/me') return json(res, { memberId: 7 });
    if (route === '/api/access/me/capabilities') return json(res, []);
    if (route === '/api/landing-content') return json(res, { content: null });
    return json(res, []);
  }
  const file = path.join(dist, route.startsWith('/assets/') ? route : 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8');
  res.end(fs.readFileSync(file));
});
class CDP {
  constructor() {
    this.sequence = 0; this.pending = new Map();
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id); if (!pending) return;
        clearTimeout(pending.timer); this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message)); else pending.resolve(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
      this.pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(label, predicate) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) { if (await predicate()) return; await delay(100); }
  throw new Error(`Timed out: ${label}`);
}
async function evaluate(expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true }, session);
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function input(selector, value) {
  await evaluate(`(() => { const input = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
}
async function click(label) {
  await evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(b => !b.disabled && b.textContent.includes(${JSON.stringify(label)})); if (!button) throw Error('Missing button'); button.click(); })()`);
}
async function submit(scope = 'form') {
  await evaluate(`document.querySelector(${JSON.stringify(scope)}).requestSubmit()`);
}
async function screenshot(name, width, height) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 }, session);
  await delay(300);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `${name} horizontal overflow`);
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, session);
  fs.writeFileSync(path.join(artifacts, name + '.png'), Buffer.from(result.data, 'base64'));
}

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const build = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', dist], {
    cwd: frontend, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, VITE_API_BASE_URL: '/api', VITE_GOOGLE_CLIENT_ID: '', VITE_SPORTS_CENTER_ID: '15' }
  });
  let output = ''; build.stdout.on('data', chunk => output += chunk); build.stderr.on('data', chunk => output += chunk);
  assert.equal(await new Promise((resolve, reject) => { build.on('exit', resolve); build.on('error', reject); }), 0, output);
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
  cdp = new CDP();
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  ({ sessionId: session } = await cdp.send('Target.attachToTarget', { targetId, flatten: true }));
  await cdp.send('Runtime.enable', {}, session); await cdp.send('Page.enable', {}, session);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, session);
  await cdp.send('Page.navigate', { url: `${origin}/#/register` }, session);
  await until('registration', () => evaluate('Boolean(document.querySelector("#register-email"))'));
  await input('#register-name', 'Hội viên kiểm thử'); await input('#register-email', 'member@example.test');
  await input('#register-password', 'Valid_Register42!'); await input('#register-confirm', 'Valid_Register42!');
  await evaluate('document.querySelector("#register-agree").click()');
  failEmail = true; await submit();
  await until('delivery failure shown', () => evaluate('document.querySelector("[role=alert]")?.textContent.includes("Không gửi được email")'));
  assert.equal(await evaluate('Boolean(document.querySelector("#register-otp"))'), false);
  failEmail = false; await submit();
  await until('OTP step', () => evaluate('Boolean(document.querySelector("#register-otp"))'));
  assert.equal(requests.filter(r => r.route === '/api/auth/register').length, 0);
  assert.equal(await evaluate('document.activeElement.id'), 'register-otp');
  checks.push('Registration requests delivery first, keeps failures retryable, and focuses the OTP field.');
  await submit();
  assert.equal(requests.filter(r => r.route === '/api/auth/register').length, 0);
  await input('#register-otp', '000000'); await submit();
  await until('wrong OTP error', () => evaluate('document.querySelector("[role=alert]")?.textContent.includes("không đúng")'));
  assert.equal(await evaluate('location.hash'), '#/register');
  await screenshot('register-otp-desktop', 1440, 1000);
  await screenshot('register-otp-tablet', 768, 1024);
  await screenshot('register-otp-mobile', 375, 1000);
  checks.push('Missing and incorrect OTPs preserve the form; registration has no horizontal overflow at 1440, 768, and 375px.');
  assert.equal(await evaluate('[...document.querySelectorAll("button")].find(b => b.textContent.includes("Gửi lại mã sau")).disabled'), true);
  await input('#register-email', 'changed@example.test');
  assert.equal(await evaluate('Boolean(document.querySelector("#register-otp"))'), false);
  await input('#register-email', 'member@example.test'); await submit();
  await until('OTP requested again', () => evaluate('Boolean(document.querySelector("#register-otp"))'));
  await input('#register-otp', '123456'); await submit();
  await until('registered and logged in', () => evaluate('location.hash.startsWith("#/member/")'));
  assert.equal(requests.filter(r => r.route === '/api/auth/register').at(-1).body.emailOtp, '123456');
  checks.push('Changing email discards the previous challenge; a valid OTP is sent with registration and then logs in.');
  await evaluate('sessionStorage.clear(); location.hash = "#/login?logout=true"');
  await until('login', () => evaluate('Boolean(document.querySelector("#login-email"))'));
  await click('Quên mật khẩu?');
  await input('[role=dialog] input[type=email]', 'member@example.test'); await submit('[role=dialog] form');
  await until('reset OTP', () => evaluate('Boolean(document.querySelector("#reset-otp"))'));
  assert.equal(await evaluate('document.body.textContent.includes("Development:")'), false);
  await input('#reset-otp', '000000'); await input('#reset-new-password', 'Valid_Reset42!'); await input('#reset-confirm-password', 'Valid_Reset42!');
  await submit('[role=dialog] form');
  await until('bad reset OTP response', () => requests.filter(r => r.route === '/api/auth/reset-password').length === 1);
  await until('reset retry enabled', () => evaluate('!document.querySelector("[role=dialog] button[type=submit]").disabled'));
  await screenshot('reset-otp-mobile', 375, 1000);
  await input('#reset-otp', '654321'); await submit('[role=dialog] form');
  await until('reset complete', () => evaluate('!document.querySelector("[role=dialog]") && document.querySelector("#login-email").value === "member@example.test"'));
  checks.push('Password reset reads the emailed code, allows retry after rejection, and returns to login after success.');
  assert.deepEqual(errors, []);
  checks.push('No uncaught browser JavaScript exceptions.');
  fs.writeFileSync(path.join(artifacts, 'report.json'), JSON.stringify({ checks, errors, api: 'Local fixture. Delivery and persistence tested separately by LogicAudit.' }, null, 2));
  console.log(`PASS ${checks.length} browser checks\n${checks.join('\n')}`);
})().catch(error => { console.error(error.stack); process.exitCode = 1; }).finally(async () => {
  if (cdp) { await cdp.send('Browser.close').catch(() => {}); socket.close(); }
  if (browser && browser.exitCode === null) browser.kill();
  server.closeAllConnections(); server.close();
});
