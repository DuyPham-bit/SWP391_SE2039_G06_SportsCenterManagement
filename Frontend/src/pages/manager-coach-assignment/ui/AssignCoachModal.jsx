import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { isCoachCompatible } from '../model/coachAssignmentView.js';
import { BusinessAlert } from '../../../shared/ui/BusinessAlert.jsx';

export function AssignCoachModal({
  assignError, assigning, coaches, compatibleCoaches, handleConfirmAssign, isEn, modalOpen,
  selectedClass, selectedCoachId, setAssignError, setModalOpen, setSelectedCoachId
}) {
  return (
    <Modal
      isOpen={modalOpen}
      onClose={() => !assigning && setModalOpen(false)}
      title={isEn ? 'Assign Coach to Training Class' : 'Phân Công Huấn Luyện Viên Cho Lớp Học'}
    >
      {selectedClass && (
        <form onSubmit={handleConfirmAssign} className="space-y-4">
          {/* Class Info Summary Card */}
          <div className="p-4 rounded-2xl bg-brand-navy-50 dark:bg-brand-navy-800/60 border border-brand-navy-200 dark:border-brand-navy-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-brand-sage-700/10 text-brand-sage-700 dark:text-brand-sage-500 border border-brand-sage-700/20">
                <span className="material-symbols-outlined text-[14px]">school</span>
                {selectedClass.sportName}
              </span>
              <span className="text-xs text-brand-navy-500 dark:text-brand-navy-400 font-semibold">
                {isEn ? 'Class ID:' : 'Mã lớp:'} #{selectedClass.id}
              </span>
            </div>
            <h3 className="font-bold text-brand-navy-900 dark:text-brand-navy-100 text-base">{selectedClass.name}</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-brand-navy-600 dark:text-brand-navy-300 pt-1 border-t border-brand-navy-200/60 dark:border-brand-navy-700">
              <div>
                {isEn ? 'Court:' : 'Phòng tập:'} <strong>{selectedClass.roomName || (isEn ? 'Not selected' : 'Chưa chọn')}</strong>
              </div>
              <div>
                {isEn ? 'Duration:' : 'Thời lượng:'} <strong>{selectedClass.durationMinutes || 60} {isEn ? 'mins' : 'phút'}</strong>
              </div>
              <div>
                {isEn ? 'Capacity:' : 'Sức chứa:'} <strong>{selectedClass.capacity} {isEn ? 'students' : 'học viên'}</strong>
              </div>
              <div>
                {isEn ? 'Enrolled:' : 'Hiện có:'} <strong>{selectedClass.enrolledCount || 0} {isEn ? 'registered' : 'đăng ký'}</strong>
              </div>
            </div>
          </div>

          {/* Coach Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1.5">
              {isEn ? 'Select Lead Coach *' : 'Chọn Huấn luyện viên phụ trách'} <span className="text-brand-danger-500">*</span>
            </label>
            <select
              value={selectedCoachId}
              onChange={(e) => {
                setSelectedCoachId(e.target.value);
                setAssignError(null);
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 focus:outline-none focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-brand-navy-100"
            >
              {compatibleCoaches.length === 0 ? (
                <option value="" disabled>
                  {isEn ? '-- No coaches qualified for this discipline --' : '-- Không có HLV phụ trách bộ môn này --'}
                </option>
              ) : (
                <>
                  {!selectedCoachId && (
                    <option value="" disabled>
                      {isEn ? '-- Select Lead Coach --' : '-- Chọn HLV phụ trách --'}
                    </option>
                  )}
                  {compatibleCoaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Notice if no coach qualified */}
          {compatibleCoaches.length === 0 && (
            <div className="p-3.5 rounded-xl bg-brand-sand-50 dark:bg-brand-sand-950/40 border border-brand-sand-200 dark:border-brand-sand-800 text-brand-sand-800 dark:text-brand-sand-300 text-xs flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-brand-sand-700 dark:text-brand-sand-400 shrink-0">warning</span>
              <div>
                <strong>{isEn ? 'No coach available for this discipline' : 'Chưa có HLV phụ trách bộ môn này'}</strong>
                <p className="text-[11px] text-brand-sand-700 dark:text-brand-sand-400 mt-0.5">
                  {isEn
                    ? `No active coach is certified for "${selectedClass.sportName}". Please assign this sport to a coach in Coaches Directory.`
                    : `Chưa có huấn luyện viên nào phụ trách bộ môn "${selectedClass.sportName}". Vui lòng phân công bộ môn cho HLV trong mục Danh sách HLV.`}
                </p>
              </div>
            </div>
          )}

          {/* Match / Mismatch Assessment */}
          {(() => {
            const candidate = coaches.find((c) => String(c.id) === String(selectedCoachId));
            if (!candidate) return null;
            const isMatch = isCoachCompatible(candidate, selectedClass);

            if (isMatch) {
              return (
                <div className="p-3.5 rounded-xl bg-brand-sage-50 dark:bg-brand-sage-950/40 border border-brand-sage-200 dark:border-brand-sage-800 text-brand-sage-800 dark:text-brand-sage-300 text-xs flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-brand-sage-700 dark:text-brand-sage-400 shrink-0">verified</span>
                  <div>
                    <strong>{isEn ? 'Specialty perfectly matched!' : 'Chuyên môn hoàn toàn phù hợp!'}</strong>
                    <p className="text-[11px] text-brand-sage-700 dark:text-brand-sage-400 mt-0.5">
                      {isEn
                        ? `Coach ${candidate.fullName} has discipline "${candidate.specialization}" matching "${selectedClass.sportName}".`
                        : `HLV ${candidate.fullName} có chuyên môn "${candidate.specialization}" khớp với bộ môn "${selectedClass.sportName}".`}
                    </p>
                  </div>
                </div>
              );
            }

            if (isMatch === false) {
              return (
                <BusinessAlert
                  type="warning"
                  title={isEn ? 'Discipline Mismatch Warning' : 'Cảnh báo lệch chuyên môn huấn luyện'}
                  message={
                    isEn
                      ? `Coach ${candidate.fullName} specializes in "${candidate.specialization}", which differs from "${selectedClass.sportName}".`
                      : `HLV ${candidate.fullName} có chuyên môn chính là "${candidate.specialization}", khác với bộ môn "${selectedClass.sportName}" của lớp học này.`
                  }
                  proposedHandling={
                    isEn
                      ? 'Manager must cross-reference subsidiary certifications to guarantee Olympic standard training quality.'
                      : 'Quản lý cần đối chiếu chứng chỉ phụ hoặc năng lực thực tế của HLV trước khi phê duyệt để đảm bảo chất lượng đào tạo đạt chuẩn Olympic.'
                  }
                />
              );
            }

            return null;
          })()}

          {/* Error / Conflict Alert */}
          {assignError && (
            <BusinessAlert
              type="error"
              title={isEn ? 'Coach Assignment Error' : 'Lỗi phân công huấn luyện viên'}
              code={assignError.code || 'COACH-ASSIGN-ERR'}
              message={assignError.message || String(assignError)}
              proposedHandling={
                assignError.proposedHandling ||
                (isEn
                  ? 'System detected a schedule conflict with another class; please reassign or adjust timetable.'
                  : 'Hệ thống phát hiện trùng lịch dạy của HLV ở lớp khác; vui lòng đổi HLV hoặc điều chỉnh lịch học.')
              }
            />
          )}

          {/* Anti-Conflict Notice */}
          <div className="p-3.5 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/60 border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 text-xs flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-brand-sage-700 dark:text-brand-sage-500 shrink-0 mt-0.5">verified_user</span>
            <span>
              {isEn
                ? 'SCMS automatically verifies coach teaching schedules. Any detected conflict blocks the assignment and issues an alert.'
                : 'Hệ thống SCMS tự động đối soát lịch giảng dạy của HLV. Nếu phát hiện trùng ca dạy ở lớp khác, hệ thống sẽ phát tín hiệu cảnh báo xung đột và ngăn chặn phân công.'}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800">
            <button
              type="button"
              disabled={assigning}
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-300 transition"
            >
              {isEn ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={assigning || !selectedCoachId || String(selectedCoachId) === String(selectedClass?.coachId) || compatibleCoaches.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 text-white shadow-md shadow-brand-sage-700/20 transition active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>{assigning ? (isEn ? 'Verifying...' : 'Đang xác thực...') : isEn ? 'Confirm Assignment' : 'Xác Nhận Phân Công'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
