// Runs the production React app in Chrome; only the API is a local, isolated fixture.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

const frontend = path.resolve(__dirname, '..');
const artifacts = path.join(frontend, 'tmp/landing-content');
const dist = path.join(artifacts, 'dist');
const errors = [], checks = [];
const galleryFiles = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1, fileId: `gallery-${index}`, fileName: `photo-${index}.${index < 4 ? 'jpg' : 'avif'}`,
  mimeType: index < 4 ? 'image/jpeg' : 'image/avif', fileSize: 1024,
  url: `https://gallery.example/photo-${index}.${index < 4 ? 'jpg' : 'avif'}`
}));
let published = null, saves = 0, failSave = false, browser, socket, cdp;

function json(res, value, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}
const server = http.createServer(async (req, res) => {
  const route = new URL(req.url, 'http://fixture').pathname;
  if (route.startsWith('/api/')) {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : null;
    if (route === '/api/landing-content' && req.method === 'GET') return json(res, { content: published });
    if (route === '/api/auth/login') return json(res, { accessToken: 'manager-test-token' });
    if (req.headers.authorization !== 'Bearer manager-test-token') return json(res, { message: 'Unauthorized' }, 401);
    if (route === '/api/profile/me') return json(res, { userId: 99, role: 'Manager', status: 'Active', centerId: 1, fullName: 'Manager test', email: 'manager@example.test' });
    if (route === '/api/access/me/capabilities') return json(res, ['manage_landing_content']);
    if (route === '/api/notifications/me') return json(res, []);
    if (route === '/api/landing-content' && req.method === 'PUT') {
      saves++;
      if (failSave) return json(res, { message: 'Simulated save failure' }, 503);
      published = body.content;
      return json(res, { content: published });
    }
    if (route === '/api/media/status') return json(res, { isConnected: true, totalImages: galleryFiles.length, folderId: 'fixture-folder' });
    if (route === '/api/media/drive-files') return json(res, galleryFiles);
    if (route.endsWith('/audit-logs')) return json(res, { items: [], totalCount: 0 });
    if (route.includes('/reports/')) return json(res, { periods: [], currentStatusCounts: {} });
    return json(res, { items: [], totalCount: 0 });
  }
  const file = path.join(dist, route === '/' ? 'index.html' : route);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream');
  let content = fs.readFileSync(file);
  if (file.endsWith('.html')) content = content.toString().replace(/<script src="https:[^"]+"><\/script>/g, '')
    .replace(/<link[^>]+https:[^>]+>/g, '').replace('tailwind.config =', 'window.tailwind = {}; tailwind.config =');
  res.end(content);
});

