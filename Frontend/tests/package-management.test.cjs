const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function loadHelpers() {
  const source = fs.readFileSync(path.join(__dirname, '../src/features/manager/packageManagementForm.js'), 'utf8')
    .replaceAll('export const ', 'const ')
    .replaceAll('export function ', 'function ');
  const context = vm.createContext({ Intl });
  vm.runInContext(`${source}\nglobalThis.helpers = { MAX_PACKAGE_PRICE, validatePackagePrice, sortMembershipPackages };`, context);
  return context.helpers;
}

test('package price accepts values that are not multiples of 50,000', () => {
  const { validatePackagePrice } = loadHelpers();

  assert.deepEqual({ ...validatePackagePrice('75001') }, { valid: true, value: 75001 });
  assert.deepEqual({ ...validatePackagePrice('123456.78') }, { valid: true, value: 123456.78 });
});

test('inactive packages are moved to the end without mutating or reordering either group', () => {
  const { sortMembershipPackages } = loadHelpers();
  const packages = [
    { id: 1, status: 'INACTIVE' },
    { id: 2, status: 'ACTIVE' },
    { id: 3, status: 'Draft' },
    { id: 4, status: 'inactive' },
    { id: 5, status: 'ACTIVE' }
  ];

  const sorted = sortMembershipPackages(packages);

  assert.deepEqual(Array.from(sorted, item => item.id), [2, 3, 5, 1, 4]);
  assert.deepEqual(packages.map(item => item.id), [1, 2, 3, 4, 5]);
});

test('package price rejects empty, non-numeric, non-positive, and excessive values', () => {
  const { MAX_PACKAGE_PRICE, validatePackagePrice } = loadHelpers();

  for (const value of ['', 'not-a-price', 0, -1, 123.456, Number.POSITIVE_INFINITY, MAX_PACKAGE_PRICE + 1]) {
    assert.equal(validatePackagePrice(value).valid, false, `Expected ${String(value)} to be invalid`);
  }
  assert.deepEqual(
    { ...validatePackagePrice(MAX_PACKAGE_PRICE) },
    { valid: true, value: MAX_PACKAGE_PRICE }
  );
});
