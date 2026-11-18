const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { transformSync } = require('esbuild');

function loadService(apiRequest, { blockedStorage = false, popupBlocked = false } = {}) {
  const store = new Map();
  const previewStore = new Map();
  const events = [];
  const previewWindow = {
    opener: {},
    sessionStorage: { setItem: (key, value) => previewStore.set(key, value) },
    location: { replace(url) { this.url = url; } },
    close() { this.closed = true; }
  };
  const window = {
    location: { href: 'https://scms.example/#/admin/home-content', hash: '#/' },
    open: () => popupBlocked ? null : previewWindow,
    dispatchEvent: event => events.push(event),
    addEventListener() {}, removeEventListener() {}
  };
  const localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem(key, value) { if (blockedStorage) throw new Error('Storage unavailable'); store.set(key, value); }
  };
  const file = path.join(__dirname, '../src/entities/landing-content/api/homeContentService.js');
  const module = { exports: {} };
  const context = vm.createContext({
    module, window, localStorage, URL, URLSearchParams, console, JSON, Object, Array, String, Number, Math, Date,
    sessionStorage: { getItem: key => previewStore.get(key) ?? null },
    CustomEvent: class { constructor(type, { detail }) { this.type = type; this.detail = detail; } },
    require: id => {
      if (id.endsWith('/http.js') || id.endsWith('/shared/api/index.js')) return { apiRequest };
      throw new Error(`Unexpected dependency: ${id}`);
    }
  });
  vm.runInContext(transformSync(fs.readFileSync(file, 'utf8'), { format: 'cjs', logLevel: 'silent' }).code, context);
  return { api: module.exports, window, store, events, previewStore, previewWindow };
}

const plain = value => JSON.parse(JSON.stringify(value));
const STATS = { sports: { visible: 9, total: 10 }, facilities: { visible: 8, total: 10 } };

test('public content is requested in the selected language, counts are filled and each language is cached', async () => {
  const calls = [];
  const { api } = loadService(async route => {
    calls.push(route);
    const en = route.includes('lang=en');
    return { content: { heroBanner: { title: en ? 'Title' : 'Tiêu đề', description: '{{sportCount}} / {{facilityCount}}' } }, stats: STATS };
  });

  const en = await api.fetchHomeContent('en');
  assert.equal(calls[0], 'home-content?lang=en');
  assert.equal(en.content.heroBanner.title, 'Title');
  assert.equal(en.content.heroBanner.description, '9 / 8');
  assert.equal(api.getCachedHomeContent('en').content.heroBanner.title, 'Title');
  assert.equal(api.getCachedHomeContent('vi'), null);

  await api.fetchHomeContent('fr'); // unknown language → vi
  assert.equal(calls[1], 'home-content?lang=vi');
  assert.equal(api.getCachedHomeContent('vi').content.heroBanner.title, 'Tiêu đề');
});

test('localizing falls back to Vietnamese when the English text is empty, like the server', () => {
  const { api } = loadService(async () => null);
  const doc = { heroBanner: { badge: { vi: 'HUY HIỆU', en: '' }, title: { vi: 'Tiêu đề', en: 'Title' }, posterUrl: '/a.webp', metrics: [{ value: '24/7', label: { vi: 'Mở cửa', en: 'Open' } }] } };

  assert.deepEqual(plain(api.localizeContent(doc, 'en')), { heroBanner: { badge: 'HUY HIỆU', title: 'Title', posterUrl: '/a.webp', metrics: [{ value: '24/7', label: 'Open' }] } });
  assert.equal(api.localizeContent(doc, 'vi').heroBanner.title, 'Tiêu đề');
  assert.deepEqual(plain(api.missingLanguages(doc)), { vi: false, en: true });
  assert.deepEqual(plain(api.missingLanguages({ a: { vi: '', en: 'Only English' } })), { vi: true, en: false });
});

