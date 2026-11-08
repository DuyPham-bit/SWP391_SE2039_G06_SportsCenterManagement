import React from 'react';

export function MembersMetrics({ isEn, stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Members */}
      <div className="p-5 rounded-2xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm hover-lift transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Total Members' : 'Tổng thành viên'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-brand-navy-100 dark:bg-brand-navy-800 flex items-center justify-center text-brand-navy-800 dark:text-brand-navy-200">
            <span className="material-symbols-outlined text-[20px]">groups</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black font-chivo text-brand-navy-900 dark:text-brand-navy-100">{stats.total}</span>
          <span className="text-xs text-brand-navy-400 font-medium">{isEn ? 'members' : 'hội viên'}</span>
        </div>
        <p className="mt-1 text-xs text-brand-navy-500 dark:text-brand-navy-400">
          {isEn ? 'Registered profiles in center' : 'Toàn bộ hồ sơ trong cơ sở'}
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
          <span className="text-3xl font-black font-chivo text-brand-sage-700 dark:text-brand-sage-400">{stats.active}</span>
          <span className="px-2 py-0.5 rounded-full bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 text-xs font-bold border border-brand-sage-200 dark:border-brand-sage-800">
            {stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : '100%'}
          </span>
        </div>
        <p className="mt-1 text-xs text-brand-navy-500 dark:text-brand-navy-400">
          {isEn ? 'Verified & ready to train' : 'Tài khoản hợp lệ và sẵn sàng'}
        </p>
      </div>

      {/* Active Packages */}
      <div className="p-5 rounded-2xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm hover-lift transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Active Subscriptions' : 'Gói tập hiệu lực'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-brand-sage-700/10 text-brand-sage-700 dark:text-brand-sage-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">card_membership</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black font-chivo text-brand-sage-700 dark:text-brand-sage-500">{stats.hasPackage}</span>
          <span className="text-xs text-brand-navy-400 font-medium">{isEn ? 'active' : 'gói active'}</span>
        </div>
        <p className="mt-1 text-xs text-brand-navy-500 dark:text-brand-navy-400">
          {isEn ? 'Eligible for check-in & booking' : 'Đủ điều kiện check-in và đặt lớp'}
        </p>
      </div>

      {/* Locked Accounts */}
      <div className="p-5 rounded-2xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm hover-lift transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Locked Accounts' : 'Tài khoản bị khóa'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-brand-danger-50 dark:bg-brand-danger-950/40 text-brand-danger-600 dark:text-brand-danger-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">lock</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black font-chivo text-brand-danger-600 dark:text-brand-danger-400">{stats.disabled}</span>
          <span className="text-xs text-brand-navy-400 font-medium">{isEn ? 'suspended' : 'tạm dừng'}</span>
        </div>
        <p className="mt-1 text-xs text-brand-navy-500 dark:text-brand-navy-400">
          {isEn ? 'Requires review to unlock' : 'Cần xác minh mở khóa'}
        </p>
      </div>
    </div>
  );
}
