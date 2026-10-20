const localDate = value => new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
const utcValue = value => /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;

export function getDashboardSessions(workspace, period, now = new Date()) {
  if (!workspace) return [];
  const today = localDate(now);
  const anchor = new Date(`${today}T12:00:00Z`);
  if (period === 'week') anchor.setUTCDate(anchor.getUTCDate() - ((anchor.getUTCDay() + 6) % 7));
  if (period === 'month') anchor.setUTCDate(1);
  const limit = new Date(anchor);
  if (period === 'month') limit.setUTCMonth(limit.getUTCMonth() + 1);
  else limit.setUTCDate(limit.getUTCDate() + (period === 'week' ? 7 : 1));
  const start = Date.parse(`${anchor.toISOString().slice(0, 10)}T00:00:00+07:00`);
  const end = Date.parse(`${limit.toISOString().slice(0, 10)}T00:00:00+07:00`);
  const sessions = (workspace.classSessions || []).map(item => ({
    id: `class-${item.id}`, sessionId: item.id, isBackend: true, sessionDate: item.sessionDate,
    startAt: Date.parse(`${item.sessionDate}T${item.startTime}+07:00`),
    timeSlot: `${item.startTime.slice(0, 5)} - ${item.endTime.slice(0, 5)}`,
    room: item.roomName || '', studentName: item.title, packageInfo: item.sessionDate,
    exerciseTitle: item.title, exerciseDetails: item.notes || '', status: item.status
  }));
  sessions.push(...(workspace.events || []).map(item => ({
    id: `event-${item.id}`, isBackend: false, sessionDate: localDate(utcValue(item.startAt)),
    startAt: Date.parse(utcValue(item.startAt)),
    timeSlot: [item.startAt, item.endAt].map(value => new Date(utcValue(value)).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })).join(' - '),
    room: item.roomName || '', studentName: item.memberName || '', packageInfo: localDate(utcValue(item.startAt)),
    exerciseTitle: item.title, exerciseDetails: item.notes || '', status: item.status
  })));
  return sessions.filter(item => item.startAt >= start && item.startAt < end)
    .sort((a, b) => a.startAt - b.startAt);
}

export function appointmentRequest(form) {
  const memberId = Number(form.memberId);
  if (!Number.isSafeInteger(memberId) || memberId <= 0) throw new Error('Vui lòng chọn học viên từ danh sách.');
  const start = new Date(`${form.sessionDate}T${form.startTime}:00+07:00`);
  if (!Number.isFinite(start.getTime()) || !form.title.trim()) throw new Error('Kiểm tra tiêu đề và thời gian lịch hẹn.');
  return {
    memberId, roomId: null, title: form.title.trim(),
    eventType: form.appointmentType === '1to1' ? 'PersonalTraining' : 'Other',
    startAt: start.toISOString(), endAt: new Date(start.getTime() + 3600000).toISOString(), notes: null
  };
}
