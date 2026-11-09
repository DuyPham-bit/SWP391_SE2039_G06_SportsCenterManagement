import React from 'react';
import { SportRevenueBarChart } from './charts/SportRevenueBarChart.jsx';
import { SportsDonutChart } from './charts/SportsDonutChart.jsx';

export function SportRevenueRow({ isEn, metrics }) {
  return (
    <div className="grid lg:grid-cols-12 gap-5 items-stretch">
      {/* Left Card (7 cols): Revenue by Sport */}
      <section className="min-w-0 lg:col-span-7 bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-3xl p-5 shadow-xs hover-lift transition-all flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-navy-100 dark:border-brand-navy-800 pb-3">
            <div>
              <h3 className="font-black text-brand-navy-900 dark:text-white text-base font-chivo flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-sand-500" />
                {isEn ? 'Revenue by Sport' : 'Doanh Thu Theo Bộ Môn'}
              </h3>
              <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
                {isEn
                  ? 'Invoice revenue allocation mapped to specific sports utilized by member packages.'
                  : 'Phân bổ doanh thu hóa đơn theo các bộ môn thực tế mà gói hội viên đã sử dụng.'}
              </p>
            </div>
            {Number(metrics.unallocatedSportRevenue || 0) !== 0 && (
              <span className="text-xs font-semibold rounded-xl bg-brand-sand-50 dark:bg-brand-sand-950/40 border border-brand-sand-200 dark:border-brand-sand-800 text-brand-sand-800 dark:text-brand-sand-300 px-3 py-1.5">
                {isEn ? 'Unallocated:' : 'Chưa phân bổ:'} {Number(metrics.unallocatedSportRevenue).toLocaleString('vi-VN')}đ
              </span>
            )}
          </div>
          <div className="pt-2">
            <SportRevenueBarChart sports={metrics.revenueBySport} />
          </div>
        </div>
      </section>

      {/* Right Card (5 cols): Sports Market Share Donut Chart & Operational Hub */}
      <section className="min-w-0 lg:col-span-5 bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-3xl p-5 shadow-xs hover-lift transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-3">
            <div>
              <h3 className="font-black text-brand-navy-900 dark:text-white text-base font-chivo flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-teal-600" />
                {isEn ? 'Sport Market Share & Utilization' : 'Thị Phần Đặt Chỗ & Hiệu Suất Bộ Môn'}
              </h3>
              <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
                {isEn
                  ? 'Percentage breakdown of bookings across sports disciplines.'
                  : 'Tỷ trọng phần trăm lượt đặt chỗ & hiệu suất ca học (Hover để xem).'}
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-700 dark:text-brand-teal-400 text-[11px] font-bold border border-brand-teal-200 dark:border-brand-teal-800">
              Donut & KPIs
            </span>
          </div>
          <div className="pt-2">
            <SportsDonutChart sports={metrics.topSports} metrics={metrics} />
          </div>
        </div>
      </section>
    </div>
  );
}
