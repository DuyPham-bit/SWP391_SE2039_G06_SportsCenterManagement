import React from 'react';
import { fillCounts } from '../../../entities/landing-content/index.js';
import { INPUT_CLASS, LABEL_CLASS, LocalizedInput, SectionHeading, showText } from './fields.jsx';

const SMALL_LABEL = 'block text-[10px] font-bold text-brand-navy-600 dark:text-brand-navy-400 uppercase mb-1';
const SMALL_FIELD = 'w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none';
const FEATURES = [1, 2];
const STATS = [1, 2, 3];

export function AuthShowcaseTab({ content, footer, lang, missing, openMediaPicker, setLang, stats, t, updateContentField }) {
  const auth = content.authShowcase || {};
  const set = (key, value) => updateContentField('authShowcase', key, value);
  // Preview text in the editing language with DB counts filled in.
  const preview = key => fillCounts(showText(auth[key], lang), stats);
  const statValue = index => fillCounts(auth[`stat${index}Value`] || '', stats);

  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-6 sm:p-8 space-y-6">
      <SectionHeading title={t('homeContent.auth.title')} description={t('homeContent.auth.description')}
        lang={lang} setLang={setLang} missing={missing} t={t} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="auth-badge" className={LABEL_CLASS}>{t('homeContent.field.badge')}</label>
              <LocalizedInput id="auth-badge" value={auth.badge} lang={lang} onChange={value => set('badge', value)} maxLength={300} className={`${INPUT_CLASS} font-semibold`} />
            </div>
            <div>
              <label htmlFor="auth-tagline" className={LABEL_CLASS}>{t('homeContent.auth.tagline')}</label>
              <LocalizedInput id="auth-tagline" value={auth.tagline} lang={lang} onChange={value => set('tagline', value)} maxLength={300} className={`${INPUT_CLASS} font-semibold`} />
            </div>
          </div>

          <div>
            <label htmlFor="auth-login-title" className={LABEL_CLASS}>{t('homeContent.auth.loginTitle')}</label>
            <LocalizedInput id="auth-login-title" multiline rows={2} value={auth.loginTitle} lang={lang} onChange={value => set('loginTitle', value)} className={`${INPUT_CLASS} text-sm font-bold`} />
            <span className="text-[11px] text-brand-navy-400 dark:text-brand-navy-500">{t('homeContent.auth.lineBreakTip')}</span>
          </div>

          <div>
            <label htmlFor="auth-register-title" className={LABEL_CLASS}>{t('homeContent.auth.registerTitle')}</label>
            <LocalizedInput id="auth-register-title" multiline rows={2} value={auth.registerTitle} lang={lang} onChange={value => set('registerTitle', value)} className={`${INPUT_CLASS} text-sm font-bold`} />
          </div>

          <div>
            <label htmlFor="auth-description" className={LABEL_CLASS}>{t('homeContent.field.description')}</label>
            <LocalizedInput id="auth-description" multiline value={auth.description} lang={lang} onChange={value => set('description', value)} className={`${INPUT_CLASS} leading-relaxed`} />
            <p className="text-[11px] text-brand-navy-400 dark:text-brand-navy-500 mt-1">{t('homeContent.hint.countPlaceholders')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="auth-poster" className={LABEL_CLASS}>{t('homeContent.auth.poster')}</label>
            <div className="flex gap-2 mb-2">
              <input id="auth-poster" type="url" value={auth.posterUrl || ''} onChange={e => set('posterUrl', e.target.value)}
                placeholder={t('homeContent.placeholder.url')} className={`${INPUT_CLASS} flex-1 px-3 py-2 truncate`} />
              <button
                type="button"
                onClick={() => openMediaPicker(t('homeContent.auth.pickPoster'), auth.posterUrl || '', url => set('posterUrl', url))}
                className="px-3.5 py-2 bg-brand-sage-700 hover:bg-brand-sage-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all hover-lift shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                <span>{t('homeContent.action.uploadImage')}</span>
              </button>
            </div>

            <div className="h-64 rounded-2xl overflow-hidden bg-brand-navy-800 relative border border-brand-navy-700 p-5 flex flex-col justify-between text-white shadow-inner">
              {auth.posterUrl && <img src={auth.posterUrl} alt={t('homeContent.auth.posterPreview')} className="absolute inset-0 w-full h-full object-cover opacity-35" />}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-800 via-brand-navy-700/80 to-transparent pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">{preview('badge')}</span>
                <span className="text-[10px] bg-black/50 text-white/70 px-2 py-0.5 rounded font-mono">{t('homeContent.label.preview')}</span>
              </div>
              <div className="relative z-10 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-brand-sand-300">{preview('tagline')}</div>
                <div className="text-sm font-black text-white leading-tight line-clamp-2">{preview('loginTitle')}</div>
              </div>
              <div className="relative z-10 flex gap-4 pt-2 border-t border-white/10 text-xs">
                {STATS.map(index => (
                  <div key={index}>
                    <span className="font-bold text-white">{statValue(index)}</span>
                    <span className="text-[10px] text-brand-navy-300 block">{preview(`stat${index}Label`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-navy-100 dark:border-brand-navy-800 pt-6">
        <h3 className="text-xs font-black text-brand-navy-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-brand-sage-700 dark:text-brand-sage-400">featured_play_list</span>
          <span>{t('homeContent.auth.featureCards', { count: FEATURES.length })}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map(index => (
            <div key={index} className="p-4 rounded-xl border border-brand-navy-200 dark:border-brand-navy-800 bg-brand-navy-50/50 dark:bg-brand-navy-800/40 space-y-3">
              <span className="text-[11px] font-bold text-brand-navy-500 uppercase tracking-wide">{t('homeContent.auth.featureCard', { index })}</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor={`auth-f${index}-icon`} className={SMALL_LABEL}>{t('homeContent.field.icon')}</label>
                  <input id={`auth-f${index}-icon`} type="text" value={auth[`feature${index}Icon`] || ''} onChange={e => set(`feature${index}Icon`, e.target.value)}
                    className={`${SMALL_FIELD} font-semibold`} />
                </div>
                <div className="col-span-2">
                  <label htmlFor={`auth-f${index}-title`} className={SMALL_LABEL}>{t('homeContent.field.title')}</label>
                  <LocalizedInput id={`auth-f${index}-title`} value={auth[`feature${index}Title`]} lang={lang} onChange={value => set(`feature${index}Title`, value)} maxLength={300}
                    className={`${SMALL_FIELD} font-bold`} />
                </div>
              </div>
              <div>
                <label htmlFor={`auth-f${index}-desc`} className={SMALL_LABEL}>{t('homeContent.field.shortDescription')}</label>
                <LocalizedInput id={`auth-f${index}-desc`} value={auth[`feature${index}Desc`]} lang={lang} onChange={value => set(`feature${index}Desc`, value)} className={SMALL_FIELD} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-brand-navy-100 dark:border-brand-navy-800 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xs font-black text-brand-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-brand-sage-700 dark:text-brand-sage-400">analytics</span>
              <span>{t('homeContent.auth.stats', { count: STATS.length })}</span>
            </h3>
            <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">{t('homeContent.auth.statsHint')}</p>
          </div>
          <button
            type="button"
            onClick={() => { set('stat1Value', '{{sportCount}}'); set('stat2Value', '{{facilityCount}}'); }}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-200 text-xs font-bold hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer hover-lift shrink-0"
          >
            <span className="material-symbols-outlined text-[16px] text-brand-sage-700 dark:text-brand-sage-400">sync_alt</span>
            <span>{t('homeContent.auth.useDbCounts')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STATS.map(index => (
            <div key={index} className="p-3.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-800 bg-brand-navy-50/50 dark:bg-brand-navy-800/40 space-y-2">
              <span className="text-[10px] font-bold text-brand-navy-500 uppercase">{t('homeContent.auth.stat', { index })}</span>
              <div>
                <label htmlFor={`auth-s${index}-value`} className={SMALL_LABEL}>{t('homeContent.field.value')}</label>
                <input id={`auth-s${index}-value`} type="text" value={auth[`stat${index}Value`] || ''} onChange={e => set(`stat${index}Value`, e.target.value)}
                  maxLength={300} className={`${SMALL_FIELD} font-black`} />
              </div>
              <div>
                <label htmlFor={`auth-s${index}-label`} className={SMALL_LABEL}>{t('homeContent.field.label')}</label>
                <LocalizedInput id={`auth-s${index}-label`} value={auth[`stat${index}Label`]} lang={lang} onChange={value => set(`stat${index}Label`, value)} maxLength={300} className={SMALL_FIELD} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 p-4 rounded-2xl bg-brand-navy-800 text-white border border-white/10 shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase font-bold text-brand-navy-400 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-sage-400 animate-pulse" />
              <span>{t('homeContent.auth.livePreview')}</span>
            </div>
            <div className="flex items-center gap-8 sm:gap-12 mt-2.5">
              {STATS.map(index => (
                <div key={index}>
                  <div className={`text-2xl sm:text-3xl font-bold tracking-tight ${index === 3 ? 'text-brand-sand-300' : 'text-white'}`}>{statValue(index)}</div>
                  <div className="text-[11px] text-brand-navy-400 font-medium mt-0.5">{preview(`stat${index}Label`)}</div>
                </div>
              ))}
            </div>
          </div>
          <a href="#/login" target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover-lift">
            <span>{t('homeContent.auth.openLogin')}</span>
            <span className="material-symbols-outlined text-[15px]">open_in_new</span>
          </a>
        </div>
      </div>

      {footer}
    </div>
  );
}