test('editing one language keeps the other and treats legacy plain strings as Vietnamese', () => {
  const { api } = loadService(async () => null);
  assert.deepEqual(plain(api.writeText('Cũ', 'en', 'Old')), { vi: 'Cũ', en: 'Old' });
  assert.deepEqual(plain(api.writeText({ vi: 'A', en: 'B' }, 'vi', 'C')), { vi: 'C', en: 'B' });
  assert.equal(api.readText(undefined, 'en'), '');
});

test('publishing uses the admin API, clears the public cache and notifies other pages', async () => {
  const calls = [];
  const fixture = loadService(async (route, options = {}) => {
    calls.push({ route, options });
    if (options.method === 'PUT') return { content: options.body.content, stats: STATS, missingTranslations: [] };
    return { content: { heroBanner: { title: 'x' } }, stats: STATS };
  });
  await fixture.api.fetchHomeContent('vi');
  const content = { heroBanner: { title: { vi: 'Mới', en: 'New' } }, ctaAndFooter: { contactZaloPhone: '+84901234567', contactFacebookUrl: '' } };

  const saved = await fixture.api.publishHomeContent(content);

  const put = calls.find(call => call.options.method === 'PUT');
  assert.equal(put.route, 'admin/home-content');
  assert.equal(put.options.body.content.ctaAndFooter.contactZaloPhone, '0901234567');
  assert.equal(saved.content.heroBanner.title.en, 'New');
  assert.equal(fixture.api.getCachedHomeContent('vi'), null);
  assert.equal(fixture.events.length, 1);
});

test('a failed or invalid publish emits no change event and keeps the cache', async () => {
  let fail = false;
  const fixture = loadService(async (route, options = {}) => {
    if (fail && options.method === 'PUT') throw new Error('API save rejected');
    return { content: { heroBanner: { title: 'Kept' } }, stats: STATS };
  });
  await fixture.api.fetchHomeContent('vi');
  fail = true;

  await assert.rejects(fixture.api.publishHomeContent({ heroBanner: {}, ctaAndFooter: {} }), /API save rejected/);
  await assert.rejects(fixture.api.publishHomeContent({ ctaAndFooter: { contactZaloPhone: '12' } }), error => error.i18nKey === 'homeContent.error.zalo');
  assert.equal(fixture.api.getCachedHomeContent('vi').content.heroBanner.title, 'Kept');
  assert.equal(fixture.events.length, 0);
});

test('saving one section uses the section endpoint', async () => {
  const calls = [];
  const { api } = loadService(async (route, options) => { calls.push({ route, options }); return { content: {}, stats: STATS }; });
  await api.saveHomeContentSection('heroBanner', { title: { vi: 'A', en: '' } });
  assert.equal(calls[0].route, 'admin/home-content/heroBanner');
  assert.equal(calls[0].options.method, 'PUT');
});

test('preview shows the unsaved bilingual draft, localized, without publishing or touching storage', () => {
  let calls = 0;
  const fixture = loadService(async () => { calls++; });
  const draft = { heroBanner: { title: { vi: 'Bản nháp', en: 'Preview only' }, description: { vi: '{{sportCount}} môn', en: '' } } };
  fixture.api.openLandingPreview(draft, STATS);
  assert.equal(calls, 0);
  assert.equal(fixture.store.size, 0);
  assert.equal(fixture.previewWindow.opener, null);
  assert.equal(fixture.previewWindow.location.url, 'https://scms.example/#/?preview=1');
  fixture.window.location.hash = '#/?preview=1';
  const preview = fixture.api.getLandingPreviewContent('en');
  assert.equal(preview.content.heroBanner.title, 'Preview only');
  assert.equal(preview.content.heroBanner.description, '9 môn');
  fixture.window.location.hash = '#/';
  assert.equal(fixture.api.getLandingPreviewContent('en'), null);
});

