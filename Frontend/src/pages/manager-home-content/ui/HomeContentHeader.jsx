import React from 'react';
import {
  SCMS_HERO_BADGE_CLASS,
  SCMS_HERO_BTN_DARK,
  SCMS_HERO_BTN_GLASS,
  SCMS_HERO_SECTION_CLASS,
  ScmsHeroDecor
} from '../../../shared/ui/ScmsHeroBanner.jsx';
import { SaveStatusText } from './TabSaveFooter.jsx';

/** Header with DB-counted visibility badges and the real save state. */
export function HomeContentHeader({ handleDiscardChanges, handlePreview, handleSaveAll, isDirty, isSaving, saveStatus, stats, t }) {
  const chips = [
    { icon: 'sports_score', tone: 'text-brand-sand-200', key: 'homeContent.header.sportsVisible', count: stats?.sports },
    { icon: 'stadium', tone: 'text-brand-sand-300', key: 'homeContent.header.facilitiesVisible', count: stats?.facilities }
  ];
  return (
    <section className={`${SCMS_HERO_SECTION_CLASS} sm:p-8`}>
      <ScmsHeroDecor />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className={`${SCMS_HERO_BADGE_CLASS} mb-2`}>
            <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
            <span>{t('homeContent.header.badge')}</span>
          </div>
          <h1 className="font-chivo text-2xl sm:text-3xl font-black text-white uppercase tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {t('homeContent.header.title')}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 mt-1 max-w-2xl leading-relaxed font-medium drop-shadow-xs">
            {t('homeContent.header.description')}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-semibold">
            {chips.map(chip => (
              <div key={chip.key} className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center gap-2 text-white">
                <span className={`material-symbols-outlined text-[16px] ${chip.tone}`}>{chip.icon}</span>
                <span>{t(chip.key, { visible: chip.count?.visible ?? '—', total: chip.count?.total ?? '—' })}</span>
              </div>
            ))}
            <div className="px-3 py-1.5 rounded-xl bg-brand-navy-950/60 border border-white/20 text-white">
              <SaveStatusText saveStatus={saveStatus} isDirty={isDirty} t={t} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button type="button" onClick={handlePreview} className={SCMS_HERO_BTN_GLASS} title={t('homeContent.action.previewHint')}>
            <span className="material-symbols-outlined text-[17px] text-brand-sand-200">visibility</span>
            <span>{t('homeContent.action.preview')}</span>
          </button>

          <button type="button" onClick={handleDiscardChanges} disabled={!isDirty || isSaving} className={SCMS_HERO_BTN_GLASS} title={t('homeContent.action.discardHint')}>
            <span className="material-symbols-outlined text-[17px]">undo</span>
            <span>{t('homeContent.action.discard')}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving || !isDirty}
            className={
              isDirty
                ? `${SCMS_HERO_BTN_DARK} ring-2 ring-white/50`
                : 'px-5 py-2.5 sm:py-3 rounded-xl bg-white/10 text-white/60 border border-white/20 text-xs font-bold font-chivo uppercase tracking-wider flex items-center gap-2 cursor-not-allowed opacity-65'
            }
          >
            <span className={`material-symbols-outlined text-[18px] ${isDirty ? 'text-brand-sand-300' : ''} ${isSaving ? 'animate-spin' : ''}`}>
              {isSaving ? 'sync' : 'save'}
            </span>
            <span>{isSaving ? t('homeContent.status.saving') : t('homeContent.action.saveAll')}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
