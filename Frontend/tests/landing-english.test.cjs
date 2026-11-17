const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const frontend = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(frontend, file), 'utf8');
const load = () => import(pathToFileURL(path.join(frontend, 'src/shared/i18n/landingTranslation.js')).href);
const loadHelper = () => import(pathToFileURL(path.join(frontend, 'src/shared/i18n/i18nHelper.js')).href);

const content = {
  heroBanner: { badge: 'TRUNG TÂM THỂ THAO', title: 'PARSE CENTER', primaryCtaLink: '#/register' },
  facilitiesSection: {
    title: 'Cơ sở vật chất',
    facilitiesList: [
      { id: 'f1', name: 'Không gian Yoga', category: 'fitness', image: 'https://cdn.test/yoga.jpg' },
      { id: 'f2', name: 'Phòng xông hơi mới', category: 'fitness' }
    ]
  },
  ctaAndFooter: { contactEmail: 'lienhe@scms.com.vn', contactAddress: '1/11 Hung Vuong, Q1, Sai Gon' },
  translations: { 'Phòng xông hơi mới': 'New sauna room' }
};

test('English page uses the real content: the center name stays, standard texts and "Không gian Yoga" are translated', async () => {
  const { localizeLandingContent } = await load();
  const en = localizeLandingContent(content, true);
  assert.equal(en.heroBanner.title, 'PARSE CENTER');
  assert.equal(en.heroBanner.badge, 'SPORTS CENTER');
  assert.equal(en.facilitiesSection.title, 'Facilities');
  assert.equal(en.facilitiesSection.facilitiesList[0].name, 'Yoga studio');
  assert.equal(en.facilitiesSection.facilitiesList[1].name, 'New sauna room');
  assert.equal(en.facilitiesSection.facilitiesList[0].image, 'https://cdn.test/yoga.jpg');
  assert.equal(en.facilitiesSection.facilitiesList[0].category, 'fitness');
  assert.equal(en.ctaAndFooter.contactAddress, '1/11 Hung Vuong, Q1, Sai Gon');
  assert.equal(localizeLandingContent(content, false), content, 'Vietnamese page is unchanged');
});

test('a text the manager edited in Vietnamese shows in Vietnamese until it gets an English version', async () => {
  const { localizeLandingContent, collectLandingTexts, builtInEnglish } = await load();
  const edited = { ...content, facilitiesSection: { ...content.facilitiesSection, title: 'Cơ sở vật chất hiện đại' } };
  assert.equal(localizeLandingContent(edited, true).facilitiesSection.title, 'Cơ sở vật chất hiện đại');
  const missing = collectLandingTexts(edited).filter(item => !edited.translations[item.text] && !builtInEnglish(item.text));
  assert.deepEqual(missing.map(item => item.text), ['Cơ sở vật chất hiện đại']);
  const translated = { ...edited, translations: { ...edited.translations, 'Cơ sở vật chất hiện đại': 'Modern facilities' } };
  assert.equal(localizeLandingContent(translated, true).facilitiesSection.title, 'Modern facilities');
});

test('saving drops English versions of texts that are no longer on the page', async () => {
  const { pruneTranslations } = await load();
  const pruned = pruneTranslations({ ...content, translations: { ...content.translations, 'Đoạn đã xoá': 'Removed', 'Cơ sở vật chất': '  ' } });
  assert.deepEqual(pruned.translations, { 'Phòng xông hơi mới': 'New sauna room' });
});

test('an all-caps Vietnamese label keeps capitals in English', async () => {
  const { builtInEnglish } = await load();
  assert.equal(builtInEnglish('KHÔNG GIAN TẬP LUYỆN'), 'TRAINING SPACES');
  assert.equal(builtInEnglish('Khu vực tập luyện'), 'Training areas');
});

test('sport names that are already English are not renamed', async () => {
  const { translateSportName } = await loadHelper();
  assert.equal(translateSportName('Yoga', true), 'Yoga');
  assert.equal(translateSportName('Boxing', true), 'Boxing');
  assert.equal(translateSportName('Bơi lội', true), 'Swimming');
});

test('landing sections no longer hard-code invented English text over the database content', () => {
  const sources = ['HeroSection', 'AboutSection', 'CoursesSection', 'FacilitiesSection', 'LandingFooter']
    .map(name => read(`src/pages/landing/ui/${name}.jsx`)).join('\n');
  assert.doesNotMatch(sources, /isEn \? 'OLYMPIC SPORTS CENTER'/);
  assert.doesNotMatch(sources, /MODERN & QUALITY OLYMPIC FACILITY COMPLEX/);
  assert.doesNotMatch(sources, /translateLandingContent/);
  assert.doesNotMatch(read('src/shared/i18n/i18nHelper.js'), /AFC, FIBA, BWF/);
});

test('editor has an English tab that can translate missing texts through the backend', () => {
  const tab = read('src/pages/manager-home-content/ui/EnglishTab.jsx');
  assert.match(tab, /translateLandingTexts/);
  assert.match(read('src/entities/landing-content/api/landingContentService.js'), /'landing-content\/translate'/);
  assert.match(read('src/pages/manager-home-content/ui/HomeContentTabs.jsx'), /id: 'english'/);
});
