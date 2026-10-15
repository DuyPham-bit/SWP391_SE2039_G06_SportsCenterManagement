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
    normalizeSubscriptionHistory
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
