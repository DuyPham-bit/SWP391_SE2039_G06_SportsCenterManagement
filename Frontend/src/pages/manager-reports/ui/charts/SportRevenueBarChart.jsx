import React, { useState } from 'react';
import { useLanguage } from '../../../../shared/i18n/LanguageContext.jsx';
import { formatVnd, getSportVisual } from '../../lib/chartFormat.js';

export function SportRevenueBarChart({ sports = [] }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [showAll, setShowAll] = useState(false);

  const rows = sports.filter(item => Number(item.net || 0) !== 0);
  if (!rows.length) {
    return (
      <div className="text-xs text-brand-navy-400 dark:text-brand-navy-500 py-12 text-center flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-[32px] mb-2 opacity-50">payments</span>
        <span>{isEn ? 'No sport revenue in selected period.' : 'Chưa có dữ liệu doanh thu bộ môn trong kỳ.'}</span>
      </div>
    );
  }

  // Sort by net revenue descending
  const sorted = [...rows].sort((a, b) => Number(b.net || 0) - Number(a.net || 0));
  const max = Math.max(1, ...sorted.map(item => Math.abs(Number(item.net || 0))));
  const totalNet = sorted.reduce((sum, item) => sum + Number(item.net || 0), 0);

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/80 shrink-0 shadow-2xs">
            🏆 #1
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-300/80 shrink-0 shadow-2xs">
            🥈 #2
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-black bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-300/80 shrink-0 shadow-2xs">
            🥉 #3
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-navy-100 text-brand-navy-700 dark:bg-brand-navy-800 dark:text-brand-navy-300 border border-brand-navy-200 dark:border-brand-navy-700 shrink-0">
            #{rank}
          </span>
        );
    }
  };

  const displayRows = showAll ? sorted : sorted.slice(0, 6);
  const remainingCount = Math.max(0, sorted.length - 6);

  return (
    <div className="space-y-3">
      {/* Partitioned List (Clean list without bulky nested box cards) */}
      <div className="divide-y divide-brand-navy-100/70 dark:divide-brand-navy-800/70">
        {displayRows.map((item, index) => {
          const visual = getSportVisual(item.sportName);
          const rank = index + 1;
          const netVal = Number(item.net || 0);
          const grossVal = Number(item.gross || 0);
          const refundVal = Number(item.refunds || 0);
          const shareVal = Number(item.share || 0);
          const barPct = Math.min(100, Math.max(4, (Math.abs(netVal) / max) * 100));

          return (
            <div
              key={item.sportId ?? `unallocated-${index}`}
              className="py-2.5 px-2 hover:bg-brand-navy-50/60 dark:hover:bg-brand-navy-800/40 rounded-xl transition-colors group"
            >
              {/* Row 1: Rank Badge + Icon + Sport Name + Net Revenue & Share */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  {getRankBadge(rank)}
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${visual.bg} shadow-2xs`}>
                    <span className="material-symbols-outlined text-[14px]">{visual.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-brand-navy-900 dark:text-white leading-tight truncate">
                    {item.sportName || (isEn ? 'Unallocated' : 'Chưa phân bổ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-black font-chivo text-brand-navy-900 dark:text-white">
                    {formatVnd(netVal)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-sage-50 text-brand-sage-700 dark:bg-brand-sage-950/60 dark:text-brand-sage-300 border border-brand-sage-200/80">
                    {shareVal.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%
                  </span>
                </div>
              </div>

              {/* Row 2: Dynamic Multi-Stop Gradient Progress Track */}
              <div className="h-2 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 overflow-hidden my-1.5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${visual.barGrad} transition-all duration-700 group-hover:brightness-110`}
                  style={{ width: `${barPct}%` }}
                />
              </div>

              {/* Row 3: Transaction Breakdown (Gross & Refunds) */}
              <div className="flex items-center justify-between text-[10.5px] px-0.5">
                <span className="text-brand-navy-500 dark:text-brand-navy-400">
                  <span className="font-semibold text-brand-navy-700 dark:text-brand-navy-300">{isEn ? 'Gross:' : 'Thu:'}</span> {formatVnd(grossVal)}
                </span>
                {refundVal > 0 ? (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                    <span className="text-brand-navy-400 font-normal">{isEn ? 'Refunds:' : 'Hoàn:'}</span>
                    <span>-{formatVnd(refundVal)}</span>
                  </span>
                ) : (
                  <span className="text-brand-navy-400 font-medium">
                    {isEn ? 'Refunds: 0đ' : 'Hoàn: 0đ'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Toggle & Total Net Bar */}
      <div className="pt-2 border-t border-brand-navy-100/80 dark:border-brand-navy-800/80 flex items-center justify-between text-[11px] px-2">
        {remainingCount > 0 ? (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-brand-teal-700 dark:text-brand-teal-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showAll ? (isEn ? 'Collapse top 6 sports' : 'Thu gọn top 6 môn') : (isEn ? `+${remainingCount} more sports (${sorted.length} total)` : `+${remainingCount} môn khác (${sorted.length} môn)`)}</span>
            <span className="material-symbols-outlined text-[14px]">{showAll ? 'expand_less' : 'expand_more'}</span>
          </button>
        ) : (
          <span className="text-brand-navy-400 font-medium">
            {isEn ? `All ${sorted.length} sports listed` : `Toàn bộ ${sorted.length} môn đang ghi nhận`}
          </span>
        )}
        <div className="flex items-center gap-1.5 font-bold text-brand-navy-700 dark:text-brand-navy-300">
          <span className="text-brand-navy-400 font-normal">{isEn ? 'Total Allocated:' : 'Tổng phân bổ:'}</span>
          <span className="font-black font-chivo text-brand-sage-700 dark:text-brand-sage-400">{formatVnd(totalNet)}</span>
        </div>
      </div>
    </div>
  );
}
