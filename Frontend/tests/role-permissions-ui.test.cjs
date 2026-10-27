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
const apiSource = fs.readFileSync(path.join(__dirname, '../src/services/backendApi.js'), 'utf8');

test('Admin can configure Manager permissions while Manager delegation remains restricted', () => {
  assert.doesNotMatch(source, /DELEGABLE_CAPABILITY_IDS/);
  assert.match(source, /isAdmin \|\| c\.defaultRole !== 'MANAGER'/);
  assert.match(source, /Admin có thể phân quyền cho Manager/);
  assert.doesNotMatch(source, /ID:\s*\{cap\.id\}/);
  assert.doesNotMatch(source, /\{cap\.id\}\s*<\/span>/);
  assert.match(source, /activeTab === 'USERS'/);
  assert.match(source, /systemApi\.updateUserPermissions/);
  assert.match(source, /systemApi\.resetRoleUserOverrides/);
  assert.match(source, /không thể tự sửa quyền/);
  assert.match(controllerSource, /canManageManagers && r\.Name == "Manager"/);
  assert.match(controllerSource, /canManageManagers && role\.Name == "Manager"/);
  assert.doesNotMatch(controllerSource, /role\.Name is "Manager" or "Admin"/);
  assert.match(apiSource, /apiRequest\(`centers\/\$\{centerId\(\)\}\/roles`\)/);
  assert.match(apiSource, /centers\/\$\{centerId\(\)\}\/roles\/\$\{Number\(roleId\)\}\/permissions/);
});

test('individual permission API blocks self-edit and both authorization paths enforce user overrides', () => {
  assert.match(controllerSource, /targetUserId == CurrentUserId/);
  assert.match(controllerSource, /CENTER_ROLE_USER_OVERRIDES_RESET/);
  assert.match(controllerSource, /canManageManagers && role\.Name == "Manager"/);
  assert.match(capabilityGuardSource, /ReadUser/);
  assert.doesNotMatch(capabilityGuardSource, /row\.Name is "Manager" or "Admin"/);
  assert.match(permissionGuardSource, /ReadUser/);
});
