import React from 'react';
import { INPUT_CLASS, LocalizedInput, SectionHeading } from './fields.jsx';

const SMALL_LABEL = 'block text-[11px] font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1';
const CARD_LABEL = 'block text-[10px] font-bold uppercase opacity-80 mb-1';
const FIELD = `${INPUT_CLASS} px-3 py-2`;
const HOURS_FIELD = 'w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none';

export function FooterTab({ content, footer, lang, missing, setLang, t, updateContentField }) {
  const cta = content.ctaAndFooter || {};
  const set = (key, value) => updateContentField('ctaAndFooter', key, value);

  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-6 sm:p-8 space-y-6">
      <SectionHeading title={t('homeContent.footer.title')} description={t('homeContent.footer.description')}
        lang={lang} setLang={setLang} missing={missing} t={t} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-sage-700 text-white space-y-3 shadow-lg border border-white/10 hover-lift transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-md inline-block text-brand-navy-200">
            {t('homeContent.footer.ctaCard')}
          </span>
          <div>
            <label htmlFor="cta-badge" className={CARD_LABEL}>{t('homeContent.field.badge')}</label>
            <LocalizedInput id="cta-badge" value={cta.ctaBadge} lang={lang} onChange={value => set('ctaBadge', value)} maxLength={300}
              className="w-full px-3 py-1.5 rounded-lg bg-white/15 border border-white/30 text-white text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-brand-sage-500" />
          </div>
          <div>
            <label htmlFor="cta-title" className={CARD_LABEL}>{t('homeContent.footer.ctaTitle')}</label>
            <LocalizedInput id="cta-title" value={cta.ctaTitle} lang={lang} onChange={value => set('ctaTitle', value)} maxLength={300}
              className="w-full px-3 py-1.5 rounded-lg bg-white/15 border border-white/30 text-white text-sm font-black uppercase focus:outline-none focus:ring-2 focus:ring-brand-sage-500" />
          </div>
          <div>
            <label htmlFor="cta-description" className={CARD_LABEL}>{t('homeContent.footer.ctaDescription')}</label>
            <LocalizedInput id="cta-description" multiline value={cta.ctaDescription} lang={lang} onChange={value => set('ctaDescription', value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white/15 border border-white/30 text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-sage-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[['ctaPrimary', 'bg-white text-brand-sage-700'], ['ctaSecondary', 'bg-white/20 border border-white/40 text-white']].map(([key, tone], index) => (
              <div key={key} className="space-y-1.5">
                <label htmlFor={`${key}-text`} className={CARD_LABEL}>{t('homeContent.footer.button', { index: index + 1 })}</label>
                <LocalizedInput id={`${key}-text`} value={cta[`${key}Text`]} lang={lang} onChange={value => set(`${key}Text`, value)} maxLength={300}
                  className={`w-full px-2.5 py-1 rounded-lg font-bold text-xs focus:outline-none ${tone}`} />
                <input type="text" aria-label={t('homeContent.footer.buttonLink', { index: index + 1 })} value={cta[`${key}Link`] || ''}
                  onChange={e => set(`${key}Link`, e.target.value)} placeholder={t('homeContent.placeholder.internalLink')}
                  className="w-full px-2.5 py-1 rounded-lg bg-white/10 border border-white/30 text-white text-[11px] focus:outline-none" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <span className="block text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 uppercase">{t('homeContent.footer.contactHeading')}</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="footer-phone" className={SMALL_LABEL}>{t('homeContent.footer.hotline')}</label>
              <input id="footer-phone" type="tel" value={cta.contactPhone || ''} onChange={e => set('contactPhone', e.target.value)} className={`${FIELD} font-bold`} />
            </div>
            <div>
              <label htmlFor="footer-email" className={SMALL_LABEL}>{t('homeContent.footer.email')}</label>
              <input id="footer-email" type="email" value={cta.contactEmail || ''} onChange={e => set('contactEmail', e.target.value)} className={FIELD} />
            </div>
          </div>

          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="footer-zalo-phone" className={SMALL_LABEL}>{t('homeContent.footer.zalo')}</label>
                <input id="footer-zalo-phone" type="tel" autoComplete="tel" value={cta.contactZaloPhone || ''}
                  onChange={e => set('contactZaloPhone', e.target.value)} placeholder={t('homeContent.placeholder.phone')}
                  aria-describedby="footer-social-links-help" className={FIELD} />
              </div>
              <div>
                <label htmlFor="footer-facebook-url" className={SMALL_LABEL}>{t('homeContent.footer.facebook')}</label>
                <input id="footer-facebook-url" type="url" value={cta.contactFacebookUrl || ''}
                  onChange={e => set('contactFacebookUrl', e.target.value)} placeholder={t('homeContent.placeholder.url')}
                  aria-describedby="footer-social-links-help" className={FIELD} />
              </div>
            </div>
            <p id="footer-social-links-help" className="mt-1.5 text-[11px] text-brand-navy-500 dark:text-brand-navy-400">{t('homeContent.footer.socialHelp')}</p>
          </div>

          <div>
            <label htmlFor="footer-address" className={SMALL_LABEL}>{t('homeContent.footer.address')}</label>
            <LocalizedInput id="footer-address" value={cta.contactAddress} lang={lang} onChange={value => set('contactAddress', value)} className={FIELD} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['hoursWeekdays', 'hoursWeekend', 'hoursHolidays'].map(key => (
              <div key={key}>
                <label htmlFor={`footer-${key}`} className="block text-[10px] font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">{t(`homeContent.footer.${key}`)}</label>
                <LocalizedInput id={`footer-${key}`} value={cta[key]} lang={lang} onChange={value => set(key, value)} maxLength={300} className={HOURS_FIELD} />
              </div>
            ))}
          </div>

          <div>
            <label htmlFor="footer-hours-note" className={SMALL_LABEL}>{t('homeContent.footer.hoursNote')}</label>
            <LocalizedInput id="footer-hours-note" value={cta.hoursNote} lang={lang} onChange={value => set('hoursNote', value)} className={FIELD} />
          </div>

          <div>
            <label htmlFor="footer-copyright" className={SMALL_LABEL}>{t('homeContent.footer.copyright')}</label>
            <LocalizedInput id="footer-copyright" value={cta.copyright} lang={lang} onChange={value => set('copyright', value)} maxLength={300}
              className={`${FIELD} text-brand-navy-600 dark:text-brand-navy-400`} />
          </div>
        </div>
      </div>

      {footer}
    </div>
  );
}
