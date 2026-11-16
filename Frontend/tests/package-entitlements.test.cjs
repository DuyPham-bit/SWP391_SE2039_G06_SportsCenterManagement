const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function load(relative, names) {
  const source = fs.readFileSync(path.join(__dirname, '../src', relative), 'utf8')
    .replaceAll('export const ', 'const ')
    .replaceAll('export function ', 'function ');
  const context = vm.createContext({});
  vm.runInContext(`${source}\nglobalThis.out = { ${names.join(', ')} };`, context);
  return context.out;
}

const { getPurchaseMode, needsSportPicker } = load('pages/member-packages/lib/purchaseMode.js', ['getPurchaseMode', 'needsSportPicker']);
const { getSessionAction, filterSessionsByEntitlements } = load(
  'pages/member-class-schedule/lib/sessionAction.js',
  ['getSessionAction', 'filterSessionsByEntitlements']
);

const basic = { id: 1, tierLevel: 1, allowedSports: 1, isAllAccess: false };
const pro = { id: 2, tierLevel: 2, allowedSports: 3, isAllAccess: false };
const olympic = { id: 4, tierLevel: 4, allowedSports: 10, isAllAccess: true };

test('pricing cards: new, renew, upgrade and blocked downgrade', () => {
  assert.equal(getPurchaseMode(pro, null), 'new');
  assert.equal(getPurchaseMode(pro, { hasActivePackage: false }), 'new');
  const current = { hasActivePackage: true, packageId: 2, tierLevel: 2 };
  assert.equal(getPurchaseMode(pro, current), 'renew');
  assert.equal(getPurchaseMode(olympic, current), 'upgrade');
  assert.equal(getPurchaseMode(basic, current), 'downgrade');
});

test('sport picker only for new/upgrade of non all-access packages', () => {
  assert.equal(needsSportPicker(pro, 'new'), true);
  assert.equal(needsSportPicker(pro, 'upgrade'), true);
  assert.equal(needsSportPicker(pro, 'renew'), false);
  assert.equal(needsSportPicker(olympic, 'upgrade'), false);
});

test('schedule button follows the backend ButtonState', () => {
  const booked = new Set();
  const cls = { sessionId: 9, enrolledCount: 1, capacity: 20, isBookable: true };
  assert.equal(getSessionAction({ ...cls, buttonState: 'ALREADY_BOOKED' }, booked, false).label, 'Hủy chỗ');
  assert.equal(getSessionAction({ ...cls, buttonState: 'EXPIRED' }, booked, false).dimmed, true);
  assert.equal(getSessionAction({ ...cls, buttonState: 'NO_VALID_PACKAGE' }, booked, false).action, 'packages');
  assert.equal(getSessionAction({ ...cls, buttonState: 'SPORT_NOT_INCLUDED' }, booked, false).label, 'Nâng cấp gói');
  assert.equal(getSessionAction({ ...cls, buttonState: 'FULL', allowWaitlist: false }, booked, false).action, null);
  assert.equal(getSessionAction({ ...cls, buttonState: 'CAN_BOOK' }, booked, false).label, 'Đặt chỗ');
});

test('schedule button falls back when the payload has no ButtonState', () => {
  const cls = { sessionId: 9, enrolledCount: 20, capacity: 20, isBookable: true };
  assert.equal(getSessionAction(cls, new Set([9]), false).state, 'ALREADY_BOOKED');
  assert.equal(getSessionAction(cls, new Set(), false).state, 'FULL');
  assert.equal(getSessionAction({ ...cls, enrolledCount: 3 }, new Set(), false).state, 'CAN_BOOK');
});

test('schedule hides sports outside the member registered sports by default', () => {
  const sessions = [
    { sessionId: 1, sportId: 1, sportName: 'Bơi lội', buttonState: 'CAN_BOOK' },
    { sessionId: 2, sportId: 2, sportName: 'Gym & Fitness', buttonState: 'SPORT_NOT_INCLUDED' },
    { sessionId: 3, sportId: 4, sportName: 'Cầu lông', buttonState: 'CAN_BOOK' },
    { sessionId: 4, sportId: 5, sportName: 'Boxing & Võ thuật', buttonState: 'CAN_BOOK' },
    { sessionId: 5, sportId: 6, sportName: 'Golf', buttonState: 'EXPIRED' },
    { sessionId: 6, sportId: 10011, sportName: 'Bóng đá', buttonState: 'ALREADY_BOOKED' }
  ];
  const entitlements = { hasActivePackage: true, isAllAccess: false, allowedSportIds: [1, 4, 5] };

  const visible = filterSessionsByEntitlements(sessions, entitlements, new Set([6]));
  assert.deepEqual(visible.map(s => s.sportId), [1, 4, 5, 10011]);

  const allAccess = filterSessionsByEntitlements(sessions, { hasActivePackage: true, isAllAccess: true, allowedSportIds: null }, new Set());
  assert.equal(allAccess.length, 6);
});
