// Uses the running frontend and intercepts every API request in a private Chrome profile.
// No authentication, invoice or payment request reaches the real backend.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const origin = process.env.SCMS_TEST_BASE_URL || 'http://localhost:3004';
const artifacts = path.resolve(__dirname, '../tmp/invoices-browser');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(action, label) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) { if (await action()) return; await pause(80); }
  throw new Error(`Timed out: ${label}`);
}
const rows = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1, invoiceNumber: `SC-FIXTURE-${index + 1}`, memberName: `Member ${index + 1}`,
  memberCode: `FIX-${index + 1}`, totalAmount: 1800000, issuedAt: '2026-10-20T02:00:00Z',
  status: index === 1 ? 'Voided' : index === 2 ? 'Issued' : 'Paid'
}));
const details = row => ({
  ...row, centerName: 'Fixture Center', centerAddress: 'Fixture address', issuedAtUtc: row.issuedAt,
  subtotal: 1800000, discount: 0, tax: 0, amountPaid: row.status === 'Paid' ? 1800000 : 0,
  outstandingBalance: row.status === 'Paid' ? 0 : 1800000,
  items: [{ description: `Package for ${row.invoiceNumber}`, quantity: 1, unitPrice: 1800000, amount: 1800000 }],
  payments: row.status === 'Paid' ? [{ id: row.id, transactionCode: `TX-${row.id}`, paymentMethod: 'CASH', status: 'Succeeded', amount: 1800000, paidAtUtc: row.issuedAt, refunds: [] }] : []
});
(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const profile = path.join(artifacts, `chrome-${Date.now()}`);
  const browser = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  const checks = [], errors = [], requests = [];
  let socket, send, held, delayNext = false, failNext = false;
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    await until(() => fs.existsSync(portFile), 'Chrome startup');
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim();
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    let sequence = 0;
    const pending = new Map();
    send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
      pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
    });
    const fulfill = (requestId, value, responseCode = 200) => send('Fetch.fulfillRequest', {
      requestId, responseCode, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
      body: Buffer.from(JSON.stringify(value)).toString('base64')
    });
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const item = pending.get(message.id); if (!item) return;
        pending.delete(message.id); clearTimeout(item.timer);
        if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
      else if (message.method === 'Fetch.requestPaused') {
        const { requestId, request } = message.params;
        const route = new URL(request.url).pathname.replace('/api/', '');
        requests.push({ route, method: request.method });
        let value = [], status = 200;
        if (route === 'profile/me') value = { userId: 99999, role: 'Receptionist', status: 'Active', centerId: 15, fullName: 'Fixture Receptionist' };
        else if (route === 'access/me/capabilities') value = ['register_counter_package'];
        else if (route === 'centers/15/invoices') value = { items: rows, totalCount: 41, page: 1, pageSize: 20 };
        else if (route.startsWith('invoices/')) {
          const number = decodeURIComponent(route.slice('invoices/'.length));
          value = details(rows.find(row => row.invoiceNumber === number));
          if (delayNext) { delayNext = false; held = { requestId, value }; return; }
          if (failNext) { failNext = false; value = { message: 'Invoice temporarily unavailable' }; status = 503; }
        }
        fulfill(requestId, value, status).catch(error => errors.push(error.message));
      }
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const screenshot = async file => {
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      fs.writeFileSync(path.join(artifacts, file), Buffer.from(shot.data, 'base64'));
    };
    await send('Page.enable'); await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send('Fetch.enable', { patterns: [{ urlPattern: `${origin}/api/*`, requestStage: 'Request' }] });
    const token = `e30.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, sub: '99999' })).toString('base64url')}.fixture`;
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `sessionStorage.setItem('scms.auth.token.v1', ${JSON.stringify(token)}); localStorage.setItem('SCMS_LANGUAGE','en');` });
    await send('Page.navigate', { url: `${origin}/#/receptionist/invoices` });
    await until(() => evaluate(`document.querySelectorAll('main tbody tr').length === 20`), '20-row invoice list');
    await evaluate(`document.querySelector('main tbody tr button').focus(); document.querySelector('main tbody tr button').click()`);
    await until(() => evaluate(`document.body.textContent.includes('Package for SC-FIXTURE-1')`), 'first invoice API details');
    await screenshot('first-invoice.png');
    assert.equal(await evaluate(`Boolean(document.querySelector('[role="dialog"]'))`), true, 'View must open a visible dialog, not details hidden below 20 rows');
    const bounds = await evaluate(`(() => { const r=document.querySelector('[role="dialog"]').getBoundingClientRect(); return {top:r.top,bottom:r.bottom}; })()`);
    assert.ok(bounds.top >= 0 && bounds.bottom <= 1000, JSON.stringify(bounds));
    assert.ok(await evaluate(`document.querySelector('[role="dialog"]').textContent.includes('TX-1')`));
    checks.push('View opens the requested invoice visibly above the long list, including saved items and payments.');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await until(() => evaluate(`!document.querySelector('[role="dialog"]')`), 'Escape closes dialog');
    assert.equal(await evaluate(`document.activeElement === document.querySelector('main tbody tr button')`), true);
    await evaluate(`document.querySelectorAll('main tbody tr button')[1].click()`);
    await until(() => evaluate(`document.querySelector('[role="dialog"]')?.textContent.includes('Package for SC-FIXTURE-2')`), 'second invoice');
    assert.equal(await evaluate(`document.querySelector('[role="dialog"] form') !== null`), false);
    assert.equal(await evaluate(`document.querySelector('[role="dialog"]').textContent.includes('Package for SC-FIXTURE-1')`), false);
    await evaluate(`document.querySelector('[role="dialog"] button[aria-label="Đóng"]').click()`);
    checks.push('Close restores focus; selecting another invoice replaces details and never offers collection for a voided invoice.');
    failNext = true;
    await evaluate(`document.querySelectorAll('main tbody tr button')[2].click()`);
    await until(() => evaluate(`document.querySelector('[role="dialog"] [role="alert"]')?.textContent.includes('Invoice temporarily unavailable')`), 'API error inside dialog');
    await evaluate(`document.querySelector('[role="dialog"] [role="alert"] button').click()`);
    await until(() => evaluate(`document.querySelector('[role="dialog"]')?.textContent.includes('Package for SC-FIXTURE-3')`), 'retry same invoice');
    assert.equal(await evaluate(`!!document.querySelector('[role="dialog"] form')`), true);
    await evaluate(`document.querySelector('[role="dialog"] button[aria-label="Đóng"]').click()`);
    checks.push('API errors and retry stay visible; retry loads the same invoice and retains the existing unpaid-balance form.');
    delayNext = true;
    await evaluate(`document.querySelector('main tbody tr button').click()`);
    await until(() => evaluate(`!!document.querySelector('[role="dialog"] [role="status"]')`), 'loading dialog');
    await until(() => held, 'held detail response');
    await evaluate(`document.querySelector('[role="dialog"] button[aria-label="Đóng"]').click()`);
    await until(() => evaluate(`!document.querySelector('[role="dialog"]') && !document.querySelectorAll('main tbody tr button')[1].disabled`), 'list usable after closing loading invoice');
    await evaluate(`document.querySelectorAll('main tbody tr button')[1].click()`);
    await until(() => evaluate(`document.querySelector('[role="dialog"]')?.textContent.includes('Package for SC-FIXTURE-2')`), 'new selection while old request pending');
    await fulfill(held.requestId, held.value);
    await pause(150);
    assert.ok(await evaluate(`document.querySelector('[role="dialog"]').textContent.includes('Package for SC-FIXTURE-2')`));
    checks.push('Closing during loading invalidates the old response so it cannot replace a newer selection.');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await pause(200); await screenshot('invoice-mobile.png');
    const mobile = await evaluate(`(() => {const r=document.querySelector('[role="dialog"]').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};})()`);
    assert.ok(mobile.left >= 0 && mobile.right <= 390 && mobile.top >= 0 && mobile.bottom <= 844, JSON.stringify(mobile));
    assert.equal(requests.some(request => request.method !== 'GET'), false);
    assert.deepEqual(errors, []);
    checks.push('Mobile dialog fits the viewport; opening, retrying and closing issue only GET requests.');
    fs.writeFileSync(path.join(artifacts, 'report.json'), JSON.stringify({ checks, errors, requests }, null, 2));
    console.log(`PASS: ${checks.length} browser checks\n${checks.map(check => `- ${check}`).join('\n')}`);
  } catch (error) {
    if (send) { try { const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(artifacts,'failure.png'),Buffer.from(shot.data,'base64')); } catch {} }
    throw error;
  } finally { if (socket) socket.close(); browser.kill(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
