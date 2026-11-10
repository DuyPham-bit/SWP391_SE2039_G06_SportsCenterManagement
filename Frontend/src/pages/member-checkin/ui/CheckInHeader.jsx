import React from 'react';

export function CheckInHeader({ isEn }) {
  return (
    <div className="scms-hero relative rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      {/* Ambient glow & sports wave overlays matching logo palette */}
      <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Subtle decorative Olympic curved motion lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
        <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
        <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
      </svg>

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 backdrop-blur-md text-brand-sage-900 dark:text-brand-sage-300 border border-white/80 dark:border-white/20 text-xs font-black uppercase tracking-wider shadow-xs">
          <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
          <span>{isEn ? 'OLYMPIC GATE TERMINAL 01' : 'CỔNG QUÉT THẺ OLYMPIC · CỔNG 01'}</span>
        </div>
        <h1 className="font-chivo text-2xl md:text-3xl font-black mt-2 text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
          {isEn ? 'Gate Scanner & Member Check-in' : 'Cổng Quét Thẻ & Check-in Hội Viên'}
        </h1>
        <p className="text-xs sm:text-sm text-white/95 mt-1 max-w-xl font-medium leading-relaxed drop-shadow-xs">
          {isEn
            ? 'Scan member QR code with camera, RFID badge, or enter ID to verify active passes and unlock turnstiles.'
            : 'Quét mã QR bằng Camera, thẻ chip RFID hoặc nhập mã hội viên để đối soát gói tập và tự động mở cổng vào sân.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0">
        <a
          href="#/receptionist/counter-register"
          className="scms-shine px-5 py-3 bg-brand-navy-950 hover:bg-brand-navy-900 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px] text-brand-sand-300">point_of_sale</span>
          <span>{isEn ? 'Counter Renewal' : 'Gia Hạn Tại Quầy'}</span>
        </a>
        <a
          href="#/receptionist/lookup"
          className="scms-shine px-5 py-3 bg-white/90 hover:bg-white text-brand-navy-950 rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px] text-brand-sage-700">person_search</span>
          <span>{isEn ? 'Member Lookup' : 'Tra Cứu'}</span>
        </a>
      </div>
    </div>
  );
}
