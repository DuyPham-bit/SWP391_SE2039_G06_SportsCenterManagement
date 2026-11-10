import React from 'react';
import { MotionButton } from '../../../shared/ui/MotionButton.jsx';
import { StatusBadge } from './Badges.jsx';
import { fmtDate } from '../lib/format.js';

export function ManagersTab({
  activeCenters, centers, filteredManagers, loadM, managerCenterFilter, managerSearch, managers,
  patchM, saving, setManagerCenterFilter, setManagerSearch, setShowCM
}) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-3xl p-5 sm:p-6 lg:p-7 shadow-xs border border-brand-navy-200/80 dark:border-brand-navy-800 space-y-5">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-brand-navy-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Quản Lý Tài Khoản Manager</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-700 dark:text-brand-teal-300 border border-brand-teal-200 dark:border-brand-teal-800">
              {managers.length} quản lý
            </span>
          </h3>
          <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
            Cấp tài khoản, phân bổ cơ sở quản lý và điều phối nhân sự lãnh đạo chi nhánh.
          </p>
        </div>

        <MotionButton
          onClick={() => setShowCM(true)}
          disabled={activeCenters.length === 0}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-teal-600 to-brand-navy-800 hover:from-brand-teal-700 hover:to-brand-navy-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-brand-teal-600/20 cursor-pointer disabled:opacity-40 self-start sm:self-auto"
          title={activeCenters.length === 0 ? 'Cần ít nhất một cơ sở hoạt động để tạo Manager' : ''}
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>+ Cấp Tài Khoản Manager</span>
        </MotionButton>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-brand-navy-50 dark:bg-brand-navy-800/50 rounded-2xl border border-brand-navy-200/60 dark:border-brand-navy-700/60">
        <div className="relative flex-1 min-w-[220px]">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-brand-navy-400">search</span>
          <input
            type="text"
            placeholder="Tìm họ tên, username, email manager..."
            value={managerSearch}
            onChange={(e) => setManagerSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal-500 transition-all placeholder:text-brand-navy-400"
          />
        </div>

        <select
          value={managerCenterFilter}
          onChange={(e) => setManagerCenterFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal-500 transition-all cursor-pointer"
        >
          <option value="">Tất cả cơ sở</option>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {(managerSearch || managerCenterFilter) && (
          <button
            onClick={() => { setManagerSearch(''); setManagerCenterFilter(''); }}
            className="text-xs font-semibold text-brand-navy-500 dark:text-brand-navy-400 hover:text-brand-navy-700 dark:hover:text-brand-navy-200 underline cursor-pointer"
          >
            Đặt lại lọc
          </button>
        )}
      </div>

      {/* Table */}
      {loadM ? (
        <div className="py-16 text-center text-brand-navy-400 flex flex-col items-center justify-center gap-2">
          <span className="w-6 h-6 border-2 border-brand-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Đang tải danh sách Manager...</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800">
          <table className="w-full text-left text-xs text-brand-navy-700 dark:text-brand-navy-300">
            <thead className="bg-brand-navy-50 dark:bg-brand-navy-800/80 text-[11px] font-bold text-brand-navy-500 dark:text-brand-navy-400 uppercase tracking-wider border-b border-brand-navy-200/80 dark:border-brand-navy-800">
              <tr>
                <th className="py-3 px-4">Mã</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Cơ Sở Phụ Trách</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4">Đăng Nhập Cuối</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800/80">
              {filteredManagers.map((m) => (
                <tr
                  key={m.id}
                  className="hover:bg-brand-navy-50/70 dark:hover:bg-brand-navy-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-brand-navy-400">#{m.id}</td>
                  <td className="py-3.5 px-4 font-extrabold text-brand-navy-900 dark:text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-brand-teal-100 dark:bg-brand-teal-950 text-brand-teal-700 dark:text-brand-teal-300 font-bold text-[11px] flex items-center justify-center uppercase">
                        {m.fullName?.slice(0, 2) || 'MN'}
                      </div>
                      <span>{m.fullName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-brand-navy-600 dark:text-brand-navy-400">{m.username}</td>
                  <td className="py-3.5 px-4 font-medium text-brand-navy-500">{m.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-200 font-semibold text-xs border border-brand-navy-200 dark:border-brand-navy-700">
                      <span className="material-symbols-outlined text-[15px] text-brand-teal-700 dark:text-brand-teal-400">domain</span>
                      <span>{m.centerName || 'Chưa gán cơ sở'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="py-3.5 px-4 text-brand-navy-400 text-[11px]">{fmtDate(m.lastLoginAt)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <MotionButton
                      onClick={() => patchM(m)}
                      disabled={saving === 'm' + m.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            m.status === 'Active'
                              ? 'border-brand-danger-200 dark:border-brand-danger-800 bg-brand-danger-50 dark:bg-brand-danger-950/60 text-brand-danger-700 dark:text-brand-danger-300 hover:bg-brand-danger-100'
                              : 'border-brand-sage-200 dark:border-brand-sage-800 bg-brand-sage-50 dark:bg-brand-sage-950/60 text-brand-sage-700 dark:text-brand-sage-300 hover:bg-brand-sage-100'
                          }`}
                    >
                      {saving === 'm' + m.id
                        ? '...'
                        : m.status === 'Active'
                        ? 'Vô Hiệu Hóa'
                        : 'Kích Hoạt'}
                    </MotionButton>
                  </td>
                </tr>
              ))}
              {filteredManagers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-brand-navy-400 dark:text-brand-navy-500">
                    Không tìm thấy Manager nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
