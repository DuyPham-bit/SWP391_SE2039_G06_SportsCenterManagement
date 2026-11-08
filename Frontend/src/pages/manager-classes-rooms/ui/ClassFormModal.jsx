import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';

export function ClassFormModal({
  availableClassCoaches, availableClassRooms, busy, data, fieldErrors, form, formError, handleBlur,
  handleFormChange, handleSaveModal, isEn, modal, setModal
}) {
  return (
    <Modal
      isOpen={modal?.type === 'class'}
      onClose={() => !busy && setModal(null)}
      title={
        modal?.row
          ? isEn
            ? `Edit Class: ${modal.row.name}`
            : `Chỉnh sửa lớp: ${modal.row.name}`
          : isEn
          ? 'Open New Training Class'
          : 'Mở Lớp Đào Tạo Mới'
      }
    >
      <form noValidate onSubmit={handleSaveModal} className="space-y-4">
        {formError && <p role="alert" className="rounded-xl bg-brand-danger-50 dark:bg-brand-danger-950/40 p-3 text-sm text-brand-danger-700 dark:text-brand-danger-300">{formError}</p>}
        <div className="space-y-1">
          <label htmlFor="class-name-input" className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300">
            {isEn ? 'Class Name' : 'Tên lớp đào tạo'} <span className="text-brand-danger-500">*</span>
          </label>
          <input
            id="class-name-input"
            type="text"
            name="name"
            maxLength={100}
            placeholder={isEn ? 'e.g. Olympic Freestyle Swimming K02' : 'VD: Bơi sải Kỹ thuật Olympic K02'}
            value={form.name || ''}
            onChange={handleFormChange}
            onBlur={handleBlur}
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? 'class-name-error' : undefined}
            className={`w-full p-2.5 rounded-xl text-sm transition-all ${
                fieldErrors.name
                  ? 'bg-brand-danger-50/25 dark:bg-brand-danger-950/25 border-2 border-brand-danger-500 text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-danger-400/30 focus:border-brand-danger-500'
                  : 'bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500'
              }`}
          />
          {fieldErrors.name && (
            <p
              id="class-name-error"
              role="alert"
              className="mt-1 text-xs text-brand-danger-600 dark:text-brand-danger-400 font-semibold flex items-center gap-1.5 animate-fadeIn"
            >
              <span className="material-symbols-outlined text-[15px] shrink-0 text-brand-danger-500">error</span>
              <span>{fieldErrors.name}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="class-sport-select" className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
              {isEn ? 'Sport Discipline' : 'Bộ môn thể thao'} <span className="text-brand-danger-500">*</span>
            </label>
            <select
              id="class-sport-select"
              name="sportId"
              value={form.sportId || ''}
              onChange={handleFormChange}
              onBlur={handleBlur}
              aria-invalid={!!fieldErrors.sportId}
              aria-describedby={fieldErrors.sportId ? 'class-sport-error' : undefined}
              className={`w-full p-2.5 rounded-xl text-sm transition-all ${
                  fieldErrors.sportId
                    ? 'bg-brand-danger-50/25 dark:bg-brand-danger-950/25 border-2 border-brand-danger-500 text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-danger-400/30 focus:border-brand-danger-500'
                    : 'bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500'
                }`}
            >
              <option value="">{isEn ? 'Select sport discipline' : 'Chọn bộ môn thể thao'}</option>
              {data.sports
                .filter((s) => s.status === 'Active')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
            {fieldErrors.sportId && (
              <p
                id="class-sport-error"
                role="alert"
                className="mt-1 text-xs text-brand-danger-600 dark:text-brand-danger-400 font-semibold flex items-center gap-1.5 animate-fadeIn"
              >
                <span className="material-symbols-outlined text-[15px] shrink-0 text-brand-danger-500">error</span>
                <span>{fieldErrors.sportId}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
              {isEn ? 'Training Level' : 'Cấp độ đào tạo'}
            </label>
            <select
              name="level"
              value={form.level || 'Cơ bản'}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-sm text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500"
            >
              <option value="Cơ bản">{isEn ? 'Beginner (Cơ bản)' : 'Cơ bản (Người mới bắt đầu)'}</option>
              <option value="Trung cấp">{isEn ? 'Intermediate (Trung cấp)' : 'Trung cấp'}</option>
              <option value="Nâng cao">{isEn ? 'Advanced (Nâng cao)' : 'Nâng cao (Chuyên sâu)'}</option>
              <option value="Mọi cấp độ">{isEn ? 'All Levels (Mọi cấp độ)' : 'Mọi cấp độ (All Levels)'}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
              {isEn ? 'Default Court / Room' : 'Phòng tập mặc định'}
            </label>
            <select
              name="roomId"
              value={form.roomId || ''}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-sm text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500"
            >
              <option value="">{isEn ? 'Select court or room' : 'Chọn phòng tập / Sân bãi'}</option>
              {availableClassRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.type || (isEn ? 'Cap' : 'Sức chứa')}: {r.capacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
              {isEn ? 'Assigned Coach' : 'Huấn luyện viên phụ trách'}
            </label>
            <select
              name="coachId"
              value={form.coachId || ''}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-sm text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500"
            >
              <option value="">
                {!form.sportId
                  ? (isEn ? 'Please select sport first' : 'Vui lòng chọn bộ môn trước')
                  : (isEn ? 'Assign later' : 'Chưa phân công HLV ngay')}
              </option>
              {availableClassCoaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="class-capacity-input" className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
              {isEn ? 'Max Capacity (Students)' : 'Sức chứa tối đa (Học viên)'} <span className="text-brand-danger-500">*</span>
            </label>
            <input
              id="class-capacity-input"
              type="number"
              name="capacity"
              min="1"
              max="500"
              value={form.capacity || 20}
              onChange={handleFormChange}
              onBlur={handleBlur}
              aria-invalid={!!fieldErrors.capacity}
              aria-describedby={fieldErrors.capacity ? 'class-capacity-error' : undefined}
              className={`w-full p-2.5 rounded-xl text-sm transition-all ${
                  fieldErrors.capacity
                    ? 'bg-brand-danger-50/25 dark:bg-brand-danger-950/25 border-2 border-brand-danger-500 text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-danger-400/30 focus:border-brand-danger-500'
                    : 'bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500'
                }`}
            />
            {fieldErrors.capacity && (
              <p
                id="class-capacity-error"
                role="alert"
                className="mt-1 text-xs text-brand-danger-600 dark:text-brand-danger-400 font-semibold flex items-center gap-1.5 animate-fadeIn"
              >
                <span className="material-symbols-outlined text-[15px] shrink-0 text-brand-danger-500">error</span>
                <span>{fieldErrors.capacity}</span>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="class-duration-input" className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
              {isEn ? 'Session Duration (Mins)' : 'Thời lượng ca học (Phút)'} <span className="text-brand-danger-500">*</span>
            </label>
            <input
              id="class-duration-input"
              type="number"
              name="durationMinutes"
              min="15"
              max="300"
              value={form.durationMinutes || 60}
              onChange={handleFormChange}
              onBlur={handleBlur}
              aria-invalid={!!fieldErrors.durationMinutes}
              aria-describedby={fieldErrors.durationMinutes ? 'class-duration-error' : undefined}
              className={`w-full p-2.5 rounded-xl text-sm transition-all ${
                  fieldErrors.durationMinutes
                    ? 'bg-brand-danger-50/25 dark:bg-brand-danger-950/25 border-2 border-brand-danger-500 text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-danger-400/30 focus:border-brand-danger-500'
                    : 'bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500'
                }`}
            />
            {fieldErrors.durationMinutes && (
              <p
                id="class-duration-error"
                role="alert"
                className="mt-1 text-xs text-brand-danger-600 dark:text-brand-danger-400 font-semibold flex items-center gap-1.5 animate-fadeIn"
              >
                <span className="material-symbols-outlined text-[15px] shrink-0 text-brand-danger-500">error</span>
                <span>{fieldErrors.durationMinutes}</span>
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
            {isEn ? 'Description & Syllabus' : 'Mô tả chi tiết & Giáo trình khóa học'}
          </label>
          <textarea
            name="description"
            rows="3"
            maxLength={500}
            placeholder={isEn ? 'Course goals, expected skills, necessary equipment...' : 'Nhập mục tiêu khóa học, kỹ năng đạt được, trang bị cần chuẩn bị...'}
            value={form.description || ''}
            onChange={handleFormChange}
            className="w-full p-2.5 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-sm text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500"
          />
        </div>

        <div className="p-3 bg-brand-navy-50 dark:bg-brand-navy-800/60 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300">
            <input
              type="checkbox"
              name="allowWaitlist"
              checked={form.allowWaitlist !== false}
              onChange={handleFormChange}
              className="w-4 h-4 text-brand-sage-700 dark:text-brand-sage-400 rounded border-brand-navy-300 focus:ring-brand-sage-500"
            />
            <span>{isEn ? 'Allow member waitlist reservations when class is fully booked' : 'Cho phép hội viên đăng ký hàng chờ (Waitlist) khi lớp đầy chỗ'}</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800">
          <button
            type="button"
            disabled={busy}
            onClick={() => setModal(null)}
            className="px-4 py-2 bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 text-sm font-semibold rounded-xl transition"
          >
            {isEn ? 'Cancel' : 'Hủy bỏ'}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-sage-700 hover:bg-brand-sage-900 text-white text-sm font-semibold rounded-xl transition shadow shadow-brand-sage-700/20 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>
              {busy
                ? isEn
                  ? 'Saving...'
                  : 'Đang lưu...'
                : modal?.row
                ? isEn
                  ? 'Save Class Changes'
                  : 'Lưu thay đổi lớp'
                : isEn
                ? 'Create Class'
                : 'Tạo lớp đào tạo'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
