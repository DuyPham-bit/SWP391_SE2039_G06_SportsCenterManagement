const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const overview = import('../src/features/coach/coachOverview.js');
const now = new Date('2026-10-17T12:00:00+07:00');

test('coach dashboard persists quick progress and attendance through the real APIs', () => {
  const dashboard = fs.readFileSync(path.join(__dirname, '../src/features/coach/CoachDashboard.jsx'), 'utf8');
  const api = fs.readFileSync(path.join(__dirname, '../src/services/api.js'), 'utf8');
  assert.match(dashboard, /coachApi\.recordWorkoutProgress\(dashboardProgressRequest/);
  assert.match(dashboard, /coachApi\.getClassMembers\(session\.id\)/);
  assert.match(dashboard, /coachApi\.takeAttendance\(activeSession\.id/);
  assert.match(api, /notifyMember:\s*data\.notifyMember !== false/);
  assert.doesNotMatch(dashboard, /defaultStudents|defaultSessions|demo-[1-9]|09xx xxx xxx/);
});

test('backend roster and attendance honor replacement coach and active class enrollment', () => {
  const controller = fs.readFileSync(path.join(__dirname, '../../Backend/SportsCenterManagement.API/Controllers/BookingOperationsController.cs'), 'utf8');
  assert.match(controller, /s\.CoachId == coach\.Id/);
  assert.match(controller, /s\.CoachId == null/);
  assert.match(controller, /db\.ClassEnrollments\.Any/);
  assert.match(controller, /e\.Status == "Active" \|\| e\.Status == "Confirmed" \|\| e\.Status == "Enrolled"/);
});

test('session progress is upserted and overnight completion uses the Vietnam session end', () => {
  const service = fs.readFileSync(path.join(__dirname, '../../Backend/SportsCenterManagement.BLL/Services/TrainingService.cs'), 'utf8');
  assert.match(service, /SessionEndVietnam\(session\.SessionDate, session\.StartTime, session\.EndTime\)/);
  assert.match(service, /r\.SessionId == request\.SessionId && r\.MemberId == request\.MemberId/);
  assert.match(service, /TRAINING_PROGRESS_UPDATED/);
});

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

test('dashboard maps persisted session identifiers and the matching class roster without demo data', async () => {
  const { mapDashboardSessions } = await overview;
  const sessions = [{
    id: 81, classId: 12, name: 'Stored class', sportName: 'Gym', roomName: 'Stored room',
    sessionDate: '2026-10-17', startTime: '08:00:00', endTime: '13:00:00',
    timeSlot: '08:00 - 13:00', status: 'SCHEDULED', enrolledCount: 1
  }];
  const classes = [
    { id: 99, members: [{ id: 999, fullName: 'Wrong positional member' }] },
    { id: 12, members: [{ id: 51, fullName: 'Stored member', phone: '0900000000' }] }
  ];
  const [mapped] = mapDashboardSessions(sessions, classes, now);
  assert.equal(mapped.id, 81);
  assert.equal(mapped.classId, 12);
  assert.equal(mapped.title, 'Stored class');
  assert.equal(mapped.room, 'Stored room');
  assert.equal(mapped.members[0].id, 51);
  assert.equal(mapped.status, 'IN_PROGRESS');
  assert.equal(mapped.canTakeAttendance, true);
});

test('dashboard only displays sessions inside the selected Vietnam calendar period', async () => {
  const { filterDashboardSessions } = await overview;
  const sessions = [
    { id: 1, sessionDate: '2026-10-17' },
    { id: 2, sessionDate: '2026-10-18' },
    { id: 3, sessionDate: '2026-11-01' }
  ];
  assert.deepEqual(filterDashboardSessions(sessions, 'day', now).map(item => item.id), [1]);
  assert.deepEqual(filterDashboardSessions(sessions, 'week', now).map(item => item.id), [1, 2]);
  assert.deepEqual(filterDashboardSessions(sessions, 'month', now).map(item => item.id), [1, 2]);
});

test('dashboard attendance payload uses backend status codes and derives late status from the note', async () => {
  const { dashboardAttendanceRecords } = await overview;
  assert.deepEqual(dashboardAttendanceRecords([
    { id: 51, status: 'PRESENT', note: '' },
    { id: 52, status: 'PRESENT', note: 'Đến muộn 10p' },
    { id: 53, status: 'ABSENT', note: 'Có phép' }
  ]), [
    { memberId: 51, status: 'PRESENT', note: null },
    { memberId: 52, status: 'LATE', note: 'Đến muộn 10p' },
    { memberId: 53, status: 'ABSENT', note: 'Có phép' }
  ]);
  assert.throws(() => dashboardAttendanceRecords([{ id: 51, status: '' }]), /chọn trạng thái/i);
});

test('dashboard progress payload identifies the persisted member and creates a real workout result', async () => {
  const { dashboardProgressRequest } = await overview;
  assert.deepEqual(dashboardProgressRequest({
    weight: '68.5', heavyLift: '95', repsSets: '4 sets x 8 reps', feedbackNote: 'Good form', sendToMember: false
  }, { id: 51, classId: 12 }), {
    classId: 12, memberId: 51, weight: 68.5, bodyFat: null, muscleMass: null,
    workoutResult: '4 sets x 8 reps • Max lift 95 kg', coachFeedback: 'Good form', sessionId: null,
    notifyMember: false
  });
});
