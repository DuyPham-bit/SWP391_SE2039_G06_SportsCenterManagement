const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function loadHelpers() {
  const source = fs.readFileSync(path.join(__dirname, '../src/features/manager/memberManagementView.js'), 'utf8')
    .replaceAll('export function ', 'function ');
  const context = vm.createContext({ Intl });
  vm.runInContext(`${source}\nglobalThis.helpers = {
    buildMemberUpdatePayload,
    getAccountPresentation,
    getSubscriptionPresentation,
    formatMembershipPrice,
    formatMembershipDuration,
    formatMembershipDate,
    formatMembershipDateTime,
    normalizeSubscriptionHistory,
    getVietnameseGivenName,
    sortMembersByVietnameseGivenName,
    summarizeSubscriptionHistory
  };`, context);
  return context.helpers;
}

test('manager update payload keeps editable profile fields and never includes email', () => {
  const { buildMemberUpdatePayload } = loadHelpers();
  const payload = buildMemberUpdatePayload({
    fullName: '  Nguyễn An  ',
    email: 'attacker@example.com',
    phone: ' 0912345678 ',
    dateOfBirth: '',
    gender: 'Female',
    address: '  Hà Nội '
  });

  assert.equal(payload.fullName, 'Nguyễn An');
  assert.equal(payload.phone, '0912345678');
  assert.equal(payload.dateOfBirth, null);
  assert.equal(payload.gender, 'Female');
  assert.equal(payload.address, 'Hà Nội');
  assert.equal(Object.hasOwn(payload, 'email'), false);
});

test('account and subscription states have safe presentations for known and unknown values', () => {
  const { getAccountPresentation, getSubscriptionPresentation } = loadHelpers();

  assert.equal(getAccountPresentation('Active').isActive, true);
  assert.equal(getAccountPresentation('Disabled').actionLabel, 'Mở khóa');
  assert.equal(getAccountPresentation('unexpected').isActive, false);
  assert.equal(getSubscriptionPresentation('PendingPayment').label, 'Chờ thanh toán');
  assert.equal(getSubscriptionPresentation(null).label, 'Chưa xác định');
});

test('history formatting handles missing data and keeps newest subscriptions first', () => {
  const {
    formatMembershipDate,
    formatMembershipDateTime,
    formatMembershipDuration,
    formatMembershipPrice,
    normalizeSubscriptionHistory
  } = loadHelpers();
  const input = [
    { subscriptionId: 1, createdAt: '2026-01-01T00:00:00' },
    { subscriptionId: 3, createdAt: null },
    { subscriptionId: 2, createdAt: '2026-02-01T00:00:00' }
  ];

  assert.deepEqual(Array.from(normalizeSubscriptionHistory(input), item => item.subscriptionId), [2, 1, 3]);
  assert.deepEqual(input.map(item => item.subscriptionId), [1, 3, 2]);
  assert.equal(formatMembershipDate('2026-02-30'), 'Chưa xác định');
  assert.equal(formatMembershipDate(null, 'Chưa kích hoạt'), 'Chưa kích hoạt');
  assert.equal(formatMembershipDateTime('not-a-date'), 'Chưa xác định');
  assert.equal(formatMembershipDuration(0), 'Chưa xác định');
  assert.equal(formatMembershipPrice(null), 'Chưa có thông tin');
});

test('member name sorting uses the Vietnamese given name and keeps missing names last', () => {
  const { getVietnameseGivenName, sortMembersByVietnameseGivenName } = loadHelpers();
  const members = [
    { memberId: 1, fullName: 'Trần Thị Bình' },
    { memberId: 2, fullName: '  Nguyễn   Văn An ' },
    { memberId: 3, fullName: 'Lê Hoàng Dũng' },
    { memberId: 4, fullName: null },
    { memberId: 5, fullName: 'Phạm Anh An' }
  ];

  assert.equal(getVietnameseGivenName('  Nguyễn   Văn An '), 'An');
  assert.deepEqual(Array.from(sortMembersByVietnameseGivenName(members, 'asc'), item => item.memberId), [2, 5, 1, 3, 4]);
  assert.deepEqual(Array.from(sortMembersByVietnameseGivenName(members, 'desc'), item => item.memberId), [3, 1, 5, 2, 4]);
  assert.deepEqual(members.map(item => item.memberId), [1, 2, 3, 4, 5]);
  assert.deepEqual(Array.from(sortMembersByVietnameseGivenName(null)), []);
});

test('subscription summary separates active, upcoming, and finished states', () => {
  const { summarizeSubscriptionHistory } = loadHelpers();
  const summary = summarizeSubscriptionHistory([
    { status: 'Active' }, { status: 'PendingPayment' }, { status: 'Scheduled' },
    { status: 'Expired' }, { status: 'Cancelled' }, { status: null }
  ]);

  assert.deepEqual(JSON.parse(JSON.stringify(summary)), { total: 6, active: 1, pending: 2, finished: 3 });
  assert.deepEqual(JSON.parse(JSON.stringify(summarizeSubscriptionHistory(null))), { total: 0, active: 0, pending: 0, finished: 0 });
});

test('manager member update contract rejects email at the API boundary', () => {
  const requestSource = fs.readFileSync(path.join(__dirname, '../../Backend/Backend/SportsCenterManagement.BLL/DTOs/Members/Requests.cs'), 'utf8');
  const managerRequest = requestSource.slice(
    requestSource.indexOf('UpdateMemberAtCenterRequest'),
    requestSource.indexOf('SetMemberStatusRequest')
  );

  assert.match(requestSource, /JsonUnmappedMemberHandling\(JsonUnmappedMemberHandling\.Disallow\)/);
  assert.doesNotMatch(managerRequest, /Email/);
});
