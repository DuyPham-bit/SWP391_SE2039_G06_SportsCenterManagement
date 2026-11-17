import React from 'react';
import {
  SCMS_HERO_BADGE_CLASS,
  SCMS_HERO_SECTION_CLASS,
  ScmsHeroDecor
} from '../../../shared/ui/ScmsHeroBanner.jsx';

export function PayrollHeader({ canManage, handleCurrentMonth, handleNextMonth, handlePrevMonth, isEn, month, year }) {
  return (
    <section className={`${SCMS_HERO_SECTION_CLASS} sm:p-8`}>
      <ScmsHeroDecor />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className={`${SCMS_HERO_BADGE_CLASS} mb-2`}>
            <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
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
            className="w-9 h-9 rounded-xl bg-white/85 hover:bg-white text-brand-navy-800 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            title={isEn ? 'Previous month' : 'Tháng trước'}
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          <div className="px-3 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-white/85">
              {isEn ? 'Pay Period' : 'Kỳ thanh toán'}
            </span>
            <span className="text-sm font-black font-chivo text-white">
              Tháng {String(month).padStart(2, '0')}/{year}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="w-9 h-9 rounded-xl bg-white/85 hover:bg-white text-brand-navy-800 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            title={isEn ? 'Next month' : 'Tháng sau'}
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>

          <button
            type="button"
            onClick={handleCurrentMonth}
            className="scms-shine px-3.5 py-1.5 rounded-xl bg-white text-brand-navy-950 font-chivo text-xs font-bold uppercase tracking-wider hover:bg-white/95 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {isEn ? 'Current' : 'Hiện tại'}
          </button>
        </div>
      </div>
    </section>
  );
}
