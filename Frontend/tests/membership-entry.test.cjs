const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { transformSync } = require('esbuild');
const moduleSource = fs.readFileSync(path.join(__dirname, '../src/entities/membership/lib/membershipEntry.js'), 'utf8');
const loaded = { exports: {} };
vm.runInNewContext(transformSync(moduleSource, { format: 'cjs' }).code, { module: loaded, URLSearchParams });
const { getMembershipIntent, getPostLoginRoute, getMembershipAction, getMembershipBanner } = loaded.exports;
const viT = key => require('../src/shared/i18n/locales/vi.json')[key] ?? key;
const enT = key => require('../src/shared/i18n/locales/en.json')[key] ?? key;

test('a guest can continue to packages after login or registration; staff keep their own workspace', () => {
  const guest = getMembershipAction(false, null, viT);
  assert.equal(guest.href, '#/login?next=packages');
  for (const authPage of ['login', 'register']) {
    const intent = getMembershipIntent(`#/${authPage}?next=packages`);
    assert.equal(getPostLoginRoute('MEMBER', intent), '#/member/packages');
    assert.equal(getPostLoginRoute('MANAGER', intent), '#/manager/dashboard');
    assert.equal(getPostLoginRoute('COACH', intent), '#/coach/dashboard');
    assert.equal(getPostLoginRoute('RECEPTIONIST', intent), '#/receptionist/dashboard');
  }
  assert.equal(getMembershipAction(true, 'MEMBER', viT).href, '#/member/packages');
  assert.equal(getMembershipAction(true, 'COACH', viT).label, 'Về trang làm việc');
  assert.equal(getMembershipAction(false, null, enT).label, 'View Packages');
  assert.equal(getPostLoginRoute('MEMBER'), '#/member/dashboard');
});

test('login continuation accepts only known member pages and rejects arbitrary or external destinations', () => {
  for (const next of ['https://example.com', '//example.com', '#/manager/dashboard', 'constructor', '__proto__', 'toString', '']) {
    assert.equal(getMembershipIntent(`#/login?next=${encodeURIComponent(next)}`), null);
    assert.equal(getPostLoginRoute('MEMBER', next), '#/member/dashboard');
  }
  assert.equal(getPostLoginRoute('MEMBER', getMembershipIntent('#/login?next=schedule')), '#/member/schedule');
});

test('legacy rental promotion is replaced without changing stored editorial content or custom package copy', () => {
  const saved = { ctaBadge: 'DÀNH CHO ĐỘI NHÓM & TỔ CHỨC SỰ KIỆN', ctaTitle: 'Liên hệ thuê sân',
    ctaDescription: 'Liên hệ thuê sân theo giờ.', contactPhone: '0912345678' };
  const before = JSON.stringify(saved);
  const presentation = getMembershipBanner(saved, viT);
  assert.doesNotMatch(presentation.ctaTitle, /thuê/);
  assert.equal(presentation.ctaBadge, 'GÓI TẬP & LỊCH LỚP');
  assert.match(presentation.ctaDescription, /thanh toán/);
  assert.equal(JSON.stringify(saved), before);
  const custom = { ctaTitle: 'Gói tập mùa hè', ctaDescription: 'Chọn gói phù hợp mục tiêu của bạn.' };
  assert.equal(getMembershipBanner(custom, viT).ctaTitle, custom.ctaTitle);
  assert.equal(getMembershipBanner(custom, viT).ctaDescription, custom.ctaDescription);
  assert.match(getMembershipBanner(saved, enT).ctaTitle, /Package/);
  // Published English copy is shown as-is (it used to be replaced by a hard-coded sentence).
  assert.equal(getMembershipBanner({ ctaTitle: 'Summer memberships' }, enT).ctaTitle, 'Summer memberships');
  assert.match(getMembershipBanner({ ctaTitle: 'Court rental for teams' }, enT).ctaTitle, /Package/);
});

test('facility cards replace legacy hourly rental rates with the localized "included in packages" label', () => {
  function loadHelper(relPath) {
    const src = fs.readFileSync(path.join(__dirname, relPath), 'utf8');
    const mod = { exports: {} };
    vm.runInNewContext(transformSync(src, { format: 'cjs' }).code, { module: mod, exports: mod.exports, require: () => ({}) });
    return mod.exports;
  }
  const { sanitizeFacilityImages } = loadHelper('../src/entities/catalog/lib/landingPresentation.js');
  const vi = require('../src/shared/i18n/locales/vi.json');
  const en = require('../src/shared/i18n/locales/en.json');

  const facilityWithHourlyRate = { id: 'room-02', name: 'Sân bóng đá', priceRate: 'Từ 150.000đ - 280.000đ/giờ' };
  assert.equal(sanitizeFacilityImages(facilityWithHourlyRate, vi['landing.priceIncluded']).priceRate, 'Bao gồm trong gói tập');
  assert.equal(sanitizeFacilityImages(facilityWithHourlyRate, en['landing.priceIncluded']).priceRate, 'Included in Packages');
  assert.equal(sanitizeFacilityImages({ priceRate: 'From 60,000 VND per hour' }, en['landing.priceIncluded']).priceRate, 'Included in Packages');
  assert.equal(sanitizeFacilityImages({ priceRate: 'Gói hội viên' }, vi['landing.priceIncluded']).priceRate, 'Gói hội viên');
  // A known-broken image is dropped rather than swapped for a hard-coded stock photo.
  assert.equal(sanitizeFacilityImages({ image: 'https://cdn.example/photo-1613918108466-292b78a8ef95.jpg' }).image, '');
});

