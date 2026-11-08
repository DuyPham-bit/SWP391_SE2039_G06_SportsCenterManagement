import React from 'react';
import { MotionButton } from '../../../shared/ui/MotionButton.jsx';
import { StatusBadge } from './Badges.jsx';
import { fmtDateOnly } from '../lib/format.js';

export function CentersTab({
  centerSearch, centerStatusFilter, centers, filteredCenters, loadC, patchC, saving, setCenterSearch,
  setCenterStatusFilter, setShowCC
}) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-3xl p-5 sm:p-6 lg:p-7 shadow-xs border border-brand-navy-200/80 dark:border-brand-navy-800 space-y-5">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-brand-navy-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Quản Lý Mạng Lưới Cơ Sở Thể Thao</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-sage-50 dark:bg-brand-sage-950/60 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800">
              {centers.length} cơ sở
            </span>
          </h3>
          <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
            Quản lý thông tin địa điểm, số điện thoại hotline và trạng thái hoạt động của từng cơ sở.
          </p>
        </div>

        <MotionButton
          onClick={() => setShowCC(true)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-sage-600 to-brand-teal-700 hover:from-brand-sage-700 hover:to-brand-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-brand-sage-600/20 cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add_business</span>
          <span>+ Tạo Cơ Sở Mới</span>
        </MotionButton>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-brand-navy-50 dark:bg-brand-navy-800/50 rounded-2xl border border-brand-navy-200/60 dark:border-brand-navy-700/60">
        <div className="relative flex-1 min-w-[220px]">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-brand-navy-400">search</span>
          <input
            type="text"
            placeholder="Tìm tên cơ sở, địa chỉ, số điện thoại..."
            value={centerSearch}
            onChange={(e) => setCenterSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-sage-500 transition-all placeholder:text-brand-navy-400"
          />
        </div>

        <select
          value={centerStatusFilter}
          onChange={(e) => setCenterStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-sage-500 transition-all cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Active">Hoạt động (Active)</option>
          <option value="Inactive">Tạm ngưng (Inactive)</option>
          <option value="Disabled">Vô hiệu hóa (Disabled)</option>
        </select>

        {(centerSearch || centerStatusFilter) && (
          <button
            onClick={() => { setCenterSearch(''); setCenterStatusFilter(''); }}
            className="text-xs font-semibold text-brand-navy-500 dark:text-brand-navy-400 hover:text-brand-navy-700 dark:hover:text-brand-navy-200 underline cursor-pointer"
          >
            Đặt lại lọc
          </button>
        )}
      </div>

      {/* Table */}
      {loadC ? (
        <div className="py-16 text-center text-brand-navy-400 flex flex-col items-center justify-center gap-2">
          <span className="w-6 h-6 border-2 border-brand-sage-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Đang tải danh sách cơ sở...</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800">
          <table className="w-full text-left text-xs text-brand-navy-700 dark:text-brand-navy-300">
            <thead className="bg-brand-navy-50 dark:bg-brand-navy-800/80 text-[11px] font-bold text-brand-navy-500 dark:text-brand-navy-400 uppercase tracking-wider border-b border-brand-navy-200/80 dark:border-brand-navy-800">
              <tr>
                <th className="py-3 px-4">Mã</th>
                <th className="py-3 px-4">Tên Cơ Sở</th>
                <th className="py-3 px-4">Địa Chỉ</th>
                <th className="py-3 px-4">Hotline</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4">Ngày Tạo</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800/80">
              {filteredCenters.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-brand-navy-50/70 dark:hover:bg-brand-navy-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-brand-navy-400">#{c.id}</td>
                  <td className="py-3.5 px-4 font-extrabold text-brand-navy-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-400 text-[18px]">apartment</span>
                      <span>{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-brand-navy-600 dark:text-brand-navy-400">
                    {c.address || '—'}
                  </td>
                  <td className="py-3.5 px-4 font-medium">{c.phone || '—'}</td>
                  <td className="py-3.5 px-4 font-medium text-brand-navy-500">{c.email || '—'}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3.5 px-4 text-brand-navy-400">{fmtDateOnly(c.createdAt)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <MotionButton
                      onClick={() => patchC(c.id, c.status)}
                      disabled={saving === 'c' + c.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            c.status === 'Active'
                              ? 'border-brand-sand-200 dark:border-brand-sand-800 bg-brand-sand-50 dark:bg-brand-sand-950/60 text-brand-sand-700 dark:text-brand-sand-300 hover:bg-brand-sand-100'
                              : 'border-brand-sage-200 dark:border-brand-sage-800 bg-brand-sage-50 dark:bg-brand-sage-950/60 text-brand-sage-700 dark:text-brand-sage-300 hover:bg-brand-sage-100'
                          }`}
                    >
                      {saving === 'c' + c.id
                        ? '...'
                        : c.status === 'Active'
                        ? 'Tạm Ngưng'
                        : 'Kích Hoạt'}
                    </MotionButton>
                  </td>
                </tr>
              ))}
              {filteredCenters.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-brand-navy-400 dark:text-brand-navy-500">
                    Không tìm thấy cơ sở nào phù hợp với bộ lọc.
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
