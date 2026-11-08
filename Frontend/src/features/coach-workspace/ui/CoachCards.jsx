import React from 'react';

export function SectionCard({ title, icon, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-brand-navy-200/90 dark:border-brand-navy-700/80 bg-white dark:bg-brand-navy-800 p-4 sm:p-5 shadow-xs transition-colors ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-brand-navy-100 dark:border-brand-navy-700/60 pb-3">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-brand-sage-500/15 dark:bg-brand-sage-500/20 text-brand-sage-700 dark:text-brand-sage-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[19px]">{icon}</span>
            </div>
          )}
          <h2 className="text-sm sm:text-base font-bold text-brand-navy-900 dark:text-white tracking-tight">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ icon = 'inbox', children, isEn = false }) {
  const content = children || (isEn ? 'No data available.' : 'Chưa có dữ liệu.');
  return (
    <div className="rounded-xl border border-dashed border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50/50 dark:bg-brand-navy-800/40 p-6 text-center">
      <span className="material-symbols-outlined text-[32px] text-brand-navy-300 dark:text-brand-navy-600 mb-1.5 block">
        {icon}
      </span>
      <p className="text-xs sm:text-sm text-brand-navy-500 dark:text-brand-navy-400">{content}</p>
    </div>
  );
}
