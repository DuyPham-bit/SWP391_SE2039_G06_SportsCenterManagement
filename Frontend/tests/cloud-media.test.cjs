const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { transformSync } = require('esbuild');

function loadService(fetchImpl) {
  const context = vm.createContext({
    module: { exports: {} }, FormData, File, console, fetch: fetchImpl,
    require: () => ({ apiRequest: async () => {}, getApiToken: () => 'manager-token', getApiUrl: route => '/api/' + route })
  });
  const source = fs.readFileSync(path.join(__dirname, '../src/services/r2ImageStorage.js'), 'utf8');
  vm.runInContext(transformSync(source, { format: 'cjs' }).code, context);
  return context.module.exports;
}
test('R2 upload keeps relative key distinct from derived rendering URL', async () => {
  const api = loadService(async (url, options) => {
    assert.equal(url, '/api/r2-images/dashboard');
    assert.equal(options.headers.Authorization, 'Bearer manager-token');
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
