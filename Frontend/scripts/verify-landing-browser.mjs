import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const artifacts = '.validation/landing-import/browser';
await fs.mkdir(artifacts, { recursive: true });
const profile = path.resolve(artifacts, 'profile-' + Date.now());
const browser = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'],
  { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
const errors = [];
try {
  let port;
  for (let i = 0; i < 100; i++) {
    try { port = (await fs.readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0].trim(); break; }
    catch { await delay(100); }
  }
  assert.ok(port, 'Chrome started');
  const info = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json();
  socket = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id) {
      const operation = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) operation.reject(new Error(msg.error.message)); else operation.resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown')
      errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++sequence; pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });
  const target = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  const evaluate = async expression => (await send('Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise: true }, sessionId)).result.value;
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Page.navigate', { url: 'http://localhost:3004/' }, sessionId);
  let state;
  for (let i = 0; i < 150; i++) {
    await evaluate("document.querySelectorAll('img').forEach(x=>x.loading='eager')");
    state = await evaluate("({images:[...document.images].filter(x=>x.src.includes('/dashboard/')).map(x=>({src:x.src,loaded:x.complete&&x.naturalWidth>0})),title:document.title})");
    if (state.images.length >= 20 && state.images.every(x => x.loaded)) break;
    await evaluate("window.scrollBy(0,500)");
    await delay(200);
  }
  if (state.images.length < 20 || errors.length) {
    const diagnostic = await evaluate("({url:location.href,text:document.body.innerText.slice(0,2500),images:[...document.images].map(x=>x.src)})");
    await fs.writeFile(path.join(artifacts, 'failure.json'), JSON.stringify({ state, errors, diagnostic }, null, 2));
    console.log(JSON.stringify({ state, errors, diagnostic }));
  }
  assert.ok(state.images.length >= 20, 'Landing R2 images rendered');
  assert.ok(state.images.every(x => x.loaded), 'No broken R2 images');
  assert.equal(errors.length, 0, errors.join('\n'));
  await evaluate('window.scrollTo(0,0)');
  await delay(200);
  const desktop = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
  await fs.writeFile(path.join(artifacts, 'desktop.png'), Buffer.from(desktop.data, 'base64'));
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId);
  await evaluate('window.scrollTo(0,0)');
  await delay(300);
  const mobile = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
  await fs.writeFile(path.join(artifacts, 'mobile.png'), Buffer.from(mobile.data, 'base64'));
  await fs.writeFile(path.join(artifacts, 'result.json'), JSON.stringify({ ...state, errors }, null, 2));
  console.log('PASS: ' + state.images.length + ' R2 image elements loaded; no JS exceptions; desktop/mobile screenshots saved.');
} finally { socket?.close(); browser.kill(); }
