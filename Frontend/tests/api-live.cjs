// Read-only checks through the real frontend service layer, proxy, API, and SQL Server.
// The defaults are documented development seed accounts; override them with SCMS_TEST_<ROLE>_EMAIL/PASSWORD.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { build } = require('esbuild');

const frontend = path.resolve(__dirname, '..');
const artifacts = path.join(frontend, 'tmp/api-live');
const apiBase = process.env.SCMS_TEST_API_BASE_URL || 'http://localhost:3004/api';
const requests = [], checks = [];
const accounts = [
  ['MANAGER', 'manager01@sportscenter.vn', 'Manager@123456'],
  ['RECEPTIONIST', 'reception01@sportscenter.vn', 'Reception@123456'],
  ['COACH', 'coach01@sportscenter.vn', 'Coach@123456'],
  ['MEMBER', 'member01@sportscenter.vn', 'Member@123456']
];
const array = value => assert.ok(Array.isArray(value), 'Expected an API list');
const page = value => { array(value.items); assert.ok(Number.isFinite(value.totalCount)); };
async function check(role, name, action, validate = () => {}) {
  try { const value = await action(); validate(value); checks.push({ role, name, passed: true }); return value; }
  catch (error) {
    checks.push({ role, name, passed: false, status: error.status, code: error.code, diagnostic: error.diagnostic, message: error.message });
    return null;
  }
}

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const bundle = path.join(artifacts, 'services.cjs');
  await build({ entryPoints: [path.join(frontend, 'src/services/api.js')], outfile: bundle, bundle: true,
    platform: 'node', format: 'cjs', logLevel: 'silent',
    define: { 'import.meta.env': JSON.stringify({ VITE_API_BASE_URL: apiBase }) } });
  const actualFetch = globalThis.fetch;
  let activeRole = 'PUBLIC';
  globalThis.fetch = async (input, options = {}) => {
    const response = await actualFetch(input, { ...options, signal: options.signal || AbortSignal.timeout(15000) });
    requests.push({ role: activeRole, method: options.method || 'GET', path: new URL(input).pathname, status: response.status });
    return response;
  };
  const { authApi, packageApi, classApi, roomApi, staffApi, memberApi, reportApi, systemApi,
    receptionApi, bookingApi, coachApi, notificationApi } = require(bundle);
  const selectedRoles = (process.env.SCMS_TEST_ROLES || accounts.map(account => account[0]).join(',')).split(',').map(role => role.trim().toUpperCase());
  assert.ok(selectedRoles.length && selectedRoles.every(role => accounts.some(account => account[0] === role)), 'Unknown SCMS_TEST_ROLES value');
  for (const [role, seedEmail, seedPassword] of accounts.filter(account => selectedRoles.includes(account[0]))) {
    activeRole = role;
    const auth = await check(role, 'login and load profile/capabilities', () => authApi.login(
      process.env[`SCMS_TEST_${role}_EMAIL`] || seedEmail, process.env[`SCMS_TEST_${role}_PASSWORD`] || seedPassword), value => assert.equal(value.user.role, role));
    if (!auth) continue;
    await check(role, 'profile', () => authApi.getCurrentUser(), value => assert.equal(value.role, role));
    await check(role, 'packages', () => packageApi.getAll(), array);
    await check(role, 'notifications', () => notificationApi.getMine(), array);
    if (role === 'MANAGER') {
      const classes = await check(role, 'management classes', () => classApi.getManagementClasses(), array);
      await check(role, 'active sports', () => classApi.getSports(), array);
      await check(role, 'all sports', () => classApi.getManagementSports(), array);
      await check(role, 'coaches and sport IDs', () => classApi.getCoaches(), value => { array(value); value.forEach(coach => array(coach.sportIds)); });
      await check(role, 'rooms', () => roomApi.getAll(), array);
      await check(role, 'staff', () => staffApi.getAll(), array);
      const members = await check(role, 'members', () => memberApi.getCenterMembers(), page);
      if (members?.items.length) await check(role, 'member subscriptions', () => receptionApi.getMemberSubscriptions(members.items[0].memberId), array);
      if (classes?.length) await check(role, 'class schedules', () => classApi.getSchedules(classes[0].id), array);
      for (const period of ['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR']) await check(role, `reports ${period}`, () => reportApi.getOverview(period), value => { array(value.revenueBySport); assert.ok(Number.isFinite(value.netRevenue)); });
      await check(role, 'role matrix', () => systemApi.getPermissions(), array);
      await check(role, 'audit logs', () => systemApi.getAuditPage(), page);
    }
    if (role === 'RECEPTIONIST') {
      const members = await check(role, 'member lookup', () => receptionApi.lookupMember('member'), array);
      await check(role, 'invoices', () => receptionApi.getInvoices(), page);
      await check(role, 'support requests', () => receptionApi.getSupportRequests(), page);
      await check(role, 'check-in history', () => receptionApi.getCheckInHistory(), array);
      await check(role, 'check-in summary', () => receptionApi.getCheckInSummary());
      await check(role, 'class sessions', () => classApi.getAll(), array);
      if (members?.length) await check(role, 'member bookings', () => bookingApi.getForMember(members[0].id), array);
    }
    if (role === 'COACH') {
      const classes = await check(role, 'coach classes', () => coachApi.getCoachClassesAndMembers(), array);
      const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
      const end = new Date(Date.now() + 7 * 3600000 + 30 * 86400000).toISOString().slice(0, 10);
      const sessions = await check(role, 'teaching schedule', () => classApi.getTeachingSchedule(today, end), array);
      await check(role, 'training plans', () => coachApi.getTrainingPlans(), array);
      await check(role, 'progress', () => coachApi.getProgress(), array);
      await check(role, 'coach notifications', () => coachApi.getNotifications(), array);
      if (classes?.length) await check(role, 'class members', () => coachApi.getMembersForClass(classes[0].id), array);
      if (sessions?.length) await check(role, 'session members', () => coachApi.getClassMembers(sessions[0].id), array);
    }
    if (role === 'MEMBER') {
      await check(role, 'class sessions', () => classApi.getAll(), array);
      await check(role, 'bookings', () => bookingApi.getMemberBookings(), array);
      await check(role, 'waitlist', () => bookingApi.getWaitlist(), array);
      await check(role, 'pending invoices', () => memberApi.getMyPendingInvoices(), array);
      await check(role, 'progress', () => memberApi.getMyProgress(), array);
      await check(role, 'training plans', () => memberApi.getMyPlans(), array);
    }
    authApi.logout();
  }
  const failures = checks.filter(check => !check.passed);
  fs.writeFileSync(path.join(artifacts, 'report.json'), JSON.stringify({ apiBase, checks, requests, failures }, null, 2));
  console.log(JSON.stringify({ checks: checks.length, passed: checks.length - failures.length, requests: requests.length, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
