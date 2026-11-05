const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function config() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../vercel.json'), 'utf8'));
}

test('Vercel forwards API paths to the fixed HTTPS Render backend before SPA fallback', () => {
  const rules = config().rewrites;
  const apiIndex = rules.findIndex(rule => rule.source === '/api/:path*');
  const spaIndex = rules.findIndex(rule => rule.source === '/(.*)');
  assert.ok(apiIndex >= 0, 'API proxy is required for same-origin HttpOnly authentication');
  assert.ok(spaIndex > apiIndex, 'SPA HTML must not swallow API requests');
  const destination = rules[apiIndex].destination;
  assert.equal(destination, 'https://scms-api-4j57.onrender.com/api/:path*');
  for (const endpoint of ['auth/login', 'auth/me', 'landing-content', 'payments/momo-ipn']) {
    const target = new URL(destination.replace(':path*', endpoint));
    assert.equal(target.origin, 'https://scms-api-4j57.onrender.com');
    assert.equal(target.pathname, `/api/${endpoint}`);
    assert.equal(target.username, '');
    assert.equal(target.password, '');
  }
  assert.equal(rules[spaIndex].destination, '/index.html');
});

test('plain authentication page paths redirect to the existing hash router', () => {
  const rules = config().redirects;
  for (const page of ['login', 'register']) {
    const rule = rules.find(item => item.source === `/${page}`);
    assert.ok(rule, `${page} must not return a platform 404 or the landing page`);
    assert.equal(rule.destination, `/#/${page}`);
    assert.equal(rule.permanent, false, 'do not permanently cache route changes');
    const url = new URL(rule.destination, 'https://sports-center-manager-fe.vercel.app');
    assert.equal(url.pathname, '/');
    assert.equal(url.hash, `#/${page}`);
  }
  assert.ok(rules.every(rule => !rule.source.startsWith('/api')), 'API requests must be proxied, never redirected');
});

test('API responses cannot be cached as public content by the Vercel proxy', () => {
  const rule = config().headers.find(item => item.source === '/api/:path*');
  assert.ok(rule);
  assert.equal(rule.headers.find(item => item.key.toLowerCase() === 'cache-control')?.value, 'no-store');
  assert.ok(rule.headers.every(item => item.key.toLowerCase() !== 'set-cookie'), 'proxy must preserve backend cookies, not invent static ones');
});
