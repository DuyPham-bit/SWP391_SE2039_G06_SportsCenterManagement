const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../src/features/member/memberOverview.js'), 'utf8')
  .replaceAll('export function ', 'function ').replaceAll('export const ', 'const ');
const context = vm.createContext({ Date });
vm.runInContext(`${source}\nglobalThis.getReminders = getMemberReminders;`, context);
const user = { packageStatus: 'ACTIVE', packageExpiry: '2027-01-07' };
const booking = { id: 1, status: 'CONFIRMED', sessionStatus: 'SCHEDULED', bookingDate: '2026-10-15',
  startTime: '08:30:00', timeSlot: '08:30 - 09:30', className: 'Yoga Phục hồi', roomName: 'Phòng Yoga' };

test('session reminders appear one hour before class in Vietnam time', () => {
  assert.equal(context.getReminders(user, [booking], new Date('2026-10-15T07:29:59+07:00')).length, 0);
  const reminders = context.getReminders(user, [booking], new Date('2026-10-15T07:30:00+07:00'));
  assert.equal(reminders.length, 1);
  assert.match(reminders[0].title, /Yoga Phục hồi/);
  assert.match(reminders[0].content, /08:30 - 09:30/);
  assert.equal(context.getReminders(user, [booking], new Date('2026-10-15T08:29:59+07:00')).length, 1);
  assert.equal(context.getReminders(user, [booking], new Date('2026-10-15T08:30:00+07:00')).length, 0);
});

test('cancelled bookings never produce an upcoming-class reminder', () => {
  const now = new Date('2026-10-15T08:00:00+07:00');
  assert.equal(context.getReminders(user, [{ ...booking, status: 'CANCELLED' }], now).length, 0);
  const reminders = context.getReminders(user, [{ ...booking, sessionStatus: 'CANCELLED' }], now);
  assert.equal(reminders.some(item => item.id === 'session-1'), false);
});
