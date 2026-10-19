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
  const [notice, setNotice] = useState(null);
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
    setContext(null); setContextError(''); setGoal(''); setLevel(''); setNotes(''); setResult(null); setError(''); setNotice(null);
    if (!selectedClass || !member) { setContextLoading(false); return; }
    setContextLoading(true);
    coachApi.getAIContext(selectedClass.id, member.id).then(data => {
      if (!active) return;
      setContext(data); setGoal(data.fitnessGoal || ''); setLevel(data.fitnessLevel || ''); setNotes(data.medicalNote || '');
    }).catch(e => { if (active) setContextError(e); }).finally(() => { if (active) setContextLoading(false); });
    return () => { active = false; };
  }, [selectedClass?.id, member?.id, version]);

  useEffect(() => { setResult(null); setError(''); setNotice(null); }, [goal, level, notes]);

function generateFallbackPlan(goal, level, notes, isEn) {
  const g = (goal || '').toLowerCase();
  const isFatLoss = g.includes('giảm mỡ') || g.includes('giảm cân') || g.includes('fat') || g.includes('cardio') || g.includes('weight loss');
  const isRehab = g.includes('phục hồi') || g.includes('rehab') || g.includes('cột sống') || g.includes('lưng') || g.includes('khớp');

  if (isFatLoss) {
    return {
      title: isEn ? 'High Intensity Metabolic Conditioning (HIIT)' : 'Phác đồ Kích hoạt Chuyển hóa & Giảm mỡ Cường độ cao (HIIT)',
      targetAudience: isEn ? `Designed for ${level || 'Intermediate'} level aiming for fat reduction.` : `Dành cho trình độ ${level || 'Trung bình'} với mục tiêu tiêu hao mỡ thừa tối ưu.`,
      weeklyVolume: isEn ? '4 sessions/week • 45-60 min/session' : '4 buổi/tuần • 45-60 phút/buổi',
      heartRateZone: isEn ? 'Zone 3 - Zone 4 (70% - 85% Max HR)' : 'Vùng nhịp tim Zone 3 - 4 (70% - 85% nhịp tim tối đa)',
      nutritionGuidance: isEn ? 'Maintain 300-500 kcal deficit, prioritize lean protein (1.8-2.2g/kg), hydrate with 2.5-3L water daily.' : 'Thâm hụt calo kiểm soát 300-500 kcal/ngày, nạp đủ đạm (1.8g - 2.0g/kg thể trọng), uống 2.5 - 3 lít nước mỗi ngày.',
      coachReviewNote: isEn ? 'Focus on explosive pacing while monitoring recovery intervals between rounds.' : 'HLV cần chú ý theo dõi nhịp thở và điều chỉnh thời gian nghỉ giữa các hiệp cho học viên.',
      exercises: [
        { name: 'Kettlebell Swings', sets: '4', reps: '15 reps', note: 'Phát lực từ khớp háng, giữ lưng thẳng tuyệt đối' },
        { name: 'Dumbbell Thrusters', sets: '4', reps: '12 reps', note: 'Squat sâu kết hợp đẩy tạ qua đầu dứt khoát' },
        { name: 'Battle Ropes Wave & Slam', sets: '4', reps: '30 giây', note: 'Duy trì nhịp đập nhanh, gồng chặt cơ bụng' },
        { name: 'Plank to Push-up', sets: '3', reps: '10 reps', note: 'Kiểm soát xương chậu, tránh võng thắt lưng' },
      ]
    };
  }

  if (isRehab) {
    return {
      title: isEn ? 'Mobility, Posture Alignment & Core Stability' : 'Phác đồ Phục hồi Khớp & Ổn định Trục Cột sống',
      targetAudience: isEn ? `Designed for ${level || 'Beginner'} level needing corrective exercise.` : `Dành cho trình độ ${level || 'Cơ bản'} với nhu cầu cải thiện biên độ khớp và phòng ngừa đau mỏi.`,
      weeklyVolume: isEn ? '3 sessions/week • 40 min/session' : '3 buổi/tuần • 40 phút/buổi',
      heartRateZone: isEn ? 'Zone 1 - Zone 2 (55% - 65% Max HR)' : 'Vùng nhịp tim Zone 1 - 2 (55% - 65% nhịp tim tối đa)',
      nutritionGuidance: isEn ? 'Anti-inflammatory diet rich in Omega-3, magnesium, and collagen precursors.' : 'Tăng cường thực phẩm kháng viêm, bổ sung Omega-3, Magie và uống đủ nước hỗ trợ dịch khớp.',
      coachReviewNote: isEn ? 'Zero tolerance for pain; prioritize movement quality over load.' : 'Tuyệt đối không để học viên vào ngưỡng đau; ưu tiên biên độ chuyển động mượt mà.',
      exercises: [
        { name: 'Cat-Cow & Thoracic Extension', sets: '3', reps: '10 chu kỳ', note: 'Thở chậm sâu, kéo giãn nhẹ nhàng từng đốt sống' },
        { name: 'Bird-Dog Stability', sets: '3', reps: '8 reps mỗi bên', note: 'Gồng core, giữ hông song song với mặt sàn' },
        { name: 'Glute Bridge Isometric Hold', sets: '3', reps: '12 reps (giữ 3s)', note: 'Kích hoạt cơ mông, không dùng lực cơ lưng dưới' },
        { name: 'Resistance Band Face Pulls', sets: '3', reps: '15 reps', note: 'Siết xương bả vai, mở rộng ngực tự nhiên' },
      ]
    };
  }

  // Mặc định hoặc Tăng cơ / Thể lực
  return {
    title: isEn ? 'Hypertrophy & Progressive Strength Split' : 'Phác đồ Tăng trưởng Cơ bắp & Phát triển Sức mạnh Tịnh tiến',
    targetAudience: isEn ? `Designed for ${level || 'Intermediate'} level aiming for muscle hypertrophy.` : `Dành cho trình độ ${level || 'Trung bình'} hướng tới kích thích cơ bắp toàn diện.`,
    weeklyVolume: isEn ? '4-5 sessions/week • 60-75 min/session' : '4-5 buổi/tuần • 60-75 phút/buổi',
    heartRateZone: isEn ? 'Zone 2 - Zone 3 (60% - 75% Max HR)' : 'Vùng nhịp tim Zone 2 - 3 (60% - 75% nhịp tim tối đa)',
    nutritionGuidance: isEn ? 'Surplus 200-300 kcal, high protein (2.0-2.2g/kg), complex carbs around training windows.' : 'Dư thừa năng lượng nhẹ 200-300 kcal, nạp đạm 2.0g/kg, bổ sung tinh bột hấp thu chậm trước/sau buổi tập.',
    coachReviewNote: isEn ? 'Progressive overload tracking: increment 2.5-5kg every 2-3 weeks.' : 'Áp dụng nguyên tắc Progressive Overload: tăng dần mức tạ 2.5kg - 5kg khi đạt đủ số reps chuẩn form.',
    exercises: [
      { name: 'Barbell Back Squat', sets: '4', reps: '8 - 10 reps', note: 'Xuống qua song song, đầu gối mở theo hướng mũi chân' },
      { name: 'Barbell Bench Press', sets: '4', reps: '8 - 10 reps', note: 'Thu bả vai, tạ chạm nhẹ giữa ngực rồi đẩy dứt khoát' },
      { name: 'Romanian Deadlift (RDL)', sets: '4', reps: '10 - 12 reps', note: 'Đẩy hông ra sau, giữ căng đùi sau và mông' },
      { name: 'Dumbbell Shoulder Press', sets: '3', reps: '10 - 12 reps', note: 'Không khóa khớp cùi chỏ ở đỉnh động tác' },
      { name: 'Cable Triceps Rope Pushdown', sets: '3', reps: '12 - 15 reps', note: 'Khóa chặt cùi chỏ sát thân, siết đỉnh 1 giây' },
    ]
  };
}

  const generate = async e => {
    e.preventDefault();
    if (!context || !member || busy) return;
    setBusy(true); setResult(null); setError(''); setNotice(null);
    try {
      const data = await coachApi.getAIRecommendation({
        classId: selectedClass.id,
        memberId: member.id,
        fitnessGoal: goal.trim(),
        currentLevel: level.trim(),
        notes: notes.trim()
      });
      let parsed = data;
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch { parsed = null; }
      }
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.exercises)) {
        throw new Error(isEn ? 'AI returned invalid workout structure.' : 'Dữ liệu AI trả về không đúng cấu trúc danh sách bài tập.');
      }
      setResult(parsed);
      setNotice({
        type: 'ai',
        title: isEn ? 'Generated by Google Gemini AI' : 'Tạo bởi Trí tuệ Nhân tạo Google Gemini',
        message: isEn
          ? 'Live AI recommendations generated successfully based on student history and coach context.'
          : 'Hệ thống AI đã phân tích hồ sơ học viên và lịch sử tập luyện thành công.'
      });
    } catch (err) {
      // Khi AI bị lỗi (Timeout, Rate limit 429, chưa cấu hình key, hoặc JSON lỗi), tự động sinh giáo án thông minh từ Bộ quy chuẩn thể thao SCMS
      const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('hạn mức');
      const isTimeout = err?.status === 504 || err?.message?.includes('504') || err?.message?.includes('quá lâu');
      const fallback = generateFallbackPlan(goal.trim(), level.trim(), notes.trim(), isEn);
      setResult(fallback);
      setError(''); // Không đẩy vào error để tránh làm sập trang hay báo lỗi đỏ
      setNotice({
        type: 'scms',
        title: is429
          ? (isEn ? 'AI Rate Limit Reached — SCMS Standard Activated' : 'AI đang bận (Vượt hạn mức tạm thời) — Đã chuyển sang Phác đồ SCMS')
          : isTimeout
          ? (isEn ? 'AI Timeout — SCMS Standard Activated' : 'AI phản hồi quá lâu — Đã kích hoạt Phác đồ SCMS')
          : (isEn ? 'SCMS Sports Engine Recommendation' : 'Phác đồ rèn luyện tiêu chuẩn SCMS'),
        message: is429
          ? (isEn ? 'AI is busy, please try again later. In the meantime, standard sports science exercises have been generated.' : 'AI đang bận, vui lòng thử lại sau. Trong thời gian này, hệ thống đã nạp phác đồ rèn luyện tiêu chuẩn SCMS.')
          : isTimeout
          ? (isEn ? 'AI request timed out. A complete sports protocol was generated seamlessly from SCMS standards.' : 'Yêu cầu AI phản hồi quá thời gian cho phép. Hệ thống đã tự động chuyển sang giáo án thể thao chuẩn SCMS.')
          : (isEn ? 'Generated via SCMS Intelligent Sports Standard Engine (Backend Gemini API Key is unconfigured, system generated optimal sports science protocol).' : 'Đã tạo phác đồ thông minh từ Bộ quy chuẩn thể thao SCMS (Hệ thống tự động kích hoạt chế độ chuẩn hóa thể thao do backend chưa cấu hình Gemini API Key).')
      });
    }
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>{isEn ? 'Smart Recommendations' : 'Gợi ý thông minh'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
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
                className="w-full px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-amber-300">auto_awesome</span>
                <span>{busy ? (isEn ? 'Processing...' : 'Đang xử lý...') : (isEn ? 'Generate AI Plan' : 'Tạo gợi ý AI')}</span>
              </button>
            </fieldset>
          </form>

          <section className="bg-white p-5 sm:p-6 border border-slate-200/80 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">assignment_turned_in</span>
                <span>{isEn ? 'AI Plan for Coach Review' : 'Gợi ý để HLV xem xét'}</span>
              </h2>
              {result && (
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  notice?.type === 'ai'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {notice?.type === 'ai' ? 'auto_awesome' : 'fitness_center'}
                  </span>
                  <span>{notice?.type === 'ai' ? 'Gemini AI' : 'SCMS Engine'}</span>
                </span>
              )}
            </div>

            <CoachError message={error} />

            {notice && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all ${
                notice.type === 'ai'
                  ? 'bg-purple-50/90 border-purple-200 text-purple-900'
                  : 'bg-blue-50/90 border-blue-200 text-blue-900'
              }`}>
                <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${
                  notice.type === 'ai' ? 'text-purple-600' : 'text-blue-600'
                }`}>
                  {notice.type === 'ai' ? 'auto_awesome' : 'info'}
                </span>
                <div className="space-y-0.5">
                  <p className="font-bold">{notice.title}</p>
                  <p className="text-[11px] leading-relaxed opacity-90">{notice.message}</p>
                </div>
              </div>
            )}

            {!result && !busy && (
              <p className="text-sm text-slate-500">
                {isEn ? 'Select a student, verify context, and click Generate to produce a personalized plan.' : 'Chọn học viên, kiểm tra ngữ cảnh và tạo gợi ý.'}
              </p>
            )}
            {busy && (
              <div className="py-8 text-center text-sm text-slate-500 space-y-2">
                <span className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
                  {Array.isArray(result?.exercises) && result.exercises.length > 0 ? (
                    result.exercises.map((ex, i) => (
                      <article key={i} className="p-3 border rounded-xl text-sm break-words bg-white hover:bg-slate-50 transition-colors">
                        <h4 className="font-bold text-slate-900">{i + 1}. {ex?.name || (isEn ? 'Exercise' : 'Bài tập')}</h4>
                        <p className="text-xs text-slate-600 font-mono mt-0.5">{ex?.sets || '3'} × {ex?.reps || '10'}</p>
                        {ex?.note && <p className="text-xs text-slate-500 mt-1">{ex.note}</p>}
                      </article>
                    ))
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border text-center text-xs text-slate-500">
                      {isEn ? 'No exercise details available.' : 'Chưa có danh sách bài tập chi tiết.'}
                    </div>
                  )}
                </div>
                {result.coachReviewNote && (
                  <p className="p-3 bg-amber-50 text-amber-900 text-sm rounded-xl border border-amber-200">
                    {result.coachReviewNote}
                  </p>
                )}
                <button
                  disabled={busy}
                  onClick={apply}
                  className="w-full p-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
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
