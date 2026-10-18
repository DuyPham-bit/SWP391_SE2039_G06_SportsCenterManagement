import React, { useState, useEffect } from 'react';
import { coachApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { CoachError, CoachPeriod, coachInput, useTeachingSessions } from './CoachShared.jsx';
import { canRecordSession, metricChanges } from './coachOverview.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function WorkoutProgress() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const metrics = {
    weight: [isEn ? 'Weight' : 'Cân nặng', 'kg', 1, 500],
    bodyFat: [isEn ? 'Body Fat' : 'Tỷ lệ mỡ', '%', 0, 100],
    muscleMass: [isEn ? 'Muscle Mass' : 'Khối cơ', 'kg', 0, 500]
  };

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

    if (form.weight !== '' && (Number(form.weight) < 25 || Number(form.weight) > 300)) {
      showError({
        message: isEn ? 'Invalid weight metric (only 25kg to 300kg accepted).' : 'Chỉ số cân nặng không hợp lý (chỉ chấp nhận từ 25kg đến 300kg).',
        code: 'VAL-WEIGHT-RANGE',
        proposedHandling: isEn ? 'Verify measurements on the center digital scale before recording.' : 'Kiểm tra lại số đo trên cân điện tử của trung tâm trước khi ghi nhận.'
      });
      return;
    }

    if (form.bodyFat !== '' && (Number(form.bodyFat) < 2 || Number(form.bodyFat) > 65)) {
      showError({
        message: isEn ? 'Invalid body fat metric (only 2% to 65% accepted).' : 'Tỷ lệ mỡ (Body Fat) không hợp lý (chỉ chấp nhận từ 2% đến 65%).',
        code: 'VAL-FAT-RANGE',
        proposedHandling: isEn ? 'Cross-check readings with the InBody / biometric scanner.' : 'Đối chiếu lại kết quả từ máy đo InBody/chỉ số sinh trắc học.'
      });
      return;
    }

    if (form.muscleMass !== '' && (Number(form.muscleMass) < 10 || Number(form.muscleMass) > 120)) {
      showError({
        message: isEn ? 'Invalid muscle mass metric (only 10kg to 120kg accepted).' : 'Khối lượng cơ bắp (Muscle Mass) không hợp lý (chỉ chấp nhận từ 10kg đến 120kg).',
        code: 'VAL-MUSCLE-RANGE',
        proposedHandling: isEn ? 'Cross-check readings with the InBody scanner before saving.' : 'Đối chiếu lại kết quả từ máy đo InBody trước khi ghi nhận.'
      });
      return;
    }

    setSaving(true);
    try {
      await coachApi.recordWorkoutProgress({
        classId: selectedClass.id, memberId: member.id, sessionId: session.id,
        ...form,
        weight: form.weight === '' ? null : Number(form.weight),
        bodyFat: form.bodyFat === '' ? null : Number(form.bodyFat),
        muscleMass: form.muscleMass === '' ? null : Number(form.muscleMass)
      });
      showSuccess(isEn ? 'Workout results and feedback saved successfully.' : 'Đã lưu kết quả và nhận xét cho buổi tập.');
      setModal(false); await load();
    } catch (err) { showError(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#81B29A]/15 text-[#2D6A4F] border border-[#81B29A]/30 text-xs font-bold uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-[#81B29A]" />
          <span>{isEn ? 'Progress & Evaluations' : 'Tiến độ & Đánh giá'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E2235] tracking-tight">
          {isEn ? 'Workout Results & Student Progress' : 'Kết Quả & Tiến Độ Tập Luyện'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          {isEn
            ? 'Log results after completed sessions; track athletic improvements and provide direct technical feedback to students.'
            : 'Ghi nhận kết quả sau buổi tập đã kết thúc; theo dõi sự cải thiện thể lực và gửi phản hồi kỹ thuật trực tiếp cho học viên.'}
        </p>
      </div>

      <CoachError message={error} retry={load} />

      {loading ? (
        <p className="text-sm text-slate-500">{isEn ? 'Loading classes and progress records...' : 'Đang tải lớp và kết quả...'}</p>
      ) : !error && (
        <>
          <div className="grid sm:grid-cols-2 gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <label className="text-xs font-bold text-slate-700">
              {isEn ? 'Assigned Class' : 'Lớp phụ trách'}
              <select
                aria-label={isEn ? "Progress class selector" : "Lớp theo dõi tiến độ"}
                className={`${coachInput} mt-1`}
                value={selectedClass?.id || ''}
                onChange={e => { setClassId(e.target.value); setMemberId(''); setSessionId(''); }}
              >
                {!classes.length && (
                  <option value="">{isEn ? 'No assigned classes' : 'Chưa được phân công lớp'}</option>
                )}
                {classes.map(c => <option key={c.id} value={c.id}>[{c.sportName}] {c.name}</option>)}
              </select>
            </label>

            <label className="text-xs font-bold text-slate-700">
              {isEn ? 'Student' : 'Học viên'}
              <select
                aria-label={isEn ? "Progress student selector" : "Học viên theo dõi tiến độ"}
                className={`${coachInput} mt-1`}
                value={member?.id || ''}
                onChange={e => setMemberId(e.target.value)}
              >
                {!selectedClass?.members?.length && (
                  <option value="">{isEn ? 'No students' : 'Chưa có học viên'}</option>
                )}
                {selectedClass?.members?.map(m => (
                  <option key={m.id} value={m.id}>{m.fullName} · {m.memberCode}</option>
                ))}
              </select>
            </label>
          </div>

          {member && (
            <section className="bg-white p-5 border border-slate-200 rounded-2xl text-sm space-y-3 shadow-xs">
              <h2 className="font-bold text-base text-slate-900">{member.fullName}</h2>
              <p className="text-xs text-slate-600">
                {isEn ? 'Goal: ' : 'Mục tiêu: '}<strong>{member.fitnessGoal || (isEn ? 'Not updated' : 'Chưa cập nhật')}</strong> · {isEn ? 'Level: ' : 'Trình độ: '}<strong>{member.fitnessLevel || (isEn ? 'Not updated' : 'Chưa cập nhật')}</strong>
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {metricChanges(history).map(item => (
                  <div key={item.key} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                    <p className="text-xs text-slate-500 font-semibold">{metrics[item.key][0]}</p>
                    <p className="font-bold text-slate-900 text-base mt-0.5">
                      {item.current === null ? (isEn ? 'Not measured' : 'Chưa đo') : item.current + ' ' + metrics[item.key][1]}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {item.change === null
                        ? (isEn ? 'Insufficient data for comparison' : 'Chưa đủ dữ liệu đánh giá')
                        : (item.change > 0 ? '+' : '') + item.change + ' ' + metrics[item.key][1] + (isEn ? ' vs ' : ' so với ') + item.previousDate}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="font-bold text-slate-900 text-sm">
              {isEn ? 'Select date range of completed sessions to log' : 'Chọn khoảng ngày của buổi tập cần ghi kết quả'}
            </h2>
            <CoachPeriod schedule={schedule} />
            <CoachError message={schedule.error} retry={schedule.reload} />

            <button
              onClick={open}
              disabled={!member || !sessions.length || schedule.loading || Boolean(schedule.error)}
              className="px-5 py-2.5 rounded-xl bg-[#1E2235] hover:bg-[#2B2D42] text-[#F2CC8F] hover:text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              <span>{isEn ? 'Log Session Result' : 'Ghi kết quả sau buổi tập'}</span>
            </button>
            {!schedule.loading && !schedule.error && !sessions.length && (
              <p className="text-sm text-slate-500">
                {isEn ? 'No completed sessions found in this date range.' : 'Chưa có buổi tập đã kết thúc trong khoảng ngày này.'}
              </p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-bold text-slate-900 text-sm">
              {isEn
                ? `Student Workout History in Class (${history.length} records)`
                : `Lịch sử học viên trong lớp (${history.length} lần ghi nhận)`}
            </h2>
            {!history.length && (
              <p className="text-sm text-slate-500">
                {isEn ? 'No workout results recorded yet.' : 'Chưa có kết quả tập luyện.'}
              </p>
            )}
            {history.map(r => (
              <article key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200/90 space-y-3 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm">
                  {r.date}
                  {r.sessionId
                    ? (isEn ? ' · Session #' : ' · Buổi #') + r.sessionId + ' · ' + String(r.sessionStartTime).slice(0, 5) + ' – ' + String(r.sessionEndTime).slice(0, 5)
                    : (isEn ? ' · General Record' : ' · Ghi nhận tổng quát')}
                </h3>
                <p className="text-xs text-slate-500">
                  {isEn ? 'Coach: ' : 'HLV: '}{r.coachName} · {r.className}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {Object.entries(metrics).map(([key, [label, unit]]) => (
                    <span key={key} className="text-slate-700">
                      {label}: <strong>{r[key] === null || r[key] === undefined ? (isEn ? 'Not measured' : 'Chưa đo') : r[key] + ' ' + unit}</strong>
                    </span>
                  ))}
                </div>
                <p className="text-sm whitespace-pre-wrap text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {r.workoutResult}
                </p>
                {r.coachFeedback && (
                  <div className="bg-blue-50 text-blue-900 p-3 rounded-xl text-sm border border-blue-200">
                    <strong>{isEn ? 'Feedback & Evaluation: ' : 'Nhận xét & đánh giá: '}</strong>
                    <p className="whitespace-pre-wrap mt-0.5">{r.coachFeedback}</p>
                  </div>
                )}
              </article>
            ))}
          </section>
        </>
      )}

      <Modal isOpen={modal} onClose={() => !saving && setModal(false)} title={(isEn ? 'Log Result: ' : 'Ghi kết quả: ') + (member?.fullName || '')}>
        <form onSubmit={save} className="space-y-4">
          <label className="block text-xs font-bold text-slate-700">
            {isEn ? 'Completed Session' : 'Buổi tập đã kết thúc'}
            <select
              aria-label={isEn ? "Completed session select" : "Buổi tập ghi kết quả"}
              required
              className={`${coachInput} mt-1`}
              value={session?.id || ''}
              disabled={saving}
              onChange={e => setSessionId(e.target.value)}
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.sessionDate} · {s.timeSlot} · {s.roomName}</option>
              ))}
            </select>
          </label>
          <p className="text-xs text-slate-500">
            {isEn ? 'Student must have a valid booking in the selected session. Body metrics are optional.' : 'Học viên cần có đặt chỗ hợp lệ trong buổi đã chọn. Các chỉ số cơ thể có thể để trống.'}
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {Object.entries(metrics).map(([key, [label, unit, min, max]]) => (
              <label key={key} className="text-xs font-bold text-slate-700">
                {label} ({unit})
                <input
                  aria-label={label}
                  type="number"
                  step="0.01"
                  min={min}
                  max={max}
                  className={`${coachInput} mt-1`}
                  value={form[key]}
                  onChange={e => change(key, e.target.value)}
                />
              </label>
            ))}
          </div>
          <label className="block text-xs font-bold text-slate-700">
            {isEn ? 'Workout Performance *' : 'Kết quả bài tập *'}
            <textarea
              aria-label={isEn ? "Workout result" : "Kết quả bài tập"}
              className={`${coachInput} mt-1`}
              required
              maxLength={1000}
              rows={3}
              value={form.workoutResult}
              onChange={e => change('workoutResult', e.target.value)}
            />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            {isEn ? 'Feedback & Progress Notes' : 'Nhận xét & đánh giá tiến độ'}
            <textarea
              aria-label={isEn ? "Feedback notes" : "Nhận xét tiến độ"}
              className={`${coachInput} mt-1`}
              maxLength={1000}
              rows={3}
              value={form.coachFeedback}
              onChange={e => change('coachFeedback', e.target.value)}
            />
          </label>
          <button
            disabled={saving || !session}
            className="px-5 py-2.5 rounded-xl bg-[#F2CC8F] hover:bg-[#E07A5F] text-[#1E2235] hover:text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save Result' : 'Lưu Kết Quả')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
