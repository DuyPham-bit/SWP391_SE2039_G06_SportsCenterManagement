import React from 'react';
import { ROLE_BADGES, getAvatarGradient, getInitials } from '../lib/avatar.js';
import { money } from '../lib/format.js';
import { KpiBadge } from './KpiBadge.jsx';

export function PayrollSheetTab({
  canManage, displayedRows, handleExportCsv, isEn, kpiFilter, load, loading, openEditModal,
  policyFilter, roleFilter, rows, searchQuery, setKpiFilter, setPolicyFilter, setRoleFilter,
  setSearchQuery, setSortBy, setViewingPayslip, sortBy
}) {
  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-brand-navy-900 p-4 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-brand-navy-400 text-[18px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEn ? 'Search employee, coach, staff code...' : 'Tìm kiếm nhân sự, HLV, mã nhân viên...'}
            className="w-full pl-9 pr-4 py-2 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl text-xs sm:text-sm text-brand-navy-800 dark:text-brand-navy-200 placeholder-brand-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-sage-700"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-brand-navy-400 hover:text-brand-navy-600 dark:hover:text-brand-navy-200 text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-navy-100 hover:bg-brand-navy-200 dark:bg-brand-navy-800 dark:hover:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>sync</span>
            <span>{isEn ? 'Reload' : 'Tải lại'}</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>{isEn ? 'Export CSV' : 'Xuất file CSV'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      {canManage && (
        <div className="flex items-center justify-between flex-wrap gap-3 px-1">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Role Filter */}
            <span className="text-brand-navy-400 font-medium">{isEn ? 'Filter:' : 'Bộ lọc:'}</span>
            {['ALL', 'COACH', 'RECEPTIONIST', 'MANAGER'].map((rf) => (
              <button
                key={rf}
                onClick={() => setRoleFilter(rf)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      roleFilter === rf
                        ? 'bg-brand-sage-700 text-white shadow-xs'
                        : 'bg-white dark:bg-brand-navy-900 border border-brand-navy-200 dark:border-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800'
                    }`}
              >
                {rf === 'ALL'
                  ? isEn
                    ? 'All Staff'
                    : 'Tất cả nhân sự'
                  : rf === 'COACH'
                  ? isEn
                    ? 'Coaches'
                    : 'HLV'
                  : rf === 'RECEPTIONIST'
                  ? isEn
                    ? 'Receptionists'
                    : 'Lễ tân'
                  : isEn
                  ? 'Managers'
                  : 'Quản lý'}
              </button>
            ))}
          </div>

          {/* Extra Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* KPI Status Filter */}
            <select
              aria-label={isEn ? 'KPI Filter' : 'Lọc theo KPI'}
              value={kpiFilter}
              onChange={(e) => setKpiFilter(e.target.value)}
              className="px-3 py-1.5 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{isEn ? 'All KPI Status' : 'Tất cả KPI ca'}</option>
              <option value="MET">{isEn ? 'Met / Surpassed KPI' : 'Đạt / Vượt KPI'}</option>
              <option value="NOT_MET">{isEn ? 'In Progress / Below Target' : 'Đang phấn đấu / Chưa đạt'}</option>
            </select>

            {/* Policy Filter */}
            <select
              aria-label={isEn ? 'Policy filter' : 'Lọc chính sách'}
              value={policyFilter}
              onChange={(e) => setPolicyFilter(e.target.value)}
              className="px-3 py-1.5 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{isEn ? 'All Policies' : 'Tất cả chính sách'}</option>
              <option value="CONFIGURED">{isEn ? 'Configured' : 'Đã cấu hình'}</option>
              <option value="NOT_CONFIGURED">{isEn ? 'Unconfigured' : 'Chưa cấu hình'}</option>
            </select>

            {/* Sort By */}
            <select
              aria-label={isEn ? 'Sort by' : 'Sắp xếp theo'}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 focus:outline-none cursor-pointer"
            >
              <option value="TOTAL_DESC">{isEn ? 'Total Salary: High to Low' : 'Tổng lương: Cao đến Thấp'}</option>
              <option value="TOTAL_ASC">{isEn ? 'Total Salary: Low to High' : 'Tổng lương: Thấp đến Cao'}</option>
              <option value="BASE_DESC">{isEn ? 'Base Salary: High to Low' : 'Lương cơ bản cao nhất'}</option>
              <option value="SESSIONS_DESC">{isEn ? 'Sessions: High to Low' : 'Ca dạy nhiều nhất'}</option>
              <option value="KPI_DESC">{isEn ? 'KPI %: High to Low' : '% Đạt KPI cao nhất'}</option>
              <option value="NAME_ASC">{isEn ? 'Name: A-Z' : 'Họ tên: A đến Z'}</option>
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 bg-white dark:bg-brand-navy-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-brand-navy-100 dark:divide-brand-navy-800">
            <thead className="bg-brand-navy-50/70 dark:bg-brand-navy-800/60 text-left text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
              <tr>
                <th className="py-3.5 px-4">{isEn ? 'Employee' : 'Nhân sự'}</th>
                <th className="py-3.5 px-4">{isEn ? 'Policy Status' : 'Chính sách'}</th>
                <th className="py-3.5 px-4">{isEn ? 'Base Salary' : 'Lương cơ bản'}</th>
                <th className="py-3.5 px-4">{isEn ? 'Allowance' : 'Phụ cấp'}</th>
                <th className="py-3.5 px-4">{isEn ? 'Session Pay' : 'Thù lao ca dạy'}</th>
                <th className="py-3.5 px-4">{isEn ? 'Session KPI' : 'Tiến độ KPI ca'}</th>
                <th className="py-3.5 px-4">{isEn ? 'KPI Rating' : 'Đánh giá KPI'}</th>
                <th className="py-3.5 px-4">{isEn ? 'Estimated Total' : 'Tổng thu nhập'}</th>
                {canManage && <th className="py-3.5 px-4 text-right">{isEn ? 'Actions' : 'Thao tác'}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800/80">
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 9 : 8} className="py-12 text-center text-brand-navy-400">
                    <span className="material-symbols-outlined text-[36px] text-brand-navy-300 block mb-2">search_off</span>
                    <span>{isEn ? 'No staff matching the search criteria.' : 'Không có nhân sự nào khớp với bộ lọc tìm kiếm.'}</span>
                  </td>
                </tr>
              ) : (
                displayedRows.map((row) => {
                  const roleUpper = String(row.role || 'STAFF').toUpperCase();
                  const roleCfg = ROLE_BADGES[roleUpper] || ROLE_BADGES.RECEPTIONIST;
                  const isCoach = roleUpper === 'COACH';

                  // Proportions
                  const totalPay = Number(row.estimatedTotal || 0);
                  const basePay = Number(row.baseSalary || 0);
                  const basePercent = totalPay > 0 ? Math.round((basePay / totalPay) * 100) : 0;
                  const varPercent = 100 - basePercent;

                  return (
                    <tr key={row.userId} className="hover:bg-brand-navy-50/80 dark:hover:bg-brand-navy-800/50 transition-colors">
                      {/* Employee Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                  row.fullName
                                )} flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs`}
                          >
                            {getInitials(row.fullName)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-brand-navy-900 dark:text-brand-navy-100 text-xs sm:text-sm truncate">
                              {row.fullName}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="font-mono text-[10px] font-semibold bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 px-1.5 py-0.5 rounded">
                                {row.employeeCode}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${roleCfg.badge}`}>
                                {isEn ? roleCfg.labelEn : roleCfg.labelVi}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Policy status */}
                      <td className="py-3.5 px-4">
                        {row.policyConfigured ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-500" />
                            <span>{isEn ? 'Active' : 'Đã chuẩn hóa'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-300 border border-brand-sand-200 dark:border-brand-sand-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-sand-500 animate-pulse" />
                            <span>{isEn ? 'Not set' : 'Chưa cấu hình'}</span>
                          </span>
                        )}
                      </td>

                      {/* Base Salary */}
                      <td className="py-3.5 px-4 font-semibold text-brand-navy-800 dark:text-brand-navy-200">{money(row.baseSalary)}</td>

                      {/* Allowance */}
                      <td className="py-3.5 px-4 text-brand-navy-600 dark:text-brand-navy-400">
                        {row.allowance > 0 ? (
                          <span className="font-semibold text-brand-navy-700 dark:text-brand-navy-300">{money(row.allowance)}</span>
                        ) : (
                          <span className="text-brand-navy-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Session Bonus */}
                      <td className="py-3.5 px-4">
                        {isCoach ? (
                          <div>
                            <div className="font-bold text-brand-teal-700 dark:text-brand-teal-400">{money(row.sessionBonus)}</div>
                            <div className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-[13px] text-brand-teal-700 dark:text-brand-teal-400">sports</span>
                              <span>{row.completedSessions} ca hoàn thành</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-brand-navy-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Session KPI */}
                      <td className="py-3.5 px-4">
                        {isCoach ? (
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300">
                              {row.completedSessions} / {row.targetSessions > 0 ? `${row.targetSessions} ca` : 'Không áp'}
                              {row.sessionKpiPercent !== null && (
                                <span className={`ml-1 font-black ${row.sessionKpiPercent >= 100 ? 'text-brand-sage-700 dark:text-brand-sage-400' : 'text-brand-navy-500'}`}>
                                  ({row.sessionKpiPercent}%)
                                </span>
                              )}
                            </div>
                            {row.targetSessions > 0 && (
                              <div className="w-24 bg-brand-navy-100 dark:bg-brand-navy-800 h-1.5 rounded-full overflow-hidden" title={`Đạt ${row.sessionKpiPercent}% KPI ca dạy`}>
                                <div
                                  className={`h-full rounded-full transition-all ${
                                        row.sessionKpiPercent >= 100 ? 'bg-brand-sage-500' : row.sessionKpiPercent >= 70 ? 'bg-brand-teal-500' : 'bg-brand-sand-500'
                                      }`}
                                  style={{ width: `${Math.min(100, row.sessionKpiPercent)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-brand-navy-400 text-xs">—</span>
                        )}
                      </td>

                      {/* KPI Performance Rating */}
                      <td className="py-3.5 px-4">
                        <KpiBadge row={row} isEn={isEn} />
                      </td>

                      {/* Total Estimated */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-black text-sm text-brand-sage-700 dark:text-brand-sage-500">{money(row.estimatedTotal)}</div>
                          <div className="w-24 h-1.5 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 overflow-hidden flex mt-1" title={`${basePercent}% Cố định / ${varPercent}% Thù lao ca`}>
                            <div className="bg-brand-teal-500 h-full" style={{ width: `${basePercent}%` }} />
                            <div className="bg-brand-teal-500 h-full" style={{ width: `${varPercent}%` }} />
                          </div>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingPayslip(row)}
                              className="px-2.5 py-1.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 text-xs font-bold transition-colors cursor-pointer"
                              title={isEn ? 'View payslip' : 'Xem phiếu lương'}
                            >
                              <span className="material-symbols-outlined text-[15px] align-middle">receipt_long</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(row)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-sage-700/10 hover:bg-brand-sage-700 text-brand-sage-700 hover:text-white dark:bg-brand-sage-500/15 dark:text-brand-sage-500 dark:hover:bg-brand-sage-500 dark:hover:text-brand-sage-900 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit_note</span>
                              <span>{isEn ? 'Set Salary' : 'Sửa lương & KPI'}</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-brand-navy-100 dark:border-brand-navy-800 bg-brand-navy-50/50 dark:bg-brand-navy-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-navy-500 dark:text-brand-navy-400">
          <div>
            {isEn ? 'Showing' : 'Hiển thị'} <span className="font-bold text-brand-navy-800 dark:text-brand-navy-200">{displayedRows.length}</span>{' '}
            {isEn ? 'of' : 'trên tổng số'} <span className="font-bold text-brand-navy-800 dark:text-brand-navy-200">{rows.length}</span>{' '}
            {isEn ? 'staff members' : 'nhân sự'}
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-teal-500" />
              <span>{isEn ? 'Blue: Base Pay' : 'Xanh dương: Lương cứng'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-teal-500" />
              <span>{isEn ? 'Teal: Session Pay' : 'Xanh ngọc: Thù lao ca dạy'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
