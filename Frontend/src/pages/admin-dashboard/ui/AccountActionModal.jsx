import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MotionButton } from '../../../shared/ui/MotionButton.jsx';
import { RoleBadge } from './Badges.jsx';

// ─────────────────────────────────────────────────────────────
// Modal 3: Account Action Modal (Lock, Unlock, Revoke, Delete)
// ─────────────────────────────────────────────────────────────
export function AccountActionModal({ actionData, onClose, onConfirm, isSaving }) {
  // Hooks below must run on every render, so the "no action" early return comes after them.
  const type = actionData?.type;
  const account = actionData?.account;
  const isDelete = type === 'delete';
  const isLock = type === 'lock';
  const isUnlock = type === 'unlock';

  const defaultReasons = {
    delete: 'Admin xóa tài khoản Member',
    lock: 'Admin tạm khóa tài khoản để kiểm tra an ninh',
    unlock: 'Admin mở khóa tài khoản sau khi xác minh',
    'revoke-sessions': 'Admin thu hồi phiên đăng nhập khẩn cấp'
  };

  const [reason, setReason] = useState(defaultReasons[type] || '');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSaving]);

  if (!actionData) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = reason.trim();
    if (!finalReason) {
      setLocalError('Vui lòng nhập lý do thực hiện thao tác.');
      return;
    }
    setLocalError('');
    onConfirm(finalReason);
  };

  const modalNode = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-brand-navy-950/65 backdrop-blur-md transition-all duration-300"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        className="relative w-full max-w-[480px] bg-white dark:bg-brand-navy-900 rounded-3xl shadow-[0_25px_60px_-15px_rgba(30,34,53,0.35)] border border-brand-navy-100 dark:border-brand-navy-800 p-6 sm:p-7 text-left transition-all overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ambient lighting tint */}
        <div
          className={`absolute top-0 inset-x-0 h-32 pointer-events-none ${
            isDelete
              ? 'bg-gradient-to-b from-brand-danger-500/20 via-brand-danger-500/5 to-transparent'
              : isLock
              ? 'bg-gradient-to-b from-brand-sand-500/20 via-brand-sand-500/5 to-transparent'
              : isUnlock
              ? 'bg-gradient-to-b from-brand-sage-500/20 via-brand-sage-500/5 to-transparent'
              : 'bg-gradient-to-b from-brand-navy-500/20 via-brand-navy-500/5 to-transparent'
          }`}
        />

        {/* Close button */}
        <MotionButton
          type="button"
          disabled={isSaving}
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 text-brand-navy-500 dark:text-brand-navy-400 flex items-center justify-center transition-colors border border-brand-navy-200 dark:border-brand-navy-700 z-10 disabled:opacity-50 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </MotionButton>

        {/* Top Icon Badge & Header */}
        <div className="relative z-10 flex items-center gap-3.5 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${
              isDelete
                ? 'bg-brand-danger-100 dark:bg-brand-danger-950/80 text-brand-danger-600 dark:text-brand-danger-400 shadow-brand-danger-500/20 border border-brand-danger-200 dark:border-brand-danger-800'
                : isLock
                ? 'bg-brand-sand-100 dark:bg-brand-sand-950/80 text-brand-sand-700 dark:text-brand-sand-400 shadow-brand-sand-500/20 border border-brand-sand-200 dark:border-brand-sand-800'
                : isUnlock
                ? 'bg-brand-sage-100 dark:bg-brand-sage-950/80 text-brand-sage-700 dark:text-brand-sage-400 shadow-brand-sage-500/20 border border-brand-sage-200 dark:border-brand-sage-800'
                : 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 shadow-brand-navy-500/20 border border-brand-navy-200 dark:border-brand-navy-700'
            }`}
          >
            <span className="material-symbols-outlined text-[26px]">
              {isDelete ? 'delete_forever' : isLock ? 'lock' : isUnlock ? 'lock_open' : 'logout'}
            </span>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 ${
                isDelete
                  ? 'bg-brand-danger-100 dark:bg-brand-danger-950 text-brand-danger-800 dark:text-brand-danger-300'
                  : isLock
                  ? 'bg-brand-sand-100 dark:bg-brand-sand-950 text-brand-sand-800 dark:text-brand-sand-300'
                  : isUnlock
                  ? 'bg-brand-sage-100 dark:bg-brand-sage-950 text-brand-sage-800 dark:text-brand-sage-300'
                  : 'bg-brand-navy-200 dark:bg-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-300'
              }`}
            >
              {isDelete ? 'Hành động nguy hiểm' : isLock ? 'Bảo mật tài khoản' : isUnlock ? 'Khôi phục truy cập' : 'Quản trị phiên'}
            </span>
            <h3 className="text-lg font-black text-brand-navy-900 dark:text-white tracking-tight">
              {isDelete
                ? 'Xóa tài khoản Member'
                : isLock
                ? 'Khóa tài khoản người dùng'
                : isUnlock
                ? 'Mở khóa tài khoản'
                : 'Thu hồi toàn bộ phiên đăng nhập'}
            </h3>
          </div>
        </div>

        {/* Target Account Summary Card */}
        <div className="relative z-10 p-3 rounded-2xl bg-brand-navy-50 dark:bg-brand-navy-800/60 border border-brand-navy-200/80 dark:border-brand-navy-700/80 mb-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-navy-200 dark:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-200 font-black flex items-center justify-center text-xs shrink-0 uppercase">
              {account.username?.slice(0, 2) || 'SC'}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-brand-navy-900 dark:text-white text-sm truncate flex items-center gap-1.5">
                <span>{account.username}</span>
                <span className="text-[11px] font-semibold text-brand-navy-400">#{account.id}</span>
              </div>
              <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400 truncate">{account.email || 'Chưa cập nhật email'}</div>
            </div>
          </div>
          <RoleBadge role={account.role} />
        </div>

        {/* Consequence Note */}
        <div
          className={`relative z-10 p-3 rounded-xl text-xs leading-relaxed flex items-start gap-2.5 mb-4 border ${
            isDelete
              ? 'bg-brand-danger-50/90 dark:bg-brand-danger-950/40 border-brand-danger-200 dark:border-brand-danger-900 text-brand-danger-900 dark:text-brand-danger-200'
              : isLock
              ? 'bg-brand-sand-50/90 dark:bg-brand-sand-950/40 border-brand-sand-200 dark:border-brand-sand-900 text-brand-sand-900 dark:text-brand-sand-200'
              : isUnlock
              ? 'bg-brand-sage-50/90 dark:bg-brand-sage-950/40 border-brand-sage-200 dark:border-brand-sage-900 text-brand-sage-900 dark:text-brand-sage-200'
              : 'bg-brand-navy-100 dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
            {isDelete ? 'warning' : isLock ? 'shield' : isUnlock ? 'check_circle' : 'info'}
          </span>
          <div>
            {isDelete ? (
              <>
                <strong>Lưu ý:</strong> Thao tác này sẽ <strong>thu hồi quyền đăng nhập vĩnh viễn</strong> và ẩn danh thông tin cá nhân. <strong>Lịch sử giao dịch và hóa đơn vẫn được lưu giữ an toàn</strong> cho công tác kiểm toán tài chính.
              </>
            ) : isLock ? (
              <>
                Tài khoản sẽ bị tạm khóa ngay lập tức và không thể đăng nhập hoặc thực hiện bất kỳ giao dịch nào cho đến khi được mở khóa.
              </>
            ) : isUnlock ? (
              <>
                Tài khoản sẽ được kích hoạt lại ngay lập tức và người dùng có thể đăng nhập bình thường.
              </>
            ) : (
              <>
                Tất cả phiên đăng nhập hiện tại trên mọi thiết bị sẽ bị hủy ngay lập tức. Người dùng cần nhập lại mật khẩu để tiếp tục.
              </>
            )}
          </div>
        </div>

        {/* Reason Form */}
        <form onSubmit={handleSubmit} className="relative z-10 space-y-3.5">
          <div>
            <label htmlFor="action-reason" className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1.5">
              Lý do thực hiện <span className="text-brand-danger-500">*</span>
            </label>
            <input
              id="action-reason"
              autoFocus
              type="text"
              required
              maxLength={500}
              disabled={isSaving}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do thực hiện thao tác..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal-500 transition-all placeholder:text-brand-navy-400"
            />
            {localError && <p className="text-xs text-brand-danger-600 font-medium mt-1">{localError}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800">
            <MotionButton
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="min-h-10 px-4 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Hủy bỏ
            </MotionButton>
            <MotionButton
              type="submit"
              disabled={isSaving}
              className={`min-h-10 px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                isDelete
                  ? 'bg-gradient-to-r from-brand-danger-600 to-brand-danger-700 hover:from-brand-danger-700 hover:to-brand-danger-800 shadow-brand-danger-600/25'
                  : isLock
                  ? 'bg-gradient-to-r from-brand-sand-600 to-brand-terra-600 hover:from-brand-sand-700 hover:to-brand-terra-700 shadow-brand-sand-600/25'
                  : isUnlock
                  ? 'bg-gradient-to-r from-brand-sage-600 to-brand-teal-700 hover:from-brand-sage-700 hover:to-brand-teal-800 shadow-brand-sage-600/25'
                  : 'bg-gradient-to-r from-brand-navy-700 to-brand-navy-900 hover:from-brand-navy-800 hover:to-black shadow-brand-navy-700/25'
              }`}
            >
              {isSaving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              <span>
                {isSaving
                  ? 'Đang xử lý...'
                  : isDelete
                  ? 'Xác nhận xóa tài khoản'
                  : isLock
                  ? 'Xác nhận khóa'
                  : isUnlock
                  ? 'Xác nhận mở khóa'
                  : 'Xác nhận thu hồi phiên'}
              </span>
            </MotionButton>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}
