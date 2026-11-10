import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';

export function CancelClassModal({ busy, handleConfirmCancelClass, isEn, modal, setModal }) {
  return (
    <Modal
      isOpen={modal?.type === 'cancel'}
      onClose={() => !busy && setModal(null)}
      title={isEn ? 'Confirm Class Cancellation' : 'Xác nhận Hủy Lớp Học'}
    >
      <div className="space-y-4">
        <div className="p-4 bg-brand-danger-50 dark:bg-brand-danger-950/40 border border-brand-danger-200 dark:border-brand-danger-900/60 rounded-2xl flex items-start gap-3">
          <span className="material-symbols-outlined text-brand-danger-600 dark:text-brand-danger-400 text-[26px] shrink-0">warning</span>
          <div className="space-y-1 text-sm text-brand-danger-900 dark:text-brand-danger-200">
            <p className="font-bold">
              {isEn ? `Are you sure you want to cancel class "${modal?.row?.name}"?` : `Bạn có chắc chắn muốn hủy lớp "${modal?.row?.name}"?`}
            </p>
            <p className="text-brand-danger-700 dark:text-brand-danger-300 text-xs">
              {isEn
                ? 'This action will cancel all upcoming sessions in this class schedule and notify enrolled members.'
                : 'Hành động này sẽ hủy tất cả các buổi học sắp tới trong lịch biểu của lớp và thông báo đến học viên đã ghi danh.'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setModal(null)}
            className="px-4 py-2 bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 text-sm font-semibold rounded-xl transition"
          >
            {isEn ? 'Back' : 'Quay lại'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleConfirmCancelClass}
            className="px-5 py-2 bg-brand-danger-600 hover:bg-brand-danger-700 text-white text-sm font-semibold rounded-xl transition shadow shadow-brand-danger-600/20 disabled:opacity-50"
          >
            {busy ? (isEn ? 'Processing...' : 'Đang xử lý...') : isEn ? 'Confirm Cancellation' : 'Xác nhận hủy lớp'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
