const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { apiSource } = require('./helpers/apiSources.cjs');

const frontend = path.resolve(__dirname, '..');
const component = fs.readFileSync(path.join(frontend, 'src/pages/coach-ai-recommendation/ui/AIRecommendation.jsx'), 'utf8');
const api = apiSource();

test('AI recommendation sends normalized subjective tag identifiers to the backend', () => {
  assert.match(component, /subjectiveTags:\s*selectedTagIds/);
  assert.match(api, /subjectiveTags:\s*Array\.isArray\(data\.subjectiveTags\)/);
});

test('body-composition tags that contradict calculated BMI are disabled before submission', () => {
  assert.match(component, /function isBodyTagCompatible\(tagId, bmiValue\)/);
  assert.match(component, /disabled=\{incompatibleWithBmi\}/);
  assert.match(component, /Thẻ này mâu thuẫn với chỉ số BMI đã tính/);
});

test('provider and authorization failures remain visible instead of creating a saveable fake plan', () => {
  assert.doesNotMatch(component, /generateFallbackPlan/);
  const catchBlock = component.match(/\}\s*catch \(err\) \{([\s\S]*?)\}\s*finally/);
  assert.ok(catchBlock, 'recommendation error handler was not found');
  assert.match(catchBlock[1], /setResult\(null\)/);
  assert.match(catchBlock[1], /setError\(err\)/);
  assert.doesNotMatch(catchBlock[1], /generateFallbackPlan|setResult\(fallback\)/);
});

test('coach can edit the AI plan title and every exercise before saving', () => {
  assert.match(component, /updateResultField\('title'/);
  for (const field of ['name', 'sets', 'reps', 'note']) {
    assert.match(component, new RegExp(`updateExercise\\(i, '${field}'`));
  }
});

test('clinical assessment, conflicts, mandatory adjustments and coach notes are rendered', () => {
  for (const field of ['clinicalAssessment', 'conflictWarnings', 'mandatoryAdjustments', 'coachNotes']) {
    assert.match(component, new RegExp(`result\\.${field}`));
  }
});

test('Medical NLP engine fields (extractedTags, aiReasoning, recommendedVolume) are rendered', () => {
  for (const field of ['extractedTags', 'aiReasoning', 'recommendedVolume']) {
    assert.match(component, new RegExp(`result\\.${field}`));
  }
});

test('coach can manually enter member biometrics from the AI recommendation panel', () => {
  assert.match(api, /updateMemberBiometrics:\s*\(classId, memberId, data\)/);
  assert.match(api, /members\/\$\{memberId\}\/biometrics`, \{\s*method: 'PUT'/);
  assert.match(component, /coachApi\.updateMemberBiometrics\(selectedClass\.id, member\.id/);
  assert.match(component, /bioField\('heightCm'\)/);
  assert.match(component, /bioField\('weightKg'\)/);
  assert.match(component, /bioField\('medicalNote'\)/);
});

test('coach manual entry is limited to height, weight and medical note (member owns gender/DOB/level)', () => {
  for (const field of ['gender', 'dateOfBirth', 'fitnessLevel']) {
    assert.doesNotMatch(component, new RegExp(`bioField\\('${field}'\\)`));
  }
  const body = api.match(/updateMemberBiometrics:[\s\S]*?body: \{([\s\S]*?)\}\s*\}\)/);
  assert.ok(body, 'updateMemberBiometrics body not found');
  assert.match(body[1], /heightCm/);
  assert.match(body[1], /weightKg/);
  assert.match(body[1], /medicalNote/);
  assert.doesNotMatch(body[1], /gender|dateOfBirth|fitnessLevel/);
});

test('biometrics panel shows whether weight came from the latest training_results session log', () => {
  assert.match(component, /context\.weightSource === 'training_result'/);
});

test('saving manual metrics warns when the member already has a latest training result', () => {
  assert.match(component, /updated\.latestResult/);
  assert.match(component, /Đã có kết quả luyện tập gần nhất cho học viên này/);
});

test('auto-fill applies latest training result together with age, gender and level from the API', () => {
  const autoFill = component.match(/const handleAutoFillPhysicalContext = \(\) => \{([\s\S]*?)\n  \};/);
  assert.ok(autoFill, 'auto-fill handler not found');
  assert.match(autoFill[1], /context\.latestResult/);
  assert.match(autoFill[1], /context\.age/);
  assert.match(autoFill[1], /context\.gender/);
  assert.match(autoFill[1], /context\.fitnessLevel/);
});
