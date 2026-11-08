import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { translateClassName, translateSportName } from '../../../shared/i18n/i18nHelper.js';

export function TrainingPlanFormModal({
  activeModalClass, coachClasses, editingMemberName, editingPlanId, endDate, exercises, goal,
  handleAddExercise, handleClassChange, handleExerciseChange, handleRemoveExercise, handleSavePlan,
  isEditingCustom, isEn, modalOpen, saving, selectedClassId, setEndDate, setGoal, setModalOpen,
  setStartDate, setTitle, startDate, title
}) {
  return (
    <Modal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      title={
        editingPlanId
          ? (isEn ? "Edit Lesson Plan & Exercises" : "Chỉnh Sửa Giáo Án & Bài Tập")
          : (isEn ? "Create Class Lesson Plan" : "Soạn Thảo Giáo Án Chung Cho Lớp Học")
      }
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSavePlan} className="space-y-4">
        {/* Chọn Lớp học đảm nhiệm */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 mb-1">
            {isEn ? 'Select Assigned Class for Plan *' : 'Chọn Lớp Học Đảm Nhiệm Áp Dụng Giáo Án *'}
          </label>
          {coachClasses.length === 0 ? (
            <div className="p-2.5 rounded-lg bg-brand-sand-50 border border-brand-sand-200 text-xs text-brand-sand-800">
              {isEn ? 'You do not have any assigned classes yet.' : 'Bạn chưa có lớp học nào được phân công.'}
            </div>
          ) : (
            <select
              value={selectedClassId}
              onChange={e => handleClassChange(e.target.value)}
              disabled={Boolean(editingPlanId)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white font-semibold text-brand-navy-900 disabled:bg-brand-navy-100 disabled:text-brand-navy-500"
            >
              {coachClasses.map(c => (
                <option key={c.id} value={c.id}>
                  {translateClassName(c.name, isEn)} ({translateSportName(c.sportName, isEn)} • {isEn ? 'Enrolled:' : 'Sĩ số:'} {c.members?.length || 0} {isEn ? 'students' : 'học viên'})
                </option>
              ))}
            </select>
          )}
          {activeModalClass && (
            <div className="text-xs text-brand-navy-600 mt-2 flex flex-wrap items-center gap-3 bg-brand-navy-50 p-2.5 rounded-lg border border-brand-navy-200">
              <span className="text-brand-sage-700 dark:text-brand-sage-400 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">group</span>
                <span>
                  {isEditingCustom && editingMemberName
                    ? (isEn ? `Applied specifically to member: ${editingMemberName}` : `Áp dụng riêng cho học viên: ${editingMemberName}`)
                    : (isEn ? 'Plan will be assigned to all students in the class' : 'Giáo án sẽ áp dụng đồng loạt cho học viên trong lớp')}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Row 2: Tên giáo án & Mục tiêu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 mb-1">
              {isEn ? 'Plan Title *' : 'Tên giáo án *'}
            </label>
            <input
              type="text"
              required
              placeholder={isEn ? "e.g. 50m Stroke Optimization & Strength" : "VD: Tối ưu sải bơi 50m & Tăng cơ"}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 mb-1">
              {isEn ? 'Specific Training Goal *' : 'Mục tiêu rèn luyện cụ thể *'}
            </label>
            <input
              type="text"
              required
              placeholder={isEn ? "e.g. Improve endurance, gain 1kg lean mass" : "VD: Cải thiện sức bền, tăng 1kg cơ bắp"}
              value={goal}
              onChange={e => setGoal(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white"
            />
          </div>
        </div>

        {/* Row 3: Thời gian áp dụng */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 mb-1">
              {isEn ? 'Start Date' : 'Ngày bắt đầu'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 mb-1">
              {isEn ? 'End Date' : 'Ngày kết thúc'}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white"
            />
          </div>
        </div>

        {/* Exercise items builder */}
        <div className="space-y-3 pt-2 border-t border-brand-navy-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-navy-700">
              {isEn ? 'Detailed Exercise List' : 'Danh sách bài tập chi tiết'}
            </label>
            <button
              type="button"
              onClick={handleAddExercise}
              className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-400 hover:text-brand-navy-900 flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>{isEn ? 'Add Exercise' : 'Thêm bài tập'}</span>
            </button>
          </div>

          {exercises.map((ex, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-brand-navy-50 border border-brand-navy-200 grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <input
                  type="text"
                  placeholder={isEn ? "Exercise Name" : "Tên bài tập"}
                  value={ex.name}
                  onChange={e => handleExerciseChange(idx, 'name', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-brand-navy-300 bg-white"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder={isEn ? "Sets" : "Số hiệp"}
                  value={ex.sets}
                  onChange={e => handleExerciseChange(idx, 'sets', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded border border-brand-navy-300 bg-white text-center"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder={isEn ? "Reps" : "Lặp lại"}
                  value={ex.reps}
                  onChange={e => handleExerciseChange(idx, 'reps', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded border border-brand-navy-300 bg-white text-center"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder={isEn ? "Technical Notes" : "Lưu ý kỹ thuật"}
                  value={ex.note}
                  onChange={e => handleExerciseChange(idx, 'note', e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded border border-brand-navy-300 bg-white"
                />
              </div>
              <div className="col-span-1 text-center">
                <button
                  type="button"
                  onClick={() => handleRemoveExercise(idx)}
                  className="text-brand-navy-400 hover:text-brand-danger-600 p-1 cursor-pointer"
                  title={isEn ? "Remove exercise" : "Xóa bài tập"}
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-brand-navy-100">
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-brand-navy-200 hover:bg-brand-navy-50 text-brand-navy-600 cursor-pointer"
          >
            {isEn ? 'Cancel' : 'Hủy'}
          </button>
          <button
            type="submit"
            disabled={saving || !selectedClassId}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl text-brand-navy-900 hover:text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                saving || !selectedClassId
                  ? 'bg-brand-navy-300 text-brand-navy-500 cursor-not-allowed'
                  : 'bg-brand-sand-300 hover:bg-brand-terra-500'
              }`}
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                <span>{isEn ? 'Saving...' : 'Đang lưu...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>{editingPlanId ? (isEn ? 'Update Plan' : 'Cập Nhật Giáo Án') : (isEn ? 'Save & Assign Plan' : 'Lưu & Giao Giáo Án')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
