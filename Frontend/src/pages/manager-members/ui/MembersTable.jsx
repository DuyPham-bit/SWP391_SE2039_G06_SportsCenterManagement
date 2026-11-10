import React from 'react';
import { calculateDaysLeft, getInitials } from '../lib/memberDisplay.js';
import { getAvatarGradient } from '../../../shared/lib/avatarGradient.js';
import { formatMemberDate } from '../../../entities/member/index.js';

export function MembersTable({
  busy, copiedCode, copyMemberCode, data, filter, filteredAndSortedItems, handleResetSearch, isEn,
  loading, openDetail, openEdit, openStatusConfirm, openSubscriptions, setFilter, statusFilter,
  totalPages
}) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-brand-navy-200 dark:border-brand-navy-800 bg-brand-navy-50/80 dark:bg-brand-navy-800/60 text-brand-navy-600 dark:text-brand-navy-300 font-chivo text-xs uppercase tracking-wider">
              <th className="py-3.5 px-5 font-bold whitespace-nowrap">{isEn ? 'Member' : 'Thành viên'}</th>
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">{isEn ? 'Contact' : 'Liên hệ'}</th>
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">{isEn ? 'Account' : 'Tài khoản'}</th>
              <th className="py-3.5 px-4 font-bold whitespace-nowrap">{isEn ? 'Package & Expiry' : 'Gói tập & Hạn dùng'}</th>
              <th className="py-3.5 px-4 font-bold text-center whitespace-nowrap">{isEn ? 'Actions' : 'Thao tác'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800 text-sm text-brand-navy-700 dark:text-brand-navy-300">
            {filteredAndSortedItems.length > 0 ? (
              filteredAndSortedItems.map((r) => {
                const daysRemaining = calculateDaysLeft(r.packageExpiry);
                const isPackageActive = r.packageStatus === 'ACTIVE';
                const isAccountActive = r.accountStatus === 'Active';

                return (
                  <tr
                    key={r.memberId}
                    onClick={() => openDetail(r)}
                    className="hover:bg-brand-navy-50/80 dark:hover:bg-brand-navy-800/50 transition-colors cursor-pointer group"
                  >
                    {/* Member Column */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        {r.avatar ? (
                          <img
                            src={r.avatar}
                            alt={r.fullName}
                            className="w-10 h-10 rounded-full object-cover shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                  r.fullName
                                )} flex items-center justify-center text-white font-black text-xs shadow-sm flex-shrink-0`}
                          >
                            {getInitials(r.fullName)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-navy-900 dark:text-brand-navy-100 group-hover:text-brand-sage-700 dark:group-hover:text-brand-sage-500 transition-colors whitespace-nowrap">
                              {r.fullName}
                            </span>
                            {r.gender && (
                              <span className="text-[10px] text-brand-navy-500 dark:text-brand-navy-400 font-semibold px-1.5 py-0.5 rounded bg-brand-navy-100 dark:bg-brand-navy-800 whitespace-nowrap">
                                {r.gender === 'Male'
                                  ? isEn
                                    ? 'Male'
                                    : 'Nam'
                                  : r.gender === 'Female'
                                  ? isEn
                                    ? 'Female'
                                    : 'Nữ'
                                  : isEn
                                  ? 'Other'
                                  : 'Khác'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-brand-navy-500 dark:text-brand-navy-400 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => copyMemberCode(r.memberCode, e)}
                              className="inline-flex items-center gap-1 font-mono font-semibold text-brand-navy-700 dark:text-brand-navy-300 bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 px-1.5 py-0.5 rounded transition-colors"
                              title={isEn ? 'Click to copy ID' : 'Nhấn để sao chép mã'}
                            >
                              <span>{r.memberCode}</span>
                              <span className="material-symbols-outlined text-[12px] text-brand-navy-400">
                                {copiedCode === r.memberCode ? 'check' : 'content_copy'}
                              </span>
                            </button>
                            <span>·</span>
                            <span className="text-brand-navy-400">@{r.username}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-brand-navy-700 dark:text-brand-navy-300">
                          <span className="material-symbols-outlined text-[14px] text-brand-navy-400">mail</span>
                          <span className="truncate max-w-[200px]">{r.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="material-symbols-outlined text-[14px] text-brand-navy-400">call</span>
                          {r.phone ? (
                            <span className="font-semibold text-brand-navy-800 dark:text-brand-navy-200">{r.phone}</span>
                          ) : (
                            <span className="text-brand-navy-400 italic">{isEn ? 'No phone' : 'Chưa có điện thoại'}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Account Status Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isAccountActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-500 animate-pulse" />
                          {isEn ? 'Active' : 'Hoạt động'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-danger-50 dark:bg-brand-danger-950/40 text-brand-danger-700 dark:text-brand-danger-300 border border-brand-danger-200 dark:border-brand-danger-800">
                          <span className="material-symbols-outlined text-[13px]">lock</span>
                          {isEn ? 'Locked' : 'Đã khóa'}
                        </span>
                      )}
                    </td>

                    {/* Package Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {r.packageName ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-brand-sage-700 dark:text-brand-sage-500">
                              fitness_center
                            </span>
                            <span className="font-bold text-brand-navy-900 dark:text-brand-navy-100 text-xs">{r.packageName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    isPackageActive
                                      ? 'bg-brand-sage-100 text-brand-sage-800 dark:bg-brand-sage-950/60 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800'
                                      : r.packageStatus === 'CANCELLED'
                                      ? 'bg-brand-danger-100 text-brand-danger-800 dark:bg-brand-danger-950/60 dark:text-brand-danger-300 border border-brand-danger-200 dark:border-brand-danger-800'
                                      : 'bg-brand-sand-100 text-brand-sand-800 dark:bg-brand-sand-950/60 dark:text-brand-sand-300 border border-brand-sand-200 dark:border-brand-sand-800'
                                  }`}
                            >
                              {r.packageStatus || 'ACTIVE'}
                            </span>
                            {r.packageExpiry && (
                              <span className="text-brand-navy-500 dark:text-brand-navy-400 text-[11px]">
                                {isEn ? 'Exp:' : 'Hạn:'} <strong className="text-brand-navy-700 dark:text-brand-navy-300">{formatMemberDate(r.packageExpiry)}</strong>
                                {daysRemaining !== null && isPackageActive && (
                                  <span className={`ml-1 font-semibold ${daysRemaining <= 7 ? 'text-brand-sand-700 dark:text-brand-sand-400' : 'text-brand-navy-500'}`}>
                                    ({daysRemaining > 0 ? (isEn ? `${daysRemaining}d left` : `còn ${daysRemaining} ngày`) : isEn ? 'expires today' : 'hết hạn hôm nay'})
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-brand-navy-400 italic">
                          <span className="material-symbols-outlined text-[14px]">remove_circle_outline</span>
                          {isEn ? 'No active package' : 'Chưa có gói tập'}
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetail(r)}
                          className="p-1.5 rounded-lg text-brand-navy-500 hover:text-brand-navy-800 dark:hover:text-brand-navy-200 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 transition-colors"
                          title={isEn ? 'View member details' : 'Xem chi tiết hồ sơ'}
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openEdit(r, e)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-brand-navy-700 dark:text-brand-navy-200 bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                          title={isEn ? 'Edit information' : 'Chỉnh sửa thông tin'}
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                          <span>{isEn ? 'Edit' : 'Sửa'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openSubscriptions(r, e)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500 bg-brand-sage-700/10 hover:bg-brand-sage-700/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                          title={isEn ? 'View subscription history' : 'Xem toàn bộ lịch sử gói tập'}
                        >
                          <span className="material-symbols-outlined text-[15px]">history</span>
                          <span>{isEn ? 'History' : 'Lịch sử gói'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openStatusConfirm(r, e)}
                          disabled={busy}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap ${
                                isAccountActive
                                  ? 'text-brand-danger-700 dark:text-brand-danger-400 bg-brand-danger-50 dark:bg-brand-danger-950/40 hover:bg-brand-danger-100 dark:hover:bg-brand-danger-900/60'
                                  : 'text-brand-sage-700 dark:text-brand-sage-300 bg-brand-sage-50 dark:bg-brand-sage-950/40 hover:bg-brand-sage-100 dark:hover:bg-brand-sage-900/60'
                              }`}
                          title={isAccountActive ? (isEn ? 'Lock account' : 'Tạm khóa tài khoản') : isEn ? 'Unlock account' : 'Mở khóa tài khoản'}
                        >
                          <span className="material-symbols-outlined text-[15px]">{isAccountActive ? 'lock' : 'lock_open'}</span>
                          <span>{isAccountActive ? (isEn ? 'Lock' : 'Khóa') : isEn ? 'Unlock' : 'Mở khóa'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-16 text-center text-brand-navy-400">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 flex items-center justify-center text-brand-navy-400">
                      <span className="material-symbols-outlined text-3xl">person_search</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-brand-navy-700 dark:text-brand-navy-300">
                        {isEn ? 'No members found' : 'Không tìm thấy thành viên nào'}
                      </p>
                      <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
                        {filter.query
                          ? isEn
                            ? `No results match "${filter.query}"`
                            : `Không có kết quả nào khớp với "${filter.query}"`
                          : isEn
                          ? 'Member directory is currently empty.'
                          : 'Danh sách thành viên hiện đang trống.'}
                      </p>
                    </div>
                    {(filter.query || statusFilter !== 'ALL') && (
                      <button
                        onClick={handleResetSearch}
                        className="mt-2 px-4 py-2 bg-brand-navy-900 text-white rounded-xl text-xs font-bold hover:bg-brand-navy-800 transition-colors shadow-sm"
                      >
                        {isEn ? 'Clear filters & show all' : 'Xóa bộ lọc & Xem tất cả'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-brand-navy-100 dark:border-brand-navy-800 bg-brand-navy-50/50 dark:bg-brand-navy-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-navy-500 dark:text-brand-navy-400">
        <div>
          {isEn ? 'Showing' : 'Hiển thị'}{' '}
          <span className="font-bold text-brand-navy-800 dark:text-brand-navy-200">{(filter.page - 1) * data.pageSize + 1}</span> -{' '}
          <span className="font-bold text-brand-navy-800 dark:text-brand-navy-200">{Math.min(filter.page * data.pageSize, data.totalCount)}</span>{' '}
          {isEn ? 'of' : 'trên tổng số'}{' '}
          <span className="font-bold text-brand-navy-800 dark:text-brand-navy-200">{data.totalCount}</span> {isEn ? 'members' : 'thành viên'}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            disabled={filter.page <= 1 || loading}
            onClick={() => setFilter((f) => ({ ...f, page: f.page - 1 }))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            <span>{isEn ? 'Previous' : 'Trước'}</span>
          </button>

          <span className="px-3 py-1.5 font-bold text-brand-navy-800 dark:text-brand-navy-200 bg-white dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 rounded-lg">
            {isEn ? `Page ${filter.page} / ${totalPages}` : `Trang ${filter.page} / ${totalPages}`}
          </span>

          <button
            disabled={filter.page >= totalPages || loading}
            onClick={() => setFilter((f) => ({ ...f, page: f.page + 1 }))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span>{isEn ? 'Next' : 'Sau'}</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
