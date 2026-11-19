const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { apiSource } = require('./helpers/apiSources.cjs');
const vm = require('node:vm');
const { test } = require('node:test');

function client(respond, now = '2026-10-17T18:00:00Z', user = { role: 'MEMBER', centerId: 15 }) {
  const source = apiSource()
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
    getAuthVersion: () => 1, assertAuthVersion: () => {}, getApiSession: () => 'token',
    setAuthUser: () => {}, clearApiSession: () => {},
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
  const source = fs.readFileSync(path.join(__dirname, '../src/entities/permission/model/permissions.js'), 'utf8')
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

test('Admin role-permission changes use the selected center scope', async () => {
  const api = client(() => [], undefined, { role: 'ADMIN', centerId: 9 });
  await api.systemApi.getPermissions();
  await api.systemApi.updatePermissions(4, ['staff.center.read'], ['manage_staff']);
  assert.equal(api.calls[0], 'centers/9/roles');
  assert.equal(api.calls[1], 'centers/9/roles/4/permissions');
});

function reportFixture(route) {
  if (route.startsWith('reports/membership?')) return {
    totalMembers: 5, activeMembers: 3, membersWithPackage: 3, membersWithoutPackage: 2,
    expiredMembers: 1, newMembers: 1, periods: []
  };
  if (route.startsWith('reports/operations?')) return {
    totalStaff: 3, activeStaff: 2, managerCount: 1, coachCount: 1, receptionistCount: 1,
    totalRooms: 2, activeRooms: 1, sessionsCount: 1, occupancyRate: 20,
    classes: [{ id: 1, name: 'Active', booked: 2, capacity: 10, occupancyRate: 20 }],
    sports: [], rooms: [], coaches: [
      { id: 1, fullName: 'Coach Active', classesCount: 1, sessionsCount: 2, booked: 2, capacity: 10, occupancyRate: 20 },
      { id: 2, fullName: 'Coach Idle', classesCount: 0, sessionsCount: 0, booked: 0, capacity: 0, occupancyRate: 0 }
    ]
  };
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
  assert.equal(overview.activeStaff, 2);
  assert.equal(overview.totalStaff, 3);
  assert.equal(overview.membersWithPackage, 3);
  assert.equal(overview.membersWithoutPackage, 2);
  assert.equal(overview.expiredMembers, 1);
  assert.equal(overview.coachesWithSessions, 1);
  assert.equal(overview.coachesWithoutSessions, 1);
});

test('admin system report queries every center with its own centerId and sums them', async () => {
  const centerOf = route => Number(new URLSearchParams(route.split('?')[1] || '').get('centerId') || route.match(/centers\/(\d+)\//)?.[1]);
  const api = client(route => {
    const id = centerOf(route);
    if (route.startsWith('reports/revenue?')) return { net: id === 15 ? 1000 : 3000, gross: id === 15 ? 1200 : 3000, refunds: id === 15 ? 200 : 0, periods: [] };
    if (route.startsWith('reports/operations?')) return {
      totalStaff: 3, activeStaff: 2, totalRooms: 2, activeRooms: 1, sessionsCount: 1,
      occupancyRate: id === 15 ? 20 : 50, classes: [], sports: [], rooms: [], coaches: []
    };
    if (route.startsWith('class-sessions?')) return { items: [
      { sessionId: id, classId: id, className: `C${id}`, sessionStatus: 'Scheduled', capacity: 10, bookedCount: id === 15 ? 2 : 5 }
    ], totalCount: 1, pageSize: 100 };
    return reportFixture(route);
  }, '2026-10-17T18:00:00Z', { role: 'ADMIN', centerId: null });

  const system = await api.reportApi.getSystemOverview('DAY', [{ id: 15, name: 'A' }, { id: 16, name: 'B' }]);
  assert.equal(system.centerCount, 2);
  assert.equal(system.netRevenue, 4000);
  assert.equal(system.refundedRevenue, 200);
  assert.equal(system.totalMembers, 10);
  assert.equal(system.totalCapacity, 20);
  // Seat-weighted over all centers: (10 * 20% + 10 * 50%) / 20 seats = 35%.
  assert.equal(system.occupancyRate, 35);
  // Sorted by net revenue (center 16 earns more). Compared as JSON: arrays come from the vm realm.
  assert.equal(JSON.stringify(system.centerSummaries.map(item => item.centerId)), '[16,15]');
  for (const id of [15, 16]) {
    assert.ok(api.calls.some(route => route.startsWith('reports/revenue?') && route.includes(`centerId=${id}`)));
    assert.ok(api.calls.some(route => route.startsWith('class-sessions?') && route.includes(`centerId=${id}`)));
    assert.ok(api.calls.includes(`centers/${id}/rooms`));
  }
});

test('admin single-center report uses the requested center, not the token center', async () => {
  const api = client(reportFixture, '2026-10-17T18:00:00Z', { role: 'ADMIN', centerId: null });
  await api.reportApi.getOverview('DAY', { centerId: 42 });
  assert.ok(api.calls.every(route => !route.includes('centerId=null') && !route.includes('centers/null')));
  assert.ok(api.calls.includes('centers/42/classes/all'));
  // Without an explicit center an Admin (no center in the token) gets a clear error, never centerId=null.
  await assert.rejects(api.reportApi.getOverview('DAY'), /Chưa xác định trung tâm/);
});

test('report API failure is not converted into an empty successful report', async () => {
  const api = client(route => {
    if (route.includes('/rooms')) throw new Error('Rooms unavailable');
    return reportFixture(route);
  });
  await assert.rejects(api.reportApi.getOverview('DAY'), /Rooms unavailable/);
});
