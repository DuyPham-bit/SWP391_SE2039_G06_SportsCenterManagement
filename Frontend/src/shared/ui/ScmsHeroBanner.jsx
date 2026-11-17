import React from 'react';

/** Shared Sage -> Teal -> Sand Olympic banner styles matching `.scms-hero` choreography in theme.css. */
export const SCMS_HERO_SECTION_CLASS =
  'scms-hero relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20';

export const SCMS_HERO_BADGE_CLASS =
  'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 dark:bg-brand-navy-900/90 backdrop-blur-md text-brand-sage-900 dark:text-brand-sage-300 border border-white/80 dark:border-white/20 text-xs font-black uppercase tracking-wider shadow-xs';

export const SCMS_HERO_SUBBADGE_CLASS =
  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 text-xs font-bold shadow-xs';

export const SCMS_HERO_BTN_LIGHT =
  'scms-shine px-4 sm:px-5 py-2.5 sm:py-3 bg-white/95 hover:bg-white text-brand-navy-950 rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer border border-white/80 disabled:opacity-50 disabled:cursor-not-allowed';

export const SCMS_HERO_BTN_DARK =
  'scms-shine px-4 sm:px-5 py-2.5 sm:py-3 bg-brand-navy-950 hover:bg-brand-navy-900 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

export const SCMS_HERO_BTN_GLASS =
  'scms-shine px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed';

/** Renders ambient blur orbs and Olympic curved tracks as direct children of `.scms-hero`. */
export function ScmsHeroDecor() {
  return (
    <>
      <div className="pointer-events-none absolute -top-16 -right-16 w-80 h-80 rounded-full bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent blur-3xl" />
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden"
        preserveAspectRatio="none"
        viewBox="0 0 1000 300"
        aria-hidden="true"
      >
        <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
        <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
      </svg>
    </>
  );
}
