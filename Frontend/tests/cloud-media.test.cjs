const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { transformSync } = require('esbuild');

function loadService(apiRequest, fetchImpl) {
  const context = vm.createContext({
    module: { exports: {} }, FormData, console,
    fetch: fetchImpl,
    require: () => ({ apiRequest, getApiToken: () => 'manager-token', getApiUrl: route => `/api/${route}` })
  });
  const source = fs.readFileSync(path.join(__dirname, '../src/services/cloudMediaStorage.js'), 'utf8');
  vm.runInContext(transformSync(source, { format: 'cjs' }).code, context);
  return context.module.exports;
}

test('the cloud gallery keeps every API item including AVIF rather than limiting the list to four', async () => {
  const files = Array.from({ length: 7 }, (_, index) => ({ fileId: `image-${index}`, fileName: `photo-${index}.${index < 4 ? 'jpg' : 'avif'}` }));
  const api = loadService(async () => files);
  const results = await api.fetchDriveFiles();
  assert.equal(results.length, 7);
  assert.equal(results.filter(file => file.fileName.endsWith('.avif')).length, 3);
});

test('AVIF upload reaches the API while SVG and fake AVIF extensions remain rejected', async () => {
  let requests = 0;
  const api = loadService(async () => [], async (url, options) => {
    requests++;
    assert.equal(url, '/api/media/upload');
    assert.equal(options.headers.Authorization, 'Bearer manager-token');
    return { ok: true, json: async () => ({ url: '/uploads/photo.avif', fileId: 'local_avif', mimeType: 'image/avif' }) };
  });
  const result = await api.uploadMediaFileToCloud(new File(['avif fixture'], 'photo.avif', { type: 'image/avif' }));
  assert.equal(result.type, 'image/avif');
  await assert.rejects(api.uploadMediaFileToCloud(new File(['svg'], 'photo.svg', { type: 'image/svg+xml' })));
  await assert.rejects(api.uploadMediaFileToCloud(new File(['html'], 'payload.html', { type: 'image/avif' })));
  assert.equal(requests, 1);
});
