import React, { useState, useEffect } from 'react';
import { memberApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.js';
import { formatMeasurement, formatMemberDate, getLatestProgress } from './memberOverview.js';
import {
  translatePlanTitle,
  translatePlanGoal,
  translateCoachName,
  translateClassName,
  translateWorkoutResult,
  translateCoachFeedback,
  translateExerciseName,
  translateExerciseNote,
  translateReps
} from '../../services/i18nHelper.js';

export function MyProgress() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [records, setRecords] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        const [progressData, planData] = await Promise.all([
          memberApi.getMyProgress(),
          memberApi.getMyPlans()
        ]);
        setRecords(Array.isArray(progressData) ? progressData : []);
        setPlans(Array.isArray(planData) ? planData : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  if (loading) return <LoadingSpinner text={isEn ? "Loading personal progress data..." : "Đang tải dữ liệu tiến độ cá nhân..."} />;
  if (error) return <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>;

  const latestRecord = getLatestProgress(records);
  const isPending = records.length === 0 && plans.length === 0;

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* 1. Olympic Progress Masterpiece Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#2F7B5D] via-[#24828F] via-[#3FAEB8] to-[#E5A33C] dark:from-[#184534] dark:via-[#144850] dark:via-[#1B5760] dark:to-[#5E4014] text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-[#24828F]/20 overflow-hidden">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-[#F2CC8F]/45 via-[#E5A33C]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-[#81B29A]/40 via-[#2F7B5D]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/30 rounded-full blur-3xl pointer-events-none" />
        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#1B4332] dark:text-emerald-300 border border-white/80 dark:border-white/20 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[13px] text-amber-500">monitoring</span>
                OLYMPIC PROGRESS & FEEDBACK
              </span>
              <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-slate-200 border border-white/80 dark:border-white/20 text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {records.length} {isEn ? 'biometric check-ins' : 'lần đo InBody'}
              </span>
            </div>

            <h1 className="font-chivo text-2xl lg:text-3xl font-black text-white tracking-tight mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              {isEn ? 'Training Profile & Physical Progress' : 'Hồ Sơ Rèn Luyện & Tiến Độ Thể Lực'}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
              {isEn
                ? 'Track InBody biometric indicators, exercise completion results, and advice from Head Coaches.'
                : 'Theo dõi các chỉ số sinh trắc học InBody, kết quả hoàn thành bài tập và lời khuyên từ Huấn luyện viên trưởng.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="#/member/schedule"
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:shadow-xl shrink-0 border border-white/20 active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-[18px] text-[#F2CC8F]">calendar_month</span>
              <span>{isEn ? 'Book Class' : 'Đặt Ca Tập'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Empty State Banner when no data yet */}
      {isPending && (
        <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center space-y-3">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">fitness_center</span>
          <h3 className="font-chivo text-base font-bold text-slate-700 dark:text-slate-300">
            {isEn ? 'No Progress Records Yet' : 'Chưa có dữ liệu tiến độ'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-6">
            {isEn
              ? 'Coaches will record physical metrics, workout results, and personalized plans after each session. Data will appear here once updated by your coach.'
              : 'Huấn luyện viên sẽ ghi nhận chỉ số thể lực, kết quả tập luyện và kế hoạch cá nhân sau mỗi buổi học. Dữ liệu sẽ hiển thị tại đây sau khi HLV cập nhật.'}
          </p>
        </div>
      )}

      {/* Latest Biometric Indicators */}
      {latestRecord && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover-lift flex items-center justify-between transition-all">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isEn ? 'Current Weight' : 'Cân Nặng Hiện Tại'}
              </span>
              <div className="font-chivo text-3xl font-black text-slate-900 dark:text-white mt-1">{formatMeasurement(latestRecord.weight, 'kg')}</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {isEn ? `Recorded on ${formatMemberDate(latestRecord.date, isEn)}` : `Ghi nhận ngày ${formatMemberDate(latestRecord.date)}`}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">monitor_weight</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover-lift flex items-center justify-between transition-all">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isEn ? 'Body Fat Rate' : 'Tỷ Lệ Mỡ Cơ Thể'}
              </span>
              <div className="font-chivo text-3xl font-black text-[#E07A5F] mt-1">{formatMeasurement(latestRecord.bodyFat, '%')}</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{isEn ? 'Assessed by Coach' : 'Theo đánh giá của HLV'}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#E07A5F]/15 text-[#E07A5F] flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">vital_signs</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover-lift flex items-center justify-between transition-all">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isEn ? 'Skeletal Muscle Mass' : 'Khối Lượng Cơ Bắp'}
              </span>
              <div className="font-chivo text-3xl font-black text-[#2D6A4F] dark:text-[#81B29A] mt-1">{formatMeasurement(latestRecord.muscleMass, 'kg')}</div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{isEn ? 'Assessed by Coach' : 'Theo đánh giá của HLV'}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A] flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">fitness_center</span>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Training Plans from Coach */}
      {plans.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover-lift space-y-4 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-chivo text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-[#81B29A]">fitness_center</span>
              {isEn ? 'Assigned Training Syllabus' : 'Giáo Án Huấn Luyện Được Chỉ Định'}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">{plans.length} {isEn ? 'plans' : 'giáo án'}</span>
          </div>

          <div className="space-y-4">
            {plans.map(p => (
              <div key={p.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-chivo text-base font-bold text-slate-900 dark:text-white">{translatePlanTitle(p.title, isEn)}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{isEn ? 'Assigned Coach: ' : 'HLV phụ trách: '}{translateCoachName(p.coachName, isEn)}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">{isEn ? 'Goal: ' : 'Mục tiêu: '}"{translatePlanGoal(p.goal, isEn)}"</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isEn ? 'Class: ' : 'Lớp: '}{translateClassName(p.className, isEn) || (isEn ? 'Not specified' : 'Chưa có thông tin')} · {isEn ? 'From ' : 'Từ '}{formatMemberDate(p.startDate, isEn)}{p.endDate && ` ${isEn ? 'to' : 'đến'} ${formatMemberDate(p.endDate, isEn)}`}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    {isEn ? 'Training details & drills:' : 'Chi tiết bài rèn luyện:'}
                  </span>
                  {p.exercises?.map((ex, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <div>
                        <strong className="text-slate-900 dark:text-white">{i + 1}. {translateExerciseName(ex.name, isEn)}</strong>
                        {ex.note && <span className="text-slate-400 dark:text-slate-500 ml-2">({translateExerciseNote(ex.note, isEn)})</span>}
                      </div>
                      <span className="font-chivo font-black text-[#E07A5F]">{ex.sets} x {translateReps(ex.reps, isEn)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Timeline & Coach Feedback */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover-lift space-y-4 transition-all">
        <h2 className="font-chivo text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
          <span className="material-symbols-outlined text-[#F2CC8F]">history_edu</span>
          {isEn ? 'Assessment History & Coach Feedback' : 'Lịch Sử Đánh Giá & Nhận Xét Của HLV'} ({records.length})
        </h2>

        <div className="space-y-4">
          {records.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">{isEn ? 'No records yet.' : 'Chưa có bản ghi nào.'}</p>
          ) : (
            records.map(rec => (
              <div key={rec.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-2 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="font-chivo font-bold text-slate-900 dark:text-white">{isEn ? `Assessment session: ${formatMemberDate(rec.date, isEn)}` : `Buổi kiểm tra ngày ${formatMemberDate(rec.date)}`}</span>
                  <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Evaluator: ' : 'Người đánh giá: '}<strong>{translateCoachName(rec.coachName, isEn)}</strong></span>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-bold block text-slate-900 dark:text-white mb-0.5">{isEn ? 'Workout results:' : 'Kết quả bài tập:'}</span>
                  <p>{translateWorkoutResult(rec.workoutResult, isEn)}</p>
                </div>

                {rec.coachFeedback && (
                  <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-0.5">{isEn ? 'Coach Feedback & Advice:' : 'Dặn dò của Huấn luyện viên:'}</span>
                    <p className="text-emerald-800 dark:text-emerald-200 italic">"{translateCoachFeedback(rec.coachFeedback, isEn)}"</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
