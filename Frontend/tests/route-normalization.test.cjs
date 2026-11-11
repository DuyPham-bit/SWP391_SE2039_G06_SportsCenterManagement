const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

// Dynamically import ES module routeNormalization
async function loadRouter() {
  const routerPath = path.resolve(__dirname, '../src/app/router/routeNormalization.js');
  return await import('file://' + routerPath.replace(/\\/g, '/'));
}

test('normalizeRouteHash handles #/membe typo by auto-correcting to #/member/dashboard', async () => {
  const { normalizeRouteHash } = await loadRouter();

  assert.strictEqual(normalizeRouteHash('#/membe'), '#/member/dashboard');
  assert.strictEqual(normalizeRouteHash('#/mem'), '#/member/dashboard');
  assert.strictEqual(normalizeRouteHash('#/members'), '#/member/dashboard');
  assert.strictEqual(normalizeRouteHash('#/member/'), '#/member/dashboard');
  assert.strictEqual(normalizeRouteHash('#/member'), '#/member/dashboard');
});

test('normalizeRouteHash auto-corrects member subroutes and preserves query parameters', async () => {
  const { normalizeRouteHash } = await loadRouter();

  assert.strictEqual(normalizeRouteHash('#/member/enrol'), '#/member/enroll');
  assert.strictEqual(normalizeRouteHash('#/member/enrollment'), '#/member/enroll');
  assert.strictEqual(normalizeRouteHash('#/member/pack?tab=active'), '#/member/packages?tab=active');
  assert.strictEqual(normalizeRouteHash('#/member/sched'), '#/member/schedule');
  assert.strictEqual(normalizeRouteHash('#/member/book'), '#/member/bookings');
});

test('normalizeRouteHash handles common aliases for other roles', async () => {
  const { normalizeRouteHash } = await loadRouter();

  // Manager
  assert.strictEqual(normalizeRouteHash('#/manage'), '#/manager/dashboard');
  assert.strictEqual(normalizeRouteHash('#/managers'), '#/manager/dashboard');
  assert.strictEqual(normalizeRouteHash('#/manager/'), '#/manager/dashboard');

  // Coach
  assert.strictEqual(normalizeRouteHash('#/coac'), '#/coach/dashboard');
  assert.strictEqual(normalizeRouteHash('#/coaches'), '#/coach/dashboard');
  assert.strictEqual(normalizeRouteHash('#/coach/'), '#/coach/dashboard');

  // Receptionist
  assert.strictEqual(normalizeRouteHash('#/recept'), '#/receptionist/dashboard');
  assert.strictEqual(normalizeRouteHash('#/reception'), '#/receptionist/dashboard');

  // Admin
  assert.strictEqual(normalizeRouteHash('#/adm'), '#/admin/dashboard');
  assert.strictEqual(normalizeRouteHash('#/admins'), '#/admin/dashboard');

  // Auth
  assert.strictEqual(normalizeRouteHash('#/logi'), '#/login');
  assert.strictEqual(normalizeRouteHash('#/signin'), '#/login');
  assert.strictEqual(normalizeRouteHash('#/regis'), '#/register');
  assert.strictEqual(normalizeRouteHash('#/signup'), '#/register');
});

test('normalizeRouteHash removes trailing slashes without modifying valid paths', async () => {
  const { normalizeRouteHash } = await loadRouter();

  assert.strictEqual(normalizeRouteHash('#/coach/schedule/'), '#/coach/schedule');
  assert.strictEqual(normalizeRouteHash('#/receptionist/counter-register/'), '#/receptionist/counter-register');
});

test('isLandingRoute recognizes landing anchors and home hashes', async () => {
  const { isLandingRoute } = await loadRouter();

  assert.strictEqual(isLandingRoute('#/'), true);
  assert.strictEqual(isLandingRoute(''), true);
  assert.strictEqual(isLandingRoute('#'), true);
  assert.strictEqual(isLandingRoute('#/trang-chu'), true);
  assert.strictEqual(isLandingRoute('#/ve-chung-toi'), true);
  assert.strictEqual(isLandingRoute('#/khoa-hoc'), true);
  assert.strictEqual(isLandingRoute('#/co-so-vat-chat'), true);

  assert.strictEqual(isLandingRoute('#/member/dashboard'), false);
  assert.strictEqual(isLandingRoute('#/coach/dashboard'), false);
  assert.strictEqual(isLandingRoute('#/random-unknown'), false);
});
