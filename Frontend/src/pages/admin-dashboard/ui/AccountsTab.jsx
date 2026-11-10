import React from 'react';
import { MotionButton } from '../../../shared/ui/MotionButton.jsx';
import { parseApiDate } from '../../../shared/lib/dateTime.js';
import { RoleBadge, StatusBadge } from './Badges.jsx';
import { fmtDate } from '../lib/format.js';

export function AccountsTab({
  PS, aPage, aPgs, aQ, aRole, aSt, aTotal, accs, actA, deleteMember, loadA, loadAFn, saving,
  setAPage, setAQ, setARole, setASt
}) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-3xl p-5 sm:p-6 lg:p-7 shadow-xs border border-brand-navy-200/80 dark:border-brand-navy-800 space-y-5">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-brand-navy-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Quản Lý Tài Khoản Toàn Hệ Thống</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-sand-50 dark:bg-brand-sand-950/60 text-brand-sand-700 dark:text-brand-sand-300 border border-brand-sand-200 dark:border-brand-sand-800">
              {aTotal} tài khoản
            </span>
          </h3>
          <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
            Kiểm soát bảo mật, khóa tài khoản vi phạm, thu hồi phiên đăng nhập và xóa thông tin hội viên.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-brand-navy-50 dark:bg-brand-navy-800/50 rounded-2xl border border-brand-navy-200/60 dark:border-brand-navy-700/60">
        <div className="relative flex-1 min-w-[220px]">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-brand-navy-400">search</span>
          <input
            type="text"
            placeholder="Tìm username, email tài khoản..."
            value={aQ}
            onChange={(e) => { setAQ(e.target.value); setAPage(1); }}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-sage-500 transition-all placeholder:text-brand-navy-400"
          />
        </div>

        <select
          value={aRole}
          onChange={(e) => { setARole(e.target.value); setAPage(1); }}
          className="px-3 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-sage-500 transition-all cursor-pointer"
        >
          <option value="">Tất cả vai trò</option>
          {['Admin', 'Manager', 'Receptionist', 'Coach', 'Member'].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={aSt}
          onChange={(e) => { setASt(e.target.value); setAPage(1); }}
          className="px-3 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-sage-500 transition-all cursor-pointer"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Active">Hoạt động (Active)</option>
          <option value="Disabled">Bị khóa (Disabled)</option>
        </select>

        <MotionButton
          onClick={loadAFn}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 rounded-xl bg-brand-navy-900 dark:bg-brand-navy-100 text-white dark:text-brand-navy-900 text-xs font-bold transition-colors cursor-pointer"
        >
          Tìm kiếm
        </MotionButton>

        {(aQ || aRole || aSt) && (
          <button
            onClick={() => { setAQ(''); setARole(''); setASt(''); setAPage(1); }}
            className="text-xs font-semibold text-brand-navy-500 dark:text-brand-navy-400 hover:text-brand-navy-700 dark:hover:text-brand-navy-200 underline cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        )}

        <div className="ml-auto text-xs font-semibold text-brand-navy-400">
          Trang {aPage} / {aPgs}
        </div>
      </div>

      {/* Accounts Table */}
      {loadA ? (
        <div className="py-16 text-center text-brand-navy-400 flex flex-col items-center justify-center gap-2">
          <span className="w-6 h-6 border-2 border-brand-sage-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Đang tải danh sách tài khoản...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800">
            <table className="w-full text-left text-xs text-brand-navy-700 dark:text-brand-navy-300">
              <thead className="bg-brand-navy-50 dark:bg-brand-navy-800/80 text-[11px] font-bold text-brand-navy-500 dark:text-brand-navy-400 uppercase tracking-wider border-b border-brand-navy-200/80 dark:border-brand-navy-800">
                <tr>
                  <th className="py-3 px-4">Mã</th>
                  <th className="py-3 px-4">Tài Khoản</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Vai Trò</th>
                  <th className="py-3 px-4">Cơ Sở</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Bị Khóa Đến</th>
                  <th className="py-3 px-4">Đăng Nhập Cuối</th>
                  <th className="py-3 px-4 text-right">Thao Tác Bảo Mật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800/80">
                {accs.map((a) => {
                  const isLocked = a.lockedUntil && parseApiDate(a.lockedUntil) > new Date();
                  return (
                    <tr
                      key={a.id}
                      className="hover:bg-brand-navy-50/70 dark:hover:bg-brand-navy-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-brand-navy-400">#{a.id}</td>
                      <td className="py-3.5 px-4 font-extrabold text-brand-navy-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 font-black text-[11px] flex items-center justify-center uppercase">
                            {a.username?.slice(0, 2) || 'SC'}
                          </div>
                          <span>{a.username}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-brand-navy-500 dark:text-brand-navy-400">{a.email}</td>
                      <td className="py-3.5 px-4">
                        <RoleBadge role={a.role} />
                      </td>
                      <td className="py-3.5 px-4 text-brand-navy-600 dark:text-brand-navy-400">{a.centerName || '—'}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={isLocked ? 'Disabled' : a.status} />
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        {isLocked ? (
                          <span className="text-brand-danger-600 font-bold">{fmtDate(a.lockedUntil)}</span>
                        ) : (
                          <span className="text-brand-navy-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-brand-navy-400 text-[11px]">{fmtDate(a.lastLoginAt)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Lock / Unlock */}
                          {!isLocked && a.role !== 'Admin' && (
                            <MotionButton
                              onClick={() => actA(a.id, 'lock')}
                              disabled={!!saving}
                              title="Khóa tài khoản"
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.94 }}
                              className="w-8 h-8 rounded-lg border border-brand-danger-200 dark:border-brand-danger-800 bg-brand-danger-50 dark:bg-brand-danger-950/60 text-brand-danger-600 hover:bg-brand-danger-100 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">lock</span>
                            </MotionButton>
                          )}
                          {isLocked && (
                            <MotionButton
                              onClick={() => actA(a.id, 'unlock')}
                              disabled={!!saving}
                              title="Mở khóa tài khoản"
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.94 }}
                              className="w-8 h-8 rounded-lg border border-brand-sage-200 dark:border-brand-sage-800 bg-brand-sage-50 dark:bg-brand-sage-950/60 text-brand-sage-700 hover:bg-brand-sage-100 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">lock_open</span>
                            </MotionButton>
                          )}

                          {/* Revoke Sessions */}
                          {a.role !== 'Admin' && (
                            <MotionButton
                              onClick={() => actA(a.id, 'revoke-sessions')}
                              disabled={!!saving}
                              title="Thu hồi phiên đăng nhập"
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.94 }}
                              className="w-8 h-8 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-300 hover:bg-brand-navy-100 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">logout</span>
                            </MotionButton>
                          )}

                          {/* Delete Member Account */}
                          {a.role === 'Member' && (
                            <MotionButton
                              onClick={() => deleteMember(a)}
                              disabled={!!saving}
                              title="Xóa tài khoản Member"
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.94 }}
                              className="w-8 h-8 rounded-lg border border-brand-danger-300 dark:border-brand-danger-800 bg-brand-danger-600 text-white hover:bg-brand-danger-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                            </MotionButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {accs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-brand-navy-400 dark:text-brand-navy-500">
                      Không có tài khoản nào phù hợp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {aPgs > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
              <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400 font-medium">
                Hiển thị {(aPage - 1) * PS + 1} - {Math.min(aPage * PS, aTotal)} trên tổng số {aTotal} tài khoản
              </div>

              <div className="flex items-center gap-1.5">
                <MotionButton
                  onClick={() => setAPage((p) => Math.max(1, p - 1))}
                  disabled={aPage <= 1}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 disabled:opacity-40 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 transition-colors cursor-pointer"
                >
                  Trước
                </MotionButton>

                {Array.from({ length: aPgs }, (_, i) => i + 1).map((p) => (
                  <MotionButton
                    key={p}
                    onClick={() => setAPage(p)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                          p === aPage
                            ? 'bg-brand-sage-700 text-white shadow-xs'
                            : 'border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-300 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800'
                        }`}
                  >
                    {p}
                  </MotionButton>
                ))}

                <MotionButton
                  onClick={() => setAPage((p) => Math.min(aPgs, p + 1))}
                  disabled={aPage >= aPgs}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 disabled:opacity-40 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 transition-colors cursor-pointer"
                >
                  Sau
                </MotionButton>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
