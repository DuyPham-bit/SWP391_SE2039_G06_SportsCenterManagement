// End-to-end checks of the bilingual home-content API against a running backend and its database.
// Every change is reverted at the end: the published content is snapshotted first and republished.
//   SCMS_TEST_API_BASE_URL     default http://localhost:5000/api (the docker backend)
//   SCMS_TEST_ADMIN_EMAIL      required: an ADMIN or MANAGER account
//   SCMS_TEST_ADMIN_PASSWORD   required
// Credentials come only from the environment; the test never reads secret files.
const apiBase = (process.env.SCMS_TEST_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const email = process.env.SCMS_TEST_ADMIN_EMAIL;
const password = process.env.SCMS_TEST_ADMIN_PASSWORD;

const results = [];
const check = (name, ok, detail = '') => {
  results.push(Boolean(ok));
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};
const clone = value => JSON.parse(JSON.stringify(value));
let token = null;

async function call(route, { method = 'GET', body, auth = true } = {}) {
  const response = await fetch(`${apiBase}/${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000)
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: response.status, data };
}
const dbCardIds = list => (list || []).map(card => card.id).filter(id => /^\d+$/.test(id));

(async () => {
  if (!email || !password) throw new Error('Set SCMS_TEST_ADMIN_EMAIL and SCMS_TEST_ADMIN_PASSWORD.');
  const login = await call('auth/login', { method: 'POST', body: { email, login: email, password }, auth: false });
  if (login.status !== 200) throw new Error(`Admin login failed (HTTP ${login.status}).`);
  token = login.data.accessToken || login.data.token;

  const original = (await call('admin/home-content')).data;
  if (!original?.content) throw new Error('No published home content; start the API once so it seeds the content.');
  const snapshot = clone(original.content);
  const sportsBefore = original.stats.sports;
  await call('admin/home-content/draft', { method: 'DELETE' });

  try {
    const vi = await call('home-content?lang=vi', { auth: false });
    const en = await call('home-content?lang=en', { auth: false });
    check('GET /home-content?lang=vi is public', vi.status === 200 && vi.data.lang === 'vi');
    check('GET /home-content?lang=en returns the English side', en.status === 200 && en.data.lang === 'en'
      && en.data.content.heroBanner.title === (snapshot.heroBanner.title.en || snapshot.heroBanner.title.vi));
    check('admin GET returns both languages', typeof original.content.heroBanner.title === 'object' && 'vi' in original.content.heroBanner.title);
    check('admin GET requires login', (await call('admin/home-content', { auth: false })).status === 401);
    const facilityCards = dbCardIds(snapshot.facilitiesSection?.facilitiesList).length;
    check('facility badge counts the facility cards backed by DB rooms', !facilityCards || vi.data.stats.facilities.total === facilityCards,
      `${vi.data.stats.facilities.visible}/${vi.data.stats.facilities.total} for ${facilityCards} cards`);

    // Edit → visible to admin and to the public page in both languages.
    const hero = clone(snapshot.heroBanner);
    hero.badge = { vi: 'KIỂM THỬ', en: 'LIVE TEST' };
    check('PUT /admin/home-content/heroBanner saves', (await call('admin/home-content/heroBanner', { method: 'PUT', body: { content: hero } })).status === 200);
    check('admin reload shows the edit', (await call('admin/home-content')).data.content.heroBanner.badge.en === 'LIVE TEST');
    check('public VI and EN show the edit', (await call('home-content?lang=vi', { auth: false })).data.content.heroBanner.badge === 'KIỂM THỬ'
      && (await call('home-content?lang=en', { auth: false })).data.content.heroBanner.badge === 'LIVE TEST');

    // Missing English: saved with a warning, public EN shows Vietnamese.
    hero.badge = { vi: 'CHỈ TIẾNG VIỆT', en: '' };
    const fallback = await call('admin/home-content/heroBanner', { method: 'PUT', body: { content: hero } });
    check('empty EN is saved with a warning', fallback.status === 200 && fallback.data.missingTranslations.includes('heroBanner.badge'));
    check('public EN falls back to VI', (await call('home-content?lang=en', { auth: false })).data.content.heroBanner.badge === 'CHỈ TIẾNG VIỆT');

    // Hide one sport → visible count drops by one; the catalog and the card follow.
    const courses = clone((await call('admin/home-content')).data.content.coursesSection);
    const target = courses.sportsList.find(card => /^\d+$/.test(card.id) && card.isVisible !== false);
    if (target) {
      target.isVisible = false;
      const hidden = await call('admin/home-content/coursesSection', { method: 'PUT', body: { content: courses } });
      check('hiding a sport updates the DB count', hidden.data.stats.sports.visible === sportsBefore.visible - 1 && hidden.data.stats.sports.total === sportsBefore.total,
        `${sportsBefore.visible}/${sportsBefore.total} → ${hidden.data.stats.sports.visible}/${hidden.data.stats.sports.total}`);
      const publicCourses = (await call('home-content?lang=vi', { auth: false })).data;
      check('public card is hidden', publicCourses.content.coursesSection.sportsList.find(card => card.id === target.id).isVisible === false);
    } else check('hiding a sport updates the DB count', false, 'no DB-linked sport card');

    // Quick metrics are a list: add and remove.
    const metricsHero = clone((await call('admin/home-content')).data.content.heroBanner);
    const count = metricsHero.metrics.length;
    metricsHero.metrics.push({ id: 'm-live-test', value: '7', label: { vi: 'Ngày/tuần', en: 'Days/week' } });
    await call('admin/home-content/heroBanner', { method: 'PUT', body: { content: metricsHero } });
    const added = (await call('home-content?lang=en', { auth: false })).data.content.heroBanner.metrics;
    check('added metric is public', added.length === count + 1 && added.at(-1).label === 'Days/week');
    metricsHero.metrics = metricsHero.metrics.filter(metric => metric.id !== 'm-live-test');
    await call('admin/home-content/heroBanner', { method: 'PUT', body: { content: metricsHero } });
    check('removed metric is gone', (await call('home-content?lang=vi', { auth: false })).data.content.heroBanner.metrics.length === count);

    // Validation rejects and stores nothing.
    const before = JSON.stringify((await call('admin/home-content')).data.content);
    for (const [label, field, value] of [
      ['empty VI heading', 'title', { vi: '', en: 'Only English' }],
      ['invalid URL', 'posterUrl', 'javascript:alert(1)'],
      ['invalid internal link', 'primaryCtaLink', '#/<x>']
    ]) {
      const invalid = clone(metricsHero);
      invalid[field] = value;
      const rejected = await call('admin/home-content/heroBanner', { method: 'PUT', body: { content: invalid } });
      check(`${label} is rejected`, rejected.status === 400, rejected.data?.message);
    }
    check('rejected saves change nothing', JSON.stringify((await call('admin/home-content')).data.content) === before);

    const legacy = await call('landing-content', { auth: false });
    check('legacy /landing-content alias returns flat Vietnamese', legacy.status === 200 && typeof legacy.data.content.heroBanner.title === 'string');
  } finally {
    const restored = await call('admin/home-content', { method: 'PUT', body: { content: snapshot } });
    const after = (await call('admin/home-content')).data;
    check('original content and visibility restored', restored.status === 200
      && JSON.stringify(after.content) === JSON.stringify(snapshot) && after.stats.sports.visible === sportsBefore.visible);
  }
})().catch(error => { console.error(`FAIL  ${error.message}`); results.push(false); }).finally(() => {
  const failed = results.filter(ok => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} home-content live checks passed`);
  process.exitCode = failed ? 1 : 0;
});
