const LOCALES = { vi: 'vi-VN', en: 'en-US' };

/** Formats a VND amount for the UI language: "250.000 ₫" (vi) / "₫250,000" (en). */
export function formatVnd(amount, language = 'vi') {
  return new Intl.NumberFormat(LOCALES[language] || LOCALES.vi, {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}
