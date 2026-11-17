import React from 'react';
import {
  SCMS_HERO_BADGE_CLASS,
  SCMS_HERO_BTN_GLASS,
  SCMS_HERO_BTN_LIGHT,
  SCMS_HERO_SECTION_CLASS,
  ScmsHeroDecor
} from '../../../shared/ui/ScmsHeroBanner.jsx';

export function ClassesHeroBanner({ busy, isEn, loadData, openClassModal, openRoomModal, openSportModal, refreshing, tab }) {
  return (
    <section className={`${SCMS_HERO_SECTION_CLASS} sm:p-8`}>
      <ScmsHeroDecor />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className={SCMS_HERO_BADGE_CLASS}>
            <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
            <span>{isEn ? 'Training & Facilities · SCMS PRO' : 'Quản trị đào tạo & Cơ sở vật chất · SCMS PRO'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-chivo tracking-tight text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'Classes, Disciplines & Courts' : 'Quản lý Lớp học, Bộ môn & Phòng tập'}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 leading-relaxed font-medium drop-shadow-xs">
            {isEn
              ? 'Coordinate sports training sessions, monitor court capacities, and standardize Olympic timetables.'
              : 'Điều phối vận hành các lớp huấn luyện thể thao, giám sát sức chứa phòng tập và tối ưu lịch biểu chuẩn hóa theo tiêu chuẩn Olympic.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing || busy}
            className={SCMS_HERO_BTN_GLASS}
            title={isEn ? 'Refresh' : 'Làm mới'}
          >
            <span className={`material-symbols-outlined text-[18px] text-brand-sand-200 ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
            <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
          </button>

          {tab !== 'cancelled' && (
            <button
              onClick={() => {
                if (tab === 'classes') openClassModal(null);
                else if (tab === 'rooms') openRoomModal(null);
                else openSportModal(null);
              }}
              disabled={busy}
              className={SCMS_HERO_BTN_LIGHT}
            >
              <span className="material-symbols-outlined text-[18px] text-brand-sage-700">add_circle</span>
              <span>
                {tab === 'classes' && (isEn ? 'Open New Class' : 'Mở lớp đào tạo mới')}
                {tab === 'rooms' && (isEn ? 'Add Court / Room' : 'Thêm phòng / Sân mới')}
                {tab === 'sports' && (isEn ? 'Add Sport Discipline' : 'Thêm bộ môn thể thao')}
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