test('a blocked preview tab raises a translatable error and storage failures do not break publishing', async () => {
  const fixture = loadService(async (_route, options) => ({ content: options.body.content, stats: STATS }), { blockedStorage: true, popupBlocked: true });
  assert.throws(() => fixture.api.openLandingPreview({}, STATS), error => error.i18nKey === 'homeContent.error.popupBlocked');
  const saved = await fixture.api.publishHomeContent({ heroBanner: { title: { vi: 'Không cần storage', en: '' } } });
  assert.equal(saved.content.heroBanner.title.vi, 'Không cần storage');
});

test('no default or fallback content ships with the frontend service', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/entities/landing-content/api/homeContentService.js'), 'utf8');
  for (const legacy of ['DEFAULT_LANDING_CONTENT', 'images.unsplash.com', 'hero-video.mp4', 'SHAPING RESILIENCE', '24/7']) {
    assert.equal(source.includes(legacy), false, legacy);
  }
});

test('landing carousel controller wraps at edges, calculates drag threshold, and pauses autoplay on interaction', () => {
  const file = path.join(__dirname, '../src/pages/landing/lib/carouselController.js');
  const module = { exports: {} };
  vm.runInContext(transformSync(fs.readFileSync(file, 'utf8'), { format: 'cjs' }).code, vm.createContext({ module, exports: module.exports, Object, Math }));
  const {
    computeNextCarouselIndex,
    shouldAutoAdvanceCarousel,
    computeDragScrollDelta
  } = module.exports;

  // Normal step forward and backward
  assert.equal(computeNextCarouselIndex({ currentIndex: 0, itemCount: 10, scrollLeft: 0, maxScroll: 2400, direction: 1 }), 1);
  assert.equal(computeNextCarouselIndex({ currentIndex: 3, itemCount: 10, scrollLeft: 900, maxScroll: 2400, direction: -1 }), 2);

  // Wrap around to 0 when scroll track is already at right edge (maxScroll) even if currentIndex < itemCount - 1
  assert.equal(computeNextCarouselIndex({ currentIndex: 7, itemCount: 10, scrollLeft: 2390, maxScroll: 2400, direction: 1 }), 0);
  assert.equal(computeNextCarouselIndex({ currentIndex: 9, itemCount: 10, scrollLeft: 2400, maxScroll: 2400, direction: 1 }), 0);

  // Wrap around to last item when pressing Prev at start
  assert.equal(computeNextCarouselIndex({ currentIndex: 0, itemCount: 10, scrollLeft: 0, maxScroll: 2400, direction: -1 }), 9);

  // Drag scroll delta and accidental click prevention threshold
  assert.deepEqual({ ...computeDragScrollDelta({ startX: 500, currentX: 497, startScrollLeft: 200 }) }, {
    scrollLeft: 203,
    didDrag: false
  });
  assert.deepEqual({ ...computeDragScrollDelta({ startX: 500, currentX: 380, startScrollLeft: 200 }) }, {
    scrollLeft: 320,
    didDrag: true
  });

  // Autoplay conditions
  assert.equal(shouldAutoAdvanceCarousel({
    itemCount: 5,
    isAutoPlayEnabled: true,
    isHovered: false,
    isDragging: false,
    isFocused: false,
    isModalOpen: false,
    isDocumentHidden: false,
    reducedMotion: false
  }), true);

  assert.equal(shouldAutoAdvanceCarousel({ itemCount: 1, isAutoPlayEnabled: true }), false);
  assert.equal(shouldAutoAdvanceCarousel({ itemCount: 5, isAutoPlayEnabled: true, isHovered: true }), false);
  assert.equal(shouldAutoAdvanceCarousel({ itemCount: 5, isAutoPlayEnabled: true, isDragging: true }), false);
  assert.equal(shouldAutoAdvanceCarousel({ itemCount: 5, isAutoPlayEnabled: true, isModalOpen: true }), false);
  assert.equal(shouldAutoAdvanceCarousel({ itemCount: 5, isAutoPlayEnabled: true, reducedMotion: true }), false);
});

