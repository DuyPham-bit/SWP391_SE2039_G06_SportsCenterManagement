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
    totalRooms: 2, activeRooms: 1, totalClasses: 1, activeClasses: 1,
    sessionsCount: 1, bookedSeats: 2, capacitySeats: 10, occupancyRate: 20,
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
  assert.equal(overview.totalSessions, 1);
  assert.equal(overview.totalBookings, 2);
  assert.equal(overview.occupancyRate, 20);
  assert.equal(overview.activeStaff, 2);
  assert.equal(overview.totalStaff, 3);
  assert.equal(overview.membersWithPackage, 3);
  assert.equal(overview.membersWithoutPackage, 2);
  assert.equal(overview.expiredMembers, 1);
  assert.equal(overview.coachesWithSessions, 1);
  assert.equal(overview.coachesWithoutSessions, 1);
});

test('report metrics use the selected period and calculate growth from the immediately preceding period', async () => {
  const api = client(route => {
    const query = new URLSearchParams(route.split('?')[1] || '');
    const from = query.get('from');
    if (route.startsWith('reports/revenue?')) {
      return from === '2026-10-01'
        ? { gross: 220, refunds: 20, net: 200, periods: [] }
        : { gross: 100, refunds: 0, net: 100, periods: [] };
    }
    if (route.startsWith('reports/membership?')) {
      return from === '2026-10-01'
        ? { totalMembers: 20, activeMembers: 12, newMembers: 4, periods: [] }
        : { totalMembers: 16, activeMembers: 10, newMembers: 2, periods: [] };
    }
    if (route.startsWith('reports/operations?')) return {
      totalClasses: 3, activeClasses: 2, sessionsCount: 4,
      bookedSeats: 12, capacitySeats: 20, occupancyRate: 60,
      classes: [], sports: [], rooms: [], coaches: []
    };
    if (route.startsWith('reports/checkins?')) return { count: from === '2026-10-01' ? 7 : 1 };
    if (route.startsWith('reports/classes?')) return { currentStatusCounts: { Booked: 12 }, periods: [] };
    if (route.startsWith('reports/revenue-by-sport?')) return { sports: [], allocatedNet: 0, unallocatedNet: 0 };
    if (route.startsWith('class-sessions?')) return { items: [], totalCount: 0, pageSize: 100 };
    if (route.includes('/rooms') || route.includes('/classes/all')) return [];
    return {};
  });

  const overview = await api.reportApi.getOverview({ from: '2026-10-01', to: '2026-10-10', groupBy: 'day' });
  assert.equal(overview.revenueGrowth, 100);
  assert.equal(overview.memberGrowth, 100);
  assert.equal(overview.previousNetRevenue, 100);
  assert.equal(overview.totalClasses, 3);
  assert.equal(overview.totalSessions, 4);
  assert.equal(overview.totalBookings, 12);
  assert.equal(overview.periodCheckins, 7);
  assert.equal(overview.todayCheckins, 1);
  assert.ok(api.calls.some(route => route.includes('reports/revenue?') && route.includes('from=2026-09-21') && route.includes('to=2026-09-30')));
});

test('report API failure is not converted into an empty successful report', async () => {
  const api = client(route => {
    if (route.includes('/rooms')) throw new Error('Rooms unavailable');
    return reportFixture(route);
  });
  await assert.rejects(api.reportApi.getOverview('DAY'), /Rooms unavailable/);
});

test('report quick periods resolve to the same Vietnam dates used by requests', async () => {
  const api = client(reportFixture, '2026-11-05T17:30:00Z');
  const expected = {
    DAY: ['2026-11-06', '2026-11-06', 'day'],
    WEEK: ['2026-11-02', '2026-11-06', 'day'],
    MONTH: ['2026-11-01', '2026-11-06', 'day'],
    QUARTER: ['2026-10-01', '2026-11-06', 'day'],
    YEAR: ['2026-01-01', '2026-11-06', 'month'],
    '30D': ['2026-10-08', '2026-11-06', 'day'],
    LAST_MONTH: ['2026-10-01', '2026-10-31', 'day']
  };
  for (const [period, dates] of Object.entries(expected)) {
    const range = api.reportApi.getPeriodRange(period);
    assert.deepEqual([range.from, range.to, range.groupBy], dates, period);
    const overview = await api.reportApi.getOverview(period);
    assert.deepEqual([overview.from, overview.to, overview.groupBy], dates, period);
  }
});

