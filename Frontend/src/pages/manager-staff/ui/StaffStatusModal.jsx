import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';

export function StaffStatusModal({ handleToggleStatus, isEn, saving, setStatusConfirmStaff, statusConfirmStaff }) {
  return (
    <Modal
      isOpen={Boolean(statusConfirmStaff)}
      onClose={() => !saving && setStatusConfirmStaff(null)}
      title={isEn ? 'Confirm Staff Status Change' : 'Xác nhận trạng thái nhân sự'}
      maxWidth="max-w-md"
    >
      {statusConfirmStaff && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
                statusConfirmStaff.status === 'ACTIVE'
                  ? 'bg-brand-danger-50 dark:bg-brand-danger-950/40 border-brand-danger-200 dark:border-brand-danger-900/60 text-brand-danger-900 dark:text-brand-danger-200'
                  : 'bg-brand-sage-50 dark:bg-brand-sage-950/40 border-brand-sage-200 dark:border-brand-sage-900/60 text-brand-sage-900 dark:text-brand-sage-200'
              }`}
          >
            <span className="material-symbols-outlined text-[24px] flex-shrink-0">
              {statusConfirmStaff.status === 'ACTIVE' ? 'warning' : 'lock_open'}
            </span>
            <div className="text-xs space-y-1">
              <p className="font-bold text-sm">
                {statusConfirmStaff.status === 'ACTIVE'
                  ? isEn
                    ? `Lock account of "${statusConfirmStaff.fullName}"?`
                    : `Khóa tài khoản của "${statusConfirmStaff.fullName}"?`
                  : isEn
                  ? `Unlock account of "${statusConfirmStaff.fullName}"?`
                  : `Mở khóa tài khoản của "${statusConfirmStaff.fullName}"?`}
              </p>
              <p className="leading-relaxed">
                {statusConfirmStaff.status === 'ACTIVE'
                  ? isEn
                    ? 'When locked, the staff member cannot log in to the management system, take class attendance, or perform any operational functions.'
                    : 'Khi bị khóa, nhân viên sẽ không thể đăng nhập vào ứng dụng quản lý, không thể điểm danh ca dạy hoặc thực hiện bất kỳ nghiệp vụ nào.'
                  : isEn
                  ? 'When unlocked, the staff member will regain full system access and resume assignments normally.'
                  : 'Khi mở khóa, nhân viên sẽ khôi phục toàn bộ quyền truy cập và thực hiện nhiệm vụ bình thường.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800">
            <button
              type="button"
              disabled={saving}
              onClick={() => setStatusConfirmStaff(null)}
              className="px-4 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 text-xs font-bold hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 transition-colors"
            >
              {isEn ? 'Cancel' : 'Hủy bỏ'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleToggleStatus}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  statusConfirmStaff.status === 'ACTIVE'
                    ? 'bg-brand-danger-600 hover:bg-brand-danger-700 shadow-brand-danger-600/30'
                    : 'bg-brand-sage-700 hover:bg-brand-sage-900 shadow-brand-sage-700/30'
                }`}
            >
              {saving
                ? isEn
                  ? 'Updating...'
                  : 'Đang cập nhật...'
                : statusConfirmStaff.status === 'ACTIVE'
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
