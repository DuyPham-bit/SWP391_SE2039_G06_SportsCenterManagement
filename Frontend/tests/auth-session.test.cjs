const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const key = 'scms.auth.token.v1';
const jwt = (seconds, subject = 1) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds, sub: String(subject) })).toString('base64url')}.test-signature`;
function tab(store = new Map(), fetch = async () => new Response('{}')) {
  const context = vm.createContext({
    Headers, Response, Event, Date, JSON, Number, Math,
    atob: value => Buffer.from(value, 'base64').toString(), fetch,
    sessionStorage: { getItem: name => store.get(name), setItem: (name, value) => store.set(name, value), removeItem: name => store.delete(name) },
    window: { dispatchEvent: () => {} }
  });
  const auth = fs.readFileSync(path.join(__dirname, '../src/services/authState.js'), 'utf8').replace(/export /g, '');
  const http = fs.readFileSync(path.join(__dirname, '../src/services/http.js'), 'utf8').replace(/^import .*;\r?\n/gm, '')
    .replace(/export /g, '').replaceAll('import.meta.env', '({})');
  vm.runInContext(`${auth}\n${http}\nglobalThis.api = { getApiToken, setApiToken, clearApiToken, apiRequest };`, context);
  return context.api;
}

test('F5 restores an unexpired token in the same tab while another tab keeps its own login', () => {
  const firstStore = new Map(), secondStore = new Map();
  const firstToken = jwt(3600, 1), secondToken = jwt(3600, 2);
  tab(firstStore).setApiToken(firstToken);
  tab(secondStore).setApiToken(secondToken);
  assert.equal(tab(firstStore).getApiToken(), firstToken);
  assert.equal(tab(secondStore).getApiToken(), secondToken);
  tab(firstStore).clearApiToken();
  assert.equal(tab(firstStore).getApiToken(), null);
  assert.equal(tab(secondStore).getApiToken(), secondToken);
});

test('expired and malformed persisted tokens are removed before restoring authentication', () => {
  for (const token of [jwt(-1), 'invalid-token', 'a.bad-json.c']) {
    const store = new Map([[key, token]]);
    assert.equal(tab(store).getApiToken(), null);
    assert.equal(store.has(key), false);
  }
});

test('an authenticated 401 removes both the in-memory and persisted login', async () => {
  const token = jwt(3600), store = new Map([[key, token]]);
  const api = tab(store, async () => new Response('{}', { status: 401, headers: { 'Content-Type': 'application/json' } }));
  await assert.rejects(api.apiRequest('profile/me'), error => error.status === 401);
  assert.equal(api.getApiToken(), null);
  assert.equal(store.has(key), false);
});

test('a late 401 from a previous account does not clear a newer login', async () => {
  let finish;
  const store = new Map([[key, jwt(3600, 1)]]);
  const api = tab(store, () => new Promise(resolve => { finish = resolve; }));
  const pending = api.apiRequest('profile/me');
  const secondToken = jwt(3600, 2);
  api.setApiToken(secondToken);
  finish(new Response('{}', { status: 401, headers: { 'Content-Type': 'application/json' } }));
  await assert.rejects(pending);
  assert.equal(api.getApiToken(), secondToken);
  assert.equal(tab(store).getApiToken(), secondToken);
});
