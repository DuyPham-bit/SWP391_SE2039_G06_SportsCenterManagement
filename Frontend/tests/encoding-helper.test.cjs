const assert = require('node:assert/strict');
const { test } = require('node:test');
const { fixMojibake, fixMojibakeString } = require('../src/services/encodingHelper.js');

test('fixMojibake repairs Windows-1252/Latin-1 UTF-8 mojibake strings correctly', () => {
  const corruptedDesc = 'PhÃ¡t triá»ƒn thá»ƒ lá»±c, tÃ´i luyá»‡n Ã½ chÃ­ vÃ  bá»©t phÃ¡ má»\u008Di giá»›i háº¡n cÃ¹ng há»‡ thá»‘ng 9 cá»¥m sÃ¢n, phÃ²ng táº­p phá»¥c vá»¥ 9 bá»™ mÃ´n thá»ƒ thao.';
  const expectedDesc = 'Phát triển thể lực, tôi luyện ý chí và bứt phá mọi giới hạn cùng hệ thống 9 cụm sân, phòng tập phục vụ 9 bộ môn thể thao.';
  assert.equal(fixMojibakeString(corruptedDesc), expectedDesc);

  const corruptedBadge = 'TRUNG TÃ‚M THá»‚ THAO Ä\u0090áº²NG Cáº¤P QUá»\u0090C Táº¾ SCMS';
  const expectedBadge = 'TRUNG TÂM THỂ THAO ĐẲNG CẤP QUỐC TẾ SCMS';
  assert.equal(fixMojibakeString(corruptedBadge), expectedBadge);

  const corruptedMetric = '5.0 â˜…';
  const expectedMetric = '5.0 ★';
  assert.equal(fixMojibakeString(corruptedMetric), expectedMetric);
});

test('fixMojibake preserves already clean Vietnamese strings and English', () => {
  const cleanVietnamese = [
    'Bơi lội',
    'Bóng bàn',
    'Bóng đá',
    'TẬP LUYỆN',
    'TỔ HỢP',
    'Khóa Học Thể Thao Đa Năng',
    'Cơ sở vật chất',
    'Đăng ký thành viên'
  ];
  for (const s of cleanVietnamese) {
    assert.equal(fixMojibake(s), s);
  }

  assert.equal(fixMojibake('SHAPING RESILIENCE THROUGH SPORTS'), 'SHAPING RESILIENCE THROUGH SPORTS');
  assert.equal(fixMojibake(12345), 12345);
  assert.equal(fixMojibake(null), null);
});

test('fixMojibake repairs nested objects and arrays recursively', () => {
  const input = {
    title: 'KhÃ³a Há»\u008Dc Thá»ƒ Thao',
    items: [
      { name: 'BÆ¡i lá»\u0099i' },
      { name: 'Cáº§u lÃ´ng' }
    ]
  };
  const output = fixMojibake(input);
  assert.equal(output.title, 'Khóa Học Thể Thao');
  assert.equal(output.items[0].name, 'Bơi lội');
  assert.equal(output.items[1].name, 'Cầu lông');
});
