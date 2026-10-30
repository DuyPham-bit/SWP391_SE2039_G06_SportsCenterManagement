const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const viewUrl = pathToFileURL(path.join(__dirname, '../src/features/coach/coachProfessionalView.js')).href;
const timezones = ['UTC', 'America/Los_Angeles', 'Asia/Tokyo', 'Pacific/Kiritimati'];

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
