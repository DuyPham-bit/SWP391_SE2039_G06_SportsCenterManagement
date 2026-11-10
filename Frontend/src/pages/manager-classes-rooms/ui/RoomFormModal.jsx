import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';

export function RoomFormModal({ busy, fieldErrors, form, handleBlur, handleFormChange, handleSaveModal, isEn, modal, setModal }) {
  return (
    <Modal
      isOpen={modal?.type === 'room'}
      onClose={() => !busy && setModal(null)}
      title={
        modal?.row
          ? isEn
            ? `Edit Court/Room: ${modal.row.name}`
            : `Chỉnh sửa phòng: ${modal.row.name}`
          : isEn
          ? 'Add Court / Facility Room'
          : 'Thêm Phòng Tập / Sân Bãi'
      }
    >
      <form noValidate onSubmit={handleSaveModal} className="space-y-4">
        <div>
          <label htmlFor="room-name-input" className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
            {isEn ? 'Court / Room Name' : 'Tên phòng / Khu vực'} <span className="text-brand-danger-500">*</span>
          </label>
          <input
            id="room-name-input"
            type="text"
            name="name"
            maxLength={100}
            placeholder={isEn ? 'e.g. Olympic Pool 50m, Badminton Court #01' : 'VD: Bể bơi Olympic 50m, Sân Cầu lông #01'}
            value={form.name || ''}
            onChange={handleFormChange}
            onBlur={handleBlur}
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? 'room-name-error' : undefined}
            className={`w-full p-2.5 rounded-xl text-sm transition-all ${
                fieldErrors.name
                  ? 'bg-brand-danger-50/25 dark:bg-brand-danger-950/25 border-2 border-brand-danger-500 text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-danger-400/30 focus:border-brand-danger-500'
                  : 'bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500'
              }`}
          />
          {fieldErrors.name && (
            <p
              id="room-name-error"
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
            <label className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
              {isEn ? 'Room / Court Type' : 'Loại phòng / Sân bãi'}
            </label>
            <input
              type="text"
              name="type"
              maxLength={100}
              placeholder={isEn ? 'e.g. Swimming Pool, Indoor Court, Boxing Ring' : 'VD: Bể bơi, Sân trong nhà, Võ đài'}
              value={form.type || ''}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-sm text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500"
            />
          </div>

          <div>
            <label htmlFor="room-capacity-input" className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
              {isEn ? 'Max Capacity (Persons)' : 'Sức chứa tối đa (Người)'} <span className="text-brand-danger-500">*</span>
            </label>
            <input
              id="room-capacity-input"
              type="number"
              name="capacity"
              min="1"
              max="1000"
              value={form.capacity || 30}
              onChange={handleFormChange}
              onBlur={handleBlur}
              aria-invalid={!!fieldErrors.capacity}
              aria-describedby={fieldErrors.capacity ? 'room-capacity-error' : undefined}
              className={`w-full p-2.5 rounded-xl text-sm transition-all ${
                  fieldErrors.capacity
                    ? 'bg-brand-danger-50/25 dark:bg-brand-danger-950/25 border-2 border-brand-danger-500 text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-danger-400/30 focus:border-brand-danger-500'
                    : 'bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500'
                }`}
            />
            {fieldErrors.capacity && (
              <p
                id="room-capacity-error"
                role="alert"
                className="mt-1 text-xs text-brand-danger-600 dark:text-brand-danger-400 font-semibold flex items-center gap-1.5 animate-fadeIn"
              >
                <span className="material-symbols-outlined text-[15px] shrink-0 text-brand-danger-500">error</span>
                <span>{fieldErrors.capacity}</span>
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
            {isEn ? 'Location / Floor / Directions' : 'Vị trí / Tầng / Chỉ dẫn'}
          </label>
          <input
            type="text"
            name="location"
            maxLength={255}
            placeholder={isEn ? 'e.g. Floor 1 - Aquatic Sports Center, Building A' : 'VD: Tầng 1 - Khu thể thao dưới nước, Tòa A'}
            value={form.location || ''}
            onChange={handleFormChange}
            className="w-full p-2.5 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-sm text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500"
          />
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
            <span>{busy ? (isEn ? 'Saving...' : 'Đang lưu...') : modal?.row ? (isEn ? 'Save Changes' : 'Lưu thay đổi') : isEn ? 'Create Court' : 'Tạo phòng tập'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
