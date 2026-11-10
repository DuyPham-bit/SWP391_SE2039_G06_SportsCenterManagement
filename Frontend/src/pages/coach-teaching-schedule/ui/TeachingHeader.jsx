import React from 'react';

export function TeachingHeader({ isEn, schedule, setShowPeriodConfig, showPeriodConfig }) {
  return (
    <div className="rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-8 relative overflow-hidden border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
      <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-brand-teal-300/30 rounded-full blur-3xl" />

      {/* Subtle decorative Olympic curved motion lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
        <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
        <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
      </svg>

      <div className="space-y-1 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 text-brand-sage-900 dark:text-brand-sage-300 text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 dark:border-white/20 mb-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
          <span>{isEn ? 'Professional Teaching Schedule' : 'Lịch giảng dạy chuyên môn'}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-chivo font-black tracking-tight text-white flex items-center gap-2.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
          <span className="material-symbols-outlined text-[28px] text-brand-sand-300">calendar_month</span>
          <span>{isEn ? 'Coach Teaching Schedule' : 'Lịch Giảng Dạy Của Huấn Luyện Viên'}</span>
        </h1>
        <p className="text-xs sm:text-sm text-white/95 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
          {isEn
            ? 'Track assigned teaching sessions, student enrollment, and take attendance according to Olympic sports standards.'
            : 'Theo dõi các ca dạy, sĩ số học viên và thực hiện điểm danh lớp học được phân công theo chuẩn thể thao Olympic.'}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0 relative z-10">
        <button
          type="button"
          onClick={() => setShowPeriodConfig(!showPeriodConfig)}
          className="px-4 py-2.5 rounded-xl border border-white/30 bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-xs hover-lift"
        >
          <span className="material-symbols-outlined text-[16px] text-brand-sand-300">date_range</span>
          <span>
            {isEn ? `Date Range (${schedule.from} → ${schedule.to})` : `Khoảng ngày (${schedule.from} → ${schedule.to})`}
          </span>
          <span className="material-symbols-outlined text-[16px]">
            {showPeriodConfig ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>
    </div>
  );
}
