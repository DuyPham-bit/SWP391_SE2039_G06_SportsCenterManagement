import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { getSportBadgeTheme, getResolvedExercises } from '../lib/planPresets.js';
import { translatePlanTitle, translateCoachName, translateClassName, translatePlanGoal, translateExerciseName, translateReps, translateExerciseNote } from '../../../shared/i18n/i18nHelper.js';

export function TrainingPlanDetailModal({ handleOpenEditModal, isEn, selectedPlanDetail, setSelectedPlanDetail }) {
  return (
    <Modal
      isOpen={Boolean(selectedPlanDetail)}
      onClose={() => setSelectedPlanDetail(null)}
      title={isEn ? "Detailed Olympic Lesson Plan" : "Chi Tiết Giáo Án Huấn Luyện Chuẩn Olympic"}
      maxWidth="max-w-3xl"
    >
      {(() => {
        const plan = selectedPlanDetail;
        const sportTheme = getSportBadgeTheme(plan.sportName, isEn);
        const resolvedExercises = getResolvedExercises(plan);

        return (
          <div className="space-y-5">
            {/* Modal Header Strip */}
            <div className={`p-4 rounded-2xl border ${sportTheme.bg} flex flex-wrap items-center justify-between gap-3`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${sportTheme.tagBg} flex items-center gap-1`}>
                    <span className="material-symbols-outlined text-[15px]">{sportTheme.icon}</span>
                    <span>{sportTheme.label}</span>
                  </span>
                  {plan.isCustom ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-sand-100 text-brand-sand-800 border border-brand-sand-300">
                      {isEn ? 'Custom Personal' : 'Phác đồ cá nhân'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-teal-100 text-brand-teal-800 border border-brand-teal-200">
                      {isEn ? 'Class Syllabus' : 'Giáo án toàn lớp'}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-brand-navy-900">
                  {translatePlanTitle(plan.title, isEn)}
                </h2>
              </div>

              <div className="text-right text-xs text-brand-navy-600">
                <div>{isEn ? 'Status: ' : 'Trạng thái: '}<strong className="text-brand-sage-700 dark:text-brand-sage-400 font-black">ACTIVE</strong></div>
                <div className="text-[11px] text-brand-navy-500">{isEn ? 'Coach: ' : 'HLV: '}{translateCoachName(plan.coachName, isEn)}</div>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-brand-navy-50 border border-brand-navy-200">
                <div className="text-brand-navy-500 font-bold mb-1 uppercase tracking-wider text-[10px]">
                  {isEn ? 'Target Audience' : 'Đối tượng áp dụng'}
                </div>
                <div className="font-bold text-brand-navy-900">
                  {plan.isCustom ? plan.memberName : (translateClassName(plan.className, isEn) || (isEn ? 'Whole Class' : 'Cả lớp'))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-brand-navy-50 border border-brand-navy-200">
                <div className="text-brand-navy-500 font-bold mb-1 uppercase tracking-wider text-[10px]">
                  {isEn ? 'Enrolled Class' : 'Lớp học'}
                </div>
                <div className="font-bold text-brand-navy-900">
                  {translateClassName(plan.className, isEn) || 'Olympic Course'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-brand-navy-50 border border-brand-navy-200">
                <div className="text-brand-navy-500 font-bold mb-1 uppercase tracking-wider text-[10px]">
                  {isEn ? 'Effective Period' : 'Thời gian hiệu lực'}
                </div>
                <div className="font-bold text-brand-navy-900">
                  {plan.startDate || '2026-10-01'} ➜ {plan.endDate || (isEn ? 'Ongoing' : 'Dài hạn')}
                </div>
              </div>
            </div>

            {/* Goal Quote */}
            <div className="p-4 rounded-xl bg-brand-sand-50/50 border border-brand-sand-200 text-xs space-y-1">
              <div className="font-bold uppercase tracking-wider text-brand-sand-900 dark:text-brand-sand-400 text-[11px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-brand-sand-700 dark:text-brand-sand-400">flag</span>
                <span>{isEn ? 'Primary Coaching Goal' : 'Mục tiêu huấn luyện trọng điểm'}</span>
              </div>
              <p className="text-brand-navy-800 italic pl-5 leading-relaxed font-semibold">
                "{translatePlanGoal(plan.goal, isEn)}"
              </p>
            </div>

            {/* Full Exercises Table */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-navy-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-brand-navy-500">list_alt</span>
                <span>{isEn ? `Comprehensive Exercise Routine (${resolvedExercises.length} drills)` : `Danh mục bài tập rèn luyện chi tiết (${resolvedExercises.length} bài)`}</span>
              </div>

              <div className="border border-brand-navy-200 rounded-xl overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead className="bg-brand-navy-100 text-brand-navy-700 uppercase font-bold text-[10px] tracking-wider border-b border-brand-navy-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">{isEn ? 'Exercise Drill' : 'Tên bài tập'}</th>
                      <th className="py-2.5 px-3 w-28 text-center">{isEn ? 'Sets x Reps' : 'Khối lượng'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'Technical Notes' : 'Hướng dẫn kỹ thuật'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-navy-100">
                    {resolvedExercises.map((ex, idx) => (
                      <tr key={idx} className="hover:bg-brand-navy-50">
                        <td className="py-2.5 px-3 text-center font-bold text-brand-navy-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-brand-navy-900">{translateExerciseName(ex.name, isEn)}</td>
                        <td className="py-2.5 px-3 text-center font-chivo font-black text-brand-navy-800 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-brand-navy-100 border border-brand-navy-200">
                            {ex.sets} {isEn ? 'sets x' : 'hiệp x'} {translateReps(ex.reps, isEn)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-brand-navy-600 italic">{translateExerciseNote(ex.note, isEn) || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-brand-navy-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border border-brand-navy-200 bg-white hover:bg-brand-navy-50 text-brand-navy-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>{isEn ? 'Print Plan' : 'In Giáo Án'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlanDetail(null);
                    handleOpenEditModal(plan);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-teal-50 text-brand-teal-700 hover:bg-brand-teal-100 border border-brand-teal-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  <span>{isEn ? 'Edit Plan' : 'Chỉnh Sửa'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlanDetail(null)}
                  className="px-4 py-2 rounded-xl bg-brand-navy-800 hover:bg-brand-navy-900 text-white font-bold text-xs cursor-pointer"
                >
                  {isEn ? 'Close' : 'Đóng'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </Modal>
  );
}
