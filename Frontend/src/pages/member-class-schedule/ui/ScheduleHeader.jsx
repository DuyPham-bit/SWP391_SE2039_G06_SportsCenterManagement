import React from 'react';

export function ScheduleHeader({ bookedSessionIds, isEn, stats }) {
  return (
    <div className="scms-hero relative rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 overflow-hidden">
      {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
      <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-brand-teal-300/30 rounded-full blur-3xl pointer-events-none" />
      {/* Subtle decorative Olympic curved motion lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
        <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
        <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
      </svg>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 backdrop-blur-md text-brand-sage-900 dark:text-brand-sage-300 border border-white/80 dark:border-white/20 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <span className="material-symbols-outlined text-[13px] text-brand-sand-700 dark:text-brand-sand-400">calendar_month</span>
              OLYMPIC SCHEDULE CALENDAR
            </span>
            <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-brand-navy-900/80 backdrop-blur-md text-brand-navy-800 dark:text-brand-navy-200 border border-white/80 dark:border-white/20 text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
              {stats.total} {isEn ? 'open sessions' : 'ca học mở'}
            </span>
          </div>

          <h1 className="font-chivo text-2xl lg:text-3xl font-black text-white tracking-tight mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'Class Schedule & Training Bookings' : 'Lịch Mở Lớp & Đặt Chỗ Rèn Luyện'}
          </h1>
          <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
            {isEn
              ? 'Olympic-standard multi-mode interactive schedule: Track weekly timetable, monthly overview, select sessions and secure your spot with expert coaches.'
              : 'Lịch tương tác đa chế độ theo chuẩn Olympic: Theo dõi lịch tuần, tổng quan tháng, chọn ca tập và bảo đảm suất rèn luyện cùng HLV chuyên môn.'}
          </p>
        </div>

        {/* Nút Xem Vé Đã Đặt Nhanh */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="#/member/bookings"
            className="px-4 py-2.5 bg-brand-navy-950 hover:bg-brand-navy-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:shadow-xl shrink-0 border border-white/20 active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <span className="material-symbols-outlined text-[18px] text-brand-sand-300">confirmation_number</span>
            <span>{isEn ? 'My Bookings' : 'Vé Đã Đặt'} ({bookedSessionIds.size})</span>
          </a>
        </div>
      </div>
    </div>
  );
}
