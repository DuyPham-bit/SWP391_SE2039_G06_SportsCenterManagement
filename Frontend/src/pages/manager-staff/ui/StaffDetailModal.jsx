import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { getAvatarGradient, getInitials } from '../lib/staffDisplay.js';
import { formatMemberDate } from '../../../entities/member/index.js';

export function StaffDetailModal({ detailModalStaff, isEn, openEditModal, roleConfig, setDetailModalStaff }) {
  return (
    <Modal
      isOpen={Boolean(detailModalStaff)}
      onClose={() => setDetailModalStaff(null)}
      title={isEn ? 'Staff Profile Details' : 'Hồ sơ chi tiết nhân viên'}
      maxWidth="max-w-2xl"
    >
      {detailModalStaff && (
        <div className="space-y-6">
          {/* Header info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/60 border border-brand-navy-200 dark:border-brand-navy-700">
            {detailModalStaff.avatar ? (
              <img
                src={detailModalStaff.avatar}
                alt={detailModalStaff.fullName}
                className="w-16 h-16 rounded-2xl object-cover shadow-md flex-shrink-0"
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                    detailModalStaff.fullName,
                    detailModalStaff.role,
                    roleConfig
                  )} flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0`}
              >
                {getInitials(detailModalStaff.fullName)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-brand-navy-900 dark:text-brand-navy-100">{detailModalStaff.fullName}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      detailModalStaff.status === 'ACTIVE'
                        ? 'bg-brand-sage-50 text-brand-sage-700 dark:bg-brand-sage-950/60 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800'
                        : 'bg-brand-danger-50 text-brand-danger-700 dark:bg-brand-danger-950/60 dark:text-brand-danger-300 border border-brand-danger-200 dark:border-brand-danger-800'
                    }`}
                >
                  {detailModalStaff.status === 'ACTIVE' ? (isEn ? 'Active' : 'Hoạt động') : isEn ? 'Locked' : 'Đã khóa'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-brand-navy-500 dark:text-brand-navy-400">
                <span className="font-mono font-bold text-brand-navy-800 dark:text-brand-navy-200 bg-white dark:bg-brand-navy-900 px-2 py-0.5 rounded border border-brand-navy-200 dark:border-brand-navy-700">
                  ID: {detailModalStaff.id}
                </span>
                {roleConfig[detailModalStaff.role] && (
                  <span className={`font-bold px-2 py-0.5 rounded ${roleConfig[detailModalStaff.role].badgeClass}`}>
                    {roleConfig[detailModalStaff.role].label}
                  </span>
                )}
                {detailModalStaff.username && <span>Username: @{detailModalStaff.username}</span>}
              </div>
            </div>
          </div>

          {/* Grid details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200 dark:border-brand-navy-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-brand-sage-700 dark:text-brand-sage-500">contact_phone</span>
                {isEn ? 'Contact Information' : 'Thông tin liên hệ'}
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-1.5">
                  <span className="text-brand-navy-500 dark:text-brand-navy-400">Email:</span>
                  <a href={`mailto:${detailModalStaff.email}`} className="font-semibold text-brand-teal-700 dark:text-brand-teal-400 hover:underline">
                    {detailModalStaff.email}
                  </a>
                </div>
                <div className="flex justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-1.5">
                  <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Phone:' : 'Số điện thoại:'}</span>
                  {detailModalStaff.phone ? (
                    <a href={`tel:${detailModalStaff.phone}`} className="font-semibold text-brand-navy-800 dark:text-brand-navy-200 hover:text-brand-sage-700">
                      {detailModalStaff.phone}
                    </a>
                  ) : (
                    <span className="text-brand-navy-400 italic">{isEn ? 'None' : 'Chưa có'}</span>
                  )}
                </div>
                <div className="flex justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-1.5">
                  <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Hire Date:' : 'Ngày nhận việc:'}</span>
                  <span className="font-semibold text-brand-navy-800 dark:text-brand-navy-200">{formatMemberDate(detailModalStaff.hireDate)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200 dark:border-brand-navy-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-brand-sage-700 dark:text-brand-sage-500">workspace_premium</span>
                {isEn ? 'Specialty & Credentials' : 'Chuyên môn & Chứng chỉ'}
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-1.5">
                  <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Specialty:' : 'Chuyên môn:'}</span>
                  <span className="font-semibold text-brand-navy-800 dark:text-brand-navy-200 text-right">
                    {detailModalStaff.specialty || (isEn ? 'Center Operations' : 'Vận hành trung tâm')}
                  </span>
                </div>
                <div className="flex justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-1.5">
                  <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Certifications:' : 'Chứng chỉ:'}</span>
                  <span className="font-semibold text-brand-sage-700 dark:text-brand-sage-500 text-right">
                    {detailModalStaff.certification || (isEn ? 'Not provided' : 'Chưa cung cấp')}
                  </span>
                </div>
                <div className="flex justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-1.5">
                  <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Experience:' : 'Kinh nghiệm:'}</span>
                  <span className="font-semibold text-brand-navy-800 dark:text-brand-navy-200">
                    {detailModalStaff.experienceYears
                      ? isEn
                        ? `${detailModalStaff.experienceYears} years`
                        : `${detailModalStaff.experienceYears} năm`
                      : isEn
                      ? 'Not updated'
                      : 'Chưa cập nhật'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Role details box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-brand-navy-900 to-brand-navy-800 text-white space-y-2 shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-sand-300">
              <span className="material-symbols-outlined text-[18px]">security</span>
              <span>{isEn ? 'SCMS Operational Permissions' : 'Phân quyền chức năng SCMS'}</span>
            </div>
            <p className="text-xs text-brand-navy-300 leading-relaxed">
              {roleConfig[detailModalStaff.role]?.desc ||
                (isEn ? 'Staff member has access and operational rights according to assigned role.' : 'Nhân sự có quyền truy cập và thao tác theo đúng vai trò được giao.')}
            </p>
          </div>

          {/* Modal actions */}
          <div className="pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800 flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setDetailModalStaff(null)}
              className="px-4 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 text-xs font-bold hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800"
            >
              {isEn ? 'Close' : 'Đóng'}
            </button>
            <button
              type="button"
              onClick={() => {
                const s = detailModalStaff;
                setDetailModalStaff(null);
                openEditModal(s);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-brand-navy-900 dark:text-brand-navy-100 bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>{isEn ? 'Edit Info' : 'Sửa thông tin'}</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
