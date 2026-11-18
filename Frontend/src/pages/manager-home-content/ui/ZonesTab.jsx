import React, { useState } from 'react';
import { INPUT_CLASS, LABEL_CLASS, LocalizedInput, SectionHeading } from './fields.jsx';
import { CampusZonesEditor } from './CampusZonesEditor.jsx';

export function ZonesTab({ content, footer, lang, missing, openMediaPicker, setLang, t, updateContentField }) {
  const zones = content.zonesLayout || {};
  const amenities = zones.serviceAmenities || [];
  const set = (key, value) => updateContentField('zonesLayout', key, value);
  const [zonesMissingEn, setZonesMissingEn] = useState(false);

  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-6 sm:p-8 space-y-6">
      <SectionHeading title={t('homeContent.zones.title')} description={t('homeContent.zones.description')}
        lang={lang} setLang={setLang} missing={{ ...missing, en: missing.en || zonesMissingEn }} t={t} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="zones-badge" className={LABEL_CLASS}>{t('homeContent.field.badge')}</label>
            <LocalizedInput id="zones-badge" value={zones.badge} lang={lang} onChange={value => set('badge', value)} maxLength={300} className={`${INPUT_CLASS} font-semibold`} />
          </div>
          <div>
            <label htmlFor="zones-title" className={LABEL_CLASS}>{t('homeContent.field.sectionTitle')}</label>
            <LocalizedInput id="zones-title" value={zones.title} lang={lang} onChange={value => set('title', value)} maxLength={300} required
              className={`${INPUT_CLASS} text-sm font-extrabold uppercase`} />
          </div>
          <div>
            <label htmlFor="zones-description" className={LABEL_CLASS}>{t('homeContent.field.description')}</label>
            <LocalizedInput id="zones-description" multiline value={zones.description} lang={lang} onChange={value => set('description', value)}
              className={`${INPUT_CLASS} leading-relaxed`} />
            <p className="text-[11px] text-brand-navy-400 dark:text-brand-navy-500 mt-1">{t('homeContent.hint.countPlaceholders')}</p>
          </div>

          <div className="space-y-2 pt-2">
            <span className="block text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 uppercase">
              {t('homeContent.zones.serviceAmenities', { count: amenities.length })}
            </span>
            {amenities.map((item, idx) => (
              <div key={item.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/50 border border-brand-navy-200 dark:border-brand-navy-800 hover-lift transition-all">
                <span className="w-8 h-8 rounded-lg bg-brand-sage-700/15 text-brand-sage-700 dark:text-brand-sage-500 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                </span>
                <LocalizedInput aria-label={t('homeContent.field.text')} value={item.text} lang={lang}
                  onChange={text => set('serviceAmenities', amenities.map((entry, i) => (i === idx ? { ...entry, text } : entry)))}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <span className="block text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 uppercase">{t('homeContent.zones.campusZones')}</span>
            <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">{t('homeContent.zones.campusZonesHint')}</p>
          </div>
          <CampusZonesEditor lang={lang} openMediaPicker={openMediaPicker} t={t} onMissingChange={setZonesMissingEn} />
        </div>
      </div>

      {footer}
    </div>
  );
}
