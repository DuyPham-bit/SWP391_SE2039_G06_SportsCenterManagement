const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const source = fs.readFileSync(
  path.join(__dirname, '../src/features/manager/RolesPermissions.jsx'),
  'utf8'
);
const controllerSource = fs.readFileSync(path.join(__dirname, '../../Backend/Backend/SportsCenterManagement.API/Controllers/CenterPermissionsController.cs'), 'utf8');
const capabilityGuardSource = fs.readFileSync(path.join(__dirname, '../../Backend/Backend/SportsCenterManagement.API/Authorization/CenterCapabilityAttribute.cs'), 'utf8');
const permissionGuardSource = fs.readFileSync(path.join(__dirname, '../../Backend/Backend/SportsCenterManagement.API/Authorization/PermissionAuthorizationHandler.cs'), 'utf8');

test('center delegation UI does not present Manager as an editable role or expose capability IDs', () => {
  assert.match(source, /DELEGABLE_CAPABILITY_IDS/);
  assert.match(source, /defaultRole !== 'MANAGER'/);
  assert.doesNotMatch(source, /ID:\s*\{cap\.id\}/);
  assert.doesNotMatch(source, /\{cap\.id\}\s*<\/span>/);
  assert.doesNotMatch(source, /Quản Lý \(Manager\)/);
  assert.match(source, /activeTab === 'USERS'/);
  assert.match(source, /systemApi\.updateUserPermissions/);
  assert.match(source, /systemApi\.resetRoleUserOverrides/);
  assert.match(source, /không thể tự sửa quyền/);
});

test('individual permission API blocks self-edit and both authorization paths enforce user overrides', () => {
  assert.match(controllerSource, /targetUserId == CurrentUserId/);
  assert.match(controllerSource, /CENTER_ROLE_USER_OVERRIDES_RESET/);
  assert.match(controllerSource, /role\.Name == "Member" \|\| role\.Name == "Coach" \|\| role\.Name == "Receptionist"/);
  assert.match(capabilityGuardSource, /ReadUser/);
  assert.match(permissionGuardSource, /ReadUser/);
});
