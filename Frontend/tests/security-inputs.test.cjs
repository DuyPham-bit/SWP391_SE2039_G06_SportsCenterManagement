const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function client() {
  const calls = [];
  const source = fs.readFileSync(path.join(__dirname, '../src/services/backendApi.js'), 'utf8')
    .replace(/^import .+;\r?\n/gm, '').replaceAll('export const ', 'const ')
    .replaceAll('import.meta.env', '({})');
  const context = vm.createContext({
    getAuthUser: () => ({ centerId: 15 }),
    clearApiSession: () => {},
    apiRequest: async (route, options) => { calls.push({ route, options }); return {}; }
  });
  vm.runInContext(`${source}\nglobalThis.api = { staffApi, receptionApi };`, context);
  return { ...context.api, calls };
}

test('creating staff or members requires an explicit password before sending any request', async () => {
  for (const password of [undefined, null, '', '   ']) {
    const api = client();
    const details = { email: 'new@example.test', fullName: 'New account', password };
    await assert.rejects(api.staffApi.create(details), /mật khẩu/i);
    await assert.rejects(api.receptionApi.createMember(details), /mật khẩu/i);
    assert.equal(api.calls.length, 0);
  }
});

test('account creation sends exactly the chosen password and appointment does not need one', async () => {
  const api = client();
  const password = 'Chosen_Password42!';
  const details = { username: 'new-user', email: 'new@example.test', fullName: 'New account', password };
  await api.staffApi.create({ ...details, role: 'COACH' });
  await api.receptionApi.createMember(details);
  assert.equal(api.calls[0].options.body.password, password);
  assert.equal(api.calls[1].options.body.password, password);
  await api.staffApi.create({ memberId: 25, role: 'COACH' });
  assert.equal(api.calls[2].route, 'centers/15/staff/appointments');
  assert.equal(Object.hasOwn(api.calls[2].options.body, 'password'), false);
});

test('data-driven links only accept HTTP(S), root-relative paths and local anchors', async () => {
  const { safeHref } = await import('../src/services/safeUrl.js');
  for (const value of [
    'https://cdn.example.test/photo.jpg', 'http://localhost:3003/uploads/photo.avif',
    '/uploads/photo.webp?version=2', '#/register', '#khoa-hoc', ' HTTPS://example.test/path '
  ]) assert.equal(safeHref(value), value.trim());
  for (const value of [
    null, undefined, {}, '', '   ', 'javascript:alert(1)', 'JaVaScRiPt:alert(1)',
    'java\nscript:alert(1)', '\tjavascript:alert(1)', 'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)', 'file:///etc/passwd', 'blob:https://example.test/123',
    '//evil.example.test/path', '/\\evil.example.test/path', 'https://trusted.test@evil.test/path',
    'https:evil.test', 'https://', 'https://example.test:99999', 'https://example.test\u0000'
  ]) assert.equal(safeHref(value), undefined, String(value));
});
