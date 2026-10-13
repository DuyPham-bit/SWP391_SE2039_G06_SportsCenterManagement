import React, { useState, useEffect } from 'react';
import { coachApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { CoachError, CoachPeriod, coachInput, useTeachingSessions } from './CoachShared.js';
import { canRecordSession, metricChanges } from './coachOverview.js';

const metrics = { weight: ['Cân nặng', 'kg', 1, 500], bodyFat: ['Tỷ lệ mỡ', '%', 0, 100], muscleMass: ['Khối cơ', 'kg', 0, 500] };

export function WorkoutProgress() {
  const { showSuccess, showError } = useToast();
  const [classes, setClasses] = useState([]);
  const [records, setRecords] = useState([]);
  const [classId, setClassId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ weight: '', bodyFat: '', muscleMass: '', workoutResult: '', coachFeedback: '' });
  const schedule = useTeachingSessions(0);
  const load = async () => {
    setLoading(true); setError('');
    try {
      const [catalog, progress] = await Promise.all([coachApi.getCoachClassesAndMembers(), coachApi.getProgress()]);
      setClasses(catalog); setRecords(progress);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const selectedClass = classes.find(c => c.id === Number(classId)) || classes[0];
  const member = selectedClass?.members?.find(m => m.id === Number(memberId)) || selectedClass?.members?.[0];
  const history = records.filter(r => r.memberId === member?.id && r.classId === selectedClass?.id);
  const sessions = schedule.sessions.filter(s => s.classId === selectedClass?.id && canRecordSession(s));
  const session = sessions.find(s => s.id === Number(sessionId)) || sessions[sessions.length - 1];
  const change = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const open = () => {
    setForm({ weight: '', bodyFat: '', muscleMass: '', workoutResult: '', coachFeedback: '' });
    setModal(true);
  };
  const save = async e => {
    e.preventDefault();
    if (!member || !session || saving) return;
    setSaving(true);
    try {
      await coachApi.recordWorkoutProgress({
        classId: selectedClass.id, memberId: member.id, sessionId: session.id,
        ...form,
        weight: form.weight === '' ? null : Number(form.weight),
        bodyFat: form.bodyFat === '' ? null : Number(form.bodyFat),
        muscleMass: form.muscleMass === '' ? null : Number(form.muscleMass)
      });
      showSuccess('Đã lưu kết quả và nhận xét cho buổi tập.');
      setModal(false); await load();
    } catch (err) { showError(err.message); }
    finally { setSaving(false); }
  };
  return <div className="space-y-5">
    <h1 className="text-2xl font-black">Kết Quả & Tiến Độ Tập Luyện</h1>
    <p className="text-sm text-slate-500">Ghi kết quả theo buổi đã kết thúc; theo dõi chỉ số và nhận xét trong từng lớp.</p>
    <CoachError message={error} retry={load} />
    {loading ? <p>Đang tải lớp và kết quả...</p> : !error && <>
      <div className="grid sm:grid-cols-2 gap-4 p-4 bg-white border rounded-xl">
        <label className="text-xs font-bold">Lớp phụ trách<select aria-label="Lớp theo dõi tiến độ" className={coachInput} value={selectedClass?.id || ''} onChange={e => { setClassId(e.target.value); setMemberId(''); setSessionId(''); }}>
          {!classes.length && <option value="">Chưa được phân công lớp</option>}{classes.map(c => <option key={c.id} value={c.id}>[{c.sportName}] {c.name}</option>)}
        </select></label>
        <label className="text-xs font-bold">Học viên<select aria-label="Học viên theo dõi tiến độ" className={coachInput} value={member?.id || ''} onChange={e => setMemberId(e.target.value)}>
          {!selectedClass?.members?.length && <option value="">Chưa có học viên</option>}{selectedClass?.members?.map(m => <option key={m.id} value={m.id}>{m.fullName} · {m.memberCode}</option>)}
        </select></label>
      </div>
      {member && <section className="bg-white p-4 border rounded-xl text-sm space-y-2">
        <h2 className="font-bold">{member.fullName}</h2>
        <p>Mục tiêu: {member.fitnessGoal || 'Chưa cập nhật'} · Trình độ: {member.fitnessLevel || 'Chưa cập nhật'}</p>
        <div className="grid sm:grid-cols-3 gap-3">{metricChanges(history).map(item => <div key={item.key} className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500">{metrics[item.key][0]}</p>
          <p className="font-bold">{item.current === null ? 'Chưa đo' : item.current + ' ' + metrics[item.key][1]}</p>
          <p className="text-xs text-slate-600">{item.change === null ? 'Chưa đủ dữ liệu đánh giá' : (item.change > 0 ? '+' : '') + item.change + ' ' + metrics[item.key][1] + ' so với ' + item.previousDate}</p>
        </div>)}</div>
      </section>}
      <section className="space-y-3">
        <h2 className="font-bold">Chọn khoảng ngày của buổi tập cần ghi kết quả</h2>
        <CoachPeriod schedule={schedule} /><CoachError message={schedule.error} retry={schedule.reload} />
        <button onClick={open} disabled={!member || !sessions.length || schedule.loading || Boolean(schedule.error)} className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50">Ghi kết quả sau buổi tập</button>
        {!schedule.loading && !schedule.error && !sessions.length && <p className="text-sm text-slate-500">Chưa có buổi tập đã kết thúc trong khoảng ngày này.</p>}
      </section>
      <section className="space-y-3">
        <h2 className="font-bold">Lịch sử học viên trong lớp ({history.length} lần ghi nhận)</h2>
        {!history.length && <p className="text-sm text-slate-500">Chưa có kết quả tập luyện.</p>}
        {history.map(r => <article key={r.id} className="bg-white p-5 rounded-xl border space-y-3">
          <h3 className="font-bold">{r.date}{r.sessionId ? ' · Buổi #' + r.sessionId + ' · ' + String(r.sessionStartTime).slice(0, 5) + ' – ' + String(r.sessionEndTime).slice(0, 5) : ' · Ghi nhận tổng quát'}</h3>
          <p className="text-xs text-slate-500">HLV: {r.coachName} · {r.className}</p>
          <div className="flex flex-wrap gap-4 text-sm">{Object.entries(metrics).map(([key, [label, unit]]) => <span key={key}>{label}: <strong>{r[key] === null || r[key] === undefined ? 'Chưa đo' : r[key] + ' ' + unit}</strong></span>)}</div>
          <p className="text-sm whitespace-pre-wrap">{r.workoutResult}</p>
          {r.coachFeedback && <div className="bg-blue-50 text-blue-900 p-3 rounded-lg text-sm"><strong>Nhận xét & đánh giá: </strong><p className="whitespace-pre-wrap">{r.coachFeedback}</p></div>}
        </article>)}
      </section>
    </>}
    <Modal isOpen={modal} onClose={() => !saving && setModal(false)} title={'Ghi kết quả: ' + (member?.fullName || '')}>
      <form onSubmit={save} className="space-y-4">
        <label className="block text-xs font-bold">Buổi tập đã kết thúc<select aria-label="Buổi tập ghi kết quả" required className={coachInput} value={session?.id || ''} disabled={saving} onChange={e => setSessionId(e.target.value)}>
          {sessions.map(s => <option key={s.id} value={s.id}>{s.sessionDate} · {s.timeSlot} · {s.roomName}</option>)}
        </select></label>
        <p className="text-xs text-slate-500">Học viên cần có đặt chỗ hợp lệ trong buổi đã chọn. Các chỉ số cơ thể có thể để trống.</p>
        <div className="grid sm:grid-cols-3 gap-3">{Object.entries(metrics).map(([key, [label, unit, min, max]]) => <label key={key} className="text-xs font-bold">{label} ({unit})
          <input aria-label={label} type="number" step="0.01" min={min} max={max} className={coachInput} value={form[key]} onChange={e => change(key, e.target.value)} />
        </label>)}</div>
        <label className="block text-xs font-bold">Kết quả bài tập *<textarea aria-label="Kết quả bài tập" className={coachInput} required maxLength={1000} rows={3} value={form.workoutResult} onChange={e => change('workoutResult', e.target.value)} /></label>
        <label className="block text-xs font-bold">Nhận xét & đánh giá tiến độ<textarea aria-label="Nhận xét tiến độ" className={coachInput} maxLength={1000} rows={3} value={form.coachFeedback} onChange={e => change('coachFeedback', e.target.value)} /></label>
        <button disabled={saving || !session} className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu Kết Quả'}</button>
      </form>
    </Modal>
  </div>;
}
