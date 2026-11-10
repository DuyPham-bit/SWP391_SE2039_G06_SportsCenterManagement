import React from 'react';
import { money } from '../lib/format.js';

export function PayrollMetrics({ isEn, metrics }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Card 1: Total Payroll */}
      <div className="p-4 rounded-2xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm hover-lift transition-all col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Total Payroll' : 'Tổng quỹ lương'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xl sm:text-2xl font-black font-chivo text-brand-sage-700 dark:text-brand-sage-400">
            {money(metrics.totalEstimated)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-brand-navy-400 font-medium">
          {metrics.totalStaff} {isEn ? 'staff members' : 'nhân sự trong kỳ'}
        </p>
      </div>

      {/* Card 2: Fixed Base */}
      <div className="p-4 rounded-2xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm hover-lift transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Fixed Base Pay' : 'Lương cơ bản'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-700 dark:text-brand-teal-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">payments</span>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-lg sm:text-xl font-black font-chivo text-brand-teal-700 dark:text-brand-teal-400">
            {money(metrics.totalBase)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-brand-navy-400 font-medium">
          {metrics.baseSharePercent}% {isEn ? 'of total payroll' : 'quỹ lương cố định'}
        </p>
      </div>

      {/* Card 3: Variable Pay (Session Pay & Allowances) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm hover-lift transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Session Pay & Bonus' : 'Thù lao ca & Phụ cấp'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-700 dark:text-brand-teal-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">sports</span>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-lg sm:text-xl font-black font-chivo text-brand-teal-700 dark:text-brand-teal-400">
            {money(metrics.totalVariable)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-brand-navy-400 font-medium">
          {metrics.variableSharePercent}% {isEn ? 'variable pay' : 'chi trả theo ca dạy'}
        </p>
      </div>

      {/* Card 4: Teaching Sessions & KPI */}
      <div className="p-4 rounded-2xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm hover-lift transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Teaching Volume' : 'Số ca dạy HLV'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">event_available</span>
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-lg sm:text-xl font-black font-chivo text-brand-sand-700 dark:text-brand-sand-400">
            {metrics.totalSessions}
          </span>
          {metrics.totalTargetSessions > 0 ? (
            <span className="text-xs text-brand-navy-400 font-medium">
              /{metrics.totalTargetSessions} ({metrics.sessionKpiAchievementRate}%)
            </span>
          ) : (
            <span className="text-xs text-brand-navy-400 font-medium">{isEn ? 'sessions' : 'ca hoàn thành'}</span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-brand-navy-400 font-medium">{money(metrics.totalSessionBonus)} thù lao</p>
      </div>

      {/* Card 5: Coach KPI Achievement */}
      <div className="p-4 rounded-2xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm hover-lift transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Coach KPI Rate' : 'Tỉ lệ đạt KPI ca'}
          </span>
          <div className="w-8 h-8 rounded-lg bg-brand-navy-50 dark:bg-brand-navy-950/40 text-brand-navy-700 dark:text-brand-navy-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-lg sm:text-xl font-black font-chivo text-brand-navy-700 dark:text-brand-navy-400">
            {metrics.coachesKpiRate}%
          </span>
          <span className="text-xs text-brand-navy-400 font-medium">
            ({metrics.coachesMeetingKpi}/{metrics.coachCount} HLV)
          </span>
        </div>
        <p className="mt-1 text-[11px] text-brand-navy-400 font-medium">
          {metrics.coverageRate}% {isEn ? 'policies set' : 'độ phủ chính sách'}
        </p>
      </div>
    </div>
  );
}
