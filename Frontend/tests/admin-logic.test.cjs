const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relPath) =>
  fs.readFileSync(path.join(__dirname, '..', '..', relPath), 'utf8');

test('AdminManagementController preserves Active, Inactive, and Disabled center statuses', () => {
  const src = read('Backend/SportsCenterManagement.API/Controllers/AdminManagementController.cs');
  assert.match(src, /NormalizeCenterStatus\(request\.Status\)/);
  assert.match(src, /string\.Equals\(trimmed,\s*"Inactive",\s*StringComparison\.OrdinalIgnoreCase\)\)\s*return\s*"Inactive"/);
});

test('AdminManagementController Overview excludes deleted accounts and syncs locked/disabled status', () => {
  const src = read('Backend/SportsCenterManagement.API/Controllers/AdminManagementController.cs');
  assert.match(src, /user\.Status != "Deleted" && \(user\.Status == "Disabled" \|\| \(user\.LockedUntil != null && user\.LockedUntil > now\)\)/);
  assert.match(src, /db\.Users\.CountAsync\(user => user\.Status != "Deleted",\s*ct\)/);
  assert.match(src, /account\.Status = "Disabled"/);
  assert.match(src, /account\.Status = "Active"/);
});

test('AdminManagementController Accounts joins CoachProfiles and MemberProfiles for center and fullName resolution', () => {
  const src = read('Backend/SportsCenterManagement.API/Controllers/AdminManagementController.cs');
  assert.match(src, /join coach in db\.CoachProfiles\.AsNoTracking\(\)/);
  assert.match(src, /join member in db\.MemberProfiles\.AsNoTracking\(\)/);
  assert.match(src, /let resolvedCenterId =/);
  assert.match(src, /let resolvedFullName =/);
});

test('AdminManagementController UpdateManager allows disabling manager on inactive center and clears lock on activation', () => {
  const src = read('Backend/SportsCenterManagement.API/Controllers/AdminManagementController.cs');
  assert.match(src, /if \(center is null \|\| \(status == "Active" && center\.Status != "Active"\)\)/);
  assert.match(src, /manager\.User\.LockedUntil = null;/);
});

test('AuditLogService resolves Center entity names and AuditLogs UI maps Admin & RBAC actions', () => {
  const beSrc = read('Backend/SportsCenterManagement.BLL/Services/AuditLogService.cs');
  const feSrc = read('Frontend/src/pages/audit-logs/ui/AuditLogs.jsx');
  assert.match(beSrc, /else if \(log\.EntityType == "Center" && centers\.TryGetValue\(log\.EntityId\.Value, out var centerName\)\) entityName = centerName;/);
  assert.match(feSrc, /'ADMIN\.CENTER\.CREATED'/);
  assert.match(feSrc, /'ADMIN\.ACCOUNT\.LOCK'/);
  assert.match(feSrc, /'CENTER_USER_PERMISSIONS_REPLACED'/);
});

test('Admin Dashboard UI handles 0-count badges, disabled account unlock buttons, and locked manager status', () => {
  const ovSrc = read('Frontend/src/pages/admin-dashboard/ui/AdminOverviewTab.jsx');
  const accSrc = read('Frontend/src/pages/admin-dashboard/ui/AccountsTab.jsx');
  const mgrSrc = read('Frontend/src/pages/admin-dashboard/ui/ManagersTab.jsx');
  assert.match(ovSrc, /centers\.length \? Math\.round\(\(\(ov\?\.activeCenterCount \|\| 0\) \/ centers\.length\) \* 100\) : 0/);
  assert.match(ovSrc, /managers\.length \? Math\.round\(\(\(ov\?\.activeManagerCount \|\| 0\) \/ managers\.length\) \* 100\) : 0/);
  assert.match(accSrc, /const isLocked = isLockedByTime \|\| String\(a\.status \|\| ''\)\.toLowerCase\(\) === 'disabled';/);
  assert.match(mgrSrc, /const isManagerActive = m\.status === 'Active' && !\(m\.lockedUntil && parseApiDate\(m\.lockedUntil\) > new Date\(\)\);/);
});
