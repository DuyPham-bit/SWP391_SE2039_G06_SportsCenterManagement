import React from 'react';
import { getAvatarGradient, getInitials } from '../lib/staffDisplay.js';
import { formatMemberDate } from '../../../entities/member/index.js';
import { COACH_CLASS_FILTER } from '../model/staffManagementView.js';

export function StaffTable({
  coachClassFilter, copiedId, copyId, displayedStaff, handleResetFilters, isEn, openDetailModal,
  openEditModal, openStatusConfirmModal, roleConfig, roleFilter, searchQuery, staffList,
  statusFilter
}) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-brand-navy-200 dark:border-brand-navy-800 bg-brand-navy-50/80 dark:bg-brand-navy-800/60 text-brand-navy-600 dark:text-brand-navy-300 font-chivo text-xs uppercase tracking-wider">
              <th className="py-3 px-3 font-bold whitespace-nowrap w-20">{isEn ? 'Staff ID' : 'Mã ID'}</th>
              <th className="py-3 px-3.5 font-bold whitespace-nowrap">{isEn ? 'Staff' : 'Nhân sự'}</th>
              <th className="py-3 px-3 font-bold whitespace-nowrap w-32">{isEn ? 'Role' : 'Vai trò'}</th>
              <th className="py-3 px-3 font-bold whitespace-nowrap">{isEn ? 'Specialty & Credentials' : 'Chuyên môn & Chứng chỉ'}</th>
              <th className="py-3 px-3 font-bold whitespace-nowrap w-32">{isEn ? 'Contact' : 'Liên hệ'}</th>
              <th className="py-3 px-3 font-bold whitespace-nowrap w-28">{isEn ? 'Status' : 'Trạng thái'}</th>
              <th className="py-3 px-3.5 font-bold text-center whitespace-nowrap w-32">{isEn ? 'Actions' : 'Thao tác'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800 text-sm text-brand-navy-700 dark:text-brand-navy-300">
            {displayedStaff.length > 0 ? (
              displayedStaff.map((staff) => {
                const roleInfo = roleConfig[staff.role] || {
                  label: staff.role,
                  icon: 'person',
                  badgeClass: 'bg-brand-navy-100 text-brand-navy-700 border-brand-navy-200 dark:bg-brand-navy-800 dark:text-brand-navy-300 dark:border-brand-navy-700',
                  avatarGrad: 'from-brand-navy-500 to-brand-navy-700'
                };
                const isActive = staff.status === 'ACTIVE';

                return (
                  <tr
                    key={staff.id}
                    onClick={() => openDetailModal(staff)}
                    className="hover:bg-brand-navy-50/80 dark:hover:bg-brand-navy-800/50 transition-colors cursor-pointer group"
                  >
                    {/* ID Column */}
                    <td className="py-2.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => copyId(staff.id, e)}
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 border border-brand-navy-200/80 dark:border-brand-navy-700 px-2 py-0.5 rounded-lg transition-colors shadow-2xs"
                        title={isEn ? 'Click to copy ID' : 'Nhấn để sao chép ID'}
                      >
                        <span className="material-symbols-outlined text-[13px] text-brand-navy-400">badge</span>
                        <span>{staff.id}</span>
                        <span className="material-symbols-outlined text-[11px] text-brand-navy-400">
                          {copiedId === staff.id ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    </td>

                    {/* Staff Column */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2.5">
                        {staff.avatar ? (
                          <img
                            src={staff.avatar}
                            alt={staff.fullName}
                            className="w-8 h-8 rounded-full object-cover shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                  staff.fullName,
                                  staff.role,
                                  roleConfig
                                )} flex items-center justify-center text-white font-black text-xs shadow-sm flex-shrink-0`}
                          >
                            {getInitials(staff.fullName)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-brand-navy-900 dark:text-brand-navy-100 group-hover:text-brand-sage-700 dark:group-hover:text-brand-sage-500 transition-colors whitespace-nowrap text-xs">
                            {staff.fullName}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-brand-navy-500 dark:text-brand-navy-400 whitespace-nowrap">
                            <span className="truncate max-w-[150px]">{staff.email}</span>
                            {staff.username && (
                              <>
                                <span>·</span>
                                <span className="text-brand-navy-400">@{staff.username}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Column */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${roleInfo.badgeClass}`}
                      >
                        <span className="material-symbols-outlined text-[13px]">{roleInfo.icon}</span>
                        <span>{roleInfo.label}</span>
                      </span>
                    </td>

                    {/* Specialty & Certification Column */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-brand-navy-800 dark:text-brand-navy-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-brand-navy-400">fitness_center</span>
                          <span className="truncate max-w-[160px]">
                            {staff.specialty || (isEn ? 'Center Operations' : 'Vận hành trung tâm')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {staff.certification && (
                            <span className="text-[9px] font-bold text-brand-sage-700 dark:text-brand-sage-500 bg-brand-sage-700/10 border border-brand-sage-700/20 px-1.5 py-0.2 rounded">
                              {staff.certification}
                            </span>
                          )}
                          {staff.experienceYears && (
                            <span className="text-[9px] font-medium text-brand-navy-500 dark:text-brand-navy-400 bg-brand-navy-100 dark:bg-brand-navy-800 px-1 py-0.2 rounded">
                              {staff.experienceYears} {isEn ? 'yrs exp' : 'năm KN'}
                            </span>
                          )}
                          {staff.role === 'COACH' && staff.activeClassCount != null && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                  staff.activeClassCount === 0
                                    ? 'text-brand-danger-700 dark:text-brand-danger-300 bg-brand-danger-50 dark:bg-brand-danger-950/40 border-brand-danger-200 dark:border-brand-danger-800'
                                    : 'text-brand-sand-700 dark:text-brand-sand-300 bg-brand-sand-50 dark:bg-brand-sand-950/40 border-brand-sand-200 dark:border-brand-sand-800'
                                }`}>
                              {staff.activeClassCount === 0
                                ? (isEn ? 'No classes' : 'Chưa có lớp')
                                : `${staff.activeClassCount} ${isEn ? 'classes' : 'lớp'}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact Column */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1 text-brand-navy-700 dark:text-brand-navy-300">
                          <span className="material-symbols-outlined text-[13px] text-brand-navy-400">call</span>
                          {staff.phone ? (
                            <a
                              href={`tel:${staff.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold hover:text-brand-sage-700 dark:hover:text-brand-sage-500 transition-colors text-xs"
                            >
                              {staff.phone}
                            </a>
                          ) : (
                            <span className="text-brand-navy-400 italic text-[11px]">{isEn ? 'No phone' : 'Chưa có SĐT'}</span>
                          )}
                        </div>
                        {staff.hireDate && (
                          <div className="text-[10px] text-brand-navy-400">
                            {isEn ? 'Hired:' : 'Vào làm:'} {formatMemberDate(staff.hireDate)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-500 animate-pulse" />
                          {isEn ? 'Active' : 'Hoạt động'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-danger-50 dark:bg-brand-danger-950/40 text-brand-danger-700 dark:text-brand-danger-300 border border-brand-danger-200 dark:border-brand-danger-800">
                          <span className="material-symbols-outlined text-[12px]">lock</span>
                          {isEn ? 'Locked' : 'Đã khóa'}
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openDetailModal(staff)}
                          className="p-1 rounded-md text-brand-navy-500 hover:text-brand-navy-800 dark:hover:text-brand-navy-200 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 transition-colors"
                          title={isEn ? 'View staff details' : 'Xem chi tiết hồ sơ'}
                        >
                          <span className="material-symbols-outlined text-[17px]">visibility</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openEditModal(staff, e)}
                          className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-bold text-brand-navy-700 dark:text-brand-navy-200 bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 transition-colors whitespace-nowrap"
                          title={isEn ? 'Edit information' : 'Chỉnh sửa thông tin'}
                        >
                          <span className="material-symbols-outlined text-[13px]">edit</span>
                          <span>{isEn ? 'Edit' : 'Sửa'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => openStatusConfirmModal(staff, e)}
                          className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                                isActive
                                  ? 'text-brand-danger-700 dark:text-brand-danger-400 bg-brand-danger-50 dark:bg-brand-danger-950/40 hover:bg-brand-danger-100 dark:hover:bg-brand-danger-900/60'
                                  : 'text-brand-sage-700 dark:text-brand-sage-300 bg-brand-sage-50 dark:bg-brand-sage-950/40 hover:bg-brand-sage-100 dark:hover:bg-brand-sage-900/60'
                              }`}
                          title={isActive ? (isEn ? 'Lock staff' : 'Khóa nhân viên') : isEn ? 'Activate staff' : 'Kích hoạt lại'}
                        >
                          <span className="material-symbols-outlined text-[13px]">{isActive ? 'lock' : 'lock_open'}</span>
                          <span>{isActive ? (isEn ? 'Lock' : 'Khóa') : isEn ? 'Unlock' : 'Mở'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-16 text-center text-brand-navy-400">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 flex items-center justify-center text-brand-navy-400">
                      <span className="material-symbols-outlined text-3xl">badge</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-brand-navy-700 dark:text-brand-navy-300">
                        {isEn ? 'No staff members found' : 'Không tìm thấy nhân viên nào'}
                      </p>
                      <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
                        {searchQuery
                          ? isEn
                            ? `No results match "${searchQuery}"`
                            : `Không có kết quả nào khớp với "${searchQuery}"`
                          : isEn
                          ? 'Staff directory is currently empty.'
                          : 'Danh sách nhân sự hiện đang trống.'}
                      </p>
                    </div>
                    {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL' || coachClassFilter !== COACH_CLASS_FILTER.ALL) && (
                      <button
                        onClick={handleResetFilters}
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

      {/* Table Footer */}
      <div className="p-4 border-t border-brand-navy-100 dark:border-brand-navy-800 bg-brand-navy-50/50 dark:bg-brand-navy-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-navy-500 dark:text-brand-navy-400">
        <div>
          {isEn ? 'Showing' : 'Hiển thị'} <span className="font-bold text-brand-navy-800 dark:text-brand-navy-200">{displayedStaff.length}</span>{' '}
          {isEn ? 'of' : 'trên tổng số'} <span className="font-bold text-brand-navy-800 dark:text-brand-navy-200">{staffList.length}</span>{' '}
          {isEn ? 'staff members' : 'nhân sự trung tâm'}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-brand-navy-900 border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-brand-sage-500" />
            {isEn ? 'Olympic SCMS Standard' : 'Chuẩn Olympic SCMS'}
          </span>
        </div>
      </div>
    </div>
  );
}
