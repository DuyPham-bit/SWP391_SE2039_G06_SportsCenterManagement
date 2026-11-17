const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { apiSource } = require('./helpers/apiSources.cjs');

// Evaluates the API layer with a stubbed apiRequest that records every route and request body.
function client() {
  const source = apiSource()
    .replace(/^import .+;\r?\n/gm, '').replaceAll('export const ', 'const ')
    .replaceAll('import.meta.env', '({})');
  const calls = [];
  const context = vm.createContext({
    URLSearchParams, Date, Map, Set,
    getAuthUser: () => null, getAuthVersion: () => 1, assertAuthVersion: () => {}, beginAuthOperation: () => 1,
    getApiSession: () => 'token', setAuthUser: () => {}, clearApiSession: () => {},
    setApiSession: () => {}, createApiSession: () => {},
    apiRequest: async (route, options = {}) => {
      calls.push({ route, body: options.body });
      if (route === 'auth/google') return { accessToken: 'jwt', user: { userId: 1, role: 'MEMBER' } };
      if (route === 'profile/me') return { userId: 1, role: 'MEMBER' };
      return null;
    }
  });
  vm.runInContext(`${source}\nglobalThis.api = { authApi };`, context);
  return { authApi: context.api.authApi, calls };
}

const googleCall = calls => calls.find(call => call.route === 'auth/google');

test('Google sign-in sends the ID token when given the Google Identity Services response', async () => {
  const api = client();
  await api.authApi.loginWithGoogle({ credential: 'id-token-123' }).catch(() => {});
  assert.equal(googleCall(api.calls)?.body?.idToken, 'id-token-123');
});

test('Google sign-in also sends the ID token when given the bare token string', async () => {
  const api = client();
  await api.authApi.loginWithGoogle('id-token-456').catch(() => {});
  assert.equal(googleCall(api.calls)?.body?.idToken, 'id-token-456');
});

test('Google sign-in without a token fails locally instead of posting an empty request', async () => {
  const api = client();
  await assert.rejects(() => api.authApi.loginWithGoogle({}));
  assert.equal(googleCall(api.calls), undefined);
});

test('login page passes the Google response object, not the bare credential', () => {
  const page = fs.readFileSync(path.resolve(__dirname, '../src/pages/login/ui/LoginPage.jsx'), 'utf8');
  assert.match(page, /loginWithGoogle\(\{\s*credential:\s*response\.credential\s*\}\)/);
  assert.doesNotMatch(page, /loginWithGoogle\(response\.credential\)/);
});