test('refund totals remain scoped to the selected day or full collection period for manager and admin', async () => {
  const api = client(route => {
    if (route.startsWith('reports/revenue?')) {
      const query = new URLSearchParams(route.split('?')[1]);
      if (query.get('from') === '2026-11-06') return { gross: 3200000, refunds: 650000, net: 2550000, periods: [] };
      if (query.get('from') === '2026-11-01') return { gross: 3850000, refunds: 650000, net: 3200000, periods: [] };
      return { gross: 650000, refunds: 0, net: 650000, periods: [] };
    }
    return reportFixture(route);
  }, '2026-11-06T07:00:00Z', { role: 'ADMIN', centerId: 15 });
  for (const [period, gross, net] of [['DAY', 3200000, 2550000], ['MONTH', 3850000, 3200000]]) {
    const manager = await api.reportApi.getOverview(period, { centerId: 15 });
    const admin = await api.reportApi.getSystemOverview(period, [{ id: 15, name: 'Center' }]);
    for (const report of [manager, admin]) {
      assert.equal(report.grossRevenue, gross);
      assert.equal(report.refundedRevenue, 650000);
      assert.equal(report.netRevenue, net);
    }
  }
});

test('report period validation handles leap years, year boundaries and invalid custom ranges', async () => {
  const january = client(reportFixture, '2026-12-31T17:00:00Z');
  assert.deepEqual(Object.values(january.reportApi.getPeriodRange('LAST_MONTH')), ['2026-12-01', '2026-12-31', 'day']);
  assert.deepEqual(Object.values(january.reportApi.getPeriodRange('WEEK')), ['2026-12-28', '2027-01-01', 'day']);
  const leapYear = client(reportFixture, '2028-03-01T05:00:00Z');
  assert.equal(leapYear.reportApi.getPeriodRange('LAST_MONTH').to, '2028-02-29');
  for (const range of [
    { from: '2026-11-06', to: '2026-11-05' },
    { from: '2026-02-29', to: '2026-03-01' },
    { from: '2025-01-01', to: '2026-01-02' },
    { from: '2026-11-01', to: '2026-11-06', groupBy: 'week' }
  ]) {
    assert.throws(() => january.reportApi.getPeriodRange(range), /366/);
    await assert.rejects(january.reportApi.getOverview(range), /366/);
  }
});

