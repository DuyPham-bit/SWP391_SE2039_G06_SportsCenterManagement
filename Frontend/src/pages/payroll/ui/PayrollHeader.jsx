import React from 'react';

export function PayrollHeader({ canManage, handleCurrentMonth, handleNextMonth, handlePrevMonth, isEn, month, year }) {
  return (
    <section
      className="scms-hero relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-8 shadow-xl shadow-brand-teal-600/20 border border-white/30 dark:border-white/10"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent blur-3xl" />
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
        <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
        <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
      </svg>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 text-brand-sage-900 text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 shadow-xs mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
            <span>{isEn ? 'Compensation & Teaching Workspace' : 'Phân hệ Lương & Thù Lao Ca Dạy · Olympic SCMS'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-chivo tracking-tight text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {canManage
              ? isEn
                ? 'Salary & Teaching Performance'
                : 'Quản lý Lương & Thù lao giảng dạy'
              : isEn
              ? 'My Salary & Teaching Statement'
              : 'Bảng kê thu nhập & Số ca đứng lớp cá nhân'}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-white/90 max-w-2xl font-medium drop-shadow-sm">
            {canManage
              ? isEn
                ? 'Automated monthly compensation, teaching session bonuses, and Coach session KPI tracking.'
                : 'Tự động tính lương cứng, thù lao ca dạy thực tế và theo dõi tiến độ hoàn thành chỉ tiêu ca dạy của HLV.'
              : isEn
              ? 'Detailed payslip statement, completed teaching volume, and session payouts.'
              : 'Bảng kê chi tiết thu nhập, số buổi đứng lớp thực tế và thù lao theo từng ca học.'}
          </p>
        </div>

        {/* Interactive Period Selector Controls */}
        <div className="flex items-center gap-2 bg-white/20 dark:bg-brand-navy-900/40 backdrop-blur-md p-2 rounded-2xl border border-white/30 self-start lg:self-auto shadow-sm">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-9 h-9 rounded-xl bg-white/80 hover:bg-white text-brand-navy-800 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            title={isEn ? 'Previous month' : 'Tháng trước'}
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          <div className="px-3 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-white/80">
              {isEn ? 'Pay Period' : 'Kỳ thanh toán'}
            </span>
            <span className="text-sm font-black font-chivo text-white">
              Tháng {String(month).padStart(2, '0')}/{year}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="w-9 h-9 rounded-xl bg-white/80 hover:bg-white text-brand-navy-800 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            title={isEn ? 'Next month' : 'Tháng sau'}
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>

          <button
            type="button"
            onClick={handleCurrentMonth}
            className="px-3 py-1.5 rounded-xl bg-white text-brand-sage-900 text-xs font-bold hover:bg-white/90 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {isEn ? 'Current' : 'Hiện tại'}
          </button>
        </div>
      </div>
    </section>
  );
}
