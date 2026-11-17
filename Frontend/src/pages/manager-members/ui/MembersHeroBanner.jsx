import React from 'react';
import {
  SCMS_HERO_BADGE_CLASS,
  SCMS_HERO_BTN_GLASS,
  SCMS_HERO_BTN_LIGHT,
  SCMS_HERO_SECTION_CLASS,
  ScmsHeroDecor
} from '../../../shared/ui/ScmsHeroBanner.jsx';

export function MembersHeroBanner({ busy, isEn, loading, openEdit, setRevision }) {
  return (
    <section className={`${SCMS_HERO_SECTION_CLASS} sm:p-8`}>
      <ScmsHeroDecor />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className={`${SCMS_HERO_BADGE_CLASS} mb-2`}>
            <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
            <span>{isEn ? 'Member Operations' : 'Quản trị hội viên SCMS'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-chivo tracking-tight text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'Member Management' : 'Quản lý hội viên'}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 mt-1.5 max-w-2xl leading-relaxed font-medium drop-shadow-xs">
            {isEn
              ? 'Track member profiles, account statuses, subscription packages, and center-wide athletic privileges.'
              : 'Theo dõi hồ sơ hội viên, trạng thái tài khoản, lịch sử gói tập và quyền lợi thể thao toàn trung tâm.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setRevision((x) => x + 1)}
            disabled={loading}
            className={SCMS_HERO_BTN_GLASS}
            title={isEn ? 'Refresh' : 'Làm mới'}
          >
            <span className={`material-symbols-outlined text-[18px] text-brand-sand-200 ${loading ? 'animate-spin' : ''}`}>refresh</span>
            <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
          </button>
          <button
            onClick={() => openEdit(null)}
            disabled={busy}
            className={SCMS_HERO_BTN_LIGHT}
          >
            <span className="material-symbols-outlined text-[18px] text-brand-sage-700">person_add</span>
            <span>{isEn ? 'Add Member' : 'Thêm thành viên mới'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
