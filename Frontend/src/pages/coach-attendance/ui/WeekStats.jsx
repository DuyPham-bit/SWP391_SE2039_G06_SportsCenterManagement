import React from 'react';

export function WeekStats({ isEn, readinessFilter, setReadinessFilter, setSelectedDateIso, setViewMode, todayIso, weekStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="p-3.5 rounded-xl bg-brand-navy-50 border border-brand-navy-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-navy-900 text-white flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-xl">calendar_today</span>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-brand-navy-500 uppercase tracking-wider truncate">
            {isEn ? 'This Week' : 'Tổng ca tuần này'}
          </div>
          <div className="font-chivo font-black text-lg text-brand-navy-900 leading-tight">
            {weekStats.total} {isEn ? 'sessions' : 'ca'}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setViewMode('list');
          setSelectedDateIso(todayIso);
        }}
        className="p-3.5 rounded-xl bg-brand-danger-50/60 hover:bg-brand-danger-50 dark:bg-brand-danger-900/20 dark:hover:bg-brand-danger-900/30 border border-brand-danger-200 dark:border-brand-danger-800 text-left transition-all flex items-center gap-3 group"
      >
        <div className="w-10 h-10 rounded-xl bg-brand-danger-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
          <span className="material-symbols-outlined text-xl">today</span>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-brand-danger-700 dark:text-brand-danger-300 uppercase tracking-wider flex items-center gap-1">
            <span className="truncate">{isEn ? 'Today' : 'Ca hôm nay'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-danger-500 animate-pulse shrink-0"></span>
          </div>
          <div className="font-chivo font-black text-lg text-brand-danger-950 dark:text-brand-danger-100 leading-tight">
            {weekStats.today} {isEn ? 'sessions' : 'ca'}
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => {
          setReadinessFilter(readinessFilter === 'READY' ? 'ALL' : 'READY');
        }}
        className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
              readinessFilter === 'READY'
                ? 'bg-brand-sage-100 dark:bg-brand-sage-900/40 border-brand-sage-400 dark:border-brand-sage-500 ring-2 ring-brand-sage-500/30'
                : 'bg-brand-sage-50/60 hover:bg-brand-sage-50 dark:bg-brand-sage-900/20 dark:hover:bg-brand-sage-900/30 border-brand-sage-200 dark:border-brand-sage-800'
            }`}
      >
        <div className="w-10 h-10 rounded-xl bg-brand-sage-700 text-white flex items-center justify-center shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-xl">fact_check</span>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-brand-sage-800 dark:text-brand-sage-300 uppercase tracking-wider flex items-center gap-1">
            <span className="truncate">{isEn ? 'Roll-call Ready' : 'Sẵn sàng điểm danh'}</span>
          </div>
          <div className="font-chivo font-black text-lg text-brand-sage-950 dark:text-brand-sage-100 leading-tight">
            {weekStats.ready} {isEn ? 'sessions' : 'ca'}
          </div>
        </div>
      </button>

      <div className="p-3.5 rounded-xl bg-brand-navy-50 border border-brand-navy-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-navy-200 text-brand-navy-700 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-xl">task_alt</span>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-brand-navy-500 uppercase tracking-wider truncate">
            {isEn ? 'Completed' : 'Đã kết thúc'}
          </div>
          <div className="font-chivo font-black text-lg text-brand-navy-900 leading-tight">
            {weekStats.ended} {isEn ? 'sessions' : 'ca'}
          </div>
        </div>
      </div>
    </div>
  );
}
