import React, { useState, useEffect } from 'react';
import { coachApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { CoachError, coachInput } from './CoachShared.jsx';
import { coachDate } from './coachOverview.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function AIRecommendation() {
  const { language } = useLanguage();
  const isEn = language === 'en';

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
    catch (e) { setLoadError(e); }
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
    }).catch(e => { if (active) setContextError(e); }).finally(() => { if (active) setContextLoading(false); });
    return () => { active = false; };
  }, [selectedClass?.id, member?.id, version]);

  useEffect(() => { setResult(null); setError(''); }, [goal, level, notes]);

  const generate = async e => {
    e.preventDefault();
    if (!context || !member || busy) return;
    setBusy(true); setResult(null); setError('');
    try {
      setResult(await coachApi.getAIRecommendation({
        classId: selectedClass.id,
        memberId: member.id,
        fitnessGoal: goal.trim(),
        currentLevel: level.trim(),
        notes: notes.trim()
      }));
    } catch (err) { setError(err); }
    finally { setBusy(false); }
  };

  const apply = async () => {
    if (!result || busy) return;
    setBusy(true); setError('');
    try {
      await coachApi.savePersonalTrainingPlan({
        classId: selectedClass.id,
        memberId: member.id,
        title: result.title,
        goal,
        startDate: coachDate(),
        fitnessCondition: notes,
        exercises: result.exercises
      });
      showSuccess(isEn ? 'Personal training plan saved after coach review.' : 'Đã lưu giáo án cá nhân sau khi HLV xem xét.');
      window.location.hash = '#/coach/training-plan';
    } catch (err) { setError(err); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#81B29A]/15 text-[#2D6A4F] border border-[#81B29A]/30 text-xs font-bold uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-[#81B29A]" />
          <span>{isEn ? 'Smart Recommendations' : 'Gợi ý thông minh'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E2235] tracking-tight">
          {isEn ? 'AI Fitness Training Plan Assistant' : 'Trợ Lý AI Đề Xuất Giáo Án Thể Lực'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          {isEn
            ? 'Personalized workout regimen suggestions based on student goals, fitness level, and recent performance history in the selected class.'
            : 'Gợi ý phác đồ rèn luyện dựa trên mục tiêu, trình độ, thể trạng và tối đa 10 kết quả gần nhất trong lớp bạn đang chọn.'}
        </p>
      </div>

      <CoachError message={loadError} retry={load} />

      {loading ? (
        <p className="text-sm text-slate-500">{isEn ? 'Loading assigned classes...' : 'Đang tải lớp phụ trách...'}</p>
      ) : !loadError && (
        <div className="grid lg:grid-cols-2 gap-5 items-start">
          <form onSubmit={generate} className="bg-white border rounded-2xl p-5 space-y-4 shadow-xs">
            <fieldset disabled={busy} className="space-y-4">
              <label className="block text-xs font-bold">
                {isEn ? 'Assigned Class' : 'Lớp phụ trách'}
                <select
                  aria-label={isEn ? 'AI class select' : 'Lớp gợi ý AI'}
                  className={coachInput}
                  value={selectedClass?.id || ''}
                  onChange={e => { setClassId(e.target.value); setMemberId(''); }}
                >
                  {!classes.length && (
                    <option value="">{isEn ? 'No assigned classes' : 'Chưa có lớp được phân công'}</option>
                  )}
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>[{c.sportName}] {c.name}</option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-bold">
                {isEn ? 'Student' : 'Học viên'}
                <select
                  aria-label={isEn ? 'AI student select' : 'Học viên gợi ý AI'}
                  className={coachInput}
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

              <CoachError message={contextError} retry={() => setVersion(v => v + 1)} />

              {contextLoading && (
                <p className="text-sm text-slate-500">{isEn ? 'Loading profile and workout history...' : 'Đang tải hồ sơ và lịch sử...'}</p>
              )}

              {context && (
                <div className="p-3 rounded-xl bg-slate-50 text-sm space-y-2 border border-slate-200">
                  <p className="font-semibold text-slate-800">
                    {isEn ? `Saved Context: ${context.recentHistory.length} latest results` : `Ngữ cảnh đã lưu: ${context.recentHistory.length} kết quả gần nhất`}
                  </p>
                  <p className="text-slate-600">
                    {isEn ? 'Profile Goal: ' : 'Mục tiêu hồ sơ: '}
                    <strong>{context.fitnessGoal || (isEn ? 'Not updated' : 'Chưa cập nhật')}</strong>
                  </p>
                  <p className="text-slate-600">
                    {isEn ? 'Fitness Level: ' : 'Trình độ: '}
                    <strong>{context.fitnessLevel || (isEn ? 'Not updated' : 'Chưa cập nhật')}</strong>
                  </p>
                  {context.recentHistory.length ? (
                    <details>
                      <summary className="cursor-pointer text-[#3D405B] hover:text-[#E07A5F] font-bold transition-colors">
                        {isEn ? 'View history used for recommendations' : 'Xem lịch sử dùng cho gợi ý'}
                      </summary>
                      <ul className="mt-2 space-y-2">
                        {context.recentHistory.map((h, i) => (
                          <li key={i} className="border-t pt-2 break-words text-xs">
                            <strong>{h.date}</strong>
                            <p className="whitespace-pre-wrap mt-0.5">{h.workoutResult}</p>
                            {h.coachFeedback && (
                              <p className="text-[#81B29A] font-semibold mt-0.5">
                                {isEn ? 'Feedback: ' : 'Nhận xét: '}{h.coachFeedback}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {isEn ? 'No workout history yet; AI will rely on member profile and coach inputs.' : 'Chưa có lịch sử; AI chỉ có hồ sơ và thông tin HLV nhập.'}
                    </p>
                  )}
                </div>
              )}

              <label className="block text-xs font-bold">
                {isEn ? 'Fitness Goal *' : 'Mục tiêu tập luyện *'}
                <input
                  aria-label={isEn ? 'Fitness Goal' : 'Mục tiêu AI'}
                  required
                  maxLength={500}
                  className={coachInput}
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                />
              </label>

              <label className="block text-xs font-bold">
                {isEn ? 'Current Fitness Level *' : 'Trình độ hiện tại *'}
                <input
                  aria-label={isEn ? 'Fitness Level' : 'Trình độ AI'}
                  required
                  maxLength={50}
                  className={coachInput}
                  placeholder={isEn ? 'Enter evaluated fitness level' : 'Nhập trình độ đã đánh giá'}
                  value={level}
                  onChange={e => setLevel(e.target.value)}
                />
              </label>

              <label className="block text-xs font-bold">
                {isEn ? 'Health condition / adjustments' : 'Lưu ý thể trạng / điều chỉnh'}
                <textarea
                  aria-label={isEn ? 'Health notes' : 'Lưu ý AI'}
                  maxLength={1000}
                  rows={3}
                  className={coachInput}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </label>

              <button
                disabled={!member || !context || contextLoading}
                className="w-full px-5 py-3 rounded-xl bg-[#1E2235] hover:bg-[#2B2D42] text-[#F2CC8F] hover:text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">psychology</span>
                <span>{busy ? (isEn ? 'Processing...' : 'Đang xử lý...') : (isEn ? 'Generate AI Plan' : 'Tạo gợi ý AI')}</span>
              </button>
            </fieldset>
          </form>

          <section className="bg-white p-5 border rounded-2xl space-y-4 shadow-xs">
            <h2 className="font-bold text-slate-900">
              {isEn ? 'AI Plan for Coach Review' : 'Gợi ý để HLV xem xét'}
            </h2>
            <CoachError message={error} />
            {!result && !busy && (
              <p className="text-sm text-slate-500">
                {isEn ? 'Select a student, verify context, and click Generate to produce a personalized plan.' : 'Chọn học viên, kiểm tra ngữ cảnh và tạo gợi ý.'}
              </p>
            )}
            {busy && (
              <div className="py-8 text-center text-sm text-slate-500 space-y-2">
                <span className="inline-block w-5 h-5 border-2 border-[#81B29A] border-t-transparent rounded-full animate-spin" />
                <p>{isEn ? 'Generating personalized workout recommendations...' : 'Đang xử lý yêu cầu...'}</p>
              </div>
            )}
            {result && (
              <>
                <h3 className="font-bold text-lg text-slate-900">{result.title}</h3>
                <p className="text-sm text-slate-600">{result.targetAudience}</p>
                <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <dt className="text-slate-500 text-xs font-bold uppercase">{isEn ? 'Weekly Volume' : 'Khối lượng tuần'}</dt>
                    <dd className="font-semibold text-slate-900 mt-1">{result.weeklyVolume}</dd>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <dt className="text-slate-500 text-xs font-bold uppercase">{isEn ? 'Heart Rate Zone' : 'Vùng nhịp tim'}</dt>
                    <dd className="font-semibold text-slate-900 mt-1">{result.heartRateZone}</dd>
                  </div>
                </dl>
                <p className="text-sm whitespace-pre-wrap text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {result.nutritionGuidance}
                </p>
                <div className="space-y-2">
                  {result.exercises.map((ex, i) => (
                    <article key={i} className="p-3 border rounded-xl text-sm break-words bg-white hover:bg-slate-50 transition-colors">
                      <h4 className="font-bold text-slate-900">{i + 1}. {ex.name}</h4>
                      <p className="text-xs text-slate-600 font-mono mt-0.5">{ex.sets} × {ex.reps}</p>
                      <p className="text-xs text-slate-500 mt-1">{ex.note}</p>
                    </article>
                  ))}
                </div>
                {result.coachReviewNote && (
                  <p className="p-3 bg-amber-50 text-amber-900 text-sm rounded-xl border border-amber-200">
                    {result.coachReviewNote}
                  </p>
                )}
                <button
                  disabled={busy}
                  onClick={apply}
                  className="w-full p-3 bg-[#F2CC8F] hover:bg-[#E07A5F] text-[#1E2235] hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                  <span>{isEn ? 'Reviewed — Save as Personal Training Plan' : 'Đã xem xét — Lưu thành giáo án cá nhân'}</span>
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
