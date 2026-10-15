const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function loadHelpers() {
  const source = fs.readFileSync(path.join(__dirname, '../src/features/manager/coachAssignmentView.js'), 'utf8')
    .replaceAll('export function ', 'function ');
  const context = vm.createContext({ Intl, Set });
  vm.runInContext(`${source}\nglobalThis.helpers = { isCoachCompatible, summarizeCoachAssignments, filterAndSortAssignmentClasses, coachWorkload };`, context);
  return context.helpers;
}

test('assignment overview excludes closed classes and counts actionable states', () => {
  const { summarizeCoachAssignments } = loadHelpers();
  const result = summarizeCoachAssignments([
    { status: 'Draft', coachId: null },
    { status: 'Published', coachId: 2 },
    { status: 'Cancelled', coachId: null },
    { status: 'Completed', coachId: 3 }
  ]);
  assert.deepEqual({ ...result }, { total: 2, assigned: 1, unassigned: 1, draft: 1 });
});

test('unassigned classes appear first and search covers operational fields', () => {
  const { filterAndSortAssignmentClasses } = loadHelpers();
  const classes = [
    { id: 1, name: 'Yoga', status: 'Published', coachId: 2, coachName: 'An' },
    { id: 2, name: 'Alpha Swim', status: 'Draft', coachId: null, roomName: 'Hồ lớn' },
    { id: 3, name: 'Beta Boxing', status: 'Draft', coachId: null, roomName: 'Võ đài' }
  ];
  assert.deepEqual(Array.from(filterAndSortAssignmentClasses(classes), item => item.id), [2, 3, 1]);
  assert.deepEqual(Array.from(filterAndSortAssignmentClasses(classes, 'hồ'), item => item.id), [2]);
  assert.deepEqual(Array.from(filterAndSortAssignmentClasses(classes, '', 'assigned'), item => item.id), [1]);
});

test('coach compatibility prioritizes fixed sport IDs and keeps legacy text fallback', () => {
  const { isCoachCompatible } = loadHelpers();
  assert.equal(isCoachCompatible({ sportIds: [2, 5], specialization: 'Wrong' }, { sportId: 5, sportName: 'Yoga' }), true);
  assert.equal(isCoachCompatible({ sportIds: [2], specialization: 'Yoga' }, { sportId: 5, sportName: 'Yoga' }), false);
  assert.equal(isCoachCompatible({ specialization: 'Yoga & Pilates, Phục hồi' }, { sportName: 'Yoga & Pilates' }), true);
  assert.equal(isCoachCompatible({ specialization: 'Yoga' }, { sportName: 'Yoga & Pilates' }), false);
  assert.equal(isCoachCompatible({ specialization: '' }, { sportName: 'Yoga' }), false);
});

test('coach workload counts only active primary assignments', () => {
  const { coachWorkload } = loadHelpers();
  const result = coachWorkload([{ id: 1, fullName: 'A' }, { id: 2, fullName: 'B' }], [
    { coachId: 1, status: 'Published' }, { coachId: 1, status: 'Cancelled' }, { coachId: 2, status: 'Draft' },
    { coachId: 2, status: 'Published' }, { coachId: 2, status: 'Completed' }
  ]);
  assert.deepEqual(Array.from(result, item => [item.id, item.primaryClassCount]), [[1, 1], [2, 2]]);
});
