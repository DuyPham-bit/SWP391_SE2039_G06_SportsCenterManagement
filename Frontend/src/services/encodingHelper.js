/**
 * Utility to repair UTF-8 text that was mistakenly decoded as Windows-1252 / ISO-8859-1 (Mojibake).
 * Common issue when UTF-8 strings are stored or retrieved through Latin-1 / Windows-1252 codepage pipelines.
 */

// Mapping of Windows-1252 special characters (0x80 - 0x9F) to their original byte values
const CP1252_MAP = {
  0x20AC: 0x80, // €
  0x201A: 0x82, // ‚
  0x0192: 0x83, // ƒ
  0x201E: 0x84, // „
  0x2026: 0x85, // …
  0x2020: 0x86, // †
  0x2021: 0x87, // ‡
  0x02C6: 0x88, // ˆ
  0x2030: 0x89, // ‰
  0x0160: 0x8A, // Š
  0x2039: 0x8B, // ‹
  0x0152: 0x8C, // Œ
  0x017D: 0x8E, // Ž
  0x2018: 0x91, // ‘
  0x2019: 0x92, // ’
  0x201C: 0x93, // “
  0x201D: 0x94, // ”
  0x2022: 0x95, // •
  0x2013: 0x96, // –
  0x2014: 0x97, // —
  0x02DC: 0x98, // ˜
  0x2122: 0x99, // ™
  0x0161: 0x9A, // š
  0x203A: 0x9B, // ›
  0x0153: 0x9C, // œ
  0x017E: 0x9E, // ž
  0x0178: 0x9F  // Ÿ
};

// UTF-8 leading bytes range for multi-byte sequences in Latin-1: 0xC2 to 0xF4
const UTF8_LEAD_BYTE_REGEX = /[\u00C2-\u00F4]/;

let utf8Decoder = null;
function getUtf8Decoder() {
  if (!utf8Decoder && typeof TextDecoder !== 'undefined') {
    utf8Decoder = new TextDecoder('utf-8', { fatal: true });
  }
  return utf8Decoder;
}

/**
 * Repairs a single string if it is corrupted by Mojibake (UTF-8 bytes misread as Windows-1252/Latin-1).
 * If the string is already valid Unicode, clean ASCII, or contains unconvertible codepoints,
 * it is returned untouched.
 */
export function fixMojibakeString(str) {
  if (typeof str !== 'string' || !str || !UTF8_LEAD_BYTE_REGEX.test(str)) {
    return str;
  }

  const len = str.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    const code = str.charCodeAt(i);
    if (code in CP1252_MAP) {
      bytes[i] = CP1252_MAP[code];
    } else if (code <= 0xFF) {
      bytes[i] = code;
    } else {
      // Contains a character outside 0x00-0xFF that isn't Windows-1252 (e.g. valid Unicode char).
      return str;
    }
  }

  try {
    const decoder = getUtf8Decoder();
    if (!decoder) return str;
    const decoded = decoder.decode(bytes);
    return decoded.includes('\u0000') ? str : decoded;
  } catch {
    // Decoding failed (bytes are not valid UTF-8 sequences); return original safely
    return str;
  }
}

/**
 * Deeply repairs any Mojibake in primitives, objects, or arrays.
 */
export function fixMojibake(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return fixMojibakeString(value);
  if (Array.isArray(value)) return value.map(fixMojibake);
  if (typeof value === 'object') {
    if (value instanceof Date || value instanceof RegExp) return value;
    const result = {};
    for (const key of Object.keys(value)) {
      result[key] = fixMojibake(value[key]);
    }
    return result;
  }
  return value;
}
