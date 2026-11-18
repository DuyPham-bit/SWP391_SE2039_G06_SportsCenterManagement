import React, { useRef, useState } from 'react';
import { uploadMediaFileToCloud } from '../../../shared/api/mediaApi.js';
import { INPUT_CLASS, LABEL_CLASS, LocalizedInput, SectionHeading } from './fields.jsx';

const MAX_METRICS = 12;
const newMetricId = () => `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function HeroBannerTab({ addToast, content, footer, lang, missing, openMediaPicker, setLang, t, updateContentField }) {
  const videoInputRef = useRef(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const hero = content.heroBanner || {};
  const metrics = hero.metrics || [];
  const set = (key, value) => updateContentField('heroBanner', key, value);
  const setMetrics = updated => set('metrics', updated);
  const uploadVideo = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingVideo(true);
    try {
      const uploaded = await uploadMediaFileToCloud(file);
      if (uploaded?.url) set('videoUrl', uploaded.url);
    } catch (error) {
      addToast?.(error.message || t('homeContent.status.saveFailed'), 'error');
    } finally {
      setUploadingVideo(false);
    }
  };
  const moveMetric = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= metrics.length) return;
    const updated = [...metrics];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setMetrics(updated);
  };

  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-6 sm:p-8 space-y-6">
      <SectionHeading
        title={t('homeContent.hero.title')}
        description={t('homeContent.hero.description')}
        lang={lang} setLang={setLang} missing={missing} t={t}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="hero-badge" className={LABEL_CLASS}>{t('homeContent.hero.badge')}</label>
            <LocalizedInput id="hero-badge" value={hero.badge} lang={lang} onChange={value => set('badge', value)} maxLength={300}
              className={`${INPUT_CLASS} font-semibold`} />
          </div>

          <div>
            <label htmlFor="hero-title" className={LABEL_CLASS}>{t('homeContent.hero.heading')}</label>
            <LocalizedInput id="hero-title" value={hero.title} lang={lang} onChange={value => set('title', value)} maxLength={300} required
              className={`${INPUT_CLASS} text-sm font-black uppercase`} />
          </div>

          <div>
            <label htmlFor="hero-description" className={LABEL_CLASS}>{t('homeContent.hero.subtext')}</label>
            <LocalizedInput id="hero-description" multiline value={hero.description} lang={lang} onChange={value => set('description', value)} maxLength={10000}
              className={`${INPUT_CLASS} leading-relaxed`} />
            <p className="text-[11px] text-brand-navy-400 dark:text-brand-navy-500 mt-1">{t('homeContent.hint.countPlaceholders')}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="hero-cta-text" className={LABEL_CLASS}>{t('homeContent.hero.primaryCta')}</label>
              <LocalizedInput id="hero-cta-text" value={hero.primaryCtaText} lang={lang} onChange={value => set('primaryCtaText', value)} maxLength={300}
                className={`${INPUT_CLASS} px-3 py-2 font-bold`} />
            </div>
            <div>
              <label htmlFor="hero-cta-link" className={LABEL_CLASS}>{t('homeContent.hero.primaryCtaLink')}</label>
              <input id="hero-cta-link" type="text" value={hero.primaryCtaLink || ''} onChange={e => set('primaryCtaLink', e.target.value)}
                placeholder={t('homeContent.placeholder.internalLink')} className={`${INPUT_CLASS} px-3 py-2`} />
            </div>
            <div>
              <label htmlFor="hero-cta2-text" className={LABEL_CLASS}>{t('homeContent.hero.secondaryCta')}</label>
              <LocalizedInput id="hero-cta2-text" value={hero.secondaryCtaText} lang={lang} onChange={value => set('secondaryCtaText', value)} maxLength={300}
                className={`${INPUT_CLASS} px-3 py-2 font-bold`} />
            </div>
            <div>
              <label htmlFor="hero-cta2-link" className={LABEL_CLASS}>{t('homeContent.hero.secondaryCtaLink')}</label>
              <input id="hero-cta2-link" type="text" value={hero.secondaryCtaLink || ''} onChange={e => set('secondaryCtaLink', e.target.value)}
                placeholder={t('homeContent.placeholder.internalLink')} className={`${INPUT_CLASS} px-3 py-2`} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="hero-poster" className={LABEL_CLASS}>{t('homeContent.hero.poster')}</label>
            <div className="flex gap-2 mb-2">
              <input id="hero-poster" type="url" value={hero.posterUrl || ''} onChange={e => set('posterUrl', e.target.value)}
                placeholder={t('homeContent.placeholder.url')}
                className={`${INPUT_CLASS} flex-1 px-3 py-2 truncate`} />
              <button
                type="button"
                onClick={() => openMediaPicker(t('homeContent.hero.pickPoster'), hero.posterUrl || '', url => set('posterUrl', url))}
                className="px-3.5 py-2 bg-brand-sage-700 hover:bg-brand-sage-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all hover-lift shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                <span>{t('homeContent.action.uploadImage')}</span>
              </button>
            </div>
            <div className="h-36 rounded-xl overflow-hidden bg-brand-navy-900 relative border border-brand-navy-200 dark:border-brand-navy-800">
              {hero.posterUrl ? (
                <img src={hero.posterUrl} alt={t('homeContent.hero.posterPreview')} className="w-full h-full object-cover opacity-80" />
              ) : (
                // No poster yet: an empty <img src=""> renders as a broken-image icon.
                <div className="w-full h-full flex items-center justify-center text-xs text-brand-navy-300">{t('homeContent.hero.noPoster')}</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-950 via-transparent to-transparent flex items-end p-3">
                <span className="text-[11px] text-white font-bold bg-black/60 px-2 py-0.5 rounded">{t('homeContent.hero.posterPreview')}</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="hero-video" className={LABEL_CLASS}>{t('homeContent.hero.video')}</label>
            <div className="flex gap-2">
              <input id="hero-video" type="text" value={hero.videoUrl || ''} onChange={e => set('videoUrl', e.target.value)}
                placeholder={t('homeContent.placeholder.videoUrl')} className={`${INPUT_CLASS} flex-1 px-3 py-2`} />
              <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,.mp4,.webm" onChange={uploadVideo} className="hidden" />
              <button
                type="button"
                disabled={uploadingVideo}
                onClick={() => videoInputRef.current?.click()}
                className="px-3.5 py-2 bg-brand-sage-700 hover:bg-brand-sage-900 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all hover-lift shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">{uploadingVideo ? 'hourglass_top' : 'video_library'}</span>
                <span>{uploadingVideo ? t('homeContent.status.uploading') : t('homeContent.action.uploadVideo')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick metrics: ordered list, any length */}
      <div className="border-t border-brand-navy-100 dark:border-brand-navy-800 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 uppercase flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-brand-sage-700 dark:text-brand-sage-500">speed</span>
            <span>{t('homeContent.hero.metrics', { count: metrics.length })}</span>
          </h3>
          <button
            type="button"
            disabled={metrics.length >= MAX_METRICS}
            onClick={() => setMetrics([...metrics, { id: newMetricId(), value: '', label: { vi: '', en: '' } }])}
            className="px-3 py-1.5 rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>{t('homeContent.hero.addMetric')}</span>
          </button>
        </div>
        {metrics.length === 0 && <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">{t('homeContent.hero.noMetrics')}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((metric, idx) => {
            const setMetric = values => setMetrics(metrics.map((item, i) => (i === idx ? { ...item, ...values } : item)));
            return (
              <div key={metric.id || idx} className="p-3 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/50 border border-brand-navy-200 dark:border-brand-navy-800 space-y-1.5 hover-lift transition-all">
                <input
                  type="text"
                  aria-label={t('homeContent.hero.metricValue')}
                  value={typeof metric.value === 'string' ? metric.value : ''}
                  onChange={e => setMetric({ value: e.target.value })}
                  maxLength={300}
                  className="w-full px-2 py-1 bg-white dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-lg text-sm font-black text-brand-sage-700 dark:text-brand-sage-500 text-center focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
                />
                <LocalizedInput
                  aria-label={t('homeContent.hero.metricLabel')}
                  value={metric.label}
                  lang={lang}
                  onChange={label => setMetric({ label })}
                  maxLength={300}
                  className="w-full px-2 py-1 bg-white dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-lg text-[11px] font-bold text-brand-navy-700 dark:text-brand-navy-300 text-center uppercase focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
                />
                <div className="flex items-center justify-center gap-1 pt-0.5">
                  <button type="button" onClick={() => moveMetric(idx, -1)} disabled={idx === 0} aria-label={t('homeContent.action.moveUp')}
                    className="p-1 rounded text-brand-navy-500 hover:text-brand-sage-700 disabled:opacity-30">
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  </button>
                  <button type="button" onClick={() => moveMetric(idx, 1)} disabled={idx === metrics.length - 1} aria-label={t('homeContent.action.moveDown')}
                    className="p-1 rounded text-brand-navy-500 hover:text-brand-sage-700 disabled:opacity-30">
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                  <button type="button" onClick={() => setMetrics(metrics.filter((_, i) => i !== idx))} aria-label={t('homeContent.hero.removeMetric')}
                    className="p-1 rounded text-brand-danger-600 hover:text-brand-danger-700">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {footer}
    </div>
  );
}
