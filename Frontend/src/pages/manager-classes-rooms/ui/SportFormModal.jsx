import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';

export function SportFormModal({ busy, fieldErrors, form, handleBlur, handleFormChange, handleSaveModal, isEn, modal, setModal }) {
  return (
    <Modal
      isOpen={modal?.type === 'sport'}
      onClose={() => !busy && setModal(null)}
      title={
        modal?.row
          ? isEn
            ? `Edit Discipline: ${modal.row.name}`
            : `Chỉnh sửa bộ môn: ${modal.row.name}`
          : isEn
          ? 'Add New Sport Discipline'
          : 'Thêm Bộ Môn Thể Thao Mới'
      }
    >
      <form noValidate onSubmit={handleSaveModal} className="space-y-4">
        <div>
          <label htmlFor="sport-name-input" className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
            {isEn ? 'Discipline Name' : 'Tên bộ môn thể thao'} <span className="text-brand-danger-500">*</span>
          </label>
          <input
            id="sport-name-input"
            type="text"
            name="name"
            maxLength={100}
            placeholder={isEn ? 'e.g. Pickleball Pro, Sport Archery' : 'VD: Pickleball Đỉnh Cao, Bắn Cung Thể Thao'}
            value={form.name || ''}
            onChange={handleFormChange}
            onBlur={handleBlur}
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? 'sport-name-error' : undefined}
            className={`w-full p-2.5 rounded-xl text-sm transition-all ${
                fieldErrors.name
                  ? 'bg-brand-danger-50/25 dark:bg-brand-danger-950/25 border-2 border-brand-danger-500 text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-danger-400/30 focus:border-brand-danger-500'
                  : 'bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500'
              }`}
          />
          {fieldErrors.name && (
            <p
              id="sport-name-error"
              role="alert"
              className="mt-1 text-xs text-brand-danger-600 dark:text-brand-danger-400 font-semibold flex items-center gap-1.5 animate-fadeIn"
            >
              <span className="material-symbols-outlined text-[15px] shrink-0 text-brand-danger-500">error</span>
              <span>{fieldErrors.name}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
            {isEn ? 'Description & Regulations' : 'Mô tả bộ môn & Quy chuẩn'}
          </label>
          <textarea
            name="description"
            rows="3"
            maxLength={500}
            placeholder={isEn ? 'Discipline overview, physical requirements, gear...' : 'Nhập mô tả bộ môn, yêu cầu thể lực, trang thiết bị...'}
            value={form.description || ''}
            onChange={handleFormChange}
            className="w-full p-2.5 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-sm text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
            {isEn ? 'Operational Status' : 'Trạng thái sử dụng'}
          </label>
          <select
            name="status"
            value={form.status || 'Active'}
            onChange={handleFormChange}
            className="w-full p-2.5 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-sm text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500"
          >
            <option value="Active">{isEn ? 'Active' : 'Đang sử dụng (Active)'}</option>
            <option value="Inactive">{isEn ? 'Inactive' : 'Ngừng sử dụng (Inactive)'}</option>
          </select>
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
            <span>{busy ? (isEn ? 'Saving...' : 'Đang lưu...') : modal?.row ? (isEn ? 'Save Changes' : 'Lưu thay đổi') : isEn ? 'Create Discipline' : 'Tạo bộ môn'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
