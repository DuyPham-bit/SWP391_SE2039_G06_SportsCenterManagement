import React from 'react';
import {
  SCMS_HERO_BADGE_CLASS,
  SCMS_HERO_BTN_GLASS,
  SCMS_HERO_SECTION_CLASS,
  ScmsHeroDecor
} from '../../../shared/ui/ScmsHeroBanner.jsx';

export function TeachingHeader({ isEn, schedule, setShowPeriodConfig, showPeriodConfig }) {
  return (
    <section className={`${SCMS_HERO_SECTION_CLASS} sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5`}>
      <ScmsHeroDecor />

      <div className="space-y-1 relative z-10">
        <div className={`${SCMS_HERO_BADGE_CLASS} mb-2`}>
          <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
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
          className={SCMS_HERO_BTN_GLASS}
        >
          <span className="material-symbols-outlined text-[17px] text-brand-sand-200">date_range</span>
          <span>
            {isEn ? `Date Range (${schedule.from} → ${schedule.to})` : `Khoảng ngày (${schedule.from} → ${schedule.to})`}
          </span>
          <span className="material-symbols-outlined text-[17px]">
            {showPeriodConfig ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>
    </section>
  );
}
