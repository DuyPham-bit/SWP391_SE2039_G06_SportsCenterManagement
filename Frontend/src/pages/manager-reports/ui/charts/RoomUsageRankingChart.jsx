import React, { useState } from 'react';
import { useLanguage } from '../../../../shared/i18n/LanguageContext.jsx';

/**
 * 6. BIỂU ĐỒ XẾP HẠNG SÂN BÃI / PHÒNG TẬP: SỐ CA HỌC & LƯỢT KHÁCH
 */
export function RoomUsageRankingChart({ rooms = [] }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [metricMode, setMetricMode] = useState('sessions'); // 'sessions' | 'booked'

  if (!rooms || !rooms.length) {
    return (
      <div className="text-xs text-brand-navy-400 dark:text-brand-navy-500 py-8 text-center">
        {isEn ? 'No court/room data available.' : 'Chưa có dữ liệu sân bãi.'}
      </div>
    );
  }

  const roomsWithMetrics = rooms;

  // Sort based on current mode
  const sorted = [...roomsWithMetrics].sort((a, b) => {
    if (metricMode === 'sessions') return b.sessionsCount - a.sessionsCount || b.booked - a.booked;
    return b.booked - a.booked || b.sessionsCount - a.sessionsCount;
  });

  const maxVal = Math.max(1, ...sorted.map(r => metricMode === 'sessions' ? r.sessionsCount : r.booked));

  return (
    <div className="space-y-4">
      {/* Toggle mode controller */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-brand-navy-500 dark:text-brand-navy-400 font-medium">
          {metricMode === 'sessions'
            ? (isEn ? 'Ranked by sessions hosted:' : 'Xếp hạng theo số ca học:')
            : (isEn ? 'Ranked by visitors received:' : 'Xếp hạng theo lượt khách tiếp nhận:')}
        </span>
        <div className="inline-flex rounded-lg bg-brand-navy-100 dark:bg-brand-navy-800 p-1 border border-brand-navy-200 dark:border-brand-navy-700">
          <button
            type="button"
            onClick={() => setMetricMode('sessions')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
              metricMode === 'sessions'
                ? 'bg-brand-sage-700 text-white shadow-xs'
                : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">calendar_month</span>
            <span>{isEn ? 'Sessions' : 'Số Ca Học'}</span>
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
            <span className="material-symbols-outlined text-[14px]">stadium</span>
            <span>{isEn ? 'Visitors' : 'Lượt Khách'}</span>
          </button>
        </div>
      </div>

      {/* Bars List */}
      <div className="space-y-2.5">
        {sorted.map((r, idx) => {
          const isTop1 = idx === 0;
          const val = metricMode === 'sessions' ? r.sessionsCount : r.booked;
          const barWidth = Math.min(100, Math.round((Number(val || 0) / maxVal) * 100));

          let rankBadge = `#${idx + 1}`;
          let rankColor = 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300';
          if (idx === 0) { rankBadge = '🥇 #1'; rankColor = 'bg-brand-sage-100 dark:bg-brand-sage-950/50 text-brand-sage-900 dark:text-brand-sage-300 border border-brand-sage-300 dark:border-brand-sage-800 font-black'; }
          else if (idx === 1) { rankBadge = '🥈 #2'; rankColor = 'bg-brand-navy-200 dark:bg-brand-navy-700 text-brand-navy-800 dark:text-brand-navy-200 font-bold'; }
          else if (idx === 2) { rankBadge = '🥉 #3'; rankColor = 'bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-800 dark:text-brand-sand-400 font-bold'; }

          return (
            <div
              key={r.id}
              className={`p-3 rounded-xl border transition-all ${
                isTop1 ? 'bg-brand-sage-50/30 dark:bg-brand-navy-800/80 border-brand-sage-300/80 dark:border-brand-sage-700 shadow-xs' : 'bg-white dark:bg-brand-navy-900 border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${rankColor}`}>
                    {rankBadge}
                  </span>
                  <span className="font-bold text-brand-navy-900 dark:text-white">{r.name}</span>
                  <span className="text-[11px] text-brand-navy-400 dark:text-brand-navy-500">({r.type})</span>
                </div>
                <div className="flex items-center gap-2">
                  <strong className={`font-chivo font-black text-sm ${metricMode === 'sessions' ? 'text-brand-sage-700 dark:text-brand-sage-500' : 'text-brand-navy-900 dark:text-white'}`}>
                    {metricMode === 'sessions' ? `${r.sessionsCount || 0} ${isEn ? 'sessions' : 'ca'}` : `${r.booked} ${isEn ? 'visitors' : 'khách'}`}
                  </strong>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                    r.occupancyRate >= 20 ? 'bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-400 border-brand-sage-200 dark:border-brand-sage-800' : 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-700'
                  }`}>
                    {r.occupancyRate}% {isEn ? 'load' : 'tải'}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    metricMode === 'sessions'
                      ? isTop1 ? 'bg-gradient-to-r from-brand-sage-700 to-brand-sage-500' : 'bg-brand-sage-700'
                      : isTop1 ? 'bg-gradient-to-r from-brand-teal-600 to-brand-navy-700' : 'bg-brand-teal-600'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-brand-navy-400 dark:text-brand-navy-500 mt-1">
                <span>{r.location || (isEn ? 'Main Zone' : 'Khu chính')} · {isEn ? 'Hosted' : 'Đã chạy'} <strong className="text-brand-navy-700 dark:text-brand-navy-300">{r.sessionsCount} {isEn ? 'sessions' : 'ca'}</strong></span>
                <span>{metricMode === 'sessions' ? `${r.booked} ${isEn ? 'visitors' : 'lượt khách'}` : `${r.sessionsCount || 0} ${isEn ? 'sessions' : 'ca'}`}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
