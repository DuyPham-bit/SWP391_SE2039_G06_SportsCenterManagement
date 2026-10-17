const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function loadMemberApi() {
  const source = fs.readFileSync(path.join(__dirname, '../src/services/backendApi.js'), 'utf8')
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
    createIdempotencyKey: () => 'payment-test-idempotency-key',
    apiRequest: async (route, options = {}) => {
      calls.push({ route, options });
      return { paymentUrl: 'https://sandbox.vnpayment.vn/payment' };
    }
  });
  vm.runInContext(`${source}\nglobalThis.api = { memberApi };`, context);
  return { memberApi: context.api.memberApi, calls };
}

test('VNPay QR checkout requests the dedicated VNPAYQR channel', async () => {
  const fixture = loadMemberApi();

  await fixture.memberApi.subscribeOnline({ packageId: 12, paymentMethod: 'VNPAY_QR' });

  assert.equal(fixture.calls.length, 1);
  assert.equal(fixture.calls[0].route, 'payments/create-vnpay-url');
  assert.equal(fixture.calls[0].options.body.packageId, 12);
  assert.equal(fixture.calls[0].options.body.bankCode, 'VNPAYQR');
});

test('existing VNPay and MoMo checkout routes remain compatible', async () => {
  const fixture = loadMemberApi();

  await fixture.memberApi.subscribeOnline({ packageId: 21, paymentMethod: 'VNPAY' });
  await fixture.memberApi.subscribeOnline({ packageId: 22, paymentMethod: 'MOMO' });

  assert.equal(fixture.calls[0].route, 'payments/create-vnpay-url');
  assert.equal(fixture.calls[0].options.body.bankCode, null);
  assert.equal(fixture.calls[1].route, 'payments/create-momo-url');
  assert.equal(fixture.calls[1].options.body.bankCode, null);
});
