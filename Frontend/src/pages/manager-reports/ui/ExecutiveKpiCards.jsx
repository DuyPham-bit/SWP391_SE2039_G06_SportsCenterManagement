import React from 'react';
import { AnimatedNumber } from '../../../shared/lib/useCountUp.jsx';

const growthLabel = (value, isEn) => value == null
  ? (isEn ? 'No baseline' : 'Chưa có kỳ gốc')
  : `${value > 0 ? '+' : ''}${Number(value).toLocaleString('vi-VN')}%`;

export function ExecutiveKpiCards({ isEn, metrics }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Today's Money / Doanh thu thuần */}
      <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-400 dark:text-brand-navy-500">
              {isEn ? 'Net Revenue' : 'Doanh thu thuần'}
            </span>
            <span className="text-[10px] font-black text-brand-sage-700 dark:text-brand-sage-400 bg-brand-sage-50 dark:bg-brand-sage-950/40 px-1.5 py-0.2 rounded border border-brand-sage-200 dark:border-brand-sage-800">
              {growthLabel(metrics.revenueGrowth, isEn)}
            </span>
          </div>
          <h3 className="text-xl lg:text-2xl font-black font-chivo text-brand-navy-900 dark:text-white">
            <AnimatedNumber value={metrics.netRevenue || 0} suffix="đ" duration={1200} />
          </h3>
          <p className="text-[11px] text-brand-navy-600 dark:text-brand-navy-300 mt-1">
            {isEn
              ? `Collected ${Number(metrics.grossRevenue || 0).toLocaleString('vi-VN')}đ − Refunded ${Number(metrics.refundedRevenue || 0).toLocaleString('vi-VN')}đ`
              : `Đã thu ${Number(metrics.grossRevenue || 0).toLocaleString('vi-VN')}đ − Đã hoàn ${Number(metrics.refundedRevenue || 0).toLocaleString('vi-VN')}đ`}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-sage-700 to-brand-teal-600 text-white flex items-center justify-center shadow-md shadow-brand-sage-700/25 shrink-0">
          <span className="material-symbols-outlined text-[24px]">payments</span>
        </div>
      </div>

      {/* Card 2: Today's Users / Tổng thành viên */}
      <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-400 dark:text-brand-navy-500">
              {isEn ? 'Total Members' : 'Tổng thành viên'}
            </span>
            <span className="text-[10px] font-black text-brand-sage-700 dark:text-brand-sage-400 bg-brand-sage-50 dark:bg-brand-sage-950/40 px-1.5 py-0.2 rounded border border-brand-sage-200 dark:border-brand-sage-800">
              {growthLabel(metrics.memberGrowth, isEn)}
            </span>
          </div>
          <h3 className="text-xl lg:text-2xl font-black font-chivo text-brand-navy-900 dark:text-white">
            <AnimatedNumber value={metrics.totalMembers} duration={1000} />
          </h3>
          <p className="text-[11px] text-brand-navy-400 dark:text-brand-navy-500 mt-1 truncate max-w-[200px]">
            {isEn ? `Active packages: ${metrics.activeMembers}` : `Gói hiệu lực: ${metrics.activeMembers}`}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-teal-600 to-brand-teal-500 text-white flex items-center justify-center shadow-md shadow-brand-teal-600/25 shrink-0">
          <span className="material-symbols-outlined text-[24px]">group</span>
        </div>
      </div>

      {/* Card 3: New Clients / Thành viên mới */}
      <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-400 dark:text-brand-navy-500">
              {isEn ? 'New Clients' : 'Thành viên mới'}
            </span>
            <span className="text-[10px] font-black text-brand-sage-700 dark:text-brand-sage-400 bg-brand-sage-50 dark:bg-brand-sage-950/40 px-1.5 py-0.2 rounded border border-brand-sage-200 dark:border-brand-sage-800">
              +{metrics.newMembers}
            </span>
          </div>
          <h3 className="text-xl lg:text-2xl font-black font-chivo text-brand-navy-900 dark:text-white">
            +<AnimatedNumber value={metrics.newMembers} duration={1000} />
          </h3>
          <p className="text-[11px] text-brand-navy-400 dark:text-brand-navy-500 mt-1 truncate max-w-[200px]">
            {isEn ? 'Registered in period' : 'Đăng ký tài khoản trong kỳ'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-sage-500 to-brand-sage-700 text-white flex items-center justify-center shadow-md shadow-brand-sage-500/25 shrink-0">
          <span className="material-symbols-outlined text-[24px]">person_add</span>
        </div>
      </div>

      {/* Card 4: Check-ins in the selected period */}
      <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-400 dark:text-brand-navy-500">
              {isEn ? 'Period Check-ins' : 'Check-in trong kỳ'}
            </span>
            <span className="text-[10px] font-black text-brand-sand-700 dark:text-brand-sand-300 bg-brand-sand-50 dark:bg-brand-sand-950/40 px-1.5 py-0.2 rounded border border-brand-sand-200 dark:border-brand-sand-800">
              {metrics.from} → {metrics.to}
            </span>
          </div>
          <h3 className="text-xl lg:text-2xl font-black font-chivo text-brand-navy-900 dark:text-white">
            {metrics.periodCheckins}
          </h3>
          <p className="text-[11px] text-brand-navy-400 dark:text-brand-navy-500 mt-1 truncate max-w-[200px]">
            {isEn ? `${metrics.activeStaff} staff on duty` : `${metrics.activeStaff} nhân sự trực ca`}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-sand-300 to-brand-sand-500 text-brand-navy-950 flex items-center justify-center shadow-md shadow-brand-sand-500/25 shrink-0">
          <span className="material-symbols-outlined text-[24px]">fact_check</span>
        </div>
      </div>
    </div>
  );
}
