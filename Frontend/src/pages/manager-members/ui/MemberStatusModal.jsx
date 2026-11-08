import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';

export function MemberStatusModal({ busy, handleToggleAccountStatus, isEn, modal, setModal }) {
  return (
    <Modal
      isOpen={modal?.type === 'status'}
      onClose={() => !busy && setModal(null)}
      title={isEn ? 'Confirm Account Status Change' : 'Xác nhận trạng thái tài khoản'}
      maxWidth="max-w-md"
    >
      {modal?.row && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
                modal.row.accountStatus === 'Active'
                  ? 'bg-brand-danger-50 dark:bg-brand-danger-950/40 border-brand-danger-200 dark:border-brand-danger-900/60 text-brand-danger-900 dark:text-brand-danger-200'
                  : 'bg-brand-sage-50 dark:bg-brand-sage-950/40 border-brand-sage-200 dark:border-brand-sage-900/60 text-brand-sage-900 dark:text-brand-sage-200'
              }`}
          >
            <span className="material-symbols-outlined text-[24px] flex-shrink-0">
              {modal.row.accountStatus === 'Active' ? 'warning' : 'lock_open'}
            </span>
            <div className="text-xs space-y-1">
              <p className="font-bold text-sm">
                {modal.row.accountStatus === 'Active'
                  ? isEn
                    ? `Lock account of "${modal.row.fullName}"?`
                    : `Khóa tài khoản của "${modal.row.fullName}"?`
                  : isEn
                  ? `Unlock account of "${modal.row.fullName}"?`
                  : `Mở khóa tài khoản của "${modal.row.fullName}"?`}
              </p>
              <p className="leading-relaxed">
                {modal.row.accountStatus === 'Active'
                  ? isEn
                    ? 'When locked, the member cannot log in, book class sessions, or check-in to sports facilities.'
                    : 'Khi bị khóa, thành viên sẽ không thể đăng nhập hệ thống, không thể đặt lịch lớp học hoặc check-in vào trung tâm.'
                  : isEn
                  ? 'When unlocked, the member will regain login access, class booking, and athletic check-in privileges.'
                  : 'Khi mở khóa, thành viên sẽ khôi phục quyền đăng nhập, đặt lịch và sử dụng dịch vụ trung tâm bình thường.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800">
            <button
              type="button"
              disabled={busy}
              onClick={() => setModal(null)}
              className="px-4 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 text-xs font-bold hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 transition-colors"
            >
              {isEn ? 'Cancel' : 'Hủy bỏ'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleToggleAccountStatus}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  modal.row.accountStatus === 'Active'
                    ? 'bg-brand-danger-600 hover:bg-brand-danger-700 shadow-brand-danger-600/30'
                    : 'bg-brand-sage-700 hover:bg-brand-sage-900 shadow-brand-sage-700/30'
                }`}
            >
              {busy
                ? isEn
                  ? 'Updating...'
                  : 'Đang cập nhật...'
                : modal.row.accountStatus === 'Active'
                ? isEn
                  ? 'Confirm Lock'
                  : 'Xác nhận khóa'
                : isEn
                ? 'Confirm Unlock'
                : 'Xác nhận mở khóa'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
