import React from 'react';
import { VisionSalesOverviewChart } from './charts/VisionSalesOverviewChart.jsx';
import { VisionActiveUsersChart } from './charts/VisionActiveUsersChart.jsx';

export function SalesOverviewRow({ isEn, membership, metrics, revenue }) {
  return (
    <div className="grid lg:grid-cols-12 gap-5">
      {/* Left Card (7 cols): Sales Overview Dual Spline Wave Chart */}
      <section className="min-w-0 lg:col-span-7 bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all">
        <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-3">
          <div>
            <h3 className="font-black text-brand-navy-900 dark:text-white text-base font-chivo flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-teal-600" />
              {isEn ? 'Sales Overview' : 'Tổng Quan Doanh Thu Thuần'}
            </h3>
            <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
              {isEn
                ? 'Smooth spline revenue curve reflecting actual cash flow received over time.'
                : 'Đường cong lượn sóng doanh thu thực nhận từng ngày/tháng với định dạng tiền tệ và điểm mốc.'}
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-300 text-[11px] font-bold border border-brand-navy-200 dark:border-brand-navy-700">
            {metrics.groupBy === 'month' ? (isEn ? 'Monthly' : 'Theo tháng') : (isEn ? 'Daily' : 'Theo ngày')}
          </span>
        </div>
        <VisionSalesOverviewChart data={revenue} groupBy={metrics.groupBy} growth={metrics.revenueGrowth} />
      </section>

      {/* Right Card (5 cols): Active Users Bar Chart + 4 Stat Pills */}
      <section className="min-w-0 lg:col-span-5 bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all">
        <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-3">
          <div>
            <h3 className="font-black text-brand-navy-900 dark:text-white text-base font-chivo flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-sage-700" />
              {isEn ? 'Active Users' : 'Khối Lượng Hoạt Động Học Viên'}
            </h3>
            <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
              {isEn
                ? 'Attendance activity volume and core operational KPI breakdown.'
                : 'Lưu lượng thành viên tham gia lớp và tóm tắt 4 chỉ số vận hành cốt lõi.'}
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-400 text-[11px] font-bold border border-brand-sage-200 dark:border-brand-sage-800">
            KPI Pills
          </span>
        </div>
        <VisionActiveUsersChart
          data={membership}
          totalUsers={metrics.totalMembers}
          totalBookings={metrics.totalBookings}
          netSales={metrics.netRevenue}
          totalSessions={metrics.totalSessions}
          growth={metrics.memberGrowth}
        />
      </section>
    </div>
  );
}
