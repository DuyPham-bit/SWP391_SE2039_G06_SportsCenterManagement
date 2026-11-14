const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const frontend = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(frontend, file), 'utf8');
const loadSpeech = () => import(pathToFileURL(path.join(frontend, 'src/shared/lib/speechLanguage.js')).href);

test('speech voice follows the language of the AI reply, not only the UI language', async () => {
  const { detectSpeechLang } = await loadSpeech();
  assert.equal(detectSpeechLang('Hôm nay có 3 lớp bơi.', 'en-US'), 'vi-VN');
  assert.equal(detectSpeechLang('There are 3 swimming classes today.', 'vi-VN'), 'en-US');
  assert.equal(detectSpeechLang('今日は水泳のクラスが3つあります。'), 'ja-JP');
  assert.equal(detectSpeechLang('오늘 수영 수업이 3개 있습니다.'), 'ko-KR');
  assert.equal(detectSpeechLang('今天有三节游泳课。'), 'zh-CN');
  assert.equal(detectSpeechLang('Hola, el horario de clases es...'), 'es-ES');
  assert.equal(detectSpeechLang('Bonjour, le cours commence à 18:00.'), 'fr-FR');
  assert.equal(detectSpeechLang('   ', 'en-US'), 'en-US');
  assert.equal(detectSpeechLang('12:00 - 13:00', 'vi-VN'), 'vi-VN');
});

test('chat requests send the UI language as a hint to the backend', () => {
  assert.match(read('src/entities/ai-chat/api/aiApi.js'), /body:\s*\{\s*message,\s*conversationId,\s*language\s*\}/);
  for (const file of [
    'src/features/member-ai-chat/ui/MemberAIChatPopup.jsx',
    'src/pages/member-ai-assistant/ui/MemberAIAssistant.jsx',
  ]) {
    const source = read(file);
    assert.match(source, /aiApi\.chat\(text,\s*conversationId,\s*language\)/, file);
    assert.match(source, /detectSpeechLang\(cleanText/, file);
    assert.match(source, /any language/, file);
  }
});
