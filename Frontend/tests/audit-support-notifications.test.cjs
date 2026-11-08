const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { apiSource } = require('./helpers/apiSources.cjs');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.join(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('audit API and manager UI do not expose before/after values', () => {
  const response = read('Backend/SportsCenterManagement.BLL/DTOs/Audit/Responses.cs');
  const query = read('Backend/SportsCenterManagement.BLL/Services/AuditLogService.cs');
  const ui = read('Frontend/src/pages/audit-logs/ui/AuditLogs.jsx');
  const api = apiSource();

  assert.doesNotMatch(response, /OldValues|NewValues/);
  assert.doesNotMatch(query, /log\.OldValues|log\.NewValues/);
  assert.doesNotMatch(ui, /oldValues|newValues|Giá trị trước \/ sau|View Diff \(Before \/ After\)/);
  assert.match(ui, /Đối Tượng Tác Động/);
  assert.doesNotMatch(api.slice(api.indexOf('async getAuditPage'), api.indexOf('async getPermissions')), /oldValues|newValues/);
});

test('manager can process support tickets but cannot create a ticket for a requester', () => {
  const controller = read('Backend/SportsCenterManagement.API/Controllers/SupportRequestsController.cs');
  const supportUi = read('Frontend/src/widgets/support-inbox/ui/SupportRequests.jsx');
  const managerUi = read('Frontend/src/pages/manager-support/ui/ManagerSupportCommunications.jsx');

  assert.match(controller, /\[Authorize\(Roles = "RECEPTIONIST"\)\]\s*public async Task<ActionResult<SupportDetails>> Create/);
  assert.match(supportUi, /currentUser\?\.role[\s\S]*=== 'RECEPTIONIST'/);
  assert.match(managerUi, /<SupportRequests allowCreate=\{false\} showHeader=\{false\}/);
  assert.match(managerUi, /systemApi\.sendCenterNotification/);
  assert.doesNotMatch(managerUi, /Phạm vi được Backend kiểm soát|Server-enforced scope/);
});

test('center notification backend rebuilds a safe recipient list and records audit', () => {
  const service = read('Backend/SportsCenterManagement.BLL/Services/CenterNotificationService.cs');
  const repository = read('Backend/SportsCenterManagement.DAL/Repositories/Implementations/NotificationRepository.cs');
  const controller = read('Backend/SportsCenterManagement.API/Controllers/NotificationsController.cs');
  const code = service + '\n' + repository;

  assert.match(controller, /\[Authorize\(Roles = "MANAGER"\)\]/);
  assert.match(controller, /centerNotificationService\.SendAsync\(CurrentUserId, centerId/);
  assert.match(code, /role\.Name == RoleNames\.Manager/);
  assert.match(code, /staff\.CenterId == centerId/);
  assert.match(code, /user\.Id != actorUserId/);
  assert.match(code, /user\.Status == "Active"/);
  assert.match(code, /user\.LockedUntil/);
  assert.match(code, /profile\.CenterId == centerId/);
  assert.match(code, /CENTER_NOTIFICATION_SENT/);
  assert.match(code, /throw new FlowException\(409/);
  assert.doesNotMatch(read('Backend/SportsCenterManagement.BLL/DTOs/Notifications/CenterNotificationDtos.cs'), /UserIds|RecipientIds/);
});

test('frontend sends either all-center or selected-role notification contract', async () => {
  const source = apiSource()
    .replace(/^import .+;\r?\n/gm, '')
    .replaceAll('export const ', 'const ')
    .replaceAll('import.meta.env', '({})');
  const calls = [];
  const context = vm.createContext({
    URLSearchParams, Date, Map, Set,
    getAuthUser: () => ({ id: 7, role: 'MANAGER', centerId: 15 }),
    getAuthVersion: () => 1,
    assertAuthVersion: () => {},
    getApiSession: () => 'token',
    setAuthUser: () => {},
    clearApiSession: () => {},
    apiRequest: async (route, options) => { calls.push({ route, options }); return { recipientCount: 2 }; }
  });
  vm.runInContext(`${source}\nglobalThis.systemApiForTest = systemApi;`, context);

  await context.systemApiForTest.sendCenterNotification({
    title: '  Bảo trì  ', message: '  Đóng cửa lúc 20h  ', sendToAll: false, targetRoles: ['Member', 'Coach']
  });
  assert.equal(calls[0].route, 'centers/15/notifications');
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(Array.from(calls[0].options.body.targetRoles), ['Member', 'Coach']);
  assert.equal(calls[0].options.body.title, 'Bảo trì');
  assert.equal(calls[0].options.body.message, 'Đóng cửa lúc 20h');

  await context.systemApiForTest.sendCenterNotification({
    title: 'Chung', message: 'Thông báo', sendToAll: true, targetRoles: ['Member']
  });
  assert.deepEqual(Array.from(calls[1].options.body.targetRoles), []);
  assert.equal(calls[1].options.body.sendToAll, true);
});
