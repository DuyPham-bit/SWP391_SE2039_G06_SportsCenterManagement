import React from 'react';
import { useLanguage } from '../../../../shared/i18n/LanguageContext.jsx';
import { formatVnd } from '../../lib/chartFormat.js';

export function SportRevenueBarChart({ sports = [] }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const rows = sports.filter(item => Number(item.net || 0) !== 0);
  if (!rows.length) return (
    <div className="text-xs text-brand-navy-400 dark:text-brand-navy-500 py-8 text-center">
      {isEn ? 'No sport revenue in selected period.' : 'Chưa có doanh thu bộ môn trong kỳ.'}
    </div>
  );
  const max = Math.max(1, ...rows.map(item => Math.abs(Number(item.net || 0))));
  return (
    <div className="space-y-3">
      {rows.map((item, index) => (
        <div key={item.sportId ?? 'unallocated'} className="rounded-xl border border-brand-navy-200 dark:border-brand-navy-800 p-3 bg-white dark:bg-brand-navy-900">
          <div className="flex justify-between gap-3 text-xs mb-2">
            <span className="font-bold text-brand-navy-900 dark:text-white">{index === 0 && item.sportId ? '🥇 ' : ''}{item.sportName}</span>
            <span className="font-black text-brand-sage-700 dark:text-brand-sage-500">{formatVnd(item.net)} · {Number(item.share || 0).toLocaleString('vi-VN')}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 overflow-hidden">
            <div className={`h-full rounded-full ${item.sportId ? 'bg-gradient-to-r from-brand-sage-700 to-brand-sand-300' : 'bg-brand-navy-400'}`}
              style={{ width: `${Math.max(item.net ? 2 : 0, Math.abs(Number(item.net || 0)) / max * 100)}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-brand-navy-500 dark:text-brand-navy-400">
            <span>{isEn ? 'Gross:' : 'Thu:'} {formatVnd(item.gross)}</span>
            <span>{isEn ? 'Refunds:' : 'Hoàn:'} {formatVnd(item.refunds)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
