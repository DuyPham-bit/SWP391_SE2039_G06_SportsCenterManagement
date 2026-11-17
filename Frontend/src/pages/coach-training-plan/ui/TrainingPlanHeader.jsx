import React from 'react';
import {
  SCMS_HERO_BADGE_CLASS,
  SCMS_HERO_BTN_DARK,
  SCMS_HERO_SECTION_CLASS,
  ScmsHeroDecor
} from '../../../shared/ui/ScmsHeroBanner.jsx';

export function TrainingPlanHeader({ handleOpenCreateModal, isEn }) {
  return (
    <section className={`${SCMS_HERO_SECTION_CLASS} sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5`}>
      <ScmsHeroDecor />

      <div className="space-y-1 relative z-10">
        <div className={`${SCMS_HERO_BADGE_CLASS} mb-2`}>
          <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
          <span>{isEn ? 'Olympic Training Programs' : 'Giáo Án Rèn Luyện Olympic'}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-chivo font-black tracking-tight text-white flex items-center gap-2.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
          <span className="material-symbols-outlined text-[28px] text-brand-sand-300">assignment</span>
          <span>{isEn ? 'Class Lesson Plans & Training Programs' : 'Giáo Án Giảng Dạy & Kế Hoạch Rèn Luyện'}</span>
        </h1>
        <p className="text-xs sm:text-sm text-white/95 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
          {isEn
            ? 'Establish standardized athletic curriculums, customized progression pathways, and targeted exercise routines.'
            : 'Thiết lập giáo án rèn luyện thể thao chuẩn Olympic đồng loạt cho cả lớp học hoặc phân tách phác đồ riêng cho từng học viên.'}
        </p>
      </div>

      <button
        type="button"
        onClick={handleOpenCreateModal}
        className={`${SCMS_HERO_BTN_DARK} shrink-0 relative z-10`}
      >
        <span className="material-symbols-outlined text-[18px] text-brand-sand-300">add</span>
        <span>{isEn ? 'Create New Plan' : 'Soạn Giáo Án Mới'}</span>
      </button>
    </section>
  );
}
