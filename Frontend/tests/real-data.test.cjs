const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { transformSync } = require('esbuild');

function load(file, apiRequest = async () => {}, centerId = '15') {
  const module = { exports: {} };
  const context = vm.createContext({ module, Date, Set, Number, Error, Intl,
    testEnv: { VITE_SPORTS_CENTER_ID: centerId },
    require: id => {
      if (id === './http.js') return { apiRequest };
      if (id === './publicCatalog.js') return load('services/publicCatalog.js', apiRequest, centerId);
      throw new Error(`Unexpected dependency: ${id}`);
    }
  });
  const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8').replaceAll('import.meta.env', 'testEnv');
  vm.runInContext(transformSync(source, { format: 'cjs' }).code, context);
  return module.exports;
}

test('empty and failed catalog requests cannot invent sports, rooms or prices', async () => {
  const empty = { center: { id: 15 }, sports: [], rooms: [], classes: [] };
  const api = load('services/publicCatalog.js', async (route, options) => {
    assert.equal(route, 'public/centers/15/catalog');
    assert.equal(options.token, null);
    return empty;
  });
  const catalog = await api.getPublicCatalog();
  assert.equal(api.catalogSports(catalog).length, 0);
  assert.equal(api.catalogFacilities(catalog).length, 0);
  const failing = load('services/publicCatalog.js', async () => { throw new Error('SQL offline'); });
  await assert.rejects(failing.getPublicCatalog(), /SQL offline/);
  await assert.rejects(load('services/publicCatalog.js', async () => empty, '').getPublicCatalog(), /VITE_SPORTS_CENTER_ID/);
});

test('catalog names, capacity and relationships come from SQL rather than editorial demo fields', () => {
  const api = load('services/publicCatalog.js');
  const catalog = { center: { id: 15 }, sports: [{ id: 81, name: 'Actual sport', description: 'Stored description' }],
    rooms: [{ id: 77, name: 'Actual room', capacity: 11, roomType: 'Court', locationDescription: 'Stored location' }],
    classes: [{ id: 52, sportId: 81, roomId: 77, level: 'Beginner' }] };
  const rooms = api.catalogFacilities(catalog, [{ id: '77', name: 'Fake room', capacity: '999', priceRate: '50.000', image: '/uploads/real.webp' }]);
  assert.equal(rooms[0].name, 'Actual room');
  assert.equal(rooms[0].capacity, '11 người');
  assert.equal(rooms[0].priceRate, '');
  assert.equal(rooms[0].image, '/uploads/real.webp');
  const sports = api.catalogSports(catalog, [{ id: '81', name: 'Fake sport', rating: '5.0', price: '1.000' }]);
  assert.equal(sports[0].name, 'Actual sport');
  assert.equal(sports[0].facilityId, '77');
  assert.equal(sports[0].price, '');
  assert.equal(sports[0].rating, undefined);
});

test('homepage keeps published CMS IDs, images, relationships and editorial fields when the operational catalog differs', () => {
  const { getLandingPresentation } = load('services/landingPresentation.js');
  const saved = {
    heroBanner: { title: 'Published center', description: 'Published description', metrics: [{ id: 'saved-metric', value: '24/7' }] },
    whyUs: { stats: [{ id: 'saved-stat', number: 9 }] },
    coursesSection: {
      trustBadges: [{ id: 'saved-badge', text: 'Published badge' }],
      sportsList: [
        { id: 'swimming', name: 'Published swimming', image: '/uploads/swimming.webp', facilityId: 'pool', category: 'Aquatics' },
        { id: 'football', name: 'Published football', image: '/uploads/football.webp', facilityId: 'pitch', isVisible: false }
      ]
    },
    facilitiesSection: {
      metrics: [{ value: '9' }],
      facilitiesList: [
        { id: 'pool', name: 'Published pool', image: '/uploads/pool.webp', specs: [{ label: 'Length', value: '25m' }] },
        { id: 'pitch', name: 'Published pitch', image: '/uploads/pitch.webp' }
      ]
    },
    ctaAndFooter: { contactPhone: '0912345678', hoursWeekdays: '05:30 - 22:30' }
  };
  const catalog = { center: { id: 15, phone: '0999999999' }, sports: [{ id: 1, name: 'Operational sport' }],
    rooms: [{ id: 1, name: 'Operational room', capacity: 10 }], classes: [] };
  const before = JSON.stringify(saved);
  const result = getLandingPresentation(saved, catalog);
  assert.equal(JSON.stringify(result), before);
  assert.equal(JSON.stringify(saved), before);
  assert.equal(result.coursesSection.sportsList[0].facilityId, result.facilitiesSection.facilitiesList[0].id);
  assert.equal(JSON.stringify(getLandingPresentation(saved, null)), before);
});

