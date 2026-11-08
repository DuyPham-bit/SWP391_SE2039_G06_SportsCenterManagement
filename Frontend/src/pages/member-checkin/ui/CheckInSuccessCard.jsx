import React from 'react';

export function CheckInSuccessCard({ isEn, lastCheckIn }) {
  return (
    <div className="p-6 rounded-2xl bg-brand-sage-50 dark:bg-brand-sage-950/30 border-2 border-brand-sage-500/70 text-brand-sage-950 dark:text-brand-sage-200 space-y-3 animate-fade-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-sage-900 to-brand-sage-800 text-white flex items-center justify-center shrink-0 shadow-md">
          <span className="material-symbols-outlined text-[28px] text-brand-sand-300">check_circle</span>
        </div>
        <div>
          <span className="font-chivo text-[11px] font-black uppercase tracking-widest text-brand-sage-700 dark:text-brand-sage-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-ping" />
            <span>{isEn ? 'GATE UNLOCKED (ENTRY APPROVED)' : 'CỬA TỰ ĐỘNG ĐÃ MỞ (GATE UNLOCKED)'}</span>
          </span>
          <h3 className="font-chivo text-xl font-black text-brand-sage-950 dark:text-white leading-tight">
            {lastCheckIn.memberName}
          </h3>
          <p className="text-xs text-brand-sage-800 dark:text-brand-sage-300 font-medium">
            {isEn ? 'Card ID' : 'Mã thẻ'}: <strong className="font-mono text-brand-sage-950 dark:text-white">{lastCheckIn.memberCode}</strong>
          </p>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-white/90 dark:bg-brand-navy-800/90 border border-brand-sage-200 dark:border-brand-sage-800 text-xs grid grid-cols-2 gap-3">
        <div>
          <span className="text-brand-sage-700 dark:text-brand-sage-400 block text-[10px] uppercase font-bold tracking-wider">
            {isEn ? 'Package' : 'Gói tập'}
          </span>
          <span className="font-bold text-brand-navy-900 dark:text-white">{lastCheckIn.packageName}</span>
        </div>
        <div>
          <span className="text-brand-sage-700 dark:text-brand-sage-400 block text-[10px] uppercase font-bold tracking-wider">
            {isEn ? 'Entry Time' : 'Thời gian vào'}
          </span>
          <span className="font-bold text-brand-navy-900 dark:text-white">{lastCheckIn.checkInTime}</span>
        </div>
      </div>
    </div>
  );
}
