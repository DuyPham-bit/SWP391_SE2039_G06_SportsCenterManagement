const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { transformSync } = require('esbuild');

function loadService(fetchImpl, service = 'r2ImageStorage.js') {
  const context = vm.createContext({
    module: { exports: {} }, FormData, File, console, fetch: fetchImpl,
    require: () => ({ apiRequest: async (route, options) => {
      const response = await fetchImpl('/api/' + route, options);
      return response.json();
    } })
  });
  const source = fs.readFileSync(path.join(__dirname, '../src/services', service), 'utf8');
  vm.runInContext(transformSync(source, { format: 'cjs' }).code, context);
  return context.module.exports;
}
test('R2 upload keeps relative key distinct from derived rendering URL', async () => {
  const api = loadService(async (url, options) => {
    assert.equal(url, '/api/r2-images/dashboard');
    assert.equal(options.headers, undefined);
    assert.equal(options.body.get('file').name, 'photo.jpg');
    return { ok: true, json: async () => ({ key: 'dashboard/example.jpg', publicUrl: 'https://cdn.example/dashboard/example.jpg' }) };
  });
  const result = await api.uploadDashboardImage(new File(['image'], 'photo.jpg', { type: 'image/jpeg' }));
  assert.equal(result.key, 'dashboard/example.jpg');
  assert.equal(result.publicUrl, 'https://cdn.example/dashboard/example.jpg');
});
test('reject unsupported extensions, MIME mismatch, empty and oversized files before network upload', async () => {
  let calls = 0;
  const api = loadService(async () => { calls++; throw new Error('unexpected upload'); });
  for (const file of [
    new File(['image'], 'photo.avif', { type: 'image/avif' }),
    new File(['html'], 'photo.html', { type: 'image/jpeg' }),
    new File([], 'photo.jpg', { type: 'image/jpeg' }),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'photo.jpg', { type: 'image/jpeg' })
  ]) await assert.rejects(api.uploadDashboardImage(file));
  assert.equal(calls, 0);
});
test('network failure remains a failed upload', async () => {
  const api = loadService(async () => { throw new Error('API offline'); });
  await assert.rejects(api.uploadDashboardImage(new File(['image'], 'photo.webp', { type: 'image/webp' })), /API offline/);
});

test('refund evidence uses the shared session API and retains the private relative key', async () => {
  const api = loadService(async (url, options) => {
    assert.equal(url, '/api/refund-bills');
    assert.equal(options.method, 'POST');
    assert.equal(options.body.get('file').name, 'proof.png');
    assert.equal(options.headers, undefined);
    return { json: async () => ({ key: 'refund-bills/proof.png' }) };
  }, 'refundBillStorage.js');
  assert.equal(await api.uploadRefundBill(new File(['png'], 'proof.png', { type: 'image/png' })), 'refund-bills/proof.png');
});
