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
      require: id => id === './http.js' ? { apiRequest } : load(path.resolve(path.dirname(file), id))
    });
    vm.runInContext(transformSync(fs.readFileSync(file, 'utf8'), { format: 'cjs' }).code, context);
    modules.set(file, module.exports);
    return module.exports;
  }
  return { api: load(path.join(__dirname, '../src/services/landingContentService.js')), window, store, events, previewStore, previewWindow };
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

test('failed publish/reset preserves the published cache and emits no success event', async () => {
  let fail = false;
  const fixture = loadService(async (_route, options = {}) => {
    if (fail) throw new Error('API save rejected');
    return { content: options.body?.content ?? null };
  });
  const draft = fixture.api.getLandingContent();
  draft.heroBanner.title = 'Kept published title';
  await fixture.api.saveLandingContent(draft);
  fail = true;
  await assert.rejects(fixture.api.resetLandingContentToDefault(), /API save rejected/);
  assert.equal(fixture.api.getLandingContent().heroBanner.title, 'Kept published title');
  assert.equal(fixture.events.length, 1);
});

test('reset uses independent defaults even after editing nested metrics and zones', async () => {
  const fixture = loadService(async (_route, options = {}) => ({ content: options.body?.content ?? null }));
  const initial = fixture.api.getDefaultLandingContent();
  const edited = await fixture.api.resetLandingContentToDefault();
  edited.heroBanner.metrics[0].value = 'Modified metric';
  edited.zonesLayout.zones[0].items[0] = 'Modified zone';
  await fixture.api.saveLandingContent(edited);
  const restored = await fixture.api.resetLandingContentToDefault();
  assert.equal(restored.heroBanner.metrics[0].value, initial.heroBanner.metrics[0].value);
  assert.equal(restored.zonesLayout.zones[0].items[0], initial.zonesLayout.zones[0].items[0]);
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
