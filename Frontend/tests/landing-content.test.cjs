const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { transformSync } = require('esbuild');

function loadService(apiRequest, { blockedStorage = false, popupBlocked = false } = {}) {
  const modules = new Map();
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
    location: { href: 'https://scms.example/#/manager/home-content', hash: '#/' },
    open: () => popupBlocked ? null : previewWindow,
    dispatchEvent: event => events.push(event),
    addEventListener() {}, removeEventListener() {}
  };
  const localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem(key, value) { if (blockedStorage) throw new Error('Storage unavailable'); store.set(key, value); }
  };
  function load(file) {
    file = path.resolve(file);
    if (modules.has(file)) return modules.get(file);
    const module = { exports: {} };
    const context = vm.createContext({
      module, window, localStorage, URL, URLSearchParams, console,
      sessionStorage: { getItem: key => previewStore.get(key) ?? null },
      CustomEvent: class { constructor(type, { detail }) { this.type = type; this.detail = detail; } },
      require: id => id.endsWith('/http.js') ? { apiRequest } : load(path.resolve(path.dirname(file), id))
    });
    vm.runInContext(transformSync(fs.readFileSync(file, 'utf8'), { format: 'cjs' }).code, context);
    modules.set(file, module.exports);
    return module.exports;
  }
  return { api: load(path.join(__dirname, '../src/entities/landing-content/api/landingContentService.js')), window, store, events, previewStore, previewWindow };
}

test('publishing goes through the API and another browser reads the shared content', async () => {
  let published = null;
  const calls = [];
  const apiRequest = async (route, options = {}) => {
    calls.push({ route, options });
    if (options.method === 'PUT') published = JSON.parse(JSON.stringify(options.body.content));
    return { content: published };
  };
  const manager = loadService(apiRequest);
  const content = manager.api.getLandingContent();
  content.heroBanner.title = 'Published across browsers';
  await manager.api.saveLandingContent(content);
  assert.equal(calls[0].route, 'landing-content');
  assert.equal(calls[0].options.method, 'PUT');
  const visitor = loadService(apiRequest);
  assert.equal((await visitor.api.loadLandingContent()).content.heroBanner.title, 'Published across browsers');
  assert.equal(manager.events.length, 1);
});

test('failed publish preserves the published cache and emits no success event', async () => {
  let fail = false;
  const fixture = loadService(async (_route, options = {}) => {
    if (fail) throw new Error('API save rejected');
    return { content: options.body?.content ?? null };
  });
  const draft = fixture.api.getLandingContent();
  draft.heroBanner.title = 'Kept published title';
  await fixture.api.saveLandingContent(draft);
  fail = true;
  draft.heroBanner.title = 'Rejected draft';
  await assert.rejects(fixture.api.saveLandingContent(draft), /API save rejected/);
  assert.equal(fixture.api.getLandingContent().heroBanner.title, 'Kept published title');
  assert.equal(fixture.events.length, 1);
});

test('editor defaults stay independent after editing and publishing nested metrics and zones', async () => {
  const fixture = loadService(async (_route, options = {}) => ({ content: options.body?.content ?? null }));
  const initial = fixture.api.getDefaultLandingContent();
  const edited = fixture.api.getDefaultLandingContent();
  edited.heroBanner.metrics.push({ id: 'test-metric', value: 'Modified metric', label: 'Test' });
  edited.zonesLayout.zones.push({ id: 'test-zone', name: 'Test zone', items: ['Modified zone'] });
  await fixture.api.saveLandingContent(edited);
  const defaults = fixture.api.getDefaultLandingContent();
  assert.deepEqual(defaults.heroBanner.metrics, initial.heroBanner.metrics);
  assert.deepEqual(defaults.zonesLayout.zones, initial.zonesLayout.zones);
  assert.equal(defaults.coursesSection.sportsList.length, 0);
  assert.equal(defaults.facilitiesSection.facilitiesList.length, 0);
});

test('preview isolates a draft in the new tab without publishing or changing browser storage', () => {
  let calls = 0;
  const fixture = loadService(async () => { calls++; });
  const draft = fixture.api.getLandingContent();
  draft.heroBanner.title = 'Preview only';
  fixture.api.openLandingPreview(draft);
  assert.equal(calls, 0);
  assert.equal(fixture.store.size, 0);
  assert.equal(fixture.previewWindow.opener, null);
  assert.equal(fixture.previewWindow.location.url, 'https://scms.example/#/?preview=1');
  assert.notEqual(fixture.api.getLandingContent().heroBanner.title, 'Preview only');
  fixture.window.location.hash = '#/?preview=1';
  assert.equal(fixture.api.getLandingPreviewContent().heroBanner.title, 'Preview only');
  fixture.window.location.hash = '#/';
  assert.equal(fixture.api.getLandingPreviewContent(), null);
});

test('blocked preview does not publish and storage failures do not invalidate an API save', async () => {
  const fixture = loadService(async (_route, options) => ({ content: options.body.content }), { blockedStorage: true, popupBlocked: true });
  const draft = fixture.api.getLandingContent();
  assert.throws(() => fixture.api.openLandingPreview(draft));
  draft.heroBanner.title = 'Saved without browser storage';
  await fixture.api.saveLandingContent(draft);
  assert.equal(fixture.api.getLandingContent().heroBanner.title, 'Saved without browser storage');
});

test('legacy local content is available as a draft but never overrides the public page', async () => {
  const fixture = loadService(async () => ({ content: null }));
  const legacy = fixture.api.getDefaultLandingContent();
  legacy.heroBanner.title = 'Old local draft';
  fixture.store.set('SCMS_DYNAMIC_LANDING_CONTENT_V1', JSON.stringify(legacy));
  const result = await fixture.api.loadLandingContent();
  assert.equal(result.hasPublishedContent, false);
  assert.notEqual(result.content.heroBanner.title, 'Old local draft');
  assert.equal(fixture.api.getLegacyLandingContent().heroBanner.title, 'Old local draft');
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

