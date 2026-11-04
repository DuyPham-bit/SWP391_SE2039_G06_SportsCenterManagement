const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');

const root = path.resolve(__dirname, '../..');
const api = 'Backend/SportsCenterManagement.API';
const trackedFiles = () => execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);

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
  for (const file of trackedFiles().filter(file => /(?:^|\/)appsettings[^/]*\.json$/.test(file))) {
    if (!fs.existsSync(path.join(root, file))) continue;
    inspect(JSON.parse(fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '')), '', file);
  }
});

test('private local environment files are ignored and never enter the Docker build context', () => {
  for (const local of ['.env', '.env.local', 'docker/.env', 'Backend/.env.production', `${api}/credentials.local.json`]) {
    const result = execFileSync('git', ['check-ignore', '--no-index', local], { cwd: root, encoding: 'utf8' }).trim();
    assert.ok(result, `${local} must be ignored`);
  }
  const dockerIgnore = fs.readFileSync(path.join(root, '.dockerignore'), 'utf8');
  for (const rule of ['**/.env', '**/.env.*', '**/credentials.local.json']) {
    assert.ok(dockerIgnore.split(/\r?\n/).includes(rule), `Docker must exclude ${rule}`);
  }
});

test('tracked environment overrides contain no nonempty private settings', () => {
  const privateKey = /password|secret|token|(?:^|_)access_?key|api_?key|jwt_?key|private_?key|connectionstrings/i;
  const publicBuildKeys = new Set(['VITE_API_BASE_URL', 'SCMS_API_PROXY_TARGET', 'VITE_SPORTS_CENTER_ID', 'VITE_GOOGLE_CLIENT_ID']);
  for (const file of trackedFiles().filter(file => /(?:^|\/)\.env(?:\.[^/]+)?$/.test(file) && !file.endsWith('.example'))) {
    for (const line of fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/)) {
      const pair = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (pair && file === 'Frontend/.env.local') {
        assert.ok(publicBuildKeys.has(pair[1]), `${file} must contain only approved public build settings`);
      }
      if (pair && privateKey.test(pair[1])) {
        const empty = ['', '""', "''"].includes(pair[2].trim());
        assert.ok(empty, `${file} contains a private setting at ${pair[1]}`);
      }
    }
  }
});

test('application startup cannot create or reset accounts with published demo passwords', () => {
  const program = fs.readFileSync(path.join(root, api, 'Program.cs'), 'utf8');
  assert.ok(!/DevelopmentAccountBootstrapper|SeedDemoAccounts|ResetExistingDemoAccounts/.test(program),
    'Startup still enables creation or reset of accounts with published demo credentials');
  const knownDemoPassword = /\b(?:Admin|Manager|Reception|Coach|Member)@123456\b/;
  for (const file of trackedFiles().filter(file => file.startsWith(`${api}/`) && file.endsWith('.cs'))) {
    if (!fs.existsSync(path.join(root, file))) continue;
    assert.ok(!knownDemoPassword.test(fs.readFileSync(path.join(root, file), 'utf8')), `${file} contains a published demo password`);
  }
});

test('obsolete storage credentials are not tracked', () => {
  for (const file of [`${api}/credentials.json`, 'Backend/credentials.json']) {
    assert.ok(!fs.existsSync(path.join(root, file)), `${file} must not be present`);
  }
});

test('tracked service-account templates have no signing key and local credentials cannot be published', () => {
  for (const file of trackedFiles().filter(file => /(?:^|\/)credentials(?:\.[^/]*)?\.json$/.test(file))) {
    if (!fs.existsSync(path.join(root, file))) continue;
    const credential = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, ''));
    assert.ok(!credential.private_key && !credential.private_key_id, file + ' contains private signing material');
  }
  for (const file of ['.gitignore', '.dockerignore']) {
    const ignore = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(ignore.split(/\r?\n/).includes('**/credentials.json'));
    assert.ok(ignore.split(/\r?\n/).includes('**/appsettings.Development.json'));
  }
});
