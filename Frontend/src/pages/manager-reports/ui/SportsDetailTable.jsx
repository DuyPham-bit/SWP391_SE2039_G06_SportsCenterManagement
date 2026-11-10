import React from 'react';
import { getSportStyle } from '../lib/reportLabels.js';

export function SportsDetailTable({ isEn, metrics }) {
  return (
    <section className="bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="font-bold text-brand-navy-900 dark:text-white text-sm">
        {isEn ? 'Detailed metrics per sport discipline' : 'Thông số chi tiết từng bộ môn thể thao'}
      </h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.topSports?.map((sport, idx) => {
          const style = getSportStyle(sport.name);
          return (
            <div
              key={sport.name}
              className="border border-brand-navy-200/80 dark:border-brand-navy-800 rounded-2xl p-4 bg-brand-navy-50/40 dark:bg-brand-navy-800/40 hover:bg-white dark:hover:bg-brand-navy-800 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${style.bg}`}>
                    <span className="material-symbols-outlined text-[16px]">{style.icon}</span>
                    {sport.name}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-brand-navy-200 dark:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300">
                    {isEn ? 'Rank' : 'Hạng'} #{idx + 1}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="bg-white dark:bg-brand-navy-900 p-2.5 rounded-xl border border-brand-navy-200/60 dark:border-brand-navy-700/60">
                    <span className="text-brand-navy-400 block text-[11px]">{isEn ? 'Booked' : 'Đã đặt chỗ'}</span>
                    <span className="text-base font-black text-brand-navy-900 dark:text-white">{sport.booked} {isEn ? 'bookings' : 'lượt'}</span>
                  </div>
                  <div className="bg-white dark:bg-brand-navy-900 p-2.5 rounded-xl border border-brand-navy-200/60 dark:border-brand-navy-700/60">
                    <span className="text-brand-navy-400 block text-[11px]">{isEn ? 'Capacity' : 'Sức chứa mở'}</span>
                    <span className="text-base font-black text-brand-navy-900 dark:text-white">{sport.capacity} {isEn ? 'slots' : 'chỗ'}</span>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Occupancy Rate:' : 'Tỷ lệ lấp đầy:'}</span>
                    <span className="text-brand-navy-900 dark:text-white font-bold">{sport.percentage}%</span>
                  </div>
                  <div className="w-full bg-brand-navy-200 dark:bg-brand-navy-700 rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full ${style.bar}`} style={{ width: `${Math.min(100, sport.percentage)}%` }} />
                  </div>
                </div>

                <div className="mt-2.5 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Center Market Share:' : 'Thị phần toàn trung tâm:'}</span>
                    <span className="text-brand-teal-700 dark:text-brand-teal-300 font-bold">{sport.share}%</span>
                  </div>
                  <div className="w-full bg-brand-navy-200 dark:bg-brand-navy-700 rounded-full h-1.5 overflow-hidden">
                    <div className="h-1.5 rounded-full bg-brand-teal-600" style={{ width: `${Math.min(100, sport.share)}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-brand-navy-200/60 dark:border-brand-navy-700/60 flex items-center justify-between text-[11px] text-brand-navy-500 dark:text-brand-navy-400">
                <span>{isEn ? 'Sessions:' : 'Số ca học:'} <strong>{sport.sessionsCount}</strong></span>
                <span>{isEn ? 'Active Classes:' : 'Số lớp hoạt động:'} <strong>{sport.classesCount}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