test('an unconfigured homepage uses only the actual SQL catalog and never invents default entries', () => {
  const { getLandingPresentation } = load('services/landingPresentation.js');
  const content = { coursesSection: { sportsList: [] }, facilitiesSection: { facilitiesList: [] } };
  const empty = getLandingPresentation(content, null);
  assert.equal(empty.coursesSection.sportsList.length, 0);
  assert.equal(empty.facilitiesSection.facilitiesList.length, 0);
  const catalog = { center: { id: 15, name: 'Stored center', description: 'Stored center description' }, sports: [{ id: 8, name: 'Stored sport' }],
    rooms: [{ id: 7, name: 'Stored room', capacity: 11 }], classes: [{ sportId: 8, roomId: 7 }] };
  const result = getLandingPresentation(content, catalog);
  assert.equal(result.heroBanner.title, 'Stored center');
  assert.equal(result.heroBanner.description, 'Stored center description');
  assert.equal(result.coursesSection.sportsList[0].name, 'Stored sport');
  assert.equal(result.coursesSection.sportsList[0].facilityId, '7');
  assert.equal(result.facilitiesSection.facilitiesList[0].capacity, '11 người');
});

test('editing a published homepage image preserves all entries, their order and their saved details', () => {
  const React = require('react');
  const module = { exports: {} };
  const catalog = { sports: [{ id: 99, name: 'Different operational sport' }], rooms: [] };
  const context = vm.createContext({ module, Number, String,
    require: id => {
      if (id === 'react') return React;
      if (id.includes('usePublicCatalog')) return { usePublicCatalog: () => ({ catalog, loading: false, error: '' }) };
      if (id.includes('publicCatalog.js')) return load('services/publicCatalog.js');
      if (id.includes('LanguageContext')) return { useLanguage: () => ({ language: 'vi' }) };
      throw new Error(`Unexpected dependency: ${id}`);
    }
  });
  const source = fs.readFileSync(path.join(__dirname, '../src/features/manager/LandingCatalogEditor.jsx'), 'utf8');
  vm.runInContext(transformSync(source, { format: 'cjs', loader: 'jsx' }).code, context);
  const metadata = [
    { id: 'saved-first', name: 'First', image: '/first.webp', facilityId: 'room-01', category: 'Published category', isVisible: false },
    { id: 'saved-second', name: 'Second', image: '/second.webp', highlight: 'Keep description' }
  ];
  let updated;
  const element = module.exports.LandingCatalogEditor({ type: 'sports', metadata, onChange: value => { updated = value; },
    openMediaPicker: (_title, _url, change) => change('/updated.webp') });
  function findAll(node, type) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(child => findAll(child, type));
    return [...(node.type === type ? [node] : []), ...findAll(node.props?.children, type)];
  }
  assert.equal(findAll(element, 'article').length, 2);
  findAll(element, 'button')[0].props.onClick();
  assert.deepEqual(JSON.parse(JSON.stringify(updated)), [{ ...metadata[0], image: '/updated.webp' }, metadata[1]]);
  assert.equal(metadata[0].image, '/first.webp');
  findAll(element, 'input')[0].props.onChange({ target: { checked: true } });
  assert.deepEqual(JSON.parse(JSON.stringify(updated)), [{ ...metadata[0], isVisible: true }, metadata[1]]);
});

