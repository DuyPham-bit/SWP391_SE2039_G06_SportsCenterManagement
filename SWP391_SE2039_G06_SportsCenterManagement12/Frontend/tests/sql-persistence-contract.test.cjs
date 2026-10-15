const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function loadApi(request) {
  const source = fs.readFileSync(path.join(__dirname, '../src/services/backendApi.js'), 'utf8')
    .replace(/^import .+;\r?\n/gm, '')
    .replaceAll('export const ', 'const ')
    .replaceAll('import.meta.env', 'testEnvironment');
  const calls = [];
  const context = vm.createContext({
    URLSearchParams, Date, Map, Set,
    testEnvironment: { VITE_SPORTS_CENTER_ID: '15' },
    getAuthUser: () => ({ centerId: 15 }),
    getAuthVersion: () => 1,
    beginAuthOperation: () => 1,
    assertAuthVersion: () => {},
    getApiToken: () => 'fixture-token',
    setApiToken: () => {},
    clearApiToken: () => {},
    setAuthUser: () => {},
    apiRequest: async (route, options = {}) => { calls.push({ route, options }); return request(route, options); }
  });
  vm.runInContext(`${source}\nglobalThis.api = { authApi, receptionApi };`, context);
  return { ...context.api, calls };
}

test('registration is sent to SQL-backed API and is not reported successful when persistence fails', async () => {
  const f = loadApi(() => { throw new Error('SQL unavailable'); });
  await assert.rejects(f.authApi.register({ fullName: 'Hội viên', email: 'member@example.test', password: 'Test@Password123!' }), /SQL unavailable/);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].route, 'auth/register');
  assert.equal(f.calls[0].options.method, 'POST');
  assert.equal(f.calls[0].options.body.centerId, 15);
});

test('check-in review saves a real support request with a resolved member and no claimed approval', async () => {
  const f = loadApi(route => route.includes('/members?')
    ? { items: [{ memberId: 21, memberCode: 'MB-21', fullName: 'Hội viên', email: 'member@example.test', accountStatus: 'Active' }] }
    : { request: { id: 42, status: 'Open' } });
  const saved = await f.receptionApi.requestCheckInReview('MB-21', ' Thẻ bị lỗi ', 'Quản lý ca');
  assert.equal(saved.request.id, 42);
  const write = f.calls.find(call => call.options.method === 'POST');
  assert.equal(write.route, 'centers/15/support-requests');
  assert.equal(write.options.body.memberId, 21);
  assert.match(write.options.body.description, /Thẻ bị lỗi/);
  assert.match(write.options.body.description, /chưa phê duyệt check-in hoặc mở cổng/);
  assert.equal(f.calls.some(call => /\/checkins$/.test(call.route)), false);
});

test('ambiguous member and API failures cannot fabricate a successful local record', async () => {
  const ambiguous = loadApi(() => [{ memberId: 1, memberCode: 'MB-1' }, { memberId: 2, memberCode: 'MB-2' }]);
  await assert.rejects(ambiguous.receptionApi.requestCheckInReview('Hội viên', 'Lý do', 'Quản lý'), /chính xác/);
  assert.equal(ambiguous.calls.some(call => call.options.method === 'POST'), false);
  const unavailable = loadApi(route => {
    if (route.includes('/members?')) return [{ memberId: 1, memberCode: 'MB-1' }];
    throw new Error('SQL unavailable');
  });
  await assert.rejects(unavailable.receptionApi.requestCheckInReview('MB-1', 'Lý do', 'Quản lý'), /SQL unavailable/);
});
