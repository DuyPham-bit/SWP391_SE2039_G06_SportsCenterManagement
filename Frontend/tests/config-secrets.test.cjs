const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');
const { test } = require('node:test');

const root = path.resolve(__dirname, '../..');
const api = 'Backend/Backend/SportsCenterManagement.API';

function trackedFiles() {
  return new Set(childProcess.execFileSync('git', ['ls-files'], {
    cwd: root,
    encoding: 'utf8'
  }).split(/\r?\n/).filter(Boolean));
}

test('tracked API configuration contains no private credentials or connection strings', () => {
  const privateFields = /^(password|key|secretkey|hashsecret|accesskey|apikey|clientsecret|refreshtoken|bearertoken|secret|checksumkey)$/i;
  function inspect(object, prefix, file) {
    for (const [key, value] of Object.entries(object)) {
      const location = `${prefix}:${key}`;
      if (value && typeof value === 'object') inspect(value, location, file);
      else if (privateFields.test(key) || prefix === 'ConnectionStrings') {
        // Never let an assertion failure print the credential itself.
        assert.ok(value === '' || value == null, `${file} has a non-empty private field at ${location}`);
      }
    }
  }
  const tracked = trackedFiles();
  for (const file of [`${api}/appsettings.json`, `${api}/appsettings.Development.json`]) {
    if (!tracked.has(file)) continue;
    inspect(JSON.parse(fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '')), '', file);
  }
});

test('tracked service-account templates have no signing key and local credentials cannot be published', () => {
  const tracked = trackedFiles();
  for (const file of [`${api}/credentials.json`, 'Backend/Backend/credentials.json']) {
    if (!tracked.has(file)) continue;
    const credential = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, ''));
    assert.ok(!credential.private_key && !credential.private_key_id, `${file} contains private signing material`);
  }
  const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  const dockerIgnore = fs.readFileSync(path.join(root, '.dockerignore'), 'utf8');
  assert.match(ignore, /^\*\*\/credentials\.json$/m);
  assert.match(ignore, /^\*\*\/appsettings\.Development\.json$/m);
  assert.match(dockerIgnore, /^\*\*\/credentials\.json$/m);
  assert.match(dockerIgnore, /^\*\*\/appsettings\.Development\.json$/m);
});
