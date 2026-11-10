import React from 'react';

// KPI status pill for a payroll row; non-coach roles always show the standard badge.
export function KpiBadge({ row, isEn }) {
  const isCoach = String(row.role || '').toUpperCase() === 'COACH';
  if (!isCoach) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-navy-100 text-brand-navy-600 dark:bg-brand-navy-800 dark:text-brand-navy-400">
        <span className="material-symbols-outlined text-[12px]">schedule</span>
        <span>{isEn ? 'Standard' : 'Định mức'}</span>
      </span>
    );
  }

  if (row.kpiStatus === 'EXCELLENT') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-brand-sage-100 text-brand-sage-800 border border-brand-sage-300 dark:bg-brand-sage-950/60 dark:text-brand-sage-300 dark:border-brand-sage-700 shadow-2xs">
        <span className="material-symbols-outlined text-[13px] text-brand-sand-700 dark:text-brand-sand-400">star</span>
        <span>{isEn ? 'Surpassed KPI' : 'Vượt KPI'}</span>
      </span>
    );
  }

  if (row.kpiStatus === 'MET') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-teal-50 text-brand-teal-700 border border-brand-teal-200 dark:bg-brand-teal-950/40 dark:text-brand-teal-300 dark:border-brand-teal-800">
        <span className="material-symbols-outlined text-[13px]">check_circle</span>
        <span>{isEn ? 'Met KPI' : 'Đạt KPI'}</span>
      </span>
    );
  }

  if (row.kpiStatus === 'IN_PROGRESS') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-sand-50 text-brand-sand-700 border border-brand-sand-200 dark:bg-brand-sand-950/40 dark:text-brand-sand-300 dark:border-brand-sand-800">
        <span className="material-symbols-outlined text-[13px]">trending_up</span>
        <span>{isEn ? 'In Progress' : 'Đang phấn đấu'}</span>
      </span>
    );
  }

  if (row.kpiStatus === 'BEHIND') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-danger-50 text-brand-danger-700 border border-brand-danger-200 dark:bg-brand-danger-950/40 dark:text-brand-danger-300 dark:border-brand-danger-800">
        <span className="material-symbols-outlined text-[13px]">warning</span>
        <span>{isEn ? 'Below Target' : 'Chưa đạt'}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-navy-100 text-brand-navy-500 dark:bg-brand-navy-800 dark:text-brand-navy-400">
      <span>{isEn ? 'No KPI Set' : 'Chưa gán KPI'}</span>
    </span>
  );
}
