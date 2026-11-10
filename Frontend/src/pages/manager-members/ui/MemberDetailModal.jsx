import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { getAvatarGradient } from '../../../shared/lib/avatarGradient.js';
import { getInitials } from '../lib/memberDisplay.js';
import { formatMemberDate } from '../../../entities/member/index.js';

export function MemberDetailModal({ isEn, modal, openEdit, openSubscriptions, setModal }) {
  return (
    <Modal
      isOpen={modal?.type === 'detail'}
      onClose={() => setModal(null)}
      title={isEn ? 'Member Profile Details' : 'Hồ sơ chi tiết thành viên'}
      maxWidth="max-w-2xl"
    >
      {modal?.row && (
        <div className="space-y-6">
          {/* Header info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/60 border border-brand-navy-200 dark:border-brand-navy-700">
            {modal.row.avatar ? (
              <img
                src={modal.row.avatar}
                alt={modal.row.fullName}
                className="w-16 h-16 rounded-2xl object-cover shadow-md flex-shrink-0"
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                    modal.row.fullName
                  )} flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0`}
              >
                {getInitials(modal.row.fullName)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-brand-navy-900 dark:text-brand-navy-100">{modal.row.fullName}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      modal.row.accountStatus === 'Active'
                        ? 'bg-brand-sage-50 text-brand-sage-700 dark:bg-brand-sage-950/60 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800'
                        : 'bg-brand-danger-50 text-brand-danger-700 dark:bg-brand-danger-950/60 dark:text-brand-danger-300 border border-brand-danger-200 dark:border-brand-danger-800'
                    }`}
                >
                  {modal.row.accountStatus === 'Active' ? (isEn ? 'Active' : 'Hoạt động') : isEn ? 'Locked' : 'Đã khóa'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-brand-navy-500 dark:text-brand-navy-400">
                <span className="font-mono font-bold text-brand-navy-700 dark:text-brand-navy-300 bg-white dark:bg-brand-navy-900 px-2 py-0.5 rounded border border-brand-navy-200 dark:border-brand-navy-700">
                  {modal.row.memberCode}
                </span>
                <span>Username: @{modal.row.username}</span>
                <span>
                  {isEn ? 'Joined:' : 'Ngày tham gia:'} {formatMemberDate(modal.row.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Grid details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200 dark:border-brand-navy-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-brand-sage-700 dark:text-brand-sage-500">badge</span>
                {isEn ? 'Personal Information' : 'Thông tin cá nhân'}
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-1.5">
                  <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Gender:' : 'Giới tính:'}</span>
                  <span className="font-semibold text-brand-navy-800 dark:text-brand-navy-200">
                    {modal.row.gender === 'Male'
                      ? isEn
                        ? 'Male'
                        : 'Nam'
                      : modal.row.gender === 'Female'
                      ? isEn
                        ? 'Female'
                        : 'Nữ'
                      : modal.row.gender || (isEn ? 'Not specified' : 'Chưa cung cấp')}
                  </span>
                </div>
                <div className="flex justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-1.5">
                  <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Date of birth:' : 'Ngày sinh:'}</span>
                  <span className="font-semibold text-brand-navy-800 dark:text-brand-navy-200">{formatMemberDate(modal.row.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-1.5">
                  <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Address:' : 'Địa chỉ:'}</span>
                  <span className="font-semibold text-brand-navy-800 dark:text-brand-navy-200 text-right">
                    {modal.row.address || (isEn ? 'Not specified' : 'Chưa cung cấp')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200 dark:border-brand-navy-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-brand-sage-700 dark:text-brand-sage-500">contact_phone</span>
                {isEn ? 'Contact Info' : 'Thông tin liên hệ'}
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-1.5">
                  <span className="text-brand-navy-500 dark:text-brand-navy-400">Email:</span>
                  <a href={`mailto:${modal.row.email}`} className="font-semibold text-brand-teal-700 dark:text-brand-teal-400 hover:underline">
                    {modal.row.email}
                  </a>
                </div>
                <div className="flex justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-1.5">
                  <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Phone:' : 'Số điện thoại:'}</span>
                  {modal.row.phone ? (
                    <a href={`tel:${modal.row.phone}`} className="font-semibold text-brand-navy-800 dark:text-brand-navy-200 hover:text-brand-sage-700">
                      {modal.row.phone}
                    </a>
                  ) : (
                    <span className="text-brand-navy-400 italic">{isEn ? 'None' : 'Chưa có'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Current Package Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-sand-300">fitness_center</span>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-300">
                  {isEn ? 'Current Subscription' : 'Gói tập hiện tại'}
                </span>
              </div>
              {modal.row.packageStatus && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-sage-700 text-white">
                  {modal.row.packageStatus}
                </span>
              )}
            </div>
            <div>
              <p className="text-lg font-black text-white">
                {modal.row.packageName || (isEn ? 'No active package registered' : 'Chưa đăng ký gói tập nào')}
              </p>
              {modal.row.packageExpiry && (
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-brand-navy-300">
                  <span>
                    {isEn ? 'Valid until:' : 'Hiệu lực đến:'} <strong className="text-white">{formatMemberDate(modal.row.packageExpiry)}</strong>
                  </span>
                  {modal.row.packageStartDate && <span>({isEn ? 'Started:' : 'Bắt đầu:'} {formatMemberDate(modal.row.packageStartDate)})</span>}
                </div>
              )}
            </div>
          </div>

          {/* Modal actions footer */}
          <div className="pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800 flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="px-4 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 text-xs font-bold hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800"
            >
              {isEn ? 'Close' : 'Đóng'}
            </button>
            <button
              type="button"
              onClick={() => openSubscriptions(modal.row)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500 bg-brand-sage-700/10 hover:bg-brand-sage-700/20"
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>{isEn ? 'Package History' : 'Lịch sử gói tập'}</span>
            </button>
            <button
              type="button"
              onClick={() => openEdit(modal.row)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-brand-navy-900 dark:text-brand-navy-100 bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>{isEn ? 'Edit Profile' : 'Sửa thông tin'}</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
