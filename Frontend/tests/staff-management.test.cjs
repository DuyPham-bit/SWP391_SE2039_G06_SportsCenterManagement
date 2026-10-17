const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function loadHelpers() {
  const source = fs.readFileSync(path.join(__dirname, '../src/features/manager/staffManagementView.js'), 'utf8')
    .replaceAll('export function ', 'function ');
  const context = vm.createContext({ Intl });
  vm.runInContext(`${source}\nglobalThis.helpers = { getVietnameseGivenName, sortStaffForManagement };`, context);
  return context.helpers;
}

const staff = [
  { id: 1, fullName: 'Trần Thị Bình', role: 'RECEPTIONIST', status: 'ACTIVE' },
  { id: 2, fullName: 'Nguyễn Văn An', role: 'COACH', status: 'DISABLED' },
  { id: 3, fullName: 'Lê Hoàng Dũng', role: 'COACH', status: 'ACTIVE' },
  { id: 4, fullName: 'Phạm Anh An', role: 'MANAGER', status: 'ACTIVE' },
  { id: 5, fullName: null, role: 'COACH', status: 'ACTIVE' }
];

test('locked staff stay at the bottom for every sorting mode', () => {
  const { sortStaffForManagement } = loadHelpers();
  for (const mode of ['DEFAULT', 'NAME_ASC', 'NAME_DESC', 'ROLE']) {
    const sorted = Array.from(sortStaffForManagement(staff, mode));
    const firstDisabled = sorted.findIndex(item => item.status !== 'ACTIVE');
    assert.equal(sorted.slice(firstDisabled).every(item => item.status !== 'ACTIVE'), true, mode);
  }
});

test('name sorting uses Vietnamese given name and keeps missing names last in its status group', () => {
  const { getVietnameseGivenName, sortStaffForManagement } = loadHelpers();
  assert.equal(getVietnameseGivenName('  Nguyễn   Văn An '), 'An');
  assert.deepEqual(Array.from(sortStaffForManagement(staff, 'NAME_ASC'), item => item.id), [4, 1, 3, 5, 2]);
  assert.deepEqual(Array.from(sortStaffForManagement(staff, 'NAME_DESC'), item => item.id), [3, 1, 4, 5, 2]);
});

test('staff sorting is null-safe, case-tolerant, stable, and does not mutate source data', () => {
  const { sortStaffForManagement } = loadHelpers();
  const input = [
    { id: 1, status: 'disabled' },
    { id: 2, status: 'Active' },
    { id: 3, status: 'ACTIVE' }
  ];
  assert.deepEqual(Array.from(sortStaffForManagement(input), item => item.id), [2, 3, 1]);
  assert.deepEqual(input.map(item => item.id), [1, 2, 3]);
  assert.deepEqual(Array.from(sortStaffForManagement(null)), []);
});

test('backend staff contract keeps ordering before paging and returns explicit self-action errors', () => {
  const service = fs.readFileSync(path.join(__dirname, '../../Backend/Backend/SportsCenterManagement.BLL/Services/StaffManagementService.cs'), 'utf8');
  const controller = fs.readFileSync(path.join(__dirname, '../../Backend/Backend/SportsCenterManagement.API/Controllers/StaffController.cs'), 'utf8');
  assert.ok(service.indexOf('var ordered = normalizedSort switch') < service.indexOf('.Skip((page - 1) * pageSize)'));
  assert.match(service, /actorUserId == staffUserId/);
  assert.match(service, /STAFF-SELF-LOCK/);
  assert.match(service, /STAFF-SELF-EDIT/);
  assert.match(controller, /StatusCodes\.Status403Forbidden, new \{ message = exception\.Message \}/);
});
