const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const frontend = path.resolve(__dirname, '..');
const component = fs.readFileSync(path.join(frontend, 'src/features/coach/AIRecommendation.jsx'), 'utf8');
const api = fs.readFileSync(path.join(frontend, 'src/services/api.js'), 'utf8');

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
