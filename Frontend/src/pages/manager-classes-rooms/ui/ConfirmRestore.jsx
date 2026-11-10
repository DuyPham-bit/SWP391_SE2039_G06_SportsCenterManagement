import React from 'react';
import { primaryButton, secondaryButton } from './formStyles.js';
import { Icon } from './Icon.jsx';

export function ConfirmRestore({ row, busy, isEn, onClose, onConfirm }) {
  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-xl border border-brand-sage-200 dark:border-brand-sage-800 bg-brand-sage-50 dark:bg-brand-sage-950/40 p-4 text-brand-sage-800 dark:text-brand-sage-300">
        <Icon className="shrink-0">restart_alt</Icon>
        <div>
          <p className="font-black">
            {isEn ? `Restore class "${row.name}"?` : `Mở lại lớp “${row.name}”?`}
          </p>
          <p className="mt-1 text-sm">
            {isEn
              ? 'The class will return to draft status for inspection and schedule re-configuration.'
              : 'Lớp sẽ trở về trạng thái bản nháp để bạn kiểm tra và cấu hình lại.'}
          </p>
        </div>
      </div>
      <p className="text-sm text-brand-navy-600 dark:text-brand-navy-400">
        {isEn
          ? 'For data integrity, past cancelled sessions and bookings remain archived. Please create a new schedule, verify coach assignments, then publish.'
          : 'Vì an toàn dữ liệu, lịch, buổi học, đăng ký và lượt đặt chỗ cũ vẫn giữ trạng thái đã hủy. Hãy tạo lịch mới, kiểm tra HLV rồi công bố lại lớp.'}
      </p>
      <div className="flex justify-end gap-2">
        <button className={secondaryButton} disabled={busy} onClick={onClose}>
          {isEn ? 'Later' : 'Để sau'}
        </button>
        <button className={primaryButton} disabled={busy} onClick={onConfirm}>
          {busy ? (isEn ? 'Restoring...' : 'Đang mở lại...') : isEn ? 'Reopen as Draft' : 'Mở lại thành bản nháp'}
        </button>
      </div>
    </div>
  );
}
