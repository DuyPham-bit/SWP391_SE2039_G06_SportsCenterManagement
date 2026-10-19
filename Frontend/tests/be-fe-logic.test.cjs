const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function client(respond, now = '2026-10-17T18:00:00Z', user = { role: 'MEMBER', centerId: 15 }) {
  const source = fs.readFileSync(path.join(__dirname, '../src/services/backendApi.js'), 'utf8')
    .replace(/^import .+;\r?\n/gm, '').replaceAll('export const ', 'const ')
    .replaceAll('import.meta.env', '({})');
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return new Date(now).getTime(); }
  }
  const calls = [];
  const context = vm.createContext({
    URLSearchParams, Date: FixedDate, Map, Set,
    getAuthUser: () => user,
    getAuthVersion: () => 1, assertAuthVersion: () => {}, getApiToken: () => 'token',
    setAuthUser: () => {}, clearApiToken: () => {},
    apiRequest: async route => { calls.push(route); return respond(route); }
  });
  vm.runInContext(`${source}\nglobalThis.api = { authApi, classApi, receptionApi, systemApi, reportApi };`, context);
  return { ...context.api, calls };
}

test('current membership uses backend state even when the device clock disagrees', async () => {
  const api = client(route => {
    if (route === 'profile/me') return { userId: 1, role: 'MEMBER', centerId: 15 };
    if (route === 'members/me') return { memberId: 21, packageId: 7, subscriptionId: 31,
      packageName: 'Gói đã trả tiền', packageStatus: 'ACTIVE', packageStartDate: '2026-10-01', packageExpiry: '2026-10-31' };
    if (route === 'members/21/subscriptions') return [
      { subscriptionId: 31, packageId: 7, status: 'Active', effectiveStatus: 'ACTIVE', startDate: '2026-10-01', endDate: '2026-10-31' },
      { subscriptionId: 32, packageId: 8, status: 'Active', effectiveStatus: 'SCHEDULED', startDate: '2026-11-01', endDate: '2026-11-30' }
    ];
    return [];
  }, '2030-01-01T00:00:00Z');
  const user = await api.authApi.getCurrentUser();
  assert.equal(user.packageStatus, 'ACTIVE');
  assert.equal(user.packageId, 7);
  assert.equal(user.packageExpiry, '2026-10-31');
  assert.equal(user.scheduledSubscriptions.length, 1);
  assert.equal(user.scheduledSubscriptions[0].subscriptionId, 32);
});

test('member lookup preserves backend package status rather than recalculating expiry', async () => {
  const api = client(() => ({ items: [{ memberId: 21, packageStatus: 'ACTIVE', packageExpiry: '2026-10-31' }] }), '2030-01-01T00:00:00Z');
  const [member] = await api.receptionApi.lookupMember('MB21');
  assert.equal(member.packageStatus, 'ACTIVE');
});

test('class browsing starts on the Vietnam business date around UTC midnight', async () => {
  const api = client(() => ({ items: [], totalCount: 0, pageSize: 100 }));
  await api.classApi.getAll();
  const query = new URLSearchParams(api.calls[0].split('?')[1]);
  assert.equal(query.get('from'), '2026-10-18');
  assert.equal(query.get('to'), '2027-01-16');
});

test('local permission overrides cannot replace backend capabilities or cross roles', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/services/permissions.js'), 'utf8')
    .replace(/^import .+;\r?\n/gm, '').replace(/export /g, '');
  const context = vm.createContext({
    getAuthUser: () => ({ id: 1, centerId: 15, role: 'COACH', capabilities: ['view_teaching_schedule'] }),
    localStorage: { getItem: () => JSON.stringify({ effectiveCapabilities: ['manage_staff'] }) }
  });
  vm.runInContext(`${source}\nglobalThis.permissions = getPermissionsForRole;`, context);
  assert.deepEqual(Array.from(context.permissions('COACH')), ['view_teaching_schedule']);
  assert.deepEqual(Array.from(context.permissions('MEMBER')), []);
});

test('SystemAdmin uses system audit without inventing a center', async () => {
  const api = client(() => ({ items: [], totalCount: 0 }), undefined, { role: 'SYSTEMADMIN' });
  await api.systemApi.getAuditPage();
  assert.match(api.calls[0], /^admin\/audit-logs\?/);
});

function reportFixture(route) {
  if (route.startsWith('class-sessions?')) return { items: [
    { sessionId: 1, classId: 1, className: 'Active', sessionStatus: 'Scheduled', capacity: 10, bookedCount: 2 },
    { sessionId: 2, classId: 1, className: 'Cancelled', sessionStatus: 'Cancelled', capacity: 10, bookedCount: 9 }
  ], totalCount: 2, pageSize: 100 };
  if (route.includes('/rooms')) return [];
  if (route.includes('/classes/all')) return [];
  return {};
}

test('report utilization excludes cancelled sessions', async () => {
  const api = client(reportFixture);
  const overview = await api.reportApi.getOverview('DAY');
  assert.equal(overview.totalClasses, 1);
  assert.equal(overview.occupancyRate, 20);
});

test('report API failure is not converted into an empty successful report', async () => {
  const api = client(route => {
    if (route.includes('/rooms')) throw new Error('Rooms unavailable');
    return reportFixture(route);
  });
  await assert.rejects(api.reportApi.getOverview('DAY'), /Rooms unavailable/);
});
