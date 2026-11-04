const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { test } = require('node:test');

const key = 'scms.auth.tab.v1';
const firstId = '11111111111111111111111111111111';
const secondId = '22222222222222222222222222222222';
function tab(store = new Map(), fetch = async () => new Response('{}')) {
  const context = vm.createContext({
    Headers, Response, Event, Date, JSON, Number, Math, Uint8Array, crypto: webcrypto, fetch,
    sessionStorage: { getItem: name => store.get(name), setItem: (name, value) => store.set(name, value), removeItem: name => store.delete(name) },
    window: { dispatchEvent: () => {} }
  });
  const auth = fs.readFileSync(path.join(__dirname, '../src/services/authState.js'), 'utf8').replace(/export /g, '');
  const http = fs.readFileSync(path.join(__dirname, '../src/services/http.js'), 'utf8').replace(/^import .*;\r?\n/gm, '')
    .replace(/export /g, '').replaceAll('import.meta.env', '({})');
  const backend = fs.readFileSync(path.join(__dirname, '../src/services/backendApi.js'), 'utf8').replace(/^import .*;\r?\n/gm, '')
    .replaceAll('export const ', 'const ').replaceAll('import.meta.env', '({})');
  vm.runInContext(`${auth}\n${http}\n${backend}\nglobalThis.api = { getApiSession, setApiSession, clearApiSession, createApiSession, apiRequest, authApi };`, context);
  return context.api;
}

test('F5 restores only a tab selector and logout leaves another tab independently authenticated', () => {
  const firstStore = new Map(), secondStore = new Map();
  tab(firstStore).setApiSession(firstId);
  tab(secondStore).setApiSession(secondId);
  assert.equal(tab(firstStore).getApiSession(), firstId);
  assert.equal(tab(secondStore).getApiSession(), secondId);
  tab(firstStore).clearApiSession();
  assert.equal(tab(firstStore).getApiSession(), null);
  assert.equal(tab(secondStore).getApiSession(), secondId);
  assert.deepEqual([...secondStore.entries()], [[key, secondId]]);
});

test('legacy JWTs and malformed selectors are removed instead of restored', () => {
  for (const selector of ['invalid-id', 'a.b.c', 'A'.repeat(32)]) {
    const store = new Map([[key, selector], ['scms.auth.token.v1', 'legacy.jwt.token']]);
    assert.equal(tab(store).getApiSession(), null);
    assert.equal(store.size, 0);
  }
});

test('authenticated fetch uses cookies and a selector header without exposing a Bearer token', async () => {
  const api = tab(new Map([[key, firstId]]), async (_url, options) => {
    assert.equal(options.credentials, 'include');
    assert.equal(options.headers.get('X-SCMS-Session'), firstId);
    assert.equal(options.headers.has('Authorization'), false);
    return new Response('{}');
  });
  await api.apiRequest('profile/me');
});

test('a duplicated tab gets a new selector on login and never stores a JWT from the response', async () => {
  const store = new Map([[key, firstId]]);
  let issued;
  const api = tab(store, async (url, options) => {
    const session = options.headers.get('X-SCMS-Session');
    if (url.endsWith('/auth/login')) {
      issued = session;
      assert.match(session, /^[a-f0-9]{32}$/);
      assert.notEqual(session, firstId);
      return new Response('{"accessToken":null}', { headers: { 'Content-Type': 'application/json' } });
    }
    assert.equal(session, issued);
    return new Response(JSON.stringify(url.endsWith('/profile/me') ? { userId: 2, role: 'Manager' } : []),
      { headers: { 'Content-Type': 'application/json' } });
  });
  assert.equal((await api.authApi.login('second@example.test', 'Chosen_Password42!')).user.id, 2);
  assert.deepEqual([...store.entries()], [[key, issued]]);
});

test('an authenticated 401 removes the current tab selector', async () => {
  const store = new Map([[key, firstId]]);
  const api = tab(store, async () => new Response('{}', { status: 401, headers: { 'Content-Type': 'application/json' } }));
  await assert.rejects(api.apiRequest('profile/me'), error => error.status === 401);
  assert.equal(api.getApiSession(), null);
  assert.equal(store.size, 0);
});

test('a late 401 from a previous account does not clear a newer login', async () => {
  let finish;
  const store = new Map([[key, firstId]]);
  const api = tab(store, () => new Promise(resolve => { finish = resolve; }));
  const pending = api.apiRequest('profile/me');
  api.setApiSession(secondId);
  finish(new Response('{}', { status: 401, headers: { 'Content-Type': 'application/json' } }));
  await assert.rejects(pending);
  assert.equal(api.getApiSession(), secondId);
  assert.equal(tab(store).getApiSession(), secondId);
});

test('a late successful response cannot populate the UI after switching accounts', async () => {
  let finish;
  const api = tab(new Map([[key, firstId]]), () => new Promise(resolve => { finish = resolve; }));
  const pending = api.apiRequest('members/me/progress');
  api.setApiSession(secondId);
  finish(new Response('{"private":"previous account"}', { headers: { 'Content-Type': 'application/json' } }));
  await assert.rejects(pending, error => error.code === 'AUTH_SUPERSEDED');
});

test('cancellation retains AbortError instead of reporting an uncertain transaction', async () => {
  const aborted = Object.assign(new Error('Cancelled'), { name: 'AbortError' });
  const api = tab(new Map(), async () => { throw aborted; });
  await assert.rejects(api.apiRequest('class-sessions'), error => error === aborted);
});

test('a late 204 cannot report success after logout', async () => {
  let finish;
  const api = tab(new Map([[key, firstId]]), () => new Promise(resolve => { finish = resolve; }));
  const pending = api.apiRequest('auth/google/link', { method: 'POST' });
  api.clearApiSession();
  finish(new Response(null, { status: 204 }));
  await assert.rejects(pending, error => error.code === 'AUTH_SUPERSEDED');
  assert.equal(api.getApiSession(), null);
});

test('switching accounts while the response body is loading discards old private data', async () => {
  let finishBody;
  const body = new Promise(resolve => { finishBody = resolve; });
  const response = new Response('{}', { headers: { 'Content-Type': 'application/json' } });
  response.json = () => body;
  const api = tab(new Map([[key, firstId]]), async () => response);
  const pending = api.apiRequest('members/me');
  await Promise.resolve();
  api.setApiSession(secondId);
  finishBody({ private: 'previous account' });
  await assert.rejects(pending, error => error.code === 'AUTH_SUPERSEDED');
});
