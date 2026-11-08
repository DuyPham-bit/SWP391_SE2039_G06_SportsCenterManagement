import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { labelClass, inputClass } from './formStyles.js';
import { today } from '../lib/memberDisplay.js';

export function MemberFormModal({ busy, form, handleFormChange, handleSaveMember, isEn, modal, setModal }) {
  return (
    <Modal
      isOpen={modal?.type === 'edit'}
      onClose={() => !busy && setModal(null)}
      title={
        modal?.row
          ? isEn
            ? `Update Profile · ${modal.row.fullName}`
            : `Cập nhật hồ sơ · ${modal.row.fullName}`
          : isEn
          ? 'Add New Member'
          : 'Thêm thành viên mới'
      }
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSaveMember} className="space-y-4">
        <div className="p-3 bg-brand-sage-50/70 dark:bg-brand-sage-950/40 border border-brand-sage-200/60 dark:border-brand-sage-800/60 rounded-xl text-xs text-brand-sage-900 dark:text-brand-sage-300 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-500 text-[18px] flex-shrink-0 mt-0.5">info</span>
          <span>
            {modal?.row
              ? isEn
                ? 'Updated information will be saved directly to the center system and synchronized with the user account.'
                : 'Thông tin cập nhật sẽ được lưu trực tiếp vào hệ thống trung tâm và đồng bộ đến tài khoản người dùng.'
              : isEn
              ? 'New members will receive an automatic member code (MEM-...) and can log in immediately after creation.'
              : 'Thành viên mới sẽ được cấp mã hội viên tự động (MEM-...) và có thể đăng nhập ngay sau khi tạo.'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!modal?.row && (
            <>
              <div>
                <label className={labelClass}>{isEn ? 'Username *' : 'Tên đăng nhập *'}</label>
                <input
                  className={inputClass}
                  name="username"
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder={isEn ? 'e.g. johndoe' : 'ví dụ: nguyenvana'}
                  pattern="[a-zA-Z0-9._-]+"
                  value={form.username || ''}
                  onChange={handleFormChange}
                />
                <span className="text-[11px] text-brand-navy-500 mt-1 block">
                  {isEn ? 'Letters, numbers, dots or underscores only.' : 'Chỉ gồm chữ cái, số, dấu chấm hoặc gạch dưới.'}
                </span>
              </div>
              <div>
                <label className={labelClass}>{isEn ? 'Initial Password *' : 'Mật khẩu ban đầu *'}</label>
                <input
                  className={inputClass}
                  type="password"
                  autoComplete="new-password"
                  name="password"
                  required
                  minLength={6}
                  maxLength={128}
                  placeholder={isEn ? 'Minimum 6 characters' : 'Tối thiểu 6 ký tự'}
                  value={form.password || ''}
                  onChange={handleFormChange}
                />
                <span className="text-[11px] text-brand-navy-500 mt-1 block">
                  {isEn ? 'Recommend letters, numbers and special characters.' : 'Khuyến nghị kết hợp chữ, số và ký tự đặc biệt.'}
                </span>
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>{isEn ? 'Full Name *' : 'Họ và tên đầy đủ *'}</label>
            <input
              className={inputClass}
              name="fullName"
              required
              maxLength={150}
              placeholder={isEn ? 'e.g. John Doe' : 'ví dụ: Nguyễn Văn A'}
              value={form.fullName || ''}
              onChange={handleFormChange}
            />
          </div>

          <div>
            <label className={labelClass}>{isEn ? 'Contact Email *' : 'Email liên hệ *'}</label>
            <input
              className={inputClass}
              name="email"
              type="email"
              readOnly={Boolean(modal?.row)}
              required
              maxLength={150}
              placeholder="email@domain.com"
              value={form.email || ''}
              onChange={handleFormChange}
            />
          </div>

          <div>
            <label className={labelClass}>{isEn ? 'Phone Number' : 'Số điện thoại'}</label>
            <input
              className={inputClass}
              name="phone"
              type="tel"
              maxLength={20}
              placeholder={isEn ? 'e.g. 0912345678' : 'ví dụ: 0912345678'}
              value={form.phone || ''}
              onChange={handleFormChange}
            />
          </div>

          <div>
            <label className={labelClass}>{isEn ? 'Date of Birth' : 'Ngày sinh'}</label>
            <input
              className={inputClass}
              name="dateOfBirth"
              type="date"
              required={Boolean(modal?.row?.dateOfBirth)}
              max={today()}
              value={form.dateOfBirth || ''}
              onChange={handleFormChange}
            />
          </div>

          <div>
            <label className={labelClass}>{isEn ? 'Gender' : 'Giới tính'}</label>
            <select className={inputClass} name="gender" value={form.gender || ''} onChange={handleFormChange}>
              <option value="">{isEn ? '-- Not specified --' : '-- Chưa cung cấp --'}</option>
              <option value="Male">{isEn ? 'Male' : 'Nam'}</option>
              <option value="Female">{isEn ? 'Female' : 'Nữ'}</option>
              <option value="Other">{isEn ? 'Other' : 'Khác'}</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>{isEn ? 'Residential Address' : 'Địa chỉ liên lạc'}</label>
            <input
              className={inputClass}
              name="address"
              maxLength={255}
              placeholder={isEn ? 'House number, street, ward, city...' : 'Số nhà, tên đường, phường/xã, quận/huyện...'}
              value={form.address || ''}
              onChange={handleFormChange}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => setModal(null)}
            className="px-4 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 text-xs font-bold hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 transition-colors"
          >
            {isEn ? 'Cancel' : 'Hủy bỏ'}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-sage-700 hover:bg-brand-sage-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand-sage-700/30 transition-all disabled:opacity-50"
          >
            {busy ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isEn ? 'Saving...' : 'Đang lưu...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>{modal?.row ? (isEn ? 'Save Changes' : 'Lưu thay đổi') : isEn ? 'Create Member' : 'Tạo thành viên'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
