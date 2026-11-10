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

export function coachMemberOptions(classes) {
  const members = new Map();
  for (const cls of classes || []) {
    const classId = Number(cls.id ?? cls.classId);
    for (const member of cls.members || []) {
      const memberId = Number(member.id ?? member.memberId);
      if (!Number.isSafeInteger(classId) || classId <= 0 || !Number.isSafeInteger(memberId) || memberId <= 0) continue;
      if (!members.has(memberId)) {
        members.set(memberId, {
          ...member,
          id: memberId,
          classId,
          className: cls.name || cls.className || '',
          name: member.fullName || member.memberName || member.name || `#${memberId}`,
          target: member.fitnessGoal || member.target || ''
        });
      }
    }
  }
  return [...members.values()];
}

export function filterDashboardSessions(sessions, period = 'day', now = new Date()) {
  const today = coachDate(0, now);
  const start = new Date(`${today}T12:00:00Z`);
  if (period === 'week') start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  if (period === 'month') start.setUTCDate(1);
  const end = new Date(start);
  if (period === 'month') end.setUTCMonth(end.getUTCMonth() + 1);
  else end.setUTCDate(end.getUTCDate() + (period === 'week' ? 7 : 1));
  const from = start.toISOString().slice(0, 10);
  const to = end.toISOString().slice(0, 10);
  return (sessions || []).filter(session => session.sessionDate >= from && session.sessionDate < to);
}

export function mapDashboardSessions(sessions, classes, now = new Date()) {
  const classById = new Map((classes || []).map(cls => [Number(cls.id ?? cls.classId), cls]));
  return (sessions || []).map(session => {
    const id = Number(session.id ?? session.sessionId);
    const classId = Number(session.classId);
    const cls = classById.get(classId);
    const members = (cls?.members || []).map(member => ({
      id: Number(member.id ?? member.memberId),
      name: member.fullName || member.memberName || member.name || '',
      status: String(member.attendanceStatus || '').toUpperCase(),
      phone: member.phone || '',
      note: member.note || ''
    }));
    const sourceStatus = String(session.status || session.sessionStatus || '').toUpperCase();
    const start = sessionTime(session);
    const end = sessionTime(session, true);
    const status = sourceStatus === 'CANCELLED'
      ? 'CANCELLED'
      : sourceStatus === 'COMPLETED' || (Number.isFinite(end) && end <= now.getTime())
        ? 'COMPLETED'
        : Number.isFinite(start) && start <= now.getTime()
          ? 'IN_PROGRESS'
          : 'UPCOMING';
    return {
      id,
      classId,
      sessionDate: session.sessionDate,
      startTime: session.startTime,
      endTime: session.endTime,
      timeSlot: session.timeSlot || `${String(session.startTime || '').slice(0, 5)} - ${String(session.endTime || '').slice(0, 5)}`,
      type: session.type || session.sportName || '',
      title: session.name || session.className || '',
      room: session.roomName || '',
      studentOrClass: session.name || session.className || '',
      members,
      attendanceDone: null,
      attendanceTotal: Number(session.enrolledCount ?? session.bookedCount ?? members.length),
      status,
      canTakeAttendance: canAttendSession({ ...session, status: sourceStatus }, now),
      isBackend: true
    };
  });
}

export function mapDashboardRoster(rows) {
  return (rows || []).map(row => ({
    id: Number(row.memberId ?? row.id),
    name: row.memberName || row.fullName || row.name || '',
    phone: row.phone || '',
    status: String(row.attendanceStatus || row.status || '').toUpperCase(),
    note: row.note || ''
  }));
}

export function dashboardAttendanceRecords(members) {
  if (!members?.length) throw new Error('Buổi học chưa có học viên đăng ký.');
  return members.map(member => {
    const memberId = Number(member.id ?? member.memberId);
    let status = String(member.status || '').toUpperCase();
    if (status === 'PRESENT' && /đến muộn|\blate\b/i.test(member.note || '')) status = 'LATE';
    if (!Number.isSafeInteger(memberId) || memberId <= 0 || !['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(status)) {
      throw new Error('Vui lòng chọn trạng thái điểm danh cho tất cả học viên.');
    }
    return { memberId, status, note: member.note?.trim() || null };
  });
}

export function dashboardProgressRequest(form, member) {
  if (!member) throw new Error('Vui lòng chọn học viên từ danh sách.');
  const volume = String(form.repsSets || '').trim();
  if (!volume) throw new Error('Vui lòng nhập kết quả tập luyện.');
  const maxLift = Number(form.heavyLift);
  const workoutResult = maxLift > 0 ? `${volume} • Max lift ${maxLift} kg` : volume;
  return {
    classId: Number(member.classId),
    memberId: Number(member.id),
    weight: form.weight === '' ? null : Number(form.weight),
    bodyFat: null,
    muscleMass: null,
    workoutResult,
    coachFeedback: form.feedbackNote?.trim() || null,
    sessionId: null,
    notifyMember: form.sendToMember !== false
  };
}

export function metricChanges(records) {
  const sorted = [...records].sort((a, b) => String(b.date).localeCompare(String(a.date)) || Number(b.id) - Number(a.id));
  return ['weight', 'bodyFat', 'muscleMass'].map(key => {
    const values = sorted.filter(r => r[key] !== null && r[key] !== undefined && r[key] !== '' && Number.isFinite(Number(r[key])));
    return { key, current: values[0]?.[key] ?? null, previousDate: values[1]?.date,
      change: values.length > 1 ? Math.round((Number(values[0][key]) - Number(values[1][key])) * 100) / 100 : null };
  });
}
