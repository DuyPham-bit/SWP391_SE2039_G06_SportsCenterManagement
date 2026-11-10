const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { apiSource } = require('./helpers/apiSources.cjs');
const vm = require('node:vm');
const { test } = require('node:test');

const read = relativePath => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');

function loadReceptionApi() {
  const source = apiSource()
    .replace(/^import .+;\r?\n/gm, '')
    .replaceAll('export const ', 'const ')
    .replaceAll('import.meta.env', 'testEnvironment');
  const calls = [];
  const context = vm.createContext({
    URLSearchParams, Date, Map, Set,
    testEnvironment: { VITE_SPORTS_CENTER_ID: '15' },
    getAuthUser: () => ({ centerId: 15 }),
    getAuthVersion: () => 1,
    beginAuthOperation: () => 1,
    assertAuthVersion: () => {},
    getApiSession: () => 'fixture-token',
    setApiSession: () => {},
    clearApiSession: () => {},
    setAuthUser: () => {},
    createIdempotencyKey: () => { throw new Error('refund must use the caller-stable key'); },
    apiRequest: async (route, options = {}) => {
      calls.push({ route, options });
      return { status: 'Pending' };
    }
  });
  vm.runInContext(`${source}\nglobalThis.receptionApiForTest = receptionApi;`, context);
  return { api: context.receptionApiForTest, calls };
}

test('invoice UI uses reviewed manual requests and exposes no direct gateway refund action', () => {
  const ui = read('src/pages/counter-invoices/ui/CounterInvoices.jsx');
  assert.match(ui, /\['Pending', 'Approved', 'Succeeded'\]\.includes\(r\.status\)/);
  assert.match(ui, /<RefundManagement embedded/);
  assert.doesNotMatch(ui, /receptionApi\.refundPayment|receptionApi\.reconcileRefund/);
  assert.doesNotMatch(apiSource(), /async refundPayment|async reconcileRefund/);
  assert.doesNotMatch(ui, /Cơ chế 4|Mechanism 4|Cơ Chế Cứu Cánh|Hóa Đơn Rác/i);
});

test('manager refund navigation is integrated into invoice management', () => {
  const app = read('src/app/router/AppRouter.jsx');
  const sidebar = read('src/widgets/app-shell/ui/Sidebar.jsx');
  const notifications = read('src/features/notifications/lib/notificationNavigation.js');
  assert.doesNotMatch(app, /#\/manager\/refunds|const RefundManagement = lazy/);
  assert.doesNotMatch(sidebar, /#\/manager\/refunds/);
  assert.match(notifications, /#\/manager\/invoices\?tab=refunds/);
});

test('member refund submission keeps a stable form reference and refreshes payment selection', () => {
  const ui = read('src/pages/member-refund-requests/ui/MemberRefundRequests.jsx');
  assert.match(ui, /const formElement = event\.currentTarget;/);
  assert.match(ui, /new FormData\(formElement\)/);
  assert.match(ui, /formElement\.reset\(\)/);
  assert.doesNotMatch(ui, /event\.currentTarget\.reset\(\)/);
  assert.match(ui, /eligiblePayments\.some\(item => String\(item\.paymentId\) === current\)/);
});

test('center-scoped invoice management excludes SystemAdmin navigation and route access', () => {
  const app = read('src/app/router/AppRouter.jsx');
  const sidebar = read('src/widgets/app-shell/ui/Sidebar.jsx');
  assert.match(app, /renderManagerRoute\(CounterInvoices, undefined, \['MANAGER', 'ADMIN'\]\)/);
  assert.match(sidebar, /normalizedRole === 'SYSTEMADMIN' \? \[\] : \[\{/);
});
