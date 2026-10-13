import React, { useState, useEffect } from 'react';
import { coachApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { CoachError, CoachPeriod, coachInput, useTeachingSessions } from './CoachShared.js';
import { canAttendSession } from './coachOverview.js';

const statuses = { PRESENT: 'Có mặt', ABSENT: 'Vắng mặt', LATE: 'Đến muộn', EXCUSED: 'Vắng có phép' };

export function Attendance() {
  const schedule = useTeachingSessions(30, new URLSearchParams(window.location.hash.split('?')[1]).get('date'));
  const { showSuccess, showError } = useToast();
  const [selectedId, setSelectedId] = useState(Number(new URLSearchParams(window.location.hash.split('?')[1]).get('sessionId')) || '');
  const [members, setMembers] = useState([]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const session = schedule.sessions.find(s => s.id === Number(selectedId)) || schedule.sessions[0];
  useEffect(() => {
    let active = true;
    setMembers([]); setRecords({}); setError('');
    if (!session) { setLoading(false); return; }
    setLoading(true);
    coachApi.getClassMembers(session.id).then(data => {
      if (!active) return;
      setMembers(data);
      setRecords(Object.fromEntries(data.map(m => [m.memberId, { memberId: m.memberId, status: m.attendanceStatus || '', note: m.note || '' }])));
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.id, version]);
  const change = (id, field, value) => setRecords(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  const save = async () => {
    if (!canAttendSession(session) || saving) return;
    const payload = Object.values(records);
    if (payload.some(r => !r.status)) { showError('Chọn trạng thái cho từng học viên trước khi lưu.'); return; }
    setSaving(true);
    try {
      await coachApi.takeAttendance(session.id, null, null, null, payload);
      showSuccess('Đã lưu kết quả điểm danh.'); setVersion(v => v + 1);
    } catch (e) { showError(e.message); }
    finally { setSaving(false); }
  };
  return <div className="space-y-5">
    <h1 className="text-2xl font-black">Điểm Danh Lớp Học Thể Thao</h1>
    <CoachPeriod schedule={schedule} /><CoachError message={schedule.error} retry={schedule.reload} />
    <label className="block text-sm font-semibold">Chọn ca dạy
      <select aria-label="Chọn ca dạy" disabled={saving || schedule.loading} className={coachInput} value={session?.id || ''} onChange={e => setSelectedId(Number(e.target.value))}>
        {!schedule.sessions.length && <option value="">Chưa có ca dạy trong khoảng ngày</option>}
        {schedule.sessions.map(s => <option key={s.id} value={s.id}>{s.name} · {s.sessionDate} · {s.timeSlot} · {s.roomName}{s.status === 'CANCELLED' ? ' (Đã hủy)' : ''}</option>)}
      </select>
    </label>
    {session && !canAttendSession(session) && <p className="p-3 bg-amber-50 text-amber-900 rounded-xl text-sm">Chỉ điểm danh khi buổi học đã bắt đầu và không bị hủy.</p>}
    <CoachError message={error} retry={() => setVersion(v => v + 1)} />
    {loading || schedule.loading ? <p>Đang tải danh sách điểm danh...</p> : !error && !schedule.error && session && !members.length ? <p>Chưa có học viên đặt chỗ cho buổi học này.</p> : null}
    {!loading && !schedule.loading && !error && !schedule.error && <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs">{Object.entries(statuses).map(([key, name]) => <span key={key}>{name}: <strong>{Object.values(records).filter(r => r.status === key).length}</strong></span>)}</div>
      {members.map(m => <article key={m.memberId} className="bg-white border rounded-xl p-4 grid md:grid-cols-3 gap-3 items-center">
        <div><h2 className="font-bold">{m.memberName}</h2><p className="text-xs text-slate-500">{m.memberCode} · {m.phone || 'Chưa có số điện thoại'}</p></div>
        <select aria-label={'Điểm danh ' + m.memberName} className={coachInput} disabled={saving || !canAttendSession(session)} value={records[m.memberId]?.status || ''} onChange={e => change(m.memberId, 'status', e.target.value)}>
          <option value="">Chưa điểm danh</option>{Object.entries(statuses).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
        </select>
        <input aria-label={'Ghi chú ' + m.memberName} className={coachInput} maxLength={500} placeholder="Ghi chú điểm danh" disabled={saving || !canAttendSession(session)} value={records[m.memberId]?.note || ''} onChange={e => change(m.memberId, 'note', e.target.value)} />
      </article>)}
      {members.length > 0 && <button onClick={save} disabled={saving || !canAttendSession(session)} className="px-5 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu Kết Quả Điểm Danh'}</button>}
    </div>}
  </div>;
}