test('coach dashboard respects Vietnam day/week/month boundaries and keeps persisted session IDs', () => {
  const api = load('features/coach/coachDashboardData.js');
  assert.equal(api.getDashboardSessions(null, 'day').length, 0);
  const workspace = { events: [], classSessions: [
    { id: 1, sessionDate: '2026-10-18', startTime: '23:00:00', endTime: '23:30:00', title: 'Sunday', status: 'Scheduled' },
    { id: 2, sessionDate: '2026-10-19', startTime: '00:00:00', endTime: '01:00:00', title: 'Monday', status: 'Scheduled' },
    { id: 3, sessionDate: '2026-10-31', startTime: '23:00:00', endTime: '23:30:00', title: 'Month end', status: 'Cancelled' },
    { id: 4, sessionDate: '2026-11-01', startTime: '00:00:00', endTime: '01:00:00', title: 'Next month', status: 'Scheduled' }
  ] };
  const now = new Date('2026-10-18T17:30:00Z');
  const day = api.getDashboardSessions(workspace, 'day', now);
  assert.equal(day.length, 1); assert.equal(day[0].sessionId, 2);
  assert.equal(api.getDashboardSessions(workspace, 'week', now).length, 1);
  const month = api.getDashboardSessions(workspace, 'month', now);
  assert.equal(month.length, 3); assert.equal(month[2].status, 'Cancelled');
});

test('appointment payload identifies a real member and does not fabricate a room or database ID', () => {
  const api = load('features/coach/coachDashboardData.js');
  const request = api.appointmentRequest({ memberId: '51', title: ' Saved title ', appointmentType: '1to1', sessionDate: '2026-10-20', startTime: '23:30' });
  assert.equal(request.memberId, 51); assert.equal(request.roomId, null); assert.equal(request.title, 'Saved title');
  assert.equal(request.startAt, '2026-10-20T16:30:00.000Z');
  assert.equal(request.endAt, '2026-10-20T17:30:00.000Z');
  assert.equal(request.id, undefined);
  assert.throws(() => api.appointmentRequest({ memberId: '', title: 'Invalid' }), /học viên/);
});

test('open notification inbox keeps empty/error states instead of fabricating unread notifications', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  function render(items, error = '') {
    const module = { exports: {} };
    const context = vm.createContext({ module, Date,
      require: id => {
        if (id === 'react') return { ...React, useState: () => [true, () => {}] };
        if (id.includes('AuthContext')) return { useAuth: () => ({ role: 'COACH' }) };
        if (id.includes('LanguageContext')) return { useLanguage: () => ({ language: 'vi' }) };
        if (id.includes('useNotifications')) return { useNotifications: () => ({ items, loading: false, error, readingId: null }) };
        if (id.includes('memberOverview')) return { formatMemberDateTime: () => 'Stored timestamp' };
        if (id.includes('i18nHelper')) return { translateNotificationTitle: value => value, translateNotificationContent: value => value };
        throw new Error(`Unexpected dependency: ${id}`);
      }
    });
    const source = fs.readFileSync(path.join(__dirname, '../src/components/common/NotificationInbox.jsx'), 'utf8');
    vm.runInContext(transformSync(source, { format: 'cjs', loader: 'jsx' }).code, context);
    return renderToStaticMarkup(React.createElement(module.exports.NotificationInbox));
  }
  const empty = render([]);
  assert.match(empty, /Chưa có thông báo/);
  assert.doesNotMatch(empty, /thông báo chưa đọc/);
  const failed = render([], 'SQL offline');
  assert.match(failed, /SQL offline/);
  assert.doesNotMatch(failed, /Chưa có thông báo|thông báo chưa đọc/);
  const real = render([{ id: 581, title: 'Stored title', content: 'Stored content', isRead: false, createdAt: '2026-10-19T10:00:00Z' }]);
  assert.match(real, /Stored title/); assert.match(real, /Stored content/);
  assert.match(real, /1 thông báo chưa đọc/);
});
