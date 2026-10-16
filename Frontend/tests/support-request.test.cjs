const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function loadPermissions() {
  const code = fs.readFileSync(path.join(__dirname, '../src/services/permissions.js'), 'utf8')
    .replaceAll("import { getAuthUser } from './authState.js';", "const getAuthUser = () => null;")
    .replaceAll('export const ', 'const ')
    .replaceAll('export function ', 'function ');

  const context = vm.createContext({});
  vm.runInContext(`${code}\nglobalThis.exported = { SYSTEM_CAPABILITIES, getDynamicNavItems, hasCapability };`, context);
  return context.exported;
}

test('COACH and MEMBER dynamic navigation items include dedicated support request paths', () => {
  const { getDynamicNavItems } = loadPermissions();

  const coachItems = getDynamicNavItems('COACH');
  const coachSupport = coachItems.find(item => item.path === '#/coach/support');
  assert.ok(coachSupport, 'Coach must have a support navigation item at #/coach/support');
  assert.equal(coachSupport.label, 'Yêu Cầu Hỗ Trợ');

  const memberItems = getDynamicNavItems('MEMBER');
  const memberSupport = memberItems.find(item => item.path === '#/member/support');
  assert.ok(memberSupport, 'Member must have a support navigation item at #/member/support');
  assert.equal(memberSupport.label, 'Yêu Cầu Hỗ Trợ');
});

test('SYSTEM_CAPABILITIES includes coach_support and member_support entries', () => {
  const { SYSTEM_CAPABILITIES } = loadPermissions();

  const coachCap = SYSTEM_CAPABILITIES.find(c => c.id === 'coach_support');
  assert.ok(coachCap, 'SYSTEM_CAPABILITIES must have coach_support capability');
  assert.equal(coachCap.path, '#/coach/support');

  const memberCap = SYSTEM_CAPABILITIES.find(c => c.id === 'member_support');
  assert.ok(memberCap, 'SYSTEM_CAPABILITIES must have member_support capability');
  assert.equal(memberCap.path, '#/member/support');
});
