const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relPath) =>
  fs.readFileSync(path.join(__dirname, '..', '..', relPath), 'utf8');

test('useClassSchedule checks only active bookings and overlapping intervals for schedule conflicts', () => {
  const src = read('Frontend/src/pages/member-class-schedule/model/useClassSchedule.js');
  assert.match(src, /if \(b\.status !== 'CONFIRMED' && b\.status !== 'BOOKED'\) return false;/);
  assert.match(src, /if \(b\.sessionStatus === 'CANCELLED'\) return false;/);
  assert.match(src, /bookingRange\.start < activeRange\.end && activeRange\.start < bookingRange\.end/);
});

test('useClassSchedule excludes cancelled, expired, and not-open sessions from AVAILABLE_ONLY and stats.available', () => {
  const src = read('Frontend/src/pages/member-class-schedule/model/useClassSchedule.js');
  assert.match(src, /const isUnavailable = \(cls\.status \|\| cls\.sessionStatus\) === 'CANCELLED' \|\| cls\.buttonState === 'EXPIRED' \|\| cls\.buttonState === 'NOT_OPEN';/);
  assert.match(src, /if \(selectedStatusFilter === 'AVAILABLE_ONLY' && \(isFull \|\| isUnavailable\)\) return false;/);
  assert.match(src, /c\.buttonState !== 'EXPIRED' &&\s*c\.buttonState !== 'NOT_OPEN'/);
});

test('MyBookings and MyAttendance normalize ISO bookingDate to YYYY-MM-DD when filtering by date', () => {
  const bookingsSrc = read('Frontend/src/pages/member-bookings/ui/MyBookings.jsx');
  const attendanceSrc = read('Frontend/src/pages/member-attendance/ui/MyAttendance.jsx');
  assert.match(bookingsSrc, /if \(selectedDate && String\(b\.bookingDate \|\| ''\)\.slice\(0, 10\) !== selectedDate\)/);
  assert.match(attendanceSrc, /const dateKey = String\(b\.bookingDate \|\| ''\)\.slice\(0, 10\);/);
  assert.match(attendanceSrc, /evaluatedTotal > 0 \? Math\.round\(\(\(present \+ late\) \/ evaluatedTotal\) \* 100\) : 0;/);
});

test('getMemberReminders normalizes bookingDate before comparing with vietnamDate', async () => {
  const { getMemberReminders } = await import('../src/entities/member/lib/memberOverview.js');
  const now = new Date('2026-11-15T05:00:00Z');
  const user = { packageStatus: 'ACTIVE', packageExpiry: '2026-12-30' };
  const bookings = [
    {
      id: 101,
      className: 'Yoga Buổi Chiều',
      bookingDate: '2026-11-15T00:00:00Z',
      timeSlot: '18:00 - 19:00',
      sessionStatus: 'CANCELLED'
    }
  ];
  const reminders = getMemberReminders(user, bookings, now, false);
  assert.ok(reminders.some(r => r.id === 'cancelled-101'));
});
