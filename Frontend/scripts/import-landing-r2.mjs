// Run from the repository root after starting the updated backend:
// node Frontend/scripts/import-landing-r2.mjs
// Images must first be downloaded to .validation/landing-import/1.jpg ... 23.jpg.
// Credentials are read locally and never printed or stored in the import report.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';

const base = process.env.SCMS_IMPORT_API || 'http://localhost:5000/api';
const env = Object.fromEntries((await fs.readFile('docker/.env', 'utf8')).split(/\r?\n/)
  .filter(line => line.trim() && !line.trim().startsWith('#') && line.includes('='))
  .map(line => { const i = line.indexOf('='); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }));
const login = await fetch(base + '/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: env.ADMIN_EMAIL || env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD })
});
const auth = await login.json();
if (!login.ok || !auth.accessToken) throw new Error('Cannot authenticate import account: HTTP ' + login.status);
const headers = { Authorization: 'Bearer ' + auth.accessToken };
const directory = '.validation/landing-import';
const reportPath = path.join(directory, 'r2-import.json');
let report;
try { report = JSON.parse(await fs.readFile(reportPath, 'utf8')); } catch { report = { images: {} }; }
const byHash = new Map(Object.values(report.images).map(image => [image.sha256, image]));
for (let index = 1; index <= 23; index++) {
  const bytes = await fs.readFile(path.join(directory, index + '.jpg'));
  if (bytes.length > 5 * 1024 * 1024 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255)
    throw new Error('Expected a JPEG under 5 MiB: ' + index);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  let image = byHash.get(sha256);
  if (!image) {
    const form = new FormData();
    form.append('file', new Blob([bytes], { type: 'image/jpeg' }), 'source.jpg');
    const response = await fetch(base + '/r2-images/dashboard', { method: 'POST', headers, body: form });
    const payload = await response.json();
    if (!response.ok) throw new Error('Upload ' + index + ' failed: HTTP ' + response.status);
    image = { key: payload.key, sha256, size: bytes.length };
    byHash.set(sha256, image);
  }
  report.images[index] = image;
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log('Image ' + index + ': ' + image.key);
}
const key = index => report.images[index].key;
const source = await fs.readFile('Frontend/src/services/landingContentService.js', 'utf8');
const defaults = JSON.parse(source.match(/export const DEFAULT_LANDING_CONTENT = ([\s\S]*?);/)[1]);
const published = await (await fetch(base + '/landing-content')).json();
// Do not overwrite a later editor's text on a repeat run.
const content = published.content || defaults;
const definitions = [
  ['swimming', 'Bơi lội', 'Bể bơi', 'pool', 'aquatics', 14, 1, 22],
  ['badminton', 'Cầu lông', 'Sân cầu lông', 'sports_tennis', 'racket-sports', 18, 2, 18],
  ['football', 'Bóng đá', 'Sân bóng đá', 'sports_soccer', 'team-sports', 4, 3, 19],
  ['yoga', 'Yoga', 'Không gian Yoga', 'self_improvement', 'fitness', 5, 6, 7],
  ['gym', 'Gym & Fitness', 'Phòng Gym', 'fitness_center', 'fitness', 8, 23, 8],
  ['tennis', 'Tennis', 'Sân Tennis', 'sports_tennis', 'racket-sports', 9, 11, 9],
  ['basketball', 'Bóng rổ', 'Sân bóng rổ', 'sports_basketball', 'team-sports', 10, 17, 10],
  ['table-tennis', 'Bóng bàn', 'Khu bóng bàn', 'sports_tennis', 'racket-sports', 15, 16, 15],
  ['boxing', 'Boxing', 'Khu tập Boxing', 'sports_mma', 'martial-arts', 20, 20, 20],
  ['running', 'Chạy bộ', 'Đường chạy', 'directions_run', 'athletics', 13, 13, 13]
];
content.heroBanner.posterUrl = key(23);
content.heroBanner.videoUrl = '';
content.authShowcase = { ...defaults.authShowcase, ...content.authShowcase, posterUrl: key(23) };
content.whyUs.imageUrl = key(12);
content.whyUs.imageAlt = 'Tư vấn sức khỏe và hỗ trợ tập luyện';
content.coursesSection.catalogSource = 'custom';
content.coursesSection.sportsList = definitions.map(([id, name, venue, icon, category, image]) => ({
  id, name, venue, icon, category, facilityId: 'landing-' + id, location: '',
  highlight: '', level: '', coach: '', schedule: '', price: '', capacity: '', badges: [],
  image: key(image), isVisible: true
}));
content.facilitiesSection.catalogSource = 'custom';
content.facilitiesSection.facilitiesList = definitions.map(([id, , name, , category, , image, secondary]) => ({
  id: 'landing-' + id, name, category, categoryName: category === 'fitness' ? 'Tập luyện' : 'Thể thao',
  location: '', zone: '', capacity: '', openHours: '', priceRate: '', badge: '',
  image: key(image), secondaryImage: key(secondary), highlights: '', description: '',
  amenities: [], tags: [], specs: [], isVisible: true
}));
// These are editorial cards, not operational rooms/classes with bookable IDs.
const response = await fetch(base + '/landing-content', {
  method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ content })
});
if (!response.ok) throw new Error('Publishing failed: HTTP ' + response.status + ' ' + await response.text());
const actual = await response.json();
const serialized = JSON.stringify(actual);
if (/googleusercontent|drive\.google/.test(serialized)) throw new Error('Legacy Drive reference remains');
report.uniqueObjects = byHash.size;
report.publishedAt = actual.updatedAt;
await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
console.log('Published ' + byHash.size + ' unique R2 images for 23 source images.');
