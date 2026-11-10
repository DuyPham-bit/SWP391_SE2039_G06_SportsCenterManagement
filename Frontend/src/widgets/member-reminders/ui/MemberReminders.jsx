import React from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';

export function MemberReminders({ items }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  if (!items || !items.length) return null;
  return (
    <section aria-label={isEn ? 'Reminders & Package Validity' : 'Nhắc lịch và hạn gói'} className="space-y-3 animate-fade-slide-up">
      <h2 className="font-chivo font-bold text-sm text-ink-strong flex items-center gap-1.5">
        <span className="material-symbols-outlined text-brand-sand-700 dark:text-brand-sand-300 text-[18px]">alarm</span>
        {isEn ? 'Reminders & Package Validity' : 'Nhắc lịch & Thời hạn gói tập'}
      </h2>
      {items.map(item => (
        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-warning/30 bg-warning-soft/70 hover-lift transition-all">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-sand-100 dark:bg-brand-sand-900/40 text-warning dark:text-brand-sand-300 flex items-center justify-center shrink-0">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">{item.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-ink-strong break-words">{item.title}</p>
              <p className="text-xs text-ink-muted mt-0.5 break-words">{item.content}</p>
            </div>
          </div>
          <a href={item.href} className="text-xs font-bold text-brand-terra-700 dark:text-brand-sand-300 hover:underline shrink-0 flex items-center gap-1">
            <span>{item.action}</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </a>
        </div>
      ))}
    </section>
  );
}

