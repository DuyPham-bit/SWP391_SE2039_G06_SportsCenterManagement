import React from 'react';

export function ScheduleSummaryCards({ isEn, selectedStatusFilter, setSelectedStatusFilter, stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white dark:bg-brand-navy-900 p-3.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-800 shadow-xs hover-lift flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-sage-500/20 text-brand-sage-700 dark:text-brand-sage-500 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px]">calendar_month</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-brand-navy-400 block tracking-wider">{isEn ? 'Total Sessions' : 'Tổng ca tập'}</span>
          <span className="font-chivo text-lg font-black text-brand-navy-900 dark:text-white">{stats.total}</span>
        </div>
      </div>

      <div
        onClick={() => setSelectedStatusFilter(f => f === 'BOOKED_ONLY' ? 'ALL' : 'BOOKED_ONLY')}
        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            selectedStatusFilter === 'BOOKED_ONLY'
              ? 'bg-brand-sage-50 dark:bg-brand-sage-900/30 border-brand-sage-400 dark:border-brand-sage-500 shadow-sm ring-2 ring-brand-sage-500/20'
              : 'bg-white border-brand-navy-200 hover:border-brand-sage-300'
          }`}
      >
        <div className="w-10 h-10 rounded-lg bg-brand-sage-100 dark:bg-brand-sage-900/40 text-brand-sage-700 dark:text-brand-sage-300 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px]">check_circle</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-brand-navy-400 block tracking-wider">{isEn ? 'My Booked' : 'Ca tôi đã đặt'}</span>
          <span className="font-chivo text-lg font-black text-brand-sage-800 dark:text-brand-sage-300">{stats.booked}</span>
        </div>
      </div>

      <div
        onClick={() => setSelectedStatusFilter(f => f === 'AVAILABLE_ONLY' ? 'ALL' : 'AVAILABLE_ONLY')}
        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            selectedStatusFilter === 'AVAILABLE_ONLY'
              ? 'bg-brand-teal-50 dark:bg-brand-teal-900/30 border-brand-teal-400 dark:border-brand-teal-500 shadow-sm ring-2 ring-brand-teal-500/20'
              : 'bg-white border-brand-navy-200 hover:border-brand-teal-300'
          }`}
      >
        <div className="w-10 h-10 rounded-lg bg-brand-teal-100 dark:bg-brand-teal-900/40 text-brand-teal-700 dark:text-brand-teal-300 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px]">event_available</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-brand-navy-400 block tracking-wider">{isEn ? 'Available Spots' : 'Ca còn chỗ'}</span>
          <span className="font-chivo text-lg font-black text-brand-teal-800 dark:text-brand-teal-300">{stats.available}</span>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-brand-navy-200 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-navy-100 text-brand-navy-800 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px]">sports</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-brand-navy-400 block tracking-wider">{isEn ? 'Open Sports' : 'Bộ môn mở'}</span>
          <span className="font-chivo text-lg font-black text-brand-navy-900">{stats.sportsCount} / 15</span>
        </div>
      </div>
    </div>
  );
}
