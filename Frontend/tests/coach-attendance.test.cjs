const test = require('node:test');
const assert = require('node:assert/strict');

const overview = import('../src/features/coach/coachOverview.js');
const now = new Date('2026-10-17T12:00:00+07:00');

test('attendance cannot be edited after the session date has passed', async () => {
  const { attendanceRestriction, canAttendSession } = await overview;
  const session = { sessionDate: '2026-10-16', startTime: '08:00:00', status: 'SCHEDULED' };

  assert.equal(attendanceRestriction(session, now), 'PAST_DATE');
  assert.equal(canAttendSession(session, now), false);
});

test('attendance remains editable on the session date after its start time', async () => {
  const { attendanceRestriction, canAttendSession } = await overview;
  const session = { sessionDate: '2026-10-17', startTime: '08:00:00', status: 'SCHEDULED' };

  assert.equal(attendanceRestriction(session, now), null);
  assert.equal(canAttendSession(session, now), true);
});

test('attendance is locked before start time and for cancelled sessions', async () => {
  const { attendanceRestriction, canAttendSession } = await overview;
  const futureSession = { sessionDate: '2026-10-17', startTime: '18:00:00', status: 'SCHEDULED' };
  const cancelledSession = { sessionDate: '2026-10-17', startTime: '08:00:00', status: 'CANCELLED' };

  assert.equal(attendanceRestriction(futureSession, now), 'NOT_STARTED');
  assert.equal(canAttendSession(futureSession, now), false);
  assert.equal(attendanceRestriction(cancelledSession, now), 'CANCELLED');
  assert.equal(canAttendSession(cancelledSession, now), false);
});
