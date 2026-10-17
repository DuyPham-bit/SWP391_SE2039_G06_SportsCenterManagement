const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function loadHelpers() {
  const source = fs.readFileSync(path.join(__dirname, '../src/features/manager/managerDashboardView.js'), 'utf8')
    .replaceAll('export function ', 'function ');
  const context = vm.createContext({ Intl, Date, Number, Math, String });
  vm.runInContext(`${source}\nglobalThis.helpers = { toNonNegativeNumber, toPercent, getManagerDashboardSummary, getAuditPresentation, formatDashboardTimestamp };`, context);
  return context.helpers;
}

test('dashboard summary derives trackable metrics from a valid overview', () => {
  const { getManagerDashboardSummary } = loadHelpers();
  const summary = getManagerDashboardSummary({
    totalMembers: 80, activeMembers: 60, monthlyRevenue: 12500000,
    totalBookings: 24, todayCheckins: 18, occupancyRate: 67.4, newMembers: 7,
    highlights: { mostPopularClass: { name: 'Yoga buổi sáng' } }
  });

  assert.deepEqual(JSON.parse(JSON.stringify(summary)), {
    totalMembers: 80, activeMembers: 60, activeMemberRate: 75, monthlyRevenue: 12500000,
    totalBookings: 24, todayCheckins: 18, occupancyRate: 67, newMembers: 7,
    popularClass: 'Yoga buổi sáng'
  });
});

test('dashboard summary safely handles missing, invalid, and out-of-range API values', () => {
  const { getManagerDashboardSummary } = loadHelpers();
  const summary = getManagerDashboardSummary({
    totalMembers: 3, activeMembers: 9, monthlyRevenue: -100,
    occupancyRate: 140, todayCheckins: 'invalid'
  });

  assert.equal(summary.activeMembers, 3);
  assert.equal(summary.activeMemberRate, 100);
  assert.equal(summary.monthlyRevenue, 0);
  assert.equal(summary.occupancyRate, 100);
  assert.equal(summary.todayCheckins, 0);
  assert.equal(summary.popularClass, 'Chưa có dữ liệu');
});

test('audit feed presents known and unknown actions without exposing unreadable codes', () => {
  const { getAuditPresentation, formatDashboardTimestamp } = loadHelpers();

  assert.equal(getAuditPresentation('MEMBER.CREATED').label, 'Đăng ký hội viên');
  assert.equal(getAuditPresentation('CUSTOM.ACTION').label, 'CUSTOM ACTION');
  assert.equal(getAuditPresentation('').label, 'Hoạt động hệ thống');
  assert.notEqual(formatDashboardTimestamp('2026-10-17T01:30:00Z'), 'Chưa rõ thời gian');
  assert.equal(formatDashboardTimestamp('not-a-date'), 'Chưa rõ thời gian');
  assert.equal(formatDashboardTimestamp(null), 'Chưa rõ thời gian');
});
