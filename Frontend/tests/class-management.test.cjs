const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function loadHelpers() {
  const source = fs.readFileSync(path.join(__dirname, '../src/features/manager/classManagementView.js'), 'utf8')
    .replaceAll('export const ', 'const ')
    .replaceAll('export function ', 'function ');
  const context = vm.createContext({ Intl });
  vm.runInContext(`${source}\nglobalThis.helpers = { CLASS_STATUS, WEEK_DAYS, splitAndSortClasses, filterClasses, groupSchedulesByDay, effectiveScheduleRoom, scheduleEndTime, validateClassForm, validateScheduleForm, isRoomMatchingSport, filterRoomsForSport, isCoachMatchingSport, filterCoachesForSport };`, context);
  return context.helpers;
}

test('cancelled classes are separated from active classes and both tabs sort by name', () => {
  const { splitAndSortClasses } = loadHelpers();
  const classes = [
    { id: 1, name: 'Yoga', status: 'Cancelled' },
    { id: 2, name: 'Boxing', status: 'Published' },
    { id: 3, name: 'Aerobic', status: 'Draft' },
    { id: 4, name: 'Bơi', status: 'Cancelled' }
  ];

  const result = splitAndSortClasses(classes);

  assert.deepEqual(Array.from(result.active, item => item.id), [3, 2]);
  assert.deepEqual(Array.from(result.cancelled, item => item.id), [4, 1]);
  assert.deepEqual(classes.map(item => item.id), [1, 2, 3, 4]);
});

test('class search covers operational fields and ignores Vietnamese letter case', () => {
  const { filterClasses } = loadHelpers();
  const classes = [
    { id: 1, name: 'Yoga sáng', sportName: 'Yoga', coachName: 'An', roomName: 'Phòng A' },
    { id: 2, name: 'Bơi nâng cao', sportName: 'Bơi lội', coachName: 'Bình', roomName: 'Hồ lớn' }
  ];

  assert.deepEqual(Array.from(filterClasses(classes, 'PHÒNG'), item => item.id), [1]);
  assert.deepEqual(Array.from(filterClasses(classes, 'bình'), item => item.id), [2]);
});

test('calendar groups schedules by weekday and sorts each day by starting time', () => {
  const { groupSchedulesByDay } = loadHelpers();
  const groups = groupSchedulesByDay([
    { id: 1, dayOfWeek: 1, startTime: '18:00:00' },
    { id: 2, dayOfWeek: 1, startTime: '08:00:00' },
    { id: 3, dayOfWeek: 5, startTime: '10:00:00' }
  ]);

  assert.deepEqual(Array.from(groups[1].items, item => item.id), [2, 1]);
  assert.deepEqual(Array.from(groups[5].items, item => item.id), [3]);
});

test('form validation rejects invalid unhappy cases before calling the API', () => {
  const { validateClassForm, validateScheduleForm } = loadHelpers();

  assert.match(validateClassForm({ name: ' ', sportId: 1, capacity: 10, durationMinutes: 60 }), /tên lớp/);
  assert.match(validateClassForm({ name: 'A', sportId: '', capacity: 10, durationMinutes: 60 }), /bộ môn/);
  assert.match(validateClassForm({ name: 'A', sportId: 1, capacity: 0, durationMinutes: 60 }), /Sức chứa/);
  assert.match(validateScheduleForm({ startDate: '2026-10-16', endDate: '2026-10-15', startTime: '08:00', endTime: '09:00' }), /Ngày kết thúc/);
  assert.match(validateScheduleForm({ startDate: '2026-10-15', endDate: '2026-10-16', startTime: '09:00', endTime: '09:00' }), /Giờ kết thúc/);
  assert.match(validateScheduleForm({ startDate: '2026-10-15', endDate: '2026-10-16', startTime: '01:00', endTime: '02:00' }, 60), /05:00.*22:00/);
  assert.match(validateScheduleForm({ startDate: '2026-10-15', endDate: '2026-10-16', startTime: '21:30', endTime: '22:01' }, 60), /05:00.*22:00/);
  assert.match(validateScheduleForm({ startDate: '2026-10-15', endDate: '2026-10-16', startTime: '08:00', endTime: '09:31' }, 90), /90 phút/);
  assert.equal(validateClassForm({ name: 'A', sportId: 1, capacity: 10, durationMinutes: 60 }), '');
  assert.equal(validateScheduleForm({ startDate: '2026-10-15', endDate: '2026-10-16', startTime: '05:00', endTime: '06:30' }, 90), '');
  assert.equal(validateScheduleForm({ startDate: '2026-10-15', endDate: '2026-10-16', startTime: '20:30', endTime: '22:00' }, 90), '');
});

test('new schedule end time follows the configured class duration', () => {
  const { scheduleEndTime } = loadHelpers();
  assert.equal(scheduleEndTime('08:00', 60), '09:00');
  assert.equal(scheduleEndTime('08:00', 90), '09:30');
  assert.equal(scheduleEndTime('21:30', 60), '22:30');
});

test('room and coach filters isolate facilities and coaches matching the selected sport', () => {
  const { filterRoomsForSport, filterCoachesForSport } = loadHelpers();
  const rooms = [
    { id: 1, name: 'Bể bơi Olympic 50m', type: 'Swimming Pool', status: 'Active' },
    { id: 2, name: 'Phòng Gym High-Performance', type: 'Gym', status: 'Active' },
    { id: 3, name: 'Sân Cầu lông #1', type: 'Badminton Court', status: 'Active' },
    { id: 4, name: 'Phòng đã đóng', type: 'Swimming Pool', status: 'Inactive' }
  ];
  const coaches = [
    { id: 10, fullName: 'Trần Hải Đăng', specialization: 'Bơi lội, Kỹ thuật đường bơi tốc độ' },
    { id: 11, fullName: 'Bùi Phương Nam', specialization: 'Gym & Fitness, HIIT' },
    { id: 12, fullName: 'Phạm Thế Anh', specialization: 'Cầu lông' }
  ];

  const swimSport = { id: 101, name: 'Bơi lội' };
  const filteredRooms = filterRoomsForSport(rooms, swimSport);
  assert.deepEqual(filteredRooms.map(r => r.id), [1]);

  const filteredCoaches = filterCoachesForSport(coaches, swimSport);
  assert.deepEqual(filteredCoaches.map(c => c.id), [10]);

  // Selected room and coach retention
  const retainedRooms = filterRoomsForSport(rooms, swimSport, 2);
  assert.equal(retainedRooms.some(r => r.id === 2), true);
});
