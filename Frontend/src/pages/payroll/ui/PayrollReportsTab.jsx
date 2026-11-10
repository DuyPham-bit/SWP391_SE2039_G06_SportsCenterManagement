import React from 'react';
import { money } from '../lib/format.js';
import { ROLE_BADGES } from '../lib/avatar.js';
import { KpiBadge } from './KpiBadge.jsx';

export function PayrollReportsTab({ isEn, metrics }) {
  return (
    <div className="space-y-6">
      {/* Section A: Cost Allocation by Role/Department */}
      <div className="bg-white dark:bg-brand-navy-900 p-6 rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-black text-brand-navy-900 dark:text-brand-navy-100 font-chivo flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-500">pie_chart</span>
              <span>{isEn ? 'Department & Role Payroll Allocation' : 'Phân bổ chi phí lương theo bộ phận & vai trò'}</span>
            </h3>
            <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
              {isEn
                ? 'Proportion of total compensation spent on Coaches, Receptionists, and Center Managers.'
                : 'Tỷ trọng ngân sách chi trả cho Đội ngũ HLV, Lễ tân và Quản lý trung tâm trong kỳ.'}
            </p>
          </div>
          <div className="text-xs font-bold text-brand-navy-400">
            {isEn ? 'Total Payroll' : 'Tổng quỹ lương'}: <span className="text-brand-navy-800 dark:text-brand-navy-200">{money(metrics.totalEstimated)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {metrics.roleBreakdown.map((item) => {
            const roleCfg = ROLE_BADGES[item.role] || ROLE_BADGES.RECEPTIONIST;
            return (
              <div
                key={item.role}
                className="p-5 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 bg-brand-navy-50/60 dark:bg-brand-navy-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${roleCfg.badge}`}>
                    {isEn ? roleCfg.labelEn : roleCfg.labelVi}
                  </span>
                  <span className="text-lg font-black text-brand-navy-800 dark:text-brand-navy-200">{item.sharePercent}%</span>
                </div>

                <div>
                  <div className="text-2xl font-black font-chivo text-brand-navy-900 dark:text-brand-navy-100">{money(item.totalPay)}</div>
                  <div className="w-full bg-brand-navy-200 dark:bg-brand-navy-700 h-2 rounded-full overflow-hidden mt-2">
                    <div className="bg-brand-sage-700 h-full rounded-full transition-all" style={{ width: `${item.sharePercent}%` }} />
                  </div>
                </div>

                <div className="pt-2 border-t border-brand-navy-200/60 dark:border-brand-navy-700/60 flex items-center justify-between text-xs text-brand-navy-500 dark:text-brand-navy-400">
                  <span>
                    {item.count} {isEn ? 'members' : 'nhân sự'}
                  </span>
                  <span>
                    {isEn ? 'Avg' : 'Bình quân'}: <strong>{money(item.averagePay)}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section B: Earnings Structure Breakdown + Coach Efficiency Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Structure */}
        <div className="bg-white dark:bg-brand-navy-900 p-6 rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm space-y-4">
          <h3 className="text-base font-black text-brand-navy-900 dark:text-brand-navy-100 font-chivo flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-sand-700 dark:text-brand-sand-400">donut_small</span>
            <span>{isEn ? 'Earnings Components Structure' : 'Cấu phần thu nhập toàn trung tâm'}</span>
          </h3>
          <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
            {isEn
              ? 'Breakdown between fixed base wages, allowances, and coaching session payouts.'
              : 'Tỷ lệ đóng góp giữa lương cứng cố định, phụ cấp trách nhiệm và thù lao theo ca dạy.'}
          </p>

          <div className="space-y-4 pt-2">
            {/* 1. Base Salary */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-brand-navy-700 dark:text-brand-navy-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-teal-500" />
                  <span>{isEn ? 'Fixed Base Salary' : 'Lương cơ bản (Cố định)'}</span>
                </span>
                <span className="text-brand-navy-900 dark:text-brand-navy-100">{money(metrics.totalBase)} ({metrics.baseSharePercent}%)</span>
              </div>
              <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-teal-500 h-full rounded-full" style={{ width: `${metrics.baseSharePercent}%` }} />
              </div>
            </div>

            {/* 2. Coaching Bonus */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-brand-navy-700 dark:text-brand-navy-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-teal-500" />
                  <span>{isEn ? 'Coaching Sessions Pay' : 'Thù lao ca dạy HLV'}</span>
                </span>
                <span className="text-brand-navy-900 dark:text-brand-navy-100">
                  {money(metrics.totalSessionBonus)} (
                  {metrics.totalEstimated > 0 ? Math.round((metrics.totalSessionBonus / metrics.totalEstimated) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-teal-500 h-full rounded-full"
                  style={{
                    width: `${metrics.totalEstimated > 0 ? (metrics.totalSessionBonus / metrics.totalEstimated) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {/* 3. Monthly Allowance */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-brand-navy-700 dark:text-brand-navy-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-navy-700" />
                  <span>{isEn ? 'Allowances' : 'Phụ cấp ăn trưa, điện thoại, trách nhiệm'}</span>
                </span>
                <span className="text-brand-navy-900 dark:text-brand-navy-100">
                  {money(metrics.totalAllowance)} (
                  {metrics.totalEstimated > 0 ? Math.round((metrics.totalAllowance / metrics.totalEstimated) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-navy-700 h-full rounded-full"
                  style={{
                    width: `${metrics.totalEstimated > 0 ? (metrics.totalAllowance / metrics.totalEstimated) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coach Efficiency & Analytics */}
        <div className="bg-white dark:bg-brand-navy-900 p-6 rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm space-y-4">
          <h3 className="text-base font-black text-brand-navy-900 dark:text-brand-navy-100 font-chivo flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-500">fitness_center</span>
            <span>{isEn ? 'Coach Performance & Teaching Payout' : 'Hiệu suất giảng dạy & Thù lao HLV'}</span>
          </h3>
          <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
            {isEn
              ? 'Operational volume of classes taught and cost efficiency per session.'
              : 'Đo lường số buổi đứng lớp thực tế và chi phí thù lao bình quân trên mỗi ca học.'}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-brand-teal-50/70 dark:bg-brand-teal-950/40 border border-brand-teal-200/70 dark:border-brand-teal-800/60">
              <span className="text-[11px] font-bold text-brand-teal-700 dark:text-brand-teal-300 uppercase">{isEn ? 'Total Sessions' : 'Tổng số ca dạy'}</span>
              <div className="text-2xl font-black font-chivo text-brand-teal-800 dark:text-brand-teal-200 mt-1">{metrics.totalSessions}</div>
              <span className="text-[10px] text-brand-teal-700 dark:text-brand-teal-400 font-medium">{isEn ? 'Completed in period' : 'Đã hoàn thành trong kỳ'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-brand-sage-50/70 dark:bg-brand-sage-950/40 border border-brand-sage-200/70 dark:border-brand-sage-800/60">
              <span className="text-[11px] font-bold text-brand-sage-700 dark:text-brand-sage-300 uppercase">{isEn ? 'Avg Sessions / Coach' : 'Bình quân ca / HLV'}</span>
              <div className="text-2xl font-black font-chivo text-brand-sage-800 dark:text-brand-sage-200 mt-1">{metrics.avgSessionsPerCoach}</div>
              <span className="text-[10px] text-brand-sage-700 dark:text-brand-sage-400 font-medium">{metrics.coachCount} {isEn ? 'active coaches' : 'HLV đang hoạt động'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-brand-sand-50/70 dark:bg-brand-sand-950/40 border border-brand-sand-200/70 dark:border-brand-sand-800/60 col-span-2">
              <span className="text-[11px] font-bold text-brand-sand-700 dark:text-brand-sand-300 uppercase">{isEn ? 'Avg Cost per Session' : 'Chi phí trung bình / Ca dạy'}</span>
              <div className="text-2xl font-black font-chivo text-brand-sand-800 dark:text-brand-sand-200 mt-1">{money(metrics.avgCostPerSession)}</div>
              <span className="text-[10px] text-brand-sand-700 dark:text-brand-sand-400 font-medium">{isEn ? 'Calculated on actual taught sessions' : 'Tính trên số buổi học hoàn tất'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section C: Coach KPI Performance & Tracking */}
      <div className="bg-white dark:bg-brand-navy-900 p-6 rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-black text-brand-navy-900 dark:text-brand-navy-100 font-chivo flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-500">verified</span>
              <span>{isEn ? 'Coach Session KPI Tracking Report' : 'Báo cáo Giám sát & Đánh giá Chỉ tiêu ca dạy HLV'}</span>
            </h3>
            <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
              {isEn
                ? 'Comparing actual teaching sessions against assigned monthly targets.'
                : 'Đối chiếu số ca dạy thực tế với các chỉ tiêu định mức ca đứng lớp đã thiết lập trong chính sách.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-400 bg-brand-sage-50 dark:bg-brand-sage-950/40 px-3 py-1 rounded-full border border-brand-sage-200 dark:border-brand-sage-800">
              {metrics.coachesMeetingKpi} / {metrics.coachCount} HLV Đạt chuẩn ({metrics.coachesKpiRate}%)
            </span>
          </div>
        </div>

        {/* KPI Summary Card */}
        <div className="p-4 rounded-2xl bg-brand-teal-50/60 dark:bg-brand-teal-950/30 border border-brand-teal-200/80 dark:border-brand-teal-800/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-brand-teal-800 dark:text-brand-teal-300">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">sports</span>
              <span>{isEn ? 'Total Session Volume vs Target' : 'Tổng ca dạy thực tế vs Chỉ tiêu ca toàn trung tâm'}</span>
            </span>
            <span className="text-sm font-black">{metrics.sessionKpiAchievementRate}%</span>
          </div>
          <div className="text-xl font-black font-chivo text-brand-navy-900 dark:text-brand-navy-100">
            {metrics.totalSessions} <span className="text-sm font-medium text-brand-navy-400">/ {metrics.totalTargetSessions} ca mục tiêu</span>
          </div>
          <div className="w-full bg-brand-teal-200/50 dark:bg-brand-teal-900/50 h-2 rounded-full overflow-hidden">
            <div className="bg-brand-teal-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, metrics.sessionKpiAchievementRate)}%` }} />
          </div>
        </div>

        {/* Coach Detailed KPI Table */}
        <div className="overflow-x-auto rounded-2xl border border-brand-navy-100 dark:border-brand-navy-800 mt-3">
          <table className="min-w-full text-xs divide-y divide-brand-navy-100 dark:divide-brand-navy-800">
            <thead className="bg-brand-navy-50 dark:bg-brand-navy-800/60 text-brand-navy-500 font-bold uppercase">
              <tr>
                <th className="py-2.5 px-3 text-left">{isEn ? 'Coach' : 'Huấn luyện viên'}</th>
                <th className="py-2.5 px-3 text-left">{isEn ? 'Teaching Sessions (Act / Target)' : 'Tiến độ Ca dạy (Thực tế / Chỉ tiêu)'}</th>
                <th className="py-2.5 px-3 text-right">{isEn ? 'Session Pay' : 'Thù lao ca dạy'}</th>
                <th className="py-2.5 px-3 text-center">{isEn ? 'Rating' : 'Xếp loại'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800">
              {metrics.coaches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-brand-navy-400">
                    {isEn ? 'No coach records found for this period.' : 'Chưa có dữ liệu HLV trong kỳ này.'}
                  </td>
                </tr>
              ) : (
                metrics.coaches.map((c) => (
                  <tr key={c.userId} className="hover:bg-brand-navy-50/60 dark:hover:bg-brand-navy-800/40">
                    <td className="py-3 px-3">
                      <div className="font-bold text-brand-navy-800 dark:text-brand-navy-200">{c.fullName}</div>
                      <div className="text-[10px] font-mono text-brand-navy-400">{c.employeeCode}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-brand-navy-700 dark:text-brand-navy-300">
                        {c.completedSessions} / {c.targetSessions > 0 ? `${c.targetSessions} ca` : 'Không áp KPI'}
                        {c.sessionKpiPercent !== null && (
                          <span className={`ml-1 font-bold ${c.sessionKpiPercent >= 100 ? 'text-brand-sage-700 dark:text-brand-sage-400' : 'text-brand-navy-500'}`}>
                            ({c.sessionKpiPercent}%)
                          </span>
                        )}
                      </div>
                      {c.targetSessions > 0 && (
                        <div className="w-28 bg-brand-navy-200 dark:bg-brand-navy-700 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${c.sessionKpiPercent >= 100 ? 'bg-brand-sage-500' : 'bg-brand-teal-500'}`}
                            style={{ width: `${Math.min(100, c.sessionKpiPercent)}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="font-bold text-brand-sage-700 dark:text-brand-sage-500">{money(c.sessionBonus)}</div>
                      <div className="text-[10px] text-brand-navy-400">{money(c.commissionPerSession)} / ca</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <KpiBadge row={c} isEn={isEn} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section D: Top Earners Leaderboard */}
      <div className="bg-white dark:bg-brand-navy-900 p-6 rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm space-y-4">
        <h3 className="text-base font-black text-brand-navy-900 dark:text-brand-navy-100 font-chivo flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-sand-700 dark:text-brand-sand-400">military_tech</span>
          <span>{isEn ? 'Top 5 Earners of the Period' : 'Top 5 nhân sự có thu nhập cao nhất trong kỳ'}</span>
        </h3>
        <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
          {isEn
            ? 'Recognition of high-performing instructors and staff based on total generated compensation.'
            : 'Bảng xếp hạng đóng góp và thu nhập của đội ngũ nhân sự trong tháng.'}
        </p>

        <div className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800">
          {metrics.topEarners.map((earner, idx) => {
            const medalColors = [
              'bg-brand-sand-400 text-brand-sage-900',
              'bg-brand-navy-300 text-brand-navy-800',
              'bg-brand-sand-700 text-white',
              'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400',
              'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400'
            ];

            return (
              <div key={earner.userId} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${medalColors[idx]}`}>
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-brand-navy-900 dark:text-brand-navy-100 text-xs sm:text-sm truncate">
                      {earner.fullName}
                    </div>
                    <div className="text-[11px] text-brand-navy-400 flex items-center gap-2">
                      <span>{earner.role}</span>
                      {earner.completedSessions > 0 && (
                        <>
                          <span>•</span>
                          <span>
                            {earner.completedSessions} {isEn ? 'sessions' : 'ca dạy'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-black text-sm text-brand-sage-700 dark:text-brand-sage-500">{money(earner.estimatedTotal)}</div>
                  <div className="text-[10px] text-brand-navy-400">
                    {isEn ? 'Base' : 'Lương cứng'}: {money(earner.baseSalary)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
