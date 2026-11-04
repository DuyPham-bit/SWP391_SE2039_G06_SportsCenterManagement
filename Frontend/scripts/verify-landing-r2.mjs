import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const base = 'http://localhost:5000/api';
const env = Object.fromEntries((await fs.readFile('docker/.env', 'utf8')).split(/\r?\n/)
  .filter(x => x.includes('=') && !x.startsWith('#')).map(x => {
    const i = x.indexOf('='); return [x.slice(0, i), x.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
  }));
const auth = await (await fetch(base + '/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: env.ADMIN_EMAIL || env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD })
})).json();
assert.ok(auth.accessToken);
const headers = { Authorization: 'Bearer ' + auth.accessToken };
const report = JSON.parse(await fs.readFile('.validation/landing-import/r2-import.json', 'utf8'));
const content = await (await fetch(base + '/landing-content')).json();
assert.equal(content.content.coursesSection.sportsList.length, 10);
assert.equal(content.content.facilitiesSection.facilitiesList.length, 10);
assert.doesNotMatch(JSON.stringify(content), /googleusercontent|drive\.google/);
let checked = 0;
const unique = new Map(Object.values(report.images).map(x => [x.key, x]));
const persisted = JSON.parse(execFileSync('docker', ['exec', 'docker-postgres-1', 'psql',
  '-U', 'scms', '-d', 'SportsCenterManagement', '-Atc',
  "SELECT setting_value FROM system_settings WHERE setting_key='site.landing-content';"], { encoding: 'utf8', windowsHide: true }));
assert.doesNotMatch(JSON.stringify(persisted), /https?:\/\/|googleusercontent/);
assert.doesNotMatch(JSON.stringify(persisted), /dashboard\//);
const rows = JSON.parse(execFileSync('docker', ['exec', 'docker-postgres-1', 'psql',
  '-U', 'scms', '-d', 'SportsCenterManagement', '-Atc',
  "SELECT coalesce(json_agg(m), '[]') FROM (SELECT \"Id\" AS id, storage_key, mime_type, file_size, file_name FROM uploaded_media WHERE storage_key LIKE 'dashboard/%') m;"],
  { encoding: 'utf8', windowsHide: true }));
assert.equal(rows.length, 21);
const gallery = await (await fetch(base + '/media/files', { headers })).json();
assert.equal(gallery.length, 21);
for (const [key, image] of unique) {
  const row = rows.find(row => row.storage_key === key);
  assert.ok(row, 'Every source image has its own metadata row: ' + key);
  assert.equal(row.file_size, image.size);
  assert.equal(row.mime_type, 'image/jpeg');
  assert.equal(row.file_name, key.split('/').pop());
  assert.ok(JSON.stringify(content).includes(key), 'Every source image remains displayed');
  const response = await fetch(env.R2_PUBLIC_DOMAIN.replace(/\/$/, '') + '/' + key);
  assert.equal(response.status, 200, key);
  assert.equal(crypto.createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'), image.sha256);
  checked++;
}
async function upload(bytes, name, type, authenticated = true) {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type }), name);
  return fetch(base + '/r2-images/dashboard', { method: 'POST', headers: authenticated ? headers : {}, body: form });
}
const jpeg = await fs.readFile('.validation/landing-import/1.jpg');
assert.equal((await upload(jpeg, 'image.jpg', 'image/jpeg', false)).status, 401);
assert.equal((await upload(jpeg, 'image.svg', 'image/svg+xml')).status, 400);
assert.equal((await upload(Buffer.from('not a jpeg'), 'image.jpg', 'image/jpeg')).status, 400);
assert.equal((await upload(jpeg, 'image.png', 'image/png')).status, 400);
assert.equal((await upload(new Uint8Array(5 * 1024 * 1024 + 1), 'image.jpg', 'image/jpeg')).status, 400);
const temporary = await upload(jpeg, '../ảnh đặc biệt # ? ü.jpg', 'image/jpeg');
assert.equal(temporary.status, 201);
const uploaded = await temporary.json();
assert.match(uploaded.key, /^dashboard\/[0-9]{4}\/[0-9]{2}\/[0-9]{17}-[a-f0-9]{32}\.jpg$/);
assert.equal((await fetch(base + '/r2-images/dashboard?key=' + encodeURIComponent(report.images[1].key), { method: 'DELETE', headers })).status, 409);
assert.equal((await fetch(base + '/r2-images/dashboard?key=' + encodeURIComponent('dashboard/../../escape.jpg'), { method: 'DELETE', headers })).status, 400);
assert.equal((await fetch(base + '/r2-images/dashboard?key=' + encodeURIComponent(uploaded.key), { method: 'DELETE', headers })).status, 204);
// Exercise post-save cleanup using a new, test-owned object in fields that are not rendered.
// The actual editorial content is restored in finally even when an assertion fails.
const cleanupUpload = await (await upload(jpeg, 'cleanup-probe.jpg', 'image/jpeg')).json();
assert.ok(cleanupUpload.key);
const original = content.content;
const testCard = { id: 'cleanup-probe-' + crypto.randomUUID(), name: 'Cleanup probe',
  image: cleanupUpload.publicUrl, secondaryImage: cleanupUpload.publicUrl, isVisible: false };
const withCard = card => ({ ...original, facilitiesSection: { ...original.facilitiesSection,
  facilitiesList: [...original.facilitiesSection.facilitiesList, card] } });
async function publish(value) {
  const response = await fetch(base + '/landing-content', {
    method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: value })
  });
  const result = await response.json();
  assert.equal(response.status, 200, JSON.stringify(result));
  return result;
}
try {
  await publish(withCard(testCard));
  await publish(withCard({ ...testCard, image: '' }));
  assert.equal((await fetch(cleanupUpload.publicUrl + '?probe=' + crypto.randomUUID())).status, 200);
} finally {
  await publish(original);
}
assert.equal((await fetch(cleanupUpload.publicUrl + '?probe=' + crypto.randomUUID())).status, 404,
  'Removing the last published reference deletes the test-owned R2 object');
assert.equal((await (await fetch(base + '/media/files', { headers })).json()).length, 21,
  'Temporary metadata rows are also removed');
const invalidReference = { ...original, whyUs: { ...original.whyUs, imageMediaId: 2147483647 } };
delete invalidReference.whyUs.imageUrl;
assert.equal((await fetch(base + '/landing-content', {
  method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: invalidReference })
})).status, 400, 'Reject media IDs absent from the catalog');
const roundtrip = await publish(persisted);
assert.equal(roundtrip.content.heroBanner.posterMediaId, persisted.heroBanner.posterMediaId);
assert.match(roundtrip.content.heroBanner.posterUrl, /^https:\/\//);
console.log('PASS: ' + checked + ' R2 objects match source SHA256; 10 sports/10 facilities; auth, extension, signature, 5MB, safe naming, shared reference protection and temporary-file cleanup.');
// All assertions and restores above are awaited; do not keep the CLI alive for HTTP keep-alive sockets.
process.exit(0);
