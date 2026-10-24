const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const view = import('../src/features/coach/coachProfessionalView.js');

function loadProfessionalApis() {
  const source = fs.readFileSync(path.join(__dirname, '../src/services/api.js'), 'utf8')
    .replace(/^import .+;\r?\n/gm, '')
    .replaceAll('export const ', 'const ')
    .replace(/export \{[\s\S]+?\} from '.+?';?\s*$/m, '');
  const calls = [];
  const context = vm.createContext({
    URLSearchParams,
    apiRequest: async (route, options = {}) => {
      calls.push({ route, options });
      return { route, options };
    }
  });
  vm.runInContext(`${source}\nglobalThis.professional = { coachApi, coachProfessionalApi, memberCoachApi, managerCoachApi };`, context);
  return { ...context.professional, calls };
}

test('professional calendar supports day, Monday-based week and month windows', async () => {
  const { calendarWindow } = await view;
  assert.deepEqual(calendarWindow('2026-10-17', 'day'), { from: '2026-10-17', to: '2026-10-17' });
  assert.deepEqual(calendarWindow('2026-10-17', 'week'), { from: '2026-10-12', to: '2026-10-18' });
  assert.deepEqual(calendarWindow('2026-10-17', 'month'), { from: '2026-10-01', to: '2026-10-31' });
});

test('calendar merges PT and class sessions in chronological order', async () => {
  const { mergeCoachCalendar } = await view;
  const result = mergeCoachCalendar(
    [{ id: 2, eventType: 'PersonalTraining', startAt: '2026-10-17T09:30:00+07:00' }],
    [{ id: 1, eventType: 'ClassSession', sessionDate: '2026-10-17', startTime: '08:00:00' }]
  );
  assert.equal(result.length, 2);
  assert.equal(result[0].id, 1);
  assert.equal(result[1].id, 2);
});

test('selecting a class session fills the exact leave window, including overnight sessions', async () => {
  const { classSessionWindow } = await view;
  assert.deepEqual(classSessionWindow({ sessionDate: '2026-10-25', startTime: '08:00:00', endTime: '10:30:00' }), {
    startAt: '2026-10-25T08:00', endAt: '2026-10-25T10:30'
  });
  assert.deepEqual(classSessionWindow({ sessionDate: '2026-10-25', startTime: '23:00:00', endTime: '01:00:00' }), {
    startAt: '2026-10-25T23:00', endAt: '2026-10-26T01:00'
  });
  const source = fs.readFileSync(path.join(__dirname, '../src/features/coach/CoachProfessionalHub.jsx'), 'utf8');
  assert.match(source, /Xin đổi đúng ca này/);
  assert.match(source, /coverage\.candidates\.map/);
  assert.doesNotMatch(source, /data\.peerCoaches\?\.map/);
});

test('leave timestamps stored as UTC are displayed in Vietnam time', async () => {
  const { formatVietnamDateTime } = await view;
  const explicitUtc = formatVietnamDateTime('2026-10-25T01:30:00Z', true);
  const sqlUnspecifiedUtc = formatVietnamDateTime('2026-10-25T01:30:00', true);
  assert.match(explicitUtc, /08:30/);
  assert.equal(sqlUnspecifiedUtc, explicitUtc);

  const service = fs.readFileSync(path.join(__dirname, '../../Backend/Backend/SportsCenterManagement.BLL/Services/CoachProfessionalService.cs'), 'utf8');
  assert.match(service, /StartAt = AsUtc\(x\.StartAt\)/);
  assert.match(service, /StartAt = AsUtc\(leave\.StartAt\)/);
});

test('replacement option API sends the selected leave window', async () => {
  const api = loadProfessionalApis();
  await api.coachProfessionalApi.getLeaveReplacementOptions('2026-10-25T08:00', '2026-10-25T10:00');
  assert.equal(api.calls[0].route, 'coaches/me/leave-replacement-options?startAt=2026-10-25T08%3A00&endAt=2026-10-25T10%3A00');
  assert.equal(api.calls[0].options.method, undefined);
});

test('manager has a dedicated pending leave approval entry and status filters', () => {
  const sidebar = fs.readFileSync(path.join(__dirname, '../src/components/layout/Sidebar.jsx'), 'utf8');
  const manager = fs.readFileSync(path.join(__dirname, '../src/features/manager/ManagerCoachOperations.jsx'), 'utf8');
  const service = fs.readFileSync(path.join(__dirname, '../../Backend/Backend/SportsCenterManagement.BLL/Services/CoachProfessionalService.cs'), 'utf8');
  assert.match(sidebar, /Duyệt đơn nghỉ HLV/);
  assert.match(manager, /leaveStatusFilter.*Pending/);
  assert.match(manager, /pendingLeaveCount/);
  assert.match(service, /Status = "Pending"/);
  assert.match(service, /request\.Status is not \("Approved" or "Rejected"\)/);
});

test('TDEE uses Mifflin-St Jeor inputs and rejects incomplete metrics', async () => {
  const { tdeeEstimate } = await view;
  assert.equal(tdeeEstimate({ gender: 'male', weightKg: 80, heightCm: 180, age: 30, activity: 1.55 }), 2759);
  assert.equal(tdeeEstimate({ gender: 'female', weightKg: 0, heightCm: 165, age: 30 }), null);
});

test('drag-drop plan schedule fields are persisted through the personal plan API contract', async () => {
  const api = loadProfessionalApis();
  await api.coachApi.savePersonalTrainingPlan({
    classId: '12', memberId: '21', title: 'Strength month', goal: 'Increase strength',
    startDate: '2026-10-19', endDate: '2026-11-15', fitnessCondition: 'Intermediate',
    exercises: [{ name: 'Squat', sets: 4, reps: 8, note: 'RPE 8', weekNumber: 3, dayOfWeek: 'Wednesday' }]
  });
  const call = api.calls.at(-1);
  assert.equal(call.route, 'coaches/me/personal-training-plans');
  assert.equal(call.options.method, 'PUT');
  assert.equal(call.options.body.classId, 12);
  assert.equal(call.options.body.memberId, 21);
  assert.deepEqual(JSON.parse(JSON.stringify(call.options.body.exercises[0])), {
    name: 'Squat', sets: '4', reps: '8', note: 'RPE 8', weekNumber: 3, dayOfWeek: 'Wednesday'
  });
});

test('coach, member and manager professional clients call role-scoped endpoints', async () => {
  const api = loadProfessionalApis();
  await api.coachProfessionalApi.createEvent({ title: 'PT' });
  await api.memberCoachApi.respondEvent(9, 'Confirmed');
  await api.managerCoachApi.reviewLeave(5, { status: 'Approved' });
  assert.deepEqual(api.calls.map(call => [call.route, call.options.method]), [
    ['coaches/me/work-events', 'POST'],
    ['members/me/coach-events/9/status', 'PATCH'],
    ['manager/coach-operations/leaves/5', 'PATCH']
  ]);
});
