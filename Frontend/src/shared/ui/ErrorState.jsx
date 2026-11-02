import React from 'react';

export function ErrorState({
  title = 'Đã có lỗi xảy ra',
  message = 'Không thể tải được thông tin. Vui lòng thử lại sau.',
  onRetry = null,
  className = ''
}) {
  return (
    <div className={`p-6 text-center flex flex-col items-center justify-center rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-2.5">
        <span className="material-symbols-outlined text-[24px]">error</span>
      </div>
      <h3 className="text-xs sm:text-sm font-bold text-red-800 dark:text-red-300">{title}</h3>
      <p className="text-[11px] text-red-600 dark:text-red-400 max-w-sm mt-1 mb-3">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}

export default ErrorState;

