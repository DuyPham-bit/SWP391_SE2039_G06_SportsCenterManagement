// Picks a SpeechSynthesis voice locale from the text itself, because the AI assistant
// replies in whatever language the member wrote in, not only in the UI language.
const SCRIPT_LOCALES = [
  [/[぀-ヿ]/, 'ja-JP'], // Hiragana / Katakana (checked before Han: Japanese also uses kanji)
  [/[가-힯]/, 'ko-KR'], // Hangul
  [/[一-鿿]/, 'zh-CN'], // Han
  [/[฀-๿]/, 'th-TH'], // Thai
  [/[Ѐ-ӿ]/, 'ru-RU'], // Cyrillic
  [/[؀-ۿ]/, 'ar-SA'], // Arabic
];

// Letters that only occur in Vietnamese among Latin-script languages.
const VIETNAMESE_MARKS = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
const FRENCH_HINT = /[àâçéèêëîïôûùüÿœ]|\b(le|la|les|des|est|bonjour|merci|cours)\b/i;
const SPANISH_HINT = /[ñ¿¡]|\b(hola|gracias|clases|horario|precio)\b/i;

export function detectSpeechLang(text, fallback = 'vi-VN') {
  const sample = String(text || '').slice(0, 400);
  if (!sample.trim()) return fallback;
  for (const [pattern, locale] of SCRIPT_LOCALES) {
    if (pattern.test(sample)) return locale;
  }
  if (VIETNAMESE_MARKS.test(sample)) return 'vi-VN';
  if (SPANISH_HINT.test(sample)) return 'es-ES';
  if (FRENCH_HINT.test(sample)) return 'fr-FR';
  if (/[a-z]/i.test(sample)) return 'en-US';
  return fallback;
}
