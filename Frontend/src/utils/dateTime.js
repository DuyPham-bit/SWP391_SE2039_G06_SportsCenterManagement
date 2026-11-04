export const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const OFFSET_MS = 7 * 60 * 60 * 1000;
const hasOffset = value => /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);

// SQL Server datetime2 timestamps are UTC even when JSON has no trailing Z.
// Date-only business values are calendar dates in Vietnam.
export function parseApiDate(value) {
  if (value instanceof Date) return new Date(value.getTime());
  if (!value) return new Date(NaN);
  const text = String(value);
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(text)
    ? `${text}T12:00:00+07:00`
    : hasOffset(text) ? text : `${text}Z`);
}

export function vietnamDate(value = new Date()) {
  const date = parseApiDate(value);
  return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

export function vietnamDateTimeInput(value = new Date()) {
  const date = parseApiDate(value);
  return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 16);
}

// A datetime-local input deliberately has no offset: interpret it as Vietnam time.
export function parseVietnamDateTime(value) {
  if (!value) return new Date(NaN);
  const text = String(value);
  return new Date(hasOffset(text) ? text : `${text}+07:00`);
}

export function formatVietnamDateTime(value, isEn = false, options = {}) {
  const date = parseApiDate(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(isEn ? 'en-US' : 'vi-VN', {
    ...options, timeZone: VIETNAM_TIME_ZONE
  });
}

export function formatVietnamDate(value, isEn = false, options = {}) {
  const date = parseApiDate(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(isEn ? 'en-US' : 'vi-VN', {
    ...options, timeZone: VIETNAM_TIME_ZONE
  });
}

export function formatVietnamTime(value = new Date(), isEn = false, options = {}) {
  const date = parseApiDate(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', {
    hour: '2-digit', minute: '2-digit', ...options, timeZone: VIETNAM_TIME_ZONE
  });
}

// Calendar arithmetic uses UTC fields as a date-only representation, never device time.
export function parseCalendarDate(value = vietnamDate()) {
  return new Date(`${String(value).slice(0, 10)}T12:00:00Z`);
}

export function calendarDateKey(date) {
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function addCalendarDays(value, days) {
  const date = parseCalendarDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return calendarDateKey(date);
}
