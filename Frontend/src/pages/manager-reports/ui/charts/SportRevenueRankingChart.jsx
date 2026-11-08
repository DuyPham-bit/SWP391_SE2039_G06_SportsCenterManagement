import React, { useState } from 'react';
import { useLanguage } from '../../../../shared/i18n/LanguageContext.jsx';
import { formatVnd, getSportColor } from '../../lib/chartFormat.js';

/**
 * 5. BIỂU ĐỒ XẾP HẠNG BỘ MÔN: DOANH THU & LƯỢT ĐẶT (TOP SPORTS BY REVENUE / BOOKINGS)
 */
export function SportRevenueRankingChart({ sports = [], revenueBySport = [] }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [metricMode, setMetricMode] = useState('revenue'); // 'revenue' | 'booked'

  // Sports with paid revenue but no sessions in the period must still be ranked.
  const byName = new Map((sports || []).map(sport => [sport.name, { ...sport, revenue: null }]));
  for (const item of revenueBySport || []) {
    const existing = byName.get(item.sportName);
    byName.set(item.sportName, existing
      ? { ...existing, revenue: item.net ?? null }
      : { name: item.sportName, booked: 0, capacity: 0, sessionsCount: 0, classesCount: 0, percentage: 0, share: 0, revenue: item.net ?? null });
  }

  if (!byName.size) {
    return (
      <div className="text-xs text-brand-navy-400 dark:text-brand-navy-500 py-8 text-center">
        {isEn ? 'No sports data available.' : 'Chưa có dữ liệu bộ môn.'}
      </div>
    );
  }

  const sportsWithMetrics = [...byName.values()].map(sport => ({ ...sport, color: getSportColor(sport.name) }));

  // Unallocated (null) revenue ranks last instead of producing NaN comparisons.
  const descending = (x, y) => (y ?? -Infinity) > (x ?? -Infinity) ? 1 : (y ?? -Infinity) < (x ?? -Infinity) ? -1 : 0;
  const sorted = [...sportsWithMetrics].sort((a, b) => metricMode === 'revenue'
    ? descending(a.revenue, b.revenue) || descending(a.booked, b.booked)
    : descending(a.booked, b.booked) || descending(a.revenue, b.revenue));

  const maxVal = Math.max(1, ...sorted.map(s => Math.abs(Number(metricMode === 'revenue' ? s.revenue : s.booked))));

  return (
    <div className="space-y-4">
      {/* Toggle mode controller */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-brand-navy-500 dark:text-brand-navy-400 font-medium">
          {metricMode === 'revenue'
            ? (isEn ? 'Ranked by net revenue received:' : 'Xếp hạng theo doanh thu thực nhận:')
            : (isEn ? 'Ranked by total bookings:' : 'Xếp hạng theo tổng lượt đặt chỗ:')}
        </span>
        <div className="inline-flex rounded-lg bg-brand-navy-100 dark:bg-brand-navy-800 p-1 border border-brand-navy-200 dark:border-brand-navy-700">
          <button
            type="button"
            onClick={() => setMetricMode('revenue')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
              metricMode === 'revenue'
                ? 'bg-brand-sage-700 text-white shadow-xs'
                : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">payments</span>
            <span>{isEn ? 'Revenue' : 'Doanh Thu'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('booked')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
              metricMode === 'booked'
                ? 'bg-brand-navy-900 text-white shadow-xs'
                : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">confirmation_number</span>
            <span>{isEn ? 'Bookings' : 'Lượt Đặt Chỗ'}</span>
          </button>
        </div>
      </div>

      {/* Bars List */}
      <div className="space-y-2.5">
        {sorted.map((s, idx) => {
          const isTop1 = idx === 0;
          const val = metricMode === 'revenue' ? s.revenue : s.booked;
          const barWidth = Math.min(100, Math.round((Math.abs(Number(val || 0)) / maxVal) * 100));

          let rankBadge = `#${idx + 1}`;
          let rankColor = 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300';
          if (idx === 0) { rankBadge = '🥇 #1'; rankColor = 'bg-brand-sand-300/30 text-brand-sand-900 dark:text-brand-sand-300 border border-brand-sand-300/60 font-black'; }
          else if (idx === 1) { rankBadge = '🥈 #2'; rankColor = 'bg-brand-navy-200 dark:bg-brand-navy-700 text-brand-navy-800 dark:text-brand-navy-200 font-bold'; }
          else if (idx === 2) { rankBadge = '🥉 #3'; rankColor = 'bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-800 dark:text-brand-sand-400 font-bold'; }

          return (
            <div
              key={s.name}
              className={`p-3 rounded-xl border transition-all ${
                isTop1 ? 'bg-brand-sand-50/30 dark:bg-brand-navy-800/80 border-brand-sand-300/60 shadow-xs' : 'bg-white dark:bg-brand-navy-900 border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${rankColor}`}>
                    {rankBadge}
                  </span>
                  <span className="font-bold text-brand-navy-900 dark:text-white">{s.name}</span>
                  <span className="text-[11px] text-brand-navy-400 dark:text-brand-navy-500">
                    ({s.sessionsCount || 0} {isEn ? 'sessions' : 'ca'} · {s.classesCount || 0} {isEn ? 'classes' : 'lớp'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <strong className={`font-chivo font-black text-sm ${metricMode === 'revenue' ? 'text-brand-sage-700 dark:text-brand-sage-500' : 'text-brand-navy-900 dark:text-white'}`}>
                    {metricMode === 'revenue' ? (s.revenue === null ? (isEn ? 'Unallocated' : 'Chưa có phân bổ') : formatVnd(s.revenue)) : `${s.booked} ${isEn ? 'bookings' : 'lượt'}`}
                  </strong>
                  <span className="text-[11px] font-semibold text-brand-navy-500 dark:text-brand-navy-400 bg-brand-navy-100 dark:bg-brand-navy-800 px-1.5 py-0.5 rounded">
                    {s.share}% {isEn ? 'share' : 'thị phần'}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    metricMode === 'revenue'
                      ? isTop1 ? 'bg-gradient-to-r from-brand-sage-700 to-brand-sand-300' : 'bg-brand-sage-700'
                      : isTop1 ? 'bg-gradient-to-r from-brand-teal-600 to-brand-sage-500' : 'bg-brand-teal-600'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-brand-navy-400 dark:text-brand-navy-500 mt-1">
                <span>{isEn ? 'Occupancy:' : 'Lấp đầy:'} <strong className="text-brand-navy-700 dark:text-brand-navy-300">{s.percentage}%</strong> ({s.booked}/{s.capacity} {isEn ? 'slots' : 'chỗ'})</span>
                <span>{metricMode === 'revenue' ? `${s.booked} ${isEn ? 'bookings' : 'lượt đặt chỗ'}` : s.revenue === null ? (isEn ? 'Unallocated' : 'Chưa có phân bổ') : formatVnd(s.revenue)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
