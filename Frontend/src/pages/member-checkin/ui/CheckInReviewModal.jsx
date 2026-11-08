import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';

export function CheckInReviewModal({
  handleOverrideCheckIn, isEn, overrideApprover, overrideModalOpen, overrideReason, processing,
  setOverrideApprover, setOverrideModalOpen, setOverrideReason
}) {
  return (
    <Modal
      isOpen={overrideModalOpen}
      onClose={() => setOverrideModalOpen(false)}
      title={isEn ? 'Submit Check-in Exception Review' : 'Gửi Yêu Cầu Xử Lý Ngoại Lệ Check-in'}
    >
      <form onSubmit={handleOverrideCheckIn} noValidate className="space-y-4">
        <div className="p-3.5 bg-brand-sand-50 dark:bg-brand-sand-950/30 rounded-xl border border-brand-sand-200 dark:border-brand-sand-800 text-xs text-brand-sand-900 dark:text-brand-sand-200 leading-relaxed">
          {isEn
            ? 'Requests and justifications are saved to the system for audit. Submitting does not automatically approve or unlock the gate; account validity and quota are still audited.'
            : 'Yêu cầu và lý do được lưu vào hệ thống để theo dõi xử lý. Việc gửi yêu cầu chưa phê duyệt check-in hoặc mở cổng; các điều kiện về tài khoản, gói tập và lượt vào vẫn được kiểm tra.'}
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
            {isEn ? 'Assigned Approver / Reviewer' : 'Người được đề nghị xử lý'}
          </label>
          <input
            type="text"
            value={overrideApprover}
            onChange={e => setOverrideApprover(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
            {isEn ? 'Justification Reason' : 'Lý do cần xử lý'}
          </label>
          <textarea
            rows={3}
            placeholder={
              isEn
                ? 'Enter exception reason (e.g., forgot physical card, coach confirmed makeup class)...'
                : 'Nhập lý do ngoại lệ (ví dụ: Học viên quên thẻ cứng, HLV Nguyễn Văn A xác nhận vào tập buổi bù)...'
            }
            value={overrideReason}
            onChange={e => setOverrideReason(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800">
          <button
            type="button"
            onClick={() => setOverrideModalOpen(false)}
            className="px-4 py-2 text-xs font-bold text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 rounded-lg cursor-pointer"
          >
            {isEn ? 'CANCEL' : 'HỦY BỎ'}
          </button>
          <button
            type="submit"
            disabled={processing}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-brand-sage-900 to-brand-sage-800 hover:brightness-110 rounded-lg shadow-sm hover-lift cursor-pointer disabled:opacity-50"
          >
            {processing ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'SUBMIT REQUEST' : 'LƯU YÊU CẦU')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
