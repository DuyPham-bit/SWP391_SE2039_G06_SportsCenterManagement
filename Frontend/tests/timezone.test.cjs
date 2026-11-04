const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const viewUrl = pathToFileURL(path.join(__dirname, '../src/features/coach/coachProfessionalView.js')).href;
const timezones = ['Asia/Ho_Chi_Minh', 'UTC', 'America/Los_Angeles', 'Asia/Tokyo', 'Pacific/Kiritimati'];

for (const timezone of timezones) {
  test(`coach calendars use Vietnam dates and hours when the device is in ${timezone}`, () => {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
      import { localDateKey, mergeCoachCalendar, calendarWindow, classSessionWindow } from ${JSON.stringify(viewUrl)};
      console.log(JSON.stringify({
        day: localDateKey('2026-10-30T18:30:00Z'),
        events: mergeCoachCalendar([{ startAt: '2026-10-30T18:30:00' }]),
        week: calendarWindow('2026-10-31', 'week'),
        overnight: classSessionWindow({ sessionDate: '2026-10-31', startTime: '23:00:00', endTime: '01:00:00' })
      }));
    `], { env: { ...process.env, TZ: timezone }, encoding: 'utf8' });
    const result = JSON.parse(output);
    assert.equal(result.day, '2026-10-31');
    assert.equal(result.events[0].date, '2026-10-31');
    assert.equal(result.events[0].startLabel, '01:30');
    assert.deepEqual(result.week, { from: '2026-10-26', to: '2026-11-01' });
    assert.deepEqual(result.overnight, { startAt: '2026-10-31T23:00', endAt: '2026-11-01T01:00' });
  });
}

const timeUrl = pathToFileURL(path.join(__dirname, '../src/utils/dateTime.js')).href;
const memberUrl = pathToFileURL(path.join(__dirname, '../src/features/member/memberOverview.js')).href;

for (const timezone of timezones) {
  test(`Vietnam midnight, SQL timestamps and form inputs stay consistent in ${timezone}`, () => {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
      import * as time from ${JSON.stringify(timeUrl)};
      import { calendarWindow } from ${JSON.stringify(viewUrl)};
      import { getMembershipSummary, getMemberReminders } from ${JSON.stringify(memberUrl)};
      const midnight = new Date('2026-12-31T17:00:00Z');
      console.log(JSON.stringify({
        beforeMidnight: time.vietnamDate('2026-12-31T16:59:59Z'),
        midnight: time.vietnamDate(midnight),
        sqlTimestamp: time.parseApiDate('2026-12-31T17:00:00').toISOString(),
        input: time.vietnamDateTimeInput(midnight),
        submitted: time.parseVietnamDateTime('2027-01-01T00:00').toISOString(),
        dstInput: time.parseVietnamDateTime('2026-11-01T01:30').toISOString(),
        offsetInput: time.parseVietnamDateTime('2026-12-31T17:00:00Z').toISOString(),
        dateOnly: time.formatVietnamDate('2027-01-01', false, { day: '2-digit', month: '2-digit', year: 'numeric' }),
        hour: time.formatVietnamTime('2026-10-30T18:30:00'),
        invalid: time.formatVietnamDateTime('invalid'),
        leapDay: time.addCalendarDays('2028-02-28', 1),
        nextYear: time.addCalendarDays('2026-12-31', 1),
        month: calendarWindow('2027-01-01', 'month'),
        expired: getMembershipSummary({ packageStatus: 'ACTIVE', packageExpiry: '2026-12-31' }, midnight).active,
        reminders: getMemberReminders({ packageStatus: 'ACTIVE', packageExpiry: '2027-02-01' }, [{
          id: 1, status: 'CONFIRMED', sessionStatus: 'SCHEDULED', bookingDate: '2027-01-01',
          startTime: '00:30:00', className: 'Yoga', roomName: 'Room', timeSlot: '00:30 - 01:30'
        }], midnight).map(item => item.id)
      }));
    `], { env: { ...process.env, TZ: timezone }, encoding: 'utf8' });
    assert.deepEqual(JSON.parse(output), {
      beforeMidnight: '2026-12-31', midnight: '2027-01-01',
      sqlTimestamp: '2026-12-31T17:00:00.000Z', input: '2027-01-01T00:00',
      submitted: '2026-12-31T17:00:00.000Z', dstInput: '2026-10-31T18:30:00.000Z',
      offsetInput: '2026-12-31T17:00:00.000Z', dateOnly: '01/01/2027', hour: '01:30', invalid: '—',
      leapDay: '2028-02-29', nextYear: '2027-01-01',
      month: { from: '2027-01-01', to: '2027-01-31' }, expired: false, reminders: ['session-1']
    });
  });

  test(`member and coach calendar grids stay on the selected dates in ${timezone}`, () => {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
      import { createRequire } from 'node:module';
      import { readFileSync } from 'node:fs';
      import { createContext, runInContext } from 'node:vm';
      import * as time from ${JSON.stringify(timeUrl)};
      const require = createRequire(${JSON.stringify(__filename)});
      const { transformSync } = require('esbuild');
      const root = ${JSON.stringify(path.join(__dirname, '../src/features'))};
      function load(relative, exports) {
        const source = readFileSync(root + '/' + relative, 'utf8') + '\\nexport { ' + exports + ' };';
        const module = { exports: {} };
        const context = createContext({ Date, Intl, module, require: id => id.includes('utils/dateTime') ? time : {} });
        runInContext(transformSync(source, { format: 'cjs', loader: 'jsx' }).code, context);
        return module.exports;
      }
      const grids = ['member/ClassScheduleView.jsx', 'coach/TeachingSchedule.jsx'].map(file => {
        const calendar = load(file, 'parseIsoDate, formatIsoDate, getWeekDays, getMonthCalendarGrid');
        return {
          date: calendar.formatIsoDate(calendar.parseIsoDate('2026-11-01')),
          week: calendar.getWeekDays(calendar.parseIsoDate('2026-11-01')).map(calendar.formatIsoDate),
          month: calendar.getMonthCalendarGrid(2026, 10).map(calendar.formatIsoDate)
        };
      });
      const attendance = load('coach/Attendance.jsx', 'getMondayOfDate, getWeekDays, toIsoDate');
      console.log(JSON.stringify({ grids,
        attendance: attendance.getWeekDays(attendance.getMondayOfDate(time.parseCalendarDate('2026-11-01'))).map(attendance.toIsoDate)
      }));
    `], { env: { ...process.env, TZ: timezone }, encoding: 'utf8' });
    const result = JSON.parse(output);
    const expectedWeek = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'];
    for (const grid of result.grids) {
      assert.equal(grid.date, '2026-11-01');
      assert.deepEqual(grid.week, expectedWeek);
      assert.equal(grid.month.length, 42);
      assert.equal(grid.month[0], '2026-10-26');
      assert.equal(grid.month[41], '2026-12-06');
    }
    assert.deepEqual(result.attendance, expectedWeek);
  });
}
