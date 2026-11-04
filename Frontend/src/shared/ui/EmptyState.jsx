import React from 'react';

export function EmptyState({
  icon = 'inbox',
  title = 'Không có dữ liệu',
  description = 'Hiện tại chưa có mục nào để hiển thị.',
  action = null,
  className = ''
}) {
  return (
    <div className={`p-8 text-center flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}

export default EmptyState;

