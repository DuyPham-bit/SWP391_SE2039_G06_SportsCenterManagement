import React, { useState, useEffect } from 'react';
import { coachApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { CoachError, coachInput } from './CoachShared.js';
import { coachDate } from './coachOverview.js';

export function AIRecommendation() {
  const { showSuccess } = useToast();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [context, setContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState('');
  const [version, setVersion] = useState(0);
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setLoading(true); setLoadError('');
    try { setClasses(await coachApi.getCoachClassesAndMembers()); }
    catch (e) { setLoadError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const selectedClass = classes.find(c => c.id === Number(classId)) || classes[0];
  const member = selectedClass?.members?.find(m => m.id === Number(memberId)) || selectedClass?.members?.[0];
  useEffect(() => {
    let active = true;
    setContext(null); setContextError(''); setGoal(''); setLevel(''); setNotes(''); setResult(null); setError('');
    if (!selectedClass || !member) { setContextLoading(false); return; }
    setContextLoading(true);
    coachApi.getAIContext(selectedClass.id, member.id).then(data => {
      if (!active) return;
      setContext(data); setGoal(data.fitnessGoal || ''); setLevel(data.fitnessLevel || ''); setNotes(data.medicalNote || '');
    }).catch(e => { if (active) setContextError(e.message); }).finally(() => { if (active) setContextLoading(false); });
    return () => { active = false; };
  }, [selectedClass?.id, member?.id, version]);
  useEffect(() => { setResult(null); setError(''); }, [goal, level, notes]);
  const generate = async e => {
    e.preventDefault();
    if (!context || !member || busy) return;
    setBusy(true); setResult(null); setError('');
    try {
      setResult(await coachApi.getAIRecommendation({ classId: selectedClass.id, memberId: member.id, fitnessGoal: goal.trim(), currentLevel: level.trim(), notes: notes.trim() }));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const apply = async () => {
    if (!result || busy) return;
    setBusy(true); setError('');
    try {
      await coachApi.savePersonalTrainingPlan({ classId: selectedClass.id, memberId: member.id, title: result.title, goal,
        startDate: coachDate(), fitnessCondition: notes, exercises: result.exercises });
      showSuccess('Đã lưu giáo án cá nhân sau khi HLV xem xét.');
      window.location.hash = '#/coach/training-plan';
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <div className="space-y-5">
    <h1 className="text-2xl font-black">Trợ Lý AI Đề Xuất Giáo Án Thể Lực</h1>
    <p className="text-sm text-slate-500">Gợi ý dựa trên mục tiêu, trình độ, thể trạng và tối đa 10 kết quả gần nhất trong lớp đang chọn.</p>
    <CoachError message={loadError} retry={load} />
    {loading ? <p>Đang tải lớp phụ trách...</p> : !loadError && <div className="grid lg:grid-cols-2 gap-5 items-start">
      <form onSubmit={generate} className="bg-white border rounded-2xl p-5 space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          <label className="block text-xs font-bold">Lớp phụ trách<select aria-label="Lớp gợi ý AI" className={coachInput} value={selectedClass?.id || ''} onChange={e => { setClassId(e.target.value); setMemberId(''); }}>
            {!classes.length && <option value="">Chưa có lớp được phân công</option>}{classes.map(c => <option key={c.id} value={c.id}>[{c.sportName}] {c.name}</option>)}
          </select></label>
          <label className="block text-xs font-bold">Học viên<select aria-label="Học viên gợi ý AI" className={coachInput} value={member?.id || ''} onChange={e => setMemberId(e.target.value)}>
            {!selectedClass?.members?.length && <option value="">Chưa có học viên</option>}{selectedClass?.members?.map(m => <option key={m.id} value={m.id}>{m.fullName} · {m.memberCode}</option>)}
          </select></label>
          <CoachError message={contextError} retry={() => setVersion(v => v + 1)} />
          {contextLoading && <p className="text-sm">Đang tải hồ sơ và lịch sử...</p>}
          {context && <div className="p-3 rounded-xl bg-slate-50 text-sm space-y-2">
            <p className="font-semibold">Ngữ cảnh đã lưu: {context.recentHistory.length} kết quả gần nhất</p>
            <p>Mục tiêu hồ sơ: {context.fitnessGoal || 'Chưa cập nhật'}</p>
            <p>Trình độ: {context.fitnessLevel || 'Chưa cập nhật'}</p>
            {context.recentHistory.length ? <details><summary className="cursor-pointer text-red-600">Xem lịch sử dùng cho gợi ý</summary>
              <ul className="mt-2 space-y-2">{context.recentHistory.map((h, i) => <li key={i} className="border-t pt-2 break-words">
                <strong>{h.date}</strong><p className="whitespace-pre-wrap">{h.workoutResult}</p>{h.coachFeedback && <p>Nhận xét: {h.coachFeedback}</p>}
              </li>)}</ul>
            </details> : <p>Chưa có lịch sử; AI chỉ có hồ sơ và thông tin HLV nhập.</p>}
          </div>}
          <label className="block text-xs font-bold">Mục tiêu tập luyện *<input aria-label="Mục tiêu AI" required maxLength={500} className={coachInput} value={goal} onChange={e => setGoal(e.target.value)} /></label>
          <label className="block text-xs font-bold">Trình độ hiện tại *<input aria-label="Trình độ AI" required maxLength={50} className={coachInput} placeholder="Nhập trình độ đã đánh giá" value={level} onChange={e => setLevel(e.target.value)} /></label>
          <label className="block text-xs font-bold">Lưu ý thể trạng / điều chỉnh<textarea aria-label="Lưu ý AI" maxLength={1000} rows={3} className={coachInput} value={notes} onChange={e => setNotes(e.target.value)} /></label>
          <button disabled={!member || !context || contextLoading} className="w-full px-4 py-3 rounded-xl bg-red-600 text-white disabled:opacity-50">{busy ? 'Đang xử lý...' : 'Tạo gợi ý AI'}</button>
        </fieldset>
      </form>
      <section className="bg-white p-5 border rounded-2xl space-y-4">
        <h2 className="font-bold">Gợi ý để HLV xem xét</h2>
        <CoachError message={error} />
        {!result && !busy && <p className="text-sm text-slate-500">Chọn học viên, kiểm tra ngữ cảnh và tạo gợi ý.</p>}
        {busy && <p className="text-sm">Đang xử lý yêu cầu...</p>}
        {result && <>
          <h3 className="font-bold text-lg">{result.title}</h3>
          <p className="text-sm">{result.targetAudience}</p>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">Khối lượng tuần</dt><dd>{result.weeklyVolume}</dd></div>
            <div><dt className="text-slate-500">Vùng nhịp tim</dt><dd>{result.heartRateZone}</dd></div>
          </dl>
          <p className="text-sm whitespace-pre-wrap">{result.nutritionGuidance}</p>
          {result.exercises.map((ex, i) => <article key={i} className="p-3 border rounded-xl text-sm break-words">
            <h4 className="font-bold">{i + 1}. {ex.name}</h4><p>{ex.sets} × {ex.reps}</p><p>{ex.note}</p>
          </article>)}
          <p className="p-3 bg-amber-50 text-amber-900 text-sm rounded-xl">{result.coachReviewNote}</p>
          <button disabled={busy} onClick={apply} className="w-full p-3 bg-red-600 rounded-xl text-white disabled:opacity-50">Đã xem xét — Lưu thành giáo án cá nhân</button>
        </>}
      </section>
    </div>}
  </div>;
}
