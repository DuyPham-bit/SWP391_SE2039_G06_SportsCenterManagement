import { vietnamDate, parseCalendarDate, calendarDateKey, addCalendarDays, formatVietnamTime } from '../../utils/dateTime.js';

export const localDateKey = value => value ? vietnamDate(value) : '';

export function calendarWindow(anchorValue, mode) {
  const anchor = parseCalendarDate(anchorValue);
  if (mode === 'day') return { from: anchorValue, to: anchorValue };
  if (mode === 'week') {
    const monday = new Date(anchor);
    const day = monday.getUTCDay() || 7;
    monday.setUTCDate(monday.getUTCDate() - day + 1);
    const sunday = new Date(monday); sunday.setUTCDate(sunday.getUTCDate() + 6);
    return { from: calendarDateKey(monday), to: calendarDateKey(sunday) };
  }
  const first = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  const last = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0));
  return { from: calendarDateKey(first), to: calendarDateKey(last) };
}

export function mergeCoachCalendar(events = [], classSessions = []) {
  const personal = events.map(item => ({ ...item, date: localDateKey(item.startAt), startLabel: formatVietnamTime(item.startAt) }));
  const classes = classSessions.map(item => ({ ...item, date: item.sessionDate, startLabel: String(item.startTime || '').slice(0, 5), eventType: item.eventType || 'ClassSession' }));
  return [...personal, ...classes].sort((a, b) => `${a.date}${a.startLabel}`.localeCompare(`${b.date}${b.startLabel}`));
}

export function classSessionWindow(item) {
  const startAt = `${item.sessionDate}T${String(item.startTime).slice(0, 5)}`;
  let endDate = item.sessionDate;
  if (String(item.endTime).slice(0, 5) <= String(item.startTime).slice(0, 5)) {
    endDate = addCalendarDays(item.sessionDate, 1);
  }
  return { startAt, endAt: `${endDate}T${String(item.endTime).slice(0, 5)}` };
}

export function formatVietnamDateTime(value, isEn = false) {
  if (!value) return '—';
  const text = String(value);
  const utcValue = /(?:Z|[+-]\d{2}:\d{2})$/i.test(text) ? text : `${text}Z`;
  const date = new Date(utcValue);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(isEn ? 'en-US' : 'vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function tdeeEstimate({ gender, weightKg, heightCm, age, activity = 1.55 }) {
  const weight = Number(weightKg); const height = Number(heightCm); const years = Number(age);
  if (![weight, height, years, activity].every(Number.isFinite) || weight <= 0 || height <= 0 || years <= 0) return null;
  const base = 10 * weight + 6.25 * height - 5 * years + (String(gender).toLowerCase() === 'female' ? -161 : 5);
  return Math.round(base * Number(activity));
}

export function currency(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));
}
