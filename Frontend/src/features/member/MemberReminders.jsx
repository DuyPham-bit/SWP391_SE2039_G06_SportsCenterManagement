import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function MemberReminders({ items }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  if (!items || !items.length) return null;
  return (
    <section aria-label={isEn ? 'Reminders & Package Validity' : 'Nhắc lịch và hạn gói'} className="space-y-3 animate-fade-slide-up">
      <h2 className="font-chivo font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
        <span className="material-symbols-outlined text-amber-600 dark:text-[#F2CC8F] text-[18px]">alarm</span>
        {isEn ? 'Reminders & Package Validity' : 'Nhắc lịch & Thời hạn gói tập'}
      </h2>
      {items.map(item => (
        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 hover-lift transition-all">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-[#F2CC8F] flex items-center justify-center shrink-0">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">{item.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-900 dark:text-white break-words">{item.title}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 break-words">{item.content}</p>
            </div>
          </div>
          <a href={item.href} className="text-xs font-bold text-[#C85A3F] dark:text-[#F2CC8F] hover:underline shrink-0 flex items-center gap-1">
            <span>{item.action}</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </a>
        </div>
      ))}
    </section>
  );
}

