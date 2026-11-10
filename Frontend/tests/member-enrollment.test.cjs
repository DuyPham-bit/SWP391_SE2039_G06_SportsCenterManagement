const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { transformSync } = require('esbuild');

function loadEnrollmentView() {
  const file = path.join(__dirname, '../src/pages/member-enrollment/model/enrollmentView.js');
  const { code } = transformSync(fs.readFileSync(file, 'utf8'), { format: 'cjs', loader: 'js' });
  const module = { exports: {} };
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

const view = loadEnrollmentView();

const options = {
  centerId: 15,
  subscriptions: [{ subscriptionId: 9, packageName: 'Gói Pro', allowedSports: 3, maxClasses: 3, usedSportIds: [1], usedClasses: 1 }],
  sports: [
    {
      sportId: 1, name: 'Bơi', isEnrolled: true,
      coaches: [
        { coachId: 11, fullName: 'HLV A', averageRating: 4.8, reviewCount: 5, classes: [
          { classId: 100, name: 'Bơi sáng', capacity: 10, enrolledCount: 10, enrollmentId: 7, eligibleSubscriptionId: null, blockedCode: null,
            schedules: [{ dayOfWeek: 3, startTime: '07:00:00', endTime: '08:00:00' }, { dayOfWeek: 1, startTime: '07:00:00', endTime: '08:00:00' }] },
          { classId: 101, name: 'Bơi tối', capacity: 10, enrolledCount: 4, enrollmentId: null, eligibleSubscriptionId: 9, blockedCode: null, schedules: [] }
        ] },
        { coachId: 12, fullName: 'HLV B', averageRating: null, reviewCount: 0, classes: [
          { classId: 102, name: 'Bơi trẻ em', capacity: 8, enrolledCount: 8, enrollmentId: null, eligibleSubscriptionId: null, blockedCode: 'CLASS_FULL', schedules: [] }
        ] }
      ]
    },
    {
      sportId: 2, name: 'Gym', isEnrolled: false,
      coaches: [{ coachId: 13, fullName: 'HLV C', averageRating: 4.2, reviewCount: 2, classes: [
        { classId: 200, name: 'Gym', capacity: 20, enrolledCount: 3, enrollmentId: null, eligibleSubscriptionId: null, blockedCode: 'SPORT_LIMIT', schedules: [] }
      ] }]
    }
  ]
};

test('weekly schedules are sorted Monday first and labelled in Vietnamese and English', () => {
  const schedules = options.sports[0].coaches[0].classes[0].schedules;
  assert.deepEqual(view.formatSchedules(schedules, false), ['Thứ 2 · 07:00–08:00', 'Thứ 4 · 07:00–08:00']);
  assert.deepEqual(view.formatSchedules([{ dayOfWeek: 7, startTime: '18:30:00', endTime: '19:30:00' }], true), ['Sun · 18:30–19:30']);
  assert.deepEqual(view.formatSchedules([], false), []);
});

test('seats left never go negative', () => {
  assert.equal(view.seatsLeft({ capacity: 10, enrolledCount: 4 }), 6);
  assert.equal(view.seatsLeft({ capacity: 8, enrolledCount: 9 }), 0);
});

test('class state is derived from the backend verdict only', () => {
  const [enrolled, open] = options.sports[0].coaches[0].classes;
  assert.equal(view.classState(enrolled), 'enrolled');
  assert.equal(view.classState(open), 'available');
  assert.equal(view.classState(options.sports[0].coaches[1].classes[0]), 'blocked');
});

test('coach summary counts joinable classes and keeps the enrolled one visible', () => {
  const summary = view.summarizeCoach(options.sports[0].coaches[0]);
  assert.equal(summary.availableCount, 1);
  assert.equal(summary.isEnrolled, true);
  assert.equal(summary.ratingLabel, '4.8');
  assert.equal(view.summarizeCoach(options.sports[0].coaches[1]).ratingLabel, null);
});

test('sport summary reports coaches, joinable classes and enrollment', () => {
  const swim = view.summarizeSport(options.sports[0]);
  assert.deepEqual({ coachCount: swim.coachCount, availableCount: swim.availableCount, isEnrolled: swim.isEnrolled },
    { coachCount: 2, availableCount: 1, isEnrolled: true });
  const gym = view.summarizeSport(options.sports[1]);
  assert.equal(gym.availableCount, 0);
  assert.equal(gym.blockedCode, 'SPORT_LIMIT');
});

test('package usage shows sports and classes used against the allowance', () => {
  const usage = view.packageUsage(options.subscriptions);
  assert.deepEqual(usage, [{ subscriptionId: 9, packageName: 'Gói Pro', sportsUsed: 1, sportsAllowed: 3, classesUsed: 1, classesAllowed: 3 }]);
  assert.deepEqual(view.packageUsage([]), []);
});

test('blocked reason uses the backend text in Vietnamese and the code in English', () => {
  const cls = { blockedCode: 'SPORT_LIMIT', blockedReason: 'Gói tập đã dùng hết số môn được phép.' };
  assert.equal(view.blockedMessage(cls, false), 'Gói tập đã dùng hết số môn được phép.');
  assert.match(view.blockedMessage(cls, true), /allowed sports/);
  assert.equal(view.blockedMessage({ blockedCode: null }, true), null);
});

test('enrollment API errors are translated for members', () => {
  assert.match(view.enrollmentErrorMessage(new Error('Class is full.'), false), /đủ chỗ/);
  assert.match(view.enrollmentErrorMessage(new Error('Membership sport allowance has been reached.'), false), /số môn/);
  assert.match(view.enrollmentErrorMessage(new Error('Membership class allowance has been reached.'), false), /số lớp/);
  assert.match(view.enrollmentErrorMessage(new Error('An active membership is required to enroll.'), false), /gói tập/);
  assert.match(view.enrollmentErrorMessage(new Error('Class is full.'), true), /full/i);
  assert.equal(view.enrollmentErrorMessage(new Error('Lỗi khác từ máy chủ'), false), 'Lỗi khác từ máy chủ');
});

test('filterVisibleSports hides unstudied sports when enrolled sports exist, and preserves all sports for new members', () => {
  // options.sports[0] is enrolled (Bơi), options.sports[1] is not (Gym)
  const filtered = view.filterVisibleSports(options.sports);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].sportId, 1);
  assert.equal(filtered[0].name, 'Bơi');

  // When no sports are enrolled, returns all available sports so new member can choose
  const unenrolledList = options.sports.map(s => ({
    ...s,
    isEnrolled: false,
    coaches: s.coaches.map(c => ({
      ...c,
      classes: c.classes.map(cl => ({ ...cl, enrollmentId: null }))
    }))
  }));
  const unenrolledFiltered = view.filterVisibleSports(unenrolledList);
  assert.equal(unenrolledFiltered.length, 2);

  // Handles null / empty gracefully
  assert.deepEqual(view.filterVisibleSports([]), []);
  assert.deepEqual(view.filterVisibleSports(null), []);
});

