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
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#81B29A]">
          VIEW PERSONAL PROGRESS & FEEDBACK
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
          {isEn ? 'Training Profile & Physical Progress' : 'Hồ Sơ Rèn Luyện & Tiến Độ Thể Lực'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {isEn
            ? 'Track InBody biometric indicators, exercise completion results, and advice from Head Coaches.'
            : 'Theo dõi các chỉ số sinh trắc học InBody, kết quả hoàn thành bài tập và lời khuyên từ Huấn luyện viên trưởng.'}
        </p>
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
