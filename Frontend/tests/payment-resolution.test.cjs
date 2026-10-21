const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const read = relativePath => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');

function loadReceptionApi() {
  const source = read('src/services/backendApi.js')
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
    getApiToken: () => 'fixture-token',
    setApiToken: () => {},
    clearApiToken: () => {},
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

test('refund API preserves the stable idempotency key and exposes refund reconciliation', async () => {
  const { api, calls } = loadReceptionApi();
  await api.refundPayment(41, {
    amount: 125000,
    reason: 'Duplicate collection',
    externalRefundReference: 'POS-REF-1',
    idempotencyKey: 'refund-attempt-41'
  });
  await api.reconcileRefund(9, {
    status: 'Succeeded',
    providerRefundId: 'GATEWAY-9',
    evidenceNote: 'Verified against provider statement'
  });

  assert.equal(calls[0].route, 'payments/41/refunds');
  assert.equal(calls[0].options.headers['Idempotency-Key'], 'refund-attempt-41');
  assert.equal(calls[1].route, 'payments/refunds/9/reconcile');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1].options.body)), {
    status: 'Succeeded',
    providerRefundId: 'GATEWAY-9',
    evidenceNote: 'Verified against provider statement'
  });
});

test('refund API rejects calls without an idempotency key before writing', async () => {
  const { api, calls } = loadReceptionApi();
  await assert.rejects(
    api.refundPayment(41, { amount: 1000, reason: 'Correction' }),
    /chống tạo lệnh hoàn tiền trùng/
  );
  assert.equal(calls.length, 0);
});

test('payment resolution UI reserves pending refunds and supports unhappy cases', () => {
  const ui = read('src/features/receptionist/CounterInvoices.jsx');
  assert.match(ui, /\['Pending', 'Succeeded'\]\.includes\(r\.status\)/);
  assert.match(ui, /result\.status === 'Succeeded'/);
  assert.match(ui, /receptionApi\.reconcileRefund/);
  assert.match(ui, /refundRequiresExternalReference/);
  assert.match(ui, /required=\{refundRequiresExternalReference\}/);
  assert.doesNotMatch(ui, /Cơ chế 4|Mechanism 4|Cơ Chế Cứu Cánh|Hóa Đơn Rác/i);
});

test('center-scoped invoice management excludes SystemAdmin navigation and route access', () => {
  const app = read('src/App.jsx');
  const sidebar = read('src/components/layout/Sidebar.jsx');
  assert.match(app, /renderManagerRoute\(CounterInvoices, undefined, \['MANAGER', 'ADMIN'\]\)/);
  assert.match(sidebar, /normalizedRole === 'SYSTEMADMIN' \? \[\] : \[\{/);
});
