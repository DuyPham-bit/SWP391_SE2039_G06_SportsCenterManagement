import React from 'react';

export function StaffMetrics({ isEn, stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Staff */}
      <div className="p-5 rounded-2xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm hover-lift transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Total Staff' : 'Tổng nhân sự'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-brand-navy-100 dark:bg-brand-navy-800 flex items-center justify-center text-brand-navy-800 dark:text-brand-navy-200">
            <span className="material-symbols-outlined text-[20px]">badge</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black font-chivo text-brand-navy-900 dark:text-brand-navy-100">{stats.total}</span>
          <span className="text-xs text-brand-navy-400 font-medium">{isEn ? 'members' : 'thành viên'}</span>
        </div>
        <p className="mt-1 text-xs text-brand-navy-500 dark:text-brand-navy-400">
          {isEn ? 'All staff across center' : 'Toàn bộ nhân sự trong cơ sở'}
        </p>
      </div>

      {/* Coaches */}
      <div className="p-5 rounded-2xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm hover-lift transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Coaches' : 'Huấn luyện viên'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">sports</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black font-chivo text-brand-sand-700 dark:text-brand-sand-400">{stats.coaches}</span>
          <span className="px-2 py-0.5 rounded-full bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-300 text-xs font-bold border border-brand-sand-200 dark:border-brand-sand-800">
            {stats.total > 0 ? `${Math.round((stats.coaches / stats.total) * 100)}%` : '0%'}
          </span>
        </div>
        <p className="mt-1 text-xs text-brand-navy-500 dark:text-brand-navy-400">
          {isEn ? 'Athletic training specialists' : 'HLV giảng dạy lớp thể thao'}
        </p>
      </div>

      {/* Receptionists */}
      <div className="p-5 rounded-2xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm hover-lift transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Receptionists' : 'Lễ tân quầy'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-950/40 text-brand-navy-700 dark:text-brand-navy-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">support_agent</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black font-chivo text-brand-navy-700 dark:text-brand-navy-400">{stats.receptionists}</span>
          <span className="text-xs text-brand-navy-400 font-medium">{isEn ? 'front-desk staff' : 'nhân viên trực quầy'}</span>
        </div>
        <p className="mt-1 text-xs text-brand-navy-500 dark:text-brand-navy-400">
          {isEn ? 'Gate check-in & counter cashier' : 'Check-in và bán gói tập'}
        </p>
      </div>

      {/* Active Accounts */}
      <div className="p-5 rounded-2xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm hover-lift transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Active Accounts' : 'Đang hoạt động'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">verified_user</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black font-chivo text-brand-sage-700 dark:text-brand-sage-400">{stats.activeCount}</span>
          <span className="px-2 py-0.5 rounded-full bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 text-xs font-bold border border-brand-sage-200 dark:border-brand-sage-800">
            {stats.total > 0 ? `${Math.round((stats.activeCount / stats.total) * 100)}%` : '100%'}
          </span>
        </div>
        <p className="mt-1 text-xs text-brand-navy-500 dark:text-brand-navy-400">
          {isEn ? 'Authorized & shift ready' : 'Tài khoản hợp lệ và sẵn sàng'}
        </p>
      </div>
    </div>
  );
}
