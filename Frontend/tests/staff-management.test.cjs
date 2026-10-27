const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function loadHelpers() {
  const source = fs.readFileSync(path.join(__dirname, '../src/features/manager/staffManagementView.js'), 'utf8')
    .replaceAll('export const ', 'const ')
    .replaceAll('export function ', 'function ');
  const context = vm.createContext({});
  vm.runInContext(`${source}\nglobalThis.helpers = { COACH_CLASS_FILTER, matchesCoachClassFilter };`, context);
  return context.helpers;
}

test('coach class filter separates coaches with and without active class assignments', () => {
  const { COACH_CLASS_FILTER, matchesCoachClassFilter } = loadHelpers();
  const unassigned = { role: 'COACH', activeClassCount: 0 };
  const assigned = { role: 'COACH', activeClassCount: 2 };
  const unknown = { role: 'COACH', activeClassCount: null };
  const receptionist = { role: 'RECEPTIONIST', activeClassCount: 0 };

  assert.equal(matchesCoachClassFilter(unassigned, COACH_CLASS_FILTER.UNASSIGNED), true);
  assert.equal(matchesCoachClassFilter(assigned, COACH_CLASS_FILTER.UNASSIGNED), false);
  assert.equal(matchesCoachClassFilter(assigned, COACH_CLASS_FILTER.ASSIGNED), true);
  assert.equal(matchesCoachClassFilter(unknown, COACH_CLASS_FILTER.UNASSIGNED), false);
  assert.equal(matchesCoachClassFilter(receptionist, COACH_CLASS_FILTER.UNASSIGNED), false);
  assert.equal(matchesCoachClassFilter(receptionist, COACH_CLASS_FILTER.ALL), true);
});
