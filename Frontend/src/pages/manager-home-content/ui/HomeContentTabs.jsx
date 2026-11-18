import React from 'react';

/** Tab subtitles are computed from the loaded content and DB counts; nothing is a fixed number. */
function tabItems(content, stats, t) {
  const whyUs = content?.whyUs || {};
  const authStats = Object.keys(content?.authShowcase || {}).filter(key => /^stat\d+Value$/.test(key)).length;
  return [
    { id: 'hero', icon: 'crop_original', desc: t('homeContent.tab.heroDesc', { count: content?.heroBanner?.metrics?.length ?? 0 }) },
    { id: 'whyUs', icon: 'verified', desc: t('homeContent.tab.whyUsDesc', { features: whyUs.features?.length ?? 0, stats: whyUs.stats?.length ?? 0 }) },
    { id: 'sports', icon: 'sports_kabaddi', desc: t('homeContent.tab.sportsDesc', { count: stats?.sports?.total ?? '—' }) },
    { id: 'facilities', icon: 'stadium', desc: t('homeContent.tab.facilitiesDesc', { count: stats?.facilities?.total ?? '—' }) },
    { id: 'zones', icon: 'apartment', desc: t('homeContent.tab.zonesDesc', { count: content?.zonesLayout?.serviceAmenities?.length ?? 0 }) },
    { id: 'footer', icon: 'contact_support', desc: t('homeContent.tab.footerDesc') },
    { id: 'authShowcase', icon: 'badge', desc: t('homeContent.tab.authDesc'), badge: t('homeContent.tab.authBadge', { count: authStats }) }
  ];
}

export function HomeContentTabs({ activeTab, content, dirtySections, handleTabChange, missingBySection, sectionOf, stats, t }) {
  return (
    <div role="tablist" className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-2.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2">
      {tabItems(content, stats, t).map((tab, index) => {
        const missing = missingBySection[tab.id] || {};
        const dirty = dirtySections.has(sectionOf[tab.id]);
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex flex-col items-start justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer relative hover-lift text-left ${
              activeTab === tab.id
                ? 'bg-brand-sage-700 text-white shadow-md shadow-brand-sage-700/25 ring-2 ring-brand-sage-700/30'
                : 'text-brand-navy-700 dark:text-brand-navy-200 bg-brand-navy-50/70 dark:bg-brand-navy-800/40 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 border border-brand-navy-200/60 dark:border-brand-navy-700/60'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1 gap-1">
              <span className={`material-symbols-outlined text-[20px] ${activeTab === tab.id ? 'text-white' : 'text-brand-sage-700 dark:text-brand-sage-500'}`}>{tab.icon}</span>
              <span className="flex items-center gap-1">
                {(missing.en || missing.vi) && (
                  <span className="w-2 h-2 rounded-full bg-brand-sand-400" title={t('homeContent.lang.missingInTab')} aria-label={t('homeContent.lang.missingInTab')} />
                )}
                {dirty && <span className="w-2 h-2 rounded-full bg-brand-teal-400 animate-pulse" title={t('homeContent.status.unsaved')} aria-label={t('homeContent.status.unsaved')} />}
                {tab.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide uppercase ${
                    activeTab === tab.id
                      ? 'bg-white/25 text-white'
                      : 'bg-brand-sage-100 dark:bg-brand-sage-950 text-brand-sage-800 dark:text-brand-sage-300 border border-brand-sage-300 dark:border-brand-sage-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </span>
            </div>
            <div className="w-full">
              <span className="block truncate font-black tracking-tight">{`${index + 1}. ${t(`homeContent.tab.${tab.id}`)}`}</span>
              <span className={`block text-[10px] font-medium truncate mt-0.5 ${activeTab === tab.id ? 'text-white/80' : 'text-brand-navy-400 dark:text-brand-navy-500'}`}>
                {tab.desc}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
