export function coachDate(offset = 0, now = new Date()) {
  return new Date(now.getTime() + 7 * 3600000 + offset * 86400000).toISOString().slice(0, 10);
}

export function sessionTime(session, end = false) {
  const time = end ? session.endTime : session.startTime;
  return Date.parse(`${session.sessionDate}T${time}+07:00`);
}

export function canRecordSession(session, now = new Date()) {
  return Boolean(session) && session.status !== 'CANCELLED' && sessionTime(session, true) <= now.getTime();
}

export function attendanceRestriction(session, now = new Date()) {
  if (!session) return 'NO_SESSION';
  if (session.status === 'CANCELLED') return 'CANCELLED';
  if (session.sessionDate < coachDate(0, now)) return 'PAST_DATE';
  if (sessionTime(session) > now.getTime()) return 'NOT_STARTED';
  return null;
}

export function canAttendSession(session, now = new Date()) {
  return attendanceRestriction(session, now) === null;
}

export function metricChanges(records) {
  const sorted = [...records].sort((a, b) => String(b.date).localeCompare(String(a.date)) || Number(b.id) - Number(a.id));
  return ['weight', 'bodyFat', 'muscleMass'].map(key => {
    const values = sorted.filter(r => r[key] !== null && r[key] !== undefined && r[key] !== '' && Number.isFinite(Number(r[key])));
    return { key, current: values[0]?.[key] ?? null, previousDate: values[1]?.date,
      change: values.length > 1 ? Math.round((Number(values[0][key]) - Number(values[1][key])) * 100) / 100 : null };
  });
}
