import React from 'react';
import { getStatusName } from '../lib/reportLabels.js';

export function ClassStatusStrip({ isEn, metrics }) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 p-3.5 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-500 text-[18px]">event_seat</span>
        <strong className="text-brand-navy-900 dark:text-white">
          {isEn ? 'Booking Status in Period:' : 'Trạng thái đăng ký trong kỳ:'}
        </strong>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(metrics.classStatusCounts).map(([status, count]) => (
          <span
            key={status}
            className="px-2.5 py-1 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 font-semibold flex items-center gap-1.5"
          >
            <span className="text-brand-navy-500 dark:text-brand-navy-400">{getStatusName(status, isEn)}:</span>
            <strong className="text-brand-navy-900 dark:text-white font-bold text-xs">{count}</strong>
          </span>
        ))}
        <span className="px-2.5 py-1 rounded-xl bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-400 border border-brand-sage-200 dark:border-brand-sage-800 text-[11px] font-bold">
          {isEn ? 'Occupancy Rate' : 'Tỷ lệ lấp đầy'}: {metrics.occupancyRate}%
        </span>
      </div>
    </div>
  );
}
