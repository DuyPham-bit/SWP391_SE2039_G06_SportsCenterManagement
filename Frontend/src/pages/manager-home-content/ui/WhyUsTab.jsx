import React from 'react';
import { INPUT_CLASS, LABEL_CLASS, LocalizedInput, SectionHeading } from './fields.jsx';

export function WhyUsTab({ content, footer, handleTabChange, lang, missing, setLang, stats, t, updateContentField }) {
  const whyUs = content.whyUs || {};
  const features = whyUs.features || [];
  const statCards = whyUs.stats || [];
  const set = (key, value) => updateContentField('whyUs', key, value);
  const setFeature = (idx, values) => set('features', features.map((item, i) => (i === idx ? { ...item, ...values } : item)));
  const setStat = (idx, values) => set('stats', statCards.map((item, i) => (i === idx ? { ...item, ...values } : item)));
  // Auto-counted cards show the DB count instead of a typed number.
  const autoCount = card => (card.id === 's1' ? stats?.facilities?.visible : card.id === 's2' ? stats?.sports?.visible : undefined);

  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-6 sm:p-8 space-y-6">
      <SectionHeading
        title={t('homeContent.whyUs.title')}
        description={t('homeContent.whyUs.description', { features: features.length, stats: statCards.length })}
        lang={lang} setLang={setLang} missing={missing} t={t}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="why-badge" className={LABEL_CLASS}>{t('homeContent.field.badge')}</label>
            <LocalizedInput id="why-badge" value={whyUs.badge} lang={lang} onChange={value => set('badge', value)} maxLength={300}
              className={`${INPUT_CLASS} font-semibold`} />
          </div>
          <div>
            <label htmlFor="why-title" className={LABEL_CLASS}>{t('homeContent.field.sectionTitle')}</label>
            <LocalizedInput id="why-title" value={whyUs.title} lang={lang} onChange={value => set('title', value)} maxLength={300} required
              className={`${INPUT_CLASS} text-sm font-extrabold`} />
          </div>
          <div>
            <label htmlFor="why-description" className={LABEL_CLASS}>{t('homeContent.field.description')}</label>
            <LocalizedInput id="why-description" multiline value={whyUs.description} lang={lang} onChange={value => set('description', value)}
              className={`${INPUT_CLASS} leading-relaxed`} />
          </div>

          <div className="space-y-3 pt-2">
            <span className="block text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 uppercase">
              {t('homeContent.whyUs.features', { count: features.length })}
            </span>
            {features.map((feat, idx) => (
              <div key={feat.id || idx} className="p-3.5 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/50 border border-brand-navy-200 dark:border-brand-navy-800 space-y-2 hover-lift transition-all">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-brand-sage-700 text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">{feat.icon}</span>
                  </span>
                  <LocalizedInput aria-label={t('homeContent.field.title')} value={feat.title} lang={lang} onChange={title => setFeature(idx, { title })} maxLength={300}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none" />
                </div>
                <LocalizedInput multiline rows={2} aria-label={t('homeContent.field.description')} value={feat.description} lang={lang} onChange={description => setFeature(idx, { description })}
                  className="w-full px-3 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-[11px] leading-relaxed focus:ring-2 focus:ring-brand-sage-700 focus:outline-none" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-brand-sage-500/10 via-brand-teal-500/10 to-brand-teal-500/10 border border-brand-sage-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-400 text-[22px] shrink-0">info</span>
              <div className="text-xs">
                <span className="font-bold text-brand-navy-900 dark:text-white">{t('homeContent.whyUs.loginStatsQuestion')}</span>
                <p className="text-brand-navy-600 dark:text-brand-navy-400 text-[11px] mt-0.5">{t('homeContent.whyUs.loginStatsHint')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange('authShowcase')}
              className="px-3.5 py-1.5 rounded-lg bg-brand-sage-700 hover:bg-brand-sage-900 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm hover-lift"
            >
              <span>{t('homeContent.whyUs.goToAuthTab')}</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>

          <span className="block text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 uppercase">
            {t('homeContent.whyUs.statCards', { count: statCards.length })}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {statCards.map((st, idx) => (
              <div key={st.id || idx} className="p-4 rounded-xl bg-gradient-to-br from-brand-navy-900 to-brand-navy-800 text-white space-y-2 shadow-md hover-lift transition-all border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-[24px] text-brand-sage-700 dark:text-brand-sage-400">{st.icon}</span>
                  <span className="text-[10px] font-bold uppercase bg-white/10 px-2 py-0.5 rounded text-brand-navy-300">
                    {t('homeContent.whyUs.card', { index: idx + 1 })}
                  </span>
                </div>
                <div className="flex gap-2">
                  {st.isAutoCount ? (
                    <span className="w-2/3 px-2 py-1 rounded-lg bg-white/5 text-white font-black text-lg text-center border border-white/10" title={t('homeContent.whyUs.autoCountHint')}>
                      {autoCount(st) ?? '—'}
                    </span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      aria-label={t('homeContent.field.number')}
                      value={st.number ?? 0}
                      onChange={e => setStat(idx, { number: Number(e.target.value) })}
                      className="w-2/3 px-2 py-1 rounded-lg bg-white/15 text-white font-black text-lg text-center border border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
                    />
                  )}
                  <input
                    type="text"
                    aria-label={t('homeContent.field.suffix')}
                    value={st.suffix || ''}
                    placeholder={t('homeContent.field.suffix')}
                    onChange={e => setStat(idx, { suffix: e.target.value })}
                    className="w-1/3 px-2 py-1 rounded-lg bg-white/15 text-white font-bold text-xs text-center border border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
                  />
                </div>
                {(st.id === 's1' || st.id === 's2') && (
                  <label className="flex items-center gap-2 text-[11px] text-white/80 cursor-pointer">
                    <input type="checkbox" checked={Boolean(st.isAutoCount)} onChange={e => setStat(idx, { isAutoCount: e.target.checked })} className="accent-brand-sage-500" />
                    <span>{t('homeContent.whyUs.autoCount')}</span>
                  </label>
                )}
                <LocalizedInput aria-label={t('homeContent.field.title')} value={st.title} lang={lang} onChange={title => setStat(idx, { title })} maxLength={300}
                  className="w-full px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-extrabold uppercase focus:outline-none focus:ring-2 focus:ring-brand-sage-500" />
                <LocalizedInput aria-label={t('homeContent.field.subtitle')} value={st.subtitle} lang={lang} onChange={subtitle => setStat(idx, { subtitle })}
                  className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/90 text-[11px] focus:outline-none focus:ring-2 focus:ring-brand-sage-500" />
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/50 border border-brand-navy-200 dark:border-brand-navy-800 space-y-2 mt-4 hover-lift transition-all">
            <span className="block text-[11px] font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase">{t('homeContent.whyUs.trustStrip')}</span>
            <LocalizedInput aria-label={t('homeContent.field.title')} value={whyUs.trustBanner?.title} lang={lang}
              onChange={title => set('trustBanner', { ...whyUs.trustBanner, title })} maxLength={300}
              className="w-full px-3 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none" />
            <LocalizedInput aria-label={t('homeContent.field.description')} value={whyUs.trustBanner?.description} lang={lang}
              onChange={description => set('trustBanner', { ...whyUs.trustBanner, description })}
              className="w-full px-3 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none" />
          </div>
        </div>
      </div>

      {footer}
    </div>
  );
}
