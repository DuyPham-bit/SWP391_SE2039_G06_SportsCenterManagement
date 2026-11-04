const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { transformSync } = require('esbuild');
const moduleSource = fs.readFileSync(path.join(__dirname, '../src/services/membershipEntry.js'), 'utf8');
const loaded = { exports: {} };
vm.runInNewContext(transformSync(moduleSource, { format: 'cjs' }).code, { module: loaded, URLSearchParams });
const { getMembershipIntent, getPostLoginRoute, getMembershipAction, getMembershipBanner } = loaded.exports;

test('a guest can continue to packages after login or registration; staff keep their own workspace', () => {
  const guest = getMembershipAction(false, null);
  assert.equal(guest.href, '#/login?next=packages');
  for (const authPage of ['login', 'register']) {
    const intent = getMembershipIntent(`#/${authPage}?next=packages`);
    assert.equal(getPostLoginRoute('MEMBER', intent), '#/member/packages');
    assert.equal(getPostLoginRoute('MANAGER', intent), '#/manager/dashboard');
    assert.equal(getPostLoginRoute('COACH', intent), '#/coach/dashboard');
    assert.equal(getPostLoginRoute('RECEPTIONIST', intent), '#/receptionist/dashboard');
  }
  assert.equal(getMembershipAction(true, 'MEMBER').href, '#/member/packages');
  assert.equal(getMembershipAction(true, 'COACH').label, 'Về trang làm việc');
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
  const presentation = getMembershipBanner(saved);
  assert.doesNotMatch(presentation.ctaTitle, /thuê/);
  assert.equal(presentation.ctaBadge, 'GÓI TẬP & LỊCH LỚP');
  assert.match(presentation.ctaDescription, /thanh toán/);
  assert.equal(JSON.stringify(saved), before);
  const custom = { ctaTitle: 'Gói tập mùa hè', ctaDescription: 'Chọn gói phù hợp mục tiêu của bạn.' };
  assert.equal(getMembershipBanner(custom).ctaTitle, custom.ctaTitle);
  assert.equal(getMembershipBanner(custom).ctaDescription, custom.ctaDescription);
  assert.match(getMembershipBanner(saved, true).ctaTitle, /Package/);
});

test('facility cards always display "Bao gồm trong gói tập" and sanitize legacy hourly rental rates', () => {
  function loadHelper(relPath) {
    const src = fs.readFileSync(path.join(__dirname, relPath), 'utf8');
    const mod = { exports: {} };
    vm.runInNewContext(transformSync(src, { format: 'cjs' }).code, { module: mod, exports: mod.exports, require: () => ({}) });
    return mod.exports;
  }
  const { sanitizeFacilityImages } = loadHelper('../src/services/landingPresentation.js');
  const { translatePriceRate } = loadHelper('../src/services/i18nHelper.js');

  const facilityWithHourlyRate = { id: 'room-02', name: 'Sân bóng đá', priceRate: 'Từ 150.000đ - 280.000đ/giờ' };
  const sanitized = sanitizeFacilityImages(facilityWithHourlyRate);
  assert.equal(sanitized.priceRate, 'Bao gồm trong gói tập');
  assert.equal(translatePriceRate(sanitized.priceRate, false), 'Bao gồm trong gói tập');
  assert.equal(translatePriceRate(sanitized.priceRate, true), 'Included in Packages');

  assert.equal(translatePriceRate('Từ 60.000đ - 100.000đ/giờ/sân', false), 'Bao gồm trong gói tập');
  assert.equal(translatePriceRate('Từ 60.000đ - 100.000đ/giờ/sân', true), 'Included in Packages');
});

