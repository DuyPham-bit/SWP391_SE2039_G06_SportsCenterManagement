import React from 'react';
import {
  SCMS_HERO_BADGE_CLASS,
  SCMS_HERO_BTN_DARK,
  SCMS_HERO_BTN_GLASS,
  SCMS_HERO_SECTION_CLASS,
  ScmsHeroDecor
} from '../../../shared/ui/ScmsHeroBanner.jsx';

export function AttendanceHeader({ isEn, schedule, setShowCustomPeriod, showCustomPeriod }) {
  return (
    <section className={`${SCMS_HERO_SECTION_CLASS} sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5`}>
      <ScmsHeroDecor />

      <div className="space-y-1 relative z-10">
        <div className={`${SCMS_HERO_BADGE_CLASS} mb-2`}>
          <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
          <span>{isEn ? 'Olympic Teaching & Attendance' : 'Lịch giảng dạy & điểm danh Olympic'}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-chivo font-black tracking-tight text-white flex items-center gap-2.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
          <span className="material-symbols-outlined text-[28px] text-brand-sand-300">event_available</span>
          <span>{isEn ? 'Teaching Schedule & Class Attendance' : 'Lịch Dạy & Điểm Danh Lớp Học'}</span>
        </h1>
        <p className="text-xs sm:text-sm text-white/95 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
          {isEn
            ? 'Track weekly coaching timetable, choose a session to take student roll-call and record attendance.'
            : 'Theo dõi thời khóa biểu ca dạy theo tuần, chọn buổi học để kiểm diện học viên và lưu kết quả chuyên cần.'}
        </p>
      </div>

      {/* Action button to toggle custom date range */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
        <button
          type="button"
          onClick={() => setShowCustomPeriod(!showCustomPeriod)}
          className={SCMS_HERO_BTN_GLASS}
        >
          <span className="material-symbols-outlined text-[17px] text-brand-sand-200">date_range</span>
          <span>{showCustomPeriod ? (isEn ? 'Hide date filter' : 'Ẩn bộ lọc ngày') : (isEn ? 'Custom date range' : 'Tùy chỉnh khoảng ngày')}</span>
        </button>
        <button
          type="button"
          onClick={() => schedule.reload()}
          disabled={schedule.loading}
          className={SCMS_HERO_BTN_DARK}
        >
          <span className={`material-symbols-outlined text-[17px] text-brand-sand-300 ${schedule.loading ? 'animate-spin' : ''}`}>
            refresh
          </span>
          <span>{isEn ? 'Refresh schedule' : 'Làm mới lịch'}</span>
        </button>
      </div>
    </section>
  );
}
