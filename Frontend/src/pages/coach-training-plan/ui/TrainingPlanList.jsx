import React from 'react';
import { getSportBadgeTheme, getResolvedExercises } from '../lib/planPresets.js';
import { translateClassName, translatePlanTitle, translateCoachName, translatePlanGoal, translateExerciseName, translateExerciseNote, translateReps } from '../../../shared/i18n/i18nHelper.js';

export function TrainingPlanList({ filteredPlans, handleDeletePlan, handleOpenEditModal, isEn, setSelectedPlanDetail }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {filteredPlans.map(plan => {
        const sportTheme = getSportBadgeTheme(plan.sportName, isEn);
        const resolvedExercises = getResolvedExercises(plan);

        return (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl border border-brand-navy-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between border-l-[6px] ${sportTheme.accent}`}
          >
            <div className="p-5 sm:p-6 space-y-4">
              {/* Top Badges Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Sport Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${sportTheme.tagBg}`}>
                    <span className="material-symbols-outlined text-[15px]">{sportTheme.icon}</span>
                    <span>{sportTheme.label}</span>
                  </span>

                  {/* Type Badge */}
                  {plan.isCustom ? (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-sand-50 text-brand-sand-800 border border-brand-sand-300 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-brand-sand-700 dark:text-brand-sand-400">star</span>
                      <span>{isEn ? 'Custom Personal Plan' : 'Giáo án riêng cá nhân'}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-teal-50 text-brand-teal-800 border border-brand-teal-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-brand-teal-700 dark:text-brand-teal-400">groups</span>
                      <span>{isEn ? 'Class Syllabus' : 'Giáo án toàn lớp'}</span>
                    </span>
                  )}

                  {/* Class Badge */}
                  {plan.className && (
                    <span className="text-[11px] font-semibold bg-brand-navy-100 text-brand-navy-700 px-2.5 py-1 rounded-full border border-brand-navy-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-brand-navy-400">school</span>
                      <span>{translateClassName(plan.className, isEn)}</span>
                    </span>
                  )}
                </div>

                {/* Status Pill */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-full bg-brand-sage-50 text-brand-sage-700 font-bold text-[11px] uppercase border border-brand-sage-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-500 animate-pulse" />
                    <span>ACTIVE</span>
                  </span>
                </div>
              </div>

              {/* Plan Title */}
              <div>
                <h3 className="text-lg font-black text-brand-navy-900 tracking-tight leading-snug">
                  {translatePlanTitle(plan.title, isEn)}
                </h3>
              </div>

              {/* Audience & Coach Details Card */}
              <div className="p-3 rounded-xl bg-brand-navy-50 border border-brand-navy-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[18px] ${plan.isCustom ? 'text-brand-sand-700 dark:text-brand-sand-400' : 'text-brand-teal-700 dark:text-brand-teal-400'}`}>
                    {plan.isCustom ? 'person' : 'groups'}
                  </span>
                  <div>
                    <span className="text-brand-navy-500">{isEn ? 'Audience: ' : 'Đối tượng: '}</span>
                    <strong className="text-brand-navy-900">
                      {plan.isCustom
                        ? (isEn ? `${plan.memberName} (Personal)` : `${plan.memberName} (Học viên riêng)`)
                        : (isEn ? `All students in ${translateClassName(plan.className, isEn)}` : `Toàn bộ học viên lớp`)}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-brand-navy-500 text-[11px] shrink-0">
                  <span className="material-symbols-outlined text-[15px] text-brand-navy-400">sports</span>
                  <span>{isEn ? 'Coach: ' : 'HLV: '}</span>
                  <strong className="text-brand-navy-700">{translateCoachName(plan.coachName, isEn)}</strong>
                </div>
              </div>

              {/* Coaching Goal Block */}
              <div className="p-3.5 rounded-xl bg-brand-sand-50/40 border border-brand-sand-100/80 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-brand-sand-900 dark:text-brand-sand-400 font-bold text-[11px] uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[15px] text-brand-sand-700 dark:text-brand-sand-400">flag</span>
                  <span>{isEn ? 'Coaching Goal' : 'Mục tiêu huấn luyện'}</span>
                </div>
                <p className="text-brand-navy-700 italic pl-5 leading-relaxed font-medium">
                  "{translatePlanGoal(plan.goal, isEn)}"
                </p>
              </div>

              {/* Exercises List Section */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-navy-600">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-brand-navy-400">fitness_center</span>
                    <span>{isEn ? `Exercises in plan (${resolvedExercises.length})` : `Các bài tập trong giáo án (${resolvedExercises.length}):`}</span>
                  </span>
                </div>

                {resolvedExercises.length > 0 ? (
                  <div className="space-y-2">
                    {resolvedExercises.slice(0, 4).map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-brand-navy-100 bg-white hover:bg-brand-navy-50/80 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-brand-navy-100 text-brand-navy-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-brand-navy-900 truncate">
                              {translateExerciseName(ex.name, isEn)}
                            </div>
                            {ex.note && (
                              <div className="text-[11px] text-brand-navy-500 italic truncate">
                                {translateExerciseNote(ex.note, isEn)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right font-chivo font-black text-brand-navy-800 text-[11px] px-2.5 py-1 rounded-lg bg-brand-navy-100 shrink-0 border border-brand-navy-200">
                          {ex.sets} {isEn ? 'sets ×' : 'hiệp ×'} {translateReps(ex.reps, isEn)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-brand-navy-200 text-center text-xs text-brand-navy-500 space-y-1.5">
                    <span className="material-symbols-outlined text-[24px] text-brand-navy-300">fitness_center</span>
                    <div>{isEn ? 'No exercises added yet' : 'Chưa cập nhật chi tiết bài tập'}</div>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(plan)}
                      className="text-[11px] font-bold text-brand-teal-700 dark:text-brand-teal-400 hover:text-brand-teal-800 cursor-pointer"
                    >
                      + {isEn ? 'Add exercises now' : 'Bổ sung bài tập ngay'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer with Duration & Action Buttons */}
            <div className="px-5 py-3.5 bg-brand-navy-50/90 border-t border-brand-navy-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="text-[11px] text-brand-navy-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-brand-navy-400">calendar_month</span>
                <span>
                  {isEn ? 'Period: ' : 'Thời hạn: '}
                  <strong className="text-brand-navy-700">{plan.startDate || '2026-10-01'}</strong> ➜ <strong className="text-brand-navy-700">{plan.endDate || (isEn ? 'Ongoing' : 'Dài hạn')}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {/* View Details Button */}
                <button
                  type="button"
                  onClick={() => setSelectedPlanDetail(plan)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-brand-navy-200 text-brand-navy-700 hover:bg-brand-navy-100 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  title={isEn ? "View complete details" : "Xem toàn bộ giáo án"}
                >
                  <span className="material-symbols-outlined text-[15px] text-brand-navy-500">visibility</span>
                  <span>{isEn ? 'Details' : 'Chi tiết'}</span>
                </button>

                {/* Edit / Add Exercises Button */}
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(plan)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-brand-navy-200 text-brand-navy-700 hover:text-brand-navy-900 hover:border-brand-navy-300 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  title={isEn ? "Edit plan and exercises" : "Chỉnh sửa bài tập và mục tiêu"}
                >
                  <span className="material-symbols-outlined text-[15px] text-brand-navy-500">edit</span>
                  <span>{isEn ? 'Edit' : 'Sửa'}</span>
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeletePlan(plan.id, plan.title)}
                  className="p-1.5 text-brand-navy-400 hover:text-brand-danger-600 rounded-lg hover:bg-brand-danger-50 transition-colors cursor-pointer"
                  title={isEn ? "Delete this plan" : "Xóa giáo án này"}
                >
                  <span className="material-symbols-outlined text-[17px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