test('Admin system report scopes every request and aggregates centers', async () => {
  const api = client(route => {
    const query = new URLSearchParams(route.split('?')[1] || '');
    const scopedId = Number(query.get('centerId') || route.match(/^centers\/(\d+)/)?.[1] || 0);
    if (route.startsWith('reports/revenue-by-sport?')) return {
      allocatedNet: scopedId * 100, unallocatedNet: 0,
      sports: [{ sportId: 1, name: 'Swimming', net: scopedId * 100 }]
    };
    if (route.startsWith('reports/revenue?')) return {
      gross: scopedId * 100, refunds: 0, net: scopedId * 100,
      periods: [{ periodStart: '2026-10-17', net: scopedId * 100 }]
    };
    if (route.startsWith('reports/membership?')) return {
      totalMembers: scopedId, activeMembers: scopedId, membersWithPackage: scopedId,
      membersWithoutPackage: 0, expiredMembers: 0, newMembers: scopedId,
      periods: [{ periodStart: '2026-10-17', newMembers: scopedId }]
    };
    if (route.startsWith('reports/classes?')) return { currentStatusCounts: { Confirmed: scopedId }, periods: [] };
    if (route.startsWith('reports/operations?')) return {
      totalStaff: scopedId, activeStaff: scopedId, managerCount: 1, coachCount: scopedId,
      receptionistCount: 0, totalRooms: scopedId, activeRooms: scopedId, sessionsCount: scopedId,
      occupancyRate: 50,
      classes: [{ id: 1, name: `Class ${scopedId}`, booked: scopedId, capacity: scopedId * 2, occupancyRate: 50 }],
      sports: [{ name: 'Swimming', booked: scopedId, capacity: scopedId * 2, sessionsCount: scopedId, classesCount: 1, occupancyRate: 50, bookingShare: 100 }],
      rooms: [{ id: 1, name: `Pool ${scopedId}`, booked: scopedId, capacity: scopedId * 2, occupancyRate: 50 }],
      coaches: []
    };
    if (route.startsWith('reports/checkins?')) return { count: scopedId };
    if (route.startsWith('class-sessions?')) return { items: [], totalCount: 0, pageSize: 100 };
    if (route.includes('/rooms') || route.includes('/classes/all')) return [];
    return {};
  }, undefined, { role: 'ADMIN' });

  const overview = await api.reportApi.getSystemOverview('DAY', [
    { id: 1, name: 'Center 1' }, { id: 2, name: 'Center 2' }
  ]);

  assert.equal(overview.centerCount, 2);
  assert.equal(overview.totalMembers, 3);
  assert.equal(overview.netRevenue, 300);
  assert.equal(overview.revenuePeriods[0].net, 300);
  assert.equal(overview.classStatusCounts.Confirmed, 3);
  assert.equal(overview.topSports[0].booked, 3);
  assert.equal(overview.occupancyRate, 50);
  assert.equal(overview.centerSummaries.length, 2);
  assert.deepEqual(Array.from(overview.centerSummaries, item => item.centerId), [2, 1]);
  assert.equal(overview.centerSummaries[0].netRevenue, 200);
  const sessionCalls = api.calls.filter(route => route.startsWith('class-sessions?'));
  assert.ok(sessionCalls.some(route => new URLSearchParams(route.split('?')[1]).get('centerId') === '1'));
  assert.ok(sessionCalls.some(route => new URLSearchParams(route.split('?')[1]).get('centerId') === '2'));
});

test('Admin system report recomputes sport revenue share from merged net revenue', async () => {
  const sportsByCenter = {
    1: [
      { sportId: 1, sportName: 'Swimming', gross: 60, refunds: 0, net: 60, share: 60 },
      { sportId: null, sportName: 'Chưa phân bổ', gross: 40, refunds: 0, net: 40, share: 40 }
    ],
    2: [
      { sportId: null, sportName: 'Chưa phân bổ', gross: 150, refunds: 0, net: 150, share: 75 },
      { sportId: 1, sportName: 'Swimming', gross: 50, refunds: 0, net: 50, share: 25 }
    ]
  };
  const api = client(route => {
    const query = new URLSearchParams(route.split('?')[1] || '');
    const scopedId = Number(query.get('centerId') || 0);
    if (route.startsWith('reports/revenue-by-sport?')) return {
      net: 100 * scopedId, allocatedNet: scopedId === 1 ? 60 : 50, unallocatedNet: scopedId === 1 ? 40 : 150,
      sports: sportsByCenter[scopedId]
    };
    if (route.startsWith('reports/revenue?')) return { gross: 100 * scopedId, refunds: 0, net: 100 * scopedId, periods: [] };
    if (route.startsWith('reports/classes?')) return { currentStatusCounts: {}, periods: [] };
    if (route.startsWith('reports/checkins?')) return { count: 0 };
    if (route.startsWith('class-sessions?')) return { items: [], totalCount: 0, pageSize: 100 };
    if (route.includes('/rooms') || route.includes('/classes/all')) return [];
    return {};
  }, undefined, { role: 'ADMIN' });

  const overview = await api.reportApi.getSystemOverview('DAY', [
    { id: 1, name: 'Center 1' }, { id: 2, name: 'Center 2' }
  ]);
  const swimming = overview.revenueBySport.find(item => item.sportId === 1);
  const unallocated = overview.revenueBySport.find(item => item.sportId == null);

  assert.equal(swimming.net, 110);
  assert.equal(unallocated.net, 190);
  assert.equal(swimming.share, 36.67);
  assert.equal(unallocated.share, 63.33);
  assert.equal(overview.highlights.highestRevenueSport.sportId, 1);
});
