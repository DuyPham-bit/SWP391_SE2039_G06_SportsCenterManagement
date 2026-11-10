import React from 'react';

export function MembershipDistribution({ isEn, metrics }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2 bg-white dark:bg-brand-navy-900 p-4 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-black text-brand-navy-900 dark:text-white">
              {isEn ? 'Current member package distribution' : 'Thống kê gói tập hiện tại của hội viên'}
            </h2>
            <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
              {isEn ? 'Based on packages valid today' : 'Tính theo gói tập còn hiệu lực trong ngày hôm nay'}
            </p>
          </div>
          <span className="text-xs font-bold text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Total' : 'Tổng'}: {metrics.totalMembers}
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-brand-sage-200 dark:border-brand-sage-800 bg-brand-sage-50/70 dark:bg-brand-sage-950/30 p-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-brand-sage-700 dark:text-brand-sage-300">{isEn ? 'With active package' : 'Có gói hiệu lực'}</p>
              <p className="text-2xl font-black text-brand-sage-800 dark:text-brand-sage-200">{metrics.membersWithPackage}</p>
            </div>
            <span className="text-sm font-black text-brand-sage-700 dark:text-brand-sage-300">
              {metrics.totalMembers ? Math.round((metrics.membersWithPackage / metrics.totalMembers) * 100) : 0}%
            </span>
          </div>
          <div className="rounded-xl border border-brand-sand-200 dark:border-brand-sand-800 bg-brand-sand-50/70 dark:bg-brand-sand-950/30 p-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-brand-sand-700 dark:text-brand-sand-300">{isEn ? 'Without active package' : 'Chưa có gói hiệu lực'}</p>
              <p className="text-2xl font-black text-brand-sand-800 dark:text-brand-sand-200">{metrics.membersWithoutPackage}</p>
            </div>
            <span className="text-sm font-black text-brand-sand-700 dark:text-brand-sand-300">
              {metrics.totalMembers ? Math.round((metrics.membersWithoutPackage / metrics.totalMembers) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-brand-navy-900 p-4 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Expired package members' : 'Hội viên có gói hết hạn'}</p>
          <p className="text-2xl font-black text-brand-navy-900 dark:text-white mt-1">{metrics.expiredMembers}</p>
          <p className="text-[11px] text-brand-navy-400 mt-1">{isEn ? 'Included in the group without an active package' : 'Thuộc nhóm chưa có gói hiệu lực'}</p>
        </div>
        <span className="material-symbols-outlined text-[32px] text-brand-navy-300 dark:text-brand-navy-600">event_busy</span>
      </div>
    </div>
  );
}
