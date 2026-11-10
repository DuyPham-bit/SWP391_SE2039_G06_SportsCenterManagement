import React from 'react';

export function DataErrorsNotice({ displayErrors, isEn }) {
  return (
    <div role="alert" className="p-4 rounded-2xl bg-brand-danger-50 dark:bg-brand-danger-950/40 border border-brand-danger-200 dark:border-brand-danger-900/60 text-xs text-brand-danger-800 dark:text-brand-danger-200 space-y-1 shadow-xs animate-fade-slide-up">
      <p className="font-bold flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[16px] text-brand-danger-600 dark:text-brand-danger-400">error</span>
        {isEn ? 'Some data could not be loaded.' : 'Một số dữ liệu chưa tải được. Bấm nút đồng bộ trên thanh tiêu đề để thử lại.'}
      </p>
      {Object.entries(displayErrors).map(([key, message]) => (
        <p key={key} className="pl-6 text-brand-navy-700 dark:text-brand-navy-300">
          • {({
            bookings: isEn ? 'Schedule' : 'Lịch tập',
            progress: isEn ? 'Progress' : 'Chỉ số thể chất',
            plans: isEn ? 'Lesson Plans' : 'Giáo án rèn luyện',
            notifications: isEn ? 'Notifications' : 'Thông báo'
          })[key] || key}: {message}
        </p>
      ))}
    </div>
  );
}
