const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', '..', rel), 'utf8');

test('manager routes default to MANAGER only; Admin is opted in per route', () => {
  const src = read('Frontend/src/app/router/AppRouter.jsx');
  assert.match(src, /allowedRoles = \['MANAGER'\]/);
  // Only center-independent screens are opened to Admin explicitly.
  const adminOptIns = [...src.matchAll(/renderManagerRoute\((\w+), undefined, \['MANAGER', 'ADMIN'\]\)/g)].map(m => m[1]).sort();
  assert.deepEqual(adminOptIns, ['CounterInvoices', 'HomeContentManagement', 'PayrollPage']);
});

test('Admin uses only the refund queue on the shared invoices screen', () => {
  const src = read('Frontend/src/pages/counter-invoices/ui/CounterInvoices.jsx');
  assert.match(src, /if \(isAdmin\) return undefined; \/\/ center-scoped list/);
  assert.match(src, /isManagerOrAdmin && !isAdmin && \(/);
});

test('notifications never send Admin to manager-only screens', () => {
  const src = read('Frontend/src/features/notifications/lib/notificationNavigation.js');
  for (const target of ['coach-operations', 'support-communications', 'manager/dashboard']) {
    const adminToTarget = new RegExp(`\\['MANAGER', 'ADMIN'\\][^\\n]*#/manager/${target}`);
    assert.doesNotMatch(src, adminToTarget, target);
  }
  assert.match(src, /\['ADMIN', 'SYSTEMADMIN'\]\.includes\(normalizedRole\)\) return '#\/admin\/dashboard'/);
});