class CDP {
  constructor() {
    this.sequence = 0; this.pending = new Map();
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id); this.pending.delete(message.id);
        if (!pending) return;
        clearTimeout(pending.timer);
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
async function evaluate(session, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true }, session);
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function attach(targetId) {
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  await cdp.send('Runtime.enable', {}, sessionId);
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Network.enable', {}, sessionId);
  await cdp.send('Network.setBlockedURLs', { urls: ['https://*'] }, sessionId);
  return sessionId;
}
async function setInput(session, inputExpression, value) {
  await evaluate(session, `(() => { const input = ${inputExpression}; if (!input) throw Error('Input missing'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
}
async function click(session, label) {
  await evaluate(session, `(() => { const button = [...document.querySelectorAll('button')].find(b => !b.disabled && b.textContent.includes(${JSON.stringify(label)})); if (!button) throw Error('Missing button'); button.click(); })()`);
}
const titleInput = value => `[...document.querySelectorAll('main input')].find(input => input.value === ${JSON.stringify(value)})`;

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const build = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', dist], {
    cwd: frontend, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, VITE_API_BASE_URL: '/api', VITE_GOOGLE_CLIENT_ID: '' }
  });
  let output = ''; build.stdout.on('data', chunk => output += chunk); build.stderr.on('data', chunk => output += chunk);
  const code = await new Promise((resolve, reject) => { build.on('exit', resolve); build.on('error', reject); });
  assert.equal(code, 0, output);
  console.log('Production frontend built; starting Chrome.');
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const profile = path.join(artifacts, `chrome-${Date.now()}`);
  browser = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  browser.on('error', error => errors.push(error.message));
  await until('Chrome start', () => fs.existsSync(path.join(profile, 'DevToolsActivePort')));
  const port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim();
  const info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  socket = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chrome WebSocket connection timed out')), 15000);
    socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener('error', error => { clearTimeout(timer); reject(error); }, { once: true });
  });
  cdp = new CDP();
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const manager = await attach(targetId);
  await cdp.send('Page.navigate', { url: `${origin}/#/login` }, manager);
  await until('login', () => evaluate(manager, `Boolean(document.querySelector('#login-email'))`));
  await setInput(manager, `document.querySelector('#login-email')`, 'manager@example.test');
  await setInput(manager, `document.querySelector('#login-password')`, 'Password123!');
  await evaluate(manager, `document.querySelector('button[type=submit]').click()`);
  await until('authenticated', () => evaluate(manager, `location.hash === '#/manager/dashboard'`));
  await evaluate(manager, `location.hash = '#/manager/home-content'`);
  const originalTitle = 'SHAPING RESILIENCE THROUGH SPORTS';
  await until('editor loaded', () => evaluate(manager, `Boolean(${titleInput(originalTitle)})`));
  console.log('Manager editor loaded; checking preview and publishing.');
  await setInput(manager, titleInput(originalTitle), 'Isolated preview draft');
  await click(manager, 'Xem Trước Trang Chủ');
  let previewId;
  await until('preview opened', async () => {
    previewId = (await cdp.send('Target.getTargets')).targetInfos.find(target => target.url.includes('#/?preview=1'))?.targetId;
    return Boolean(previewId);
  });
  const preview = await attach(previewId);
  await until('preview draft rendered', () => evaluate(preview, `document.querySelector('h1')?.textContent.includes('Isolated preview draft')`));
  assert.equal(saves, 0); assert.equal(published, null);
  checks.push('Preview opens the draft in a separate tab without publishing.');

  const { browserContextId } = await cdp.send('Target.createBrowserContext');
  const { targetId: visitorId } = await cdp.send('Target.createTarget', { url: 'about:blank', browserContextId });
  const visitor = await attach(visitorId);
  await cdp.send('Page.navigate', { url: `${origin}/#/` }, visitor);
  await until('visitor sees defaults', () => evaluate(visitor, `document.querySelector('h1')?.textContent.includes(${JSON.stringify(originalTitle)})`));
  await cdp.send('Page.bringToFront', {}, manager);
  await click(manager, 'Lưu Toàn Bộ Thay Đổi');
  await until('save completed', () => evaluate(manager, `!document.querySelector('main fieldset')?.disabled && !document.querySelector('main')?.textContent.includes('Có thay đổi chưa lưu')`));
  assert.equal(published.heroBanner.title, 'Isolated preview draft');
  await cdp.send('Page.bringToFront', {}, visitor);
  await evaluate(visitor, `window.dispatchEvent(new Event('focus'))`);
  await until('independent visitor sees publication', () => evaluate(visitor, `document.querySelector('h1')?.textContent.includes('Isolated preview draft')`));
  checks.push('A visitor with isolated browser storage receives published content from the API.');

  await cdp.send('Page.bringToFront', {}, manager);
  await setInput(manager, titleInput('Isolated preview draft'), 'Unsaved failure draft');
  failSave = true;
  await click(manager, 'Lưu Toàn Bộ Thay Đổi');
  await until('save error', () => evaluate(manager, `document.querySelector('[role=alert]')?.textContent.includes('Simulated save failure')`));
  assert.equal(published.heroBanner.title, 'Isolated preview draft');
  assert.equal(await evaluate(manager, `document.querySelector('main').textContent.includes('Có thay đổi chưa lưu')`), true);
  checks.push('Save failure keeps the draft dirty and leaves published content unchanged.');
  await click(manager, 'Khôi Phục Gốc');
  await click(manager, 'Đồng Ý Khôi Phục');
  await until('reset failure completed', () => evaluate(manager, `!document.querySelector('main fieldset').disabled`));
  assert.equal(await evaluate(manager, `Boolean(${titleInput('Unsaved failure draft')})`), true);
  assert.equal(published.heroBanner.title, 'Isolated preview draft');
  checks.push('Failed reset preserves the unsaved draft.');
  failSave = false;
  await click(manager, 'Đồng Ý Khôi Phục');
  await until('reset completed', () => evaluate(manager, `Boolean(${titleInput(originalTitle)})`));
  const metric = published.heroBanner.metrics[0].value;
  await setInput(manager, titleInput(metric), 'Modified metric');
  await click(manager, 'Khôi Phục Gốc');
  await click(manager, 'Đồng Ý Khôi Phục');
  await until('nested defaults restored', () => evaluate(manager, `!document.querySelector('main fieldset').disabled && Boolean(${titleInput(metric)})`));
  assert.equal(published.heroBanner.metrics[0].value, metric);
  checks.push('Repeated reset restores nested metrics to the original defaults.');

  for (const label of ['2. Tại Sao Chọn SCMS', '3. Thẻ Môn Thể Thao', '4. Thẻ Cụm Sân', '5. Sơ Đồ Phân Khu', '6. Banner Kêu Gọi & Footer']) {
    await click(manager, label); await delay(100);
  }
  checks.push('All six editor tabs render without JavaScript errors.');

  const zaloPhone = '0901234567';
  const zaloLabel = `Zalo: ${zaloPhone}`;
  const zaloUrl = 'https://zalo.me/0901234567';
  const facebookUrl = 'https://www.facebook.com/scms-test-center';
  await setInput(manager, `document.querySelector('#footer-zalo-phone')`, ' +84 901 234 567 ');
  await setInput(manager, `document.querySelector('#footer-facebook-url')`, facebookUrl);
  await click(manager, 'Xem Trước Trang Chủ');
  let contactPreviewId;
  await until('contact preview opened', async () => {
    contactPreviewId = (await cdp.send('Target.getTargets')).targetInfos.find(target => target.url.includes('#/?preview=1') && target.targetId !== previewId)?.targetId;
    return Boolean(contactPreviewId);
  });
  const contactPreview = await attach(contactPreviewId);
  const footerLink = label => `[...document.querySelectorAll('footer a')].find(link => link.textContent.trim() === ${JSON.stringify(label)})`;
  await until('contact preview rendered', () => evaluate(contactPreview, `Boolean(${footerLink(zaloLabel)}) && Boolean(${footerLink('Facebook')})`));
  assert.equal(published.ctaAndFooter.contactZaloPhone, '');
  checks.push('Contact links appear in the draft preview without publishing.');

  await click(manager, 'Lưu Toàn Bộ Thay Đổi');
  await until('contact links saved', () => published.ctaAndFooter.contactZaloPhone === zaloPhone && published.ctaAndFooter.contactFacebookUrl === facebookUrl);
  await cdp.send('Page.reload', {}, visitor);
  await until('visitor sees contact links', () => evaluate(visitor, `Boolean(${footerLink(zaloLabel)}) && Boolean(${footerLink('Facebook')})`));
  for (const [label, url] of [[zaloLabel, zaloUrl], ['Facebook', facebookUrl]]) {
    assert.deepEqual(await evaluate(visitor, `(() => { const link = ${footerLink(label)}; return { href: link.href, target: link.target, rel: link.rel }; })()`), { href: url, target: '_blank', rel: 'noopener noreferrer' });
  }
  await evaluate(manager, `location.hash = '#/manager/dashboard'`);
  await until('manager leaves editor', () => evaluate(manager, `!document.querySelector('main fieldset')`));
  await evaluate(manager, `location.hash = '#/manager/home-content'`);
  await until('editor reloads', () => evaluate(manager, `!document.querySelector('main fieldset')?.disabled && Boolean(${titleInput(originalTitle)})`));
  await click(manager, '6. Banner Kêu Gọi & Footer');
  assert.equal(await evaluate(manager, `document.querySelector('#footer-zalo-phone').value`), zaloPhone);
  assert.equal(await evaluate(manager, `document.querySelector('#footer-facebook-url').value`), facebookUrl);
  checks.push('Both contact links persist after reopening the editor and reloading an independent visitor.');

  const savesBeforeInvalidLink = saves;
  await setInput(manager, `document.querySelector('#footer-zalo-phone')`, '090abc1234');
  await click(manager, 'Lưu Toàn Bộ Thay Đổi');
  await until('invalid Zalo phone rejected', () => evaluate(manager, `document.querySelector('[role=alert]')?.textContent.includes('Số điện thoại Zalo')`));
  assert.equal(saves, savesBeforeInvalidLink);
  assert.equal(published.ctaAndFooter.contactZaloPhone, zaloPhone);
  await setInput(manager, `document.querySelector('#footer-zalo-phone')`, zaloPhone);
  await setInput(manager, `document.querySelector('#footer-facebook-url')`, 'javascript:alert(1)');
  await click(manager, 'Lưu Toàn Bộ Thay Đổi');
  await until('invalid contact URL rejected', () => evaluate(manager, `document.querySelector('[role=alert]')?.textContent.includes('Facebook')`));
  assert.equal(saves, savesBeforeInvalidLink);
  assert.equal(published.ctaAndFooter.contactFacebookUrl, facebookUrl);
  await setInput(manager, `document.querySelector('#footer-zalo-phone')`, '');
  await setInput(manager, `document.querySelector('#footer-facebook-url')`, '');
  await click(manager, 'Lưu Toàn Bộ Thay Đổi');
  await until('empty contact links saved', () => published.ctaAndFooter.contactZaloPhone === '' && published.ctaAndFooter.contactFacebookUrl === '');
  await cdp.send('Page.reload', {}, visitor);
  await until('visitor loaded after clearing links', () => evaluate(visitor, `Boolean(document.querySelector('footer'))`));
  assert.equal(await evaluate(visitor, `Boolean(${footerLink(zaloLabel)}) || Boolean(${footerLink('Facebook')})`), false);
  checks.push('Invalid Zalo phones and Facebook URLs cannot publish; clearing them hides the corresponding contacts.');

  await click(manager, '1. Hero Banner');
  await click(manager, 'Tải/Đổi Ảnh');
  await until('all gallery images rendered', () => evaluate(manager, `document.querySelectorAll('p[title^="photo-"]').length === 7`));
  for (const file of galleryFiles.filter(file => file.mimeType === 'image/avif')) {
    assert.equal(await evaluate(manager, `Boolean(document.querySelector(${JSON.stringify(`p[title="${file.fileName}"]`)}))`), true);
  }
  checks.push('The media picker renders all seven API images, including three AVIF images.');
  assert.deepEqual(errors, []);
  console.log(`PASS: ${checks.length} browser checks\n${checks.map(check => `- ${check}`).join('\n')}`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (socket) socket.close();
  if (browser && browser.exitCode === null) browser.kill();
  await new Promise(resolve => server.close(resolve));
});
