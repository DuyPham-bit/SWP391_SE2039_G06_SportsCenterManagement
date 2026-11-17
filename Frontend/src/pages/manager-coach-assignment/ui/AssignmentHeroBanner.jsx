import React from 'react';
import {
  SCMS_HERO_BADGE_CLASS,
  SCMS_HERO_BTN_DARK,
  SCMS_HERO_BTN_GLASS,
  SCMS_HERO_BTN_LIGHT,
  SCMS_HERO_SECTION_CLASS,
  ScmsHeroDecor
} from '../../../shared/ui/ScmsHeroBanner.jsx';

export function AssignmentHeroBanner({ assigning, isEn, loadData, refreshing }) {
  return (
    <section className={`${SCMS_HERO_SECTION_CLASS} sm:p-8`}>
      <ScmsHeroDecor />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className={SCMS_HERO_BADGE_CLASS}>
            <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
            <span>{isEn ? 'Coach Dispatch & Syllabus · SCMS PRO' : 'Điều phối Huấn luyện viên & Giáo án · SCMS PRO'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-chivo tracking-tight text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'Coach Assignment to Classes' : 'Phân Công Huấn Luyện Viên Cho Lớp Học'}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 leading-relaxed font-medium drop-shadow-xs">
            {isEn
              ? 'Coordinate coaching expertise, detect discipline mismatches automatically, prevent timetable overlaps, and inspect Olympic coach capacity.'
              : 'Điều phối chuyên môn giảng dạy, tự động phát hiện lệch chuyên môn thể thao, ngăn chặn xung đột trùng ca dạy và đối soát năng lực HLV chuẩn Olympic.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing || assigning}
            className={SCMS_HERO_BTN_GLASS}
            title={isEn ? 'Refresh' : 'Làm mới'}
          >
            <span className={`material-symbols-outlined text-[18px] text-brand-sand-200 ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
            <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
          </button>

          <a href="#/manager/classes-rooms" className={SCMS_HERO_BTN_LIGHT}>
            <span className="material-symbols-outlined text-[18px] text-brand-sage-700">calendar_month</span>
            <span>{isEn ? 'Class Timetables' : 'Quản lý lịch học'}</span>
          </a>

          <a href="#/manager/staff" className={SCMS_HERO_BTN_DARK}>
            <span className="material-symbols-outlined text-[18px] text-brand-sand-300">badge</span>
            <span>{isEn ? 'Coaches Directory' : 'Danh sách HLV'}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
