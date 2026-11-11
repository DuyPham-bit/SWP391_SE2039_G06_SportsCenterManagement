const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const frontend = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(frontend, rel), 'utf8');
const modal = read('src/features/auth/ui/ProfileModal.jsx');
const authApi = read('src/entities/session/api/authApi.js');

test('member can edit gender, date of birth and fitness level on the Profile page', () => {
  assert.match(modal, /currentUser\?\.role === 'MEMBER'/);
  for (const id of ['profile-gender', 'profile-dob', 'profile-fitness-level']) {
    assert.match(modal, new RegExp(`id="${id}"`));
  }
  assert.match(modal, /memberDetails:/);
});

test('member profile details are loaded from and saved to members/me', () => {
  assert.match(authApi, /dateOfBirth: memberProfile\?\.dateOfBirth/);
  assert.match(authApi, /gender: memberProfile\?\.gender/);
  assert.match(authApi, /fitnessLevel: memberProfile\?\.fitnessLevel/);
  assert.match(authApi, /apiRequest\('members\/me', \{\s*method: 'PATCH'/);
  assert.match(authApi, /fitnessLevel: details\.fitnessLevel \|\| null/);
});
