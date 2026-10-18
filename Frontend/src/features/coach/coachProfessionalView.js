export function localDateKey(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function calendarWindow(anchorValue, mode) {
  const anchor = new Date(`${anchorValue}T00:00:00`);
  if (mode === 'day') return { from: anchorValue, to: anchorValue };
  if (mode === 'week') {
    const monday = new Date(anchor);
    const day = monday.getDay() || 7;
    monday.setDate(monday.getDate() - day + 1);
    const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
    return { from: localDateKey(monday), to: localDateKey(sunday) };
  }
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  return { from: localDateKey(first), to: localDateKey(last) };
}

export function mergeCoachCalendar(events = [], classSessions = []) {
  const personal = events.map(item => ({ ...item, date: localDateKey(item.startAt), startLabel: new Date(item.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }));
  const classes = classSessions.map(item => ({ ...item, date: item.sessionDate, startLabel: String(item.startTime || '').slice(0, 5), eventType: item.eventType || 'ClassSession' }));
  return [...personal, ...classes].sort((a, b) => `${a.date}${a.startLabel}`.localeCompare(`${b.date}${b.startLabel}`));
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
