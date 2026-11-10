const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const helperUrl = pathToFileURL(path.join(__dirname, '../src/pages/landing/ui/heroVideo.js')).href;

test('landing restores its bundled default video for empty or missing configuration', async () => {
  const { resolveHeroVideoUrl } = await import(helperUrl);
  for (const hero of [undefined, null, {}, { videoUrl: '' }]) {
    assert.equal(resolveHeroVideoUrl(hero), '/hero-video.mp4');
  }
  const file = path.join(__dirname, '../public/hero-video.mp4');
  assert.ok(fs.statSync(file).size > 0, 'the fallback must be shipped with the frontend');
  const header = fs.readFileSync(file).subarray(4, 8).toString('ascii');
  assert.equal(header, 'ftyp', 'fallback asset is an MP4, not a placeholder');
});

test('an explicitly configured landing video takes priority over the bundled video', async () => {
  const { resolveHeroVideoUrl } = await import(helperUrl);
  const customUrl = 'https://media.example.com/landing/custom.mp4';
  assert.equal(resolveHeroVideoUrl({ videoUrl: customUrl }), customUrl);
});

test('hero playback and mute control use the resolved video source', () => {
  const page = fs.readFileSync(path.join(__dirname, '../src/pages/landing/ui/HeroSection.jsx'), 'utf8');
  assert.ok(/const heroVideoUrl = resolveHeroVideoUrl\(landingContent\.heroBanner\)/.test(page));
  assert.ok(/<video[\s\S]*?key=\{heroVideoUrl\}[\s\S]*?autoPlay loop[\s\S]*?muted=\{isVideoMuted\}/.test(page));
  assert.ok(/<source src=\{heroVideoUrl\} type="video\/mp4"/.test(page));
  assert.ok(/\{heroVideoUrl && <button/.test(page));
  assert.ok(!/\{landingContent\.heroBanner\?\.videoUrl \? <video/.test(page),
    'blank videoUrl must not turn the hero into a static image');
});
