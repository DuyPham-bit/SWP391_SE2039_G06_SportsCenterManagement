import React from 'react';

export function TeachingSummary({ isEn, stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <div className="p-4 rounded-xl border border-brand-navy-200 bg-white shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-navy-500">
          <span>{isEn ? 'Total Sessions' : 'Tổng ca dạy'}</span>
          <span className="material-symbols-outlined text-[18px] text-brand-navy-400">fitness_center</span>
        </div>
        <div className="font-chivo text-2xl font-black text-brand-navy-900 mt-2">
          {stats.total}
        </div>
      </div>

      <div className="p-4 rounded-xl border border-brand-teal-200 bg-brand-teal-50/60 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-teal-800 dark:text-brand-teal-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-teal-500 animate-ping" />
            {isEn ? 'Scheduled' : 'Đã lên lịch'}
          </span>
          <span className="material-symbols-outlined text-[18px] text-brand-teal-700 dark:text-brand-teal-400">schedule</span>
        </div>
        <div className="font-chivo text-2xl font-black text-brand-teal-900 dark:text-brand-teal-400 mt-2">
          {stats.scheduled}
        </div>
      </div>

      <div className="p-4 rounded-xl border border-brand-sage-200 bg-brand-sage-50/60 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-sage-800 dark:text-brand-sage-400">
          <span>{isEn ? 'Completed' : 'Đã kết thúc'}</span>
          <span className="material-symbols-outlined text-[18px] text-brand-sage-700 dark:text-brand-sage-400">task_alt</span>
        </div>
        <div className="font-chivo text-2xl font-black text-brand-sage-900 dark:text-brand-sage-400 mt-2">
          {stats.completed}
        </div>
      </div>

      <div className="p-4 rounded-xl border border-brand-sand-300/60 bg-brand-navy-50 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-sand-800 dark:text-brand-sand-400">
          <span>{isEn ? 'Student Enrollments' : 'Lượt học viên'}</span>
          <span className="material-symbols-outlined text-[18px] text-brand-sand-600">group</span>
        </div>
        <div className="font-chivo text-2xl font-black text-brand-navy-900 mt-2">
          {stats.totalEnrolled}
        </div>
      </div>
    </div>
  );
}
