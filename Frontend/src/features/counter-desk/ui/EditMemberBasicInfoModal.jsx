import React, { useEffect, useState } from 'react';
import { memberApi } from '../../../entities/member/index.js';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';

const PHONE_PATTERN = /^\+?[0-9]{8,15}$/;

const inputClass = (hasError) => `w-full min-h-[40px] px-3 py-2 text-sm rounded-lg border bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 ${
  hasError ? 'border-brand-danger-400 focus:ring-brand-danger-500/30' : 'border-brand-navy-300 dark:border-brand-navy-700 focus:ring-brand-sage-500'
}`;
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1';

const toForm = (member) => ({
  fullName: member?.fullName || '',
  dateOfBirth: member?.dateOfBirth ? String(member.dateOfBirth).slice(0, 10) : '',
  gender: member?.gender || '',
  emergencyContactName: member?.emergencyContactName || '',
  emergencyContactPhone: member?.emergencyContactPhone || ''
});

function validate(form, isEn) {
  const t = (en, vi) => (isEn ? en : vi);
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = t('Please enter the full name.', 'Vui lòng nhập họ và tên.');
  if (form.dateOfBirth && form.dateOfBirth > new Date().toISOString().slice(0, 10))
    errors.dateOfBirth = t('Date of birth cannot be in the future.', 'Ngày sinh không được ở tương lai.');
  const phone = form.emergencyContactPhone.replace(/[\s.\-()]/g, '');
  if (phone && !PHONE_PATTERN.test(phone))
    errors.emergencyContactPhone = t('Phone must have 8-15 digits.', 'Số điện thoại cần có 8-15 chữ số.');
  return errors;
}

/**
 * Counter correction of typos after a member was created. Login phone/email, address and account
 * status are intentionally not editable here (Manager-only).
 */
export function EditMemberBasicInfoModal({ isOpen, onClose, member, onSaved, isEn = false }) {
  const { showSuccess } = useToast();
  const [form, setForm] = useState(toForm(member));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(toForm(member));
    setErrors({});
    setFormError('');
  }, [isOpen, member?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fieldProps = (key) => ({
    id: `edit-member-${key}`,
    name: key,
    value: form[key],
    onChange: (event) => {
      const value = event.target.value;
      setForm(prev => ({ ...prev, [key]: value }));
      setErrors(prev => (prev[key] ? { ...prev, [key]: undefined } : prev));
    },
    disabled: saving,
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `edit-member-${key}-error` : undefined,
    className: inputClass(Boolean(errors[key]))
  });

  const field = (key, label, input) => (
    <div>
      <label htmlFor={`edit-member-${key}`} className={labelClass}>{label}</label>
      {input}
      {errors[key] && <p id={`edit-member-${key}-error`} className="text-[11px] font-medium text-brand-danger-600 dark:text-brand-danger-400 mt-1">{errors[key]}</p>}
    </div>
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form, isEn);
    setErrors(nextErrors);
    setFormError('');
    const firstInvalid = ['fullName', 'dateOfBirth', 'emergencyContactPhone'].find(key => nextErrors[key]);
    if (firstInvalid) {
      document.getElementById(`edit-member-${firstInvalid}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const updated = await memberApi.updateBasicInfo(member.id, {
        fullName: form.fullName.trim(),
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        emergencyContactName: form.emergencyContactName.trim() || null,
        emergencyContactPhone: form.emergencyContactPhone.replace(/[\s.\-()]/g, '') || null
      });
      showSuccess(isEn ? 'Member details updated.' : 'Đã cập nhật thông tin hội viên.');
      onSaved?.(updated);
      onClose();
    } catch (error) {
      setFormError(error?.message || (isEn ? 'Unable to update the member.' : 'Không thể cập nhật thông tin hội viên.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { if (!saving) onClose(); }} title={isEn ? 'Edit Member Details' : 'Sửa Thông Tin Hội Viên'}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <p className="text-xs text-brand-navy-600 dark:text-brand-navy-300">
          {isEn
            ? 'Login phone and email cannot be changed at the counter; ask a Manager if they are wrong.'
            : 'SĐT và email đăng nhập không sửa tại quầy; nếu sai, hãy báo Manager.'}
        </p>
        {formError && (
          <div role="alert" className="p-3 bg-brand-danger-50 dark:bg-brand-danger-950/30 border border-brand-danger-200 dark:border-brand-danger-800 text-brand-danger-700 dark:text-brand-danger-300 text-xs rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
            <span>{formError}</span>
          </div>
        )}

        {field('fullName', isEn ? 'Full name *' : 'Họ và tên *',
          <input type="text" autoComplete="name" maxLength={150} {...fieldProps('fullName')} />)}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field('gender', isEn ? 'Gender' : 'Giới tính',
            <select {...fieldProps('gender')}>
              <option value="">{isEn ? '— Not specified —' : '— Không chọn —'}</option>
              <option value="Male">{isEn ? 'Male' : 'Nam'}</option>
              <option value="Female">{isEn ? 'Female' : 'Nữ'}</option>
              <option value="Other">{isEn ? 'Other' : 'Khác'}</option>
            </select>)}
          {field('dateOfBirth', isEn ? 'Date of birth' : 'Ngày sinh',
            <input type="date" max={new Date().toISOString().slice(0, 10)} {...fieldProps('dateOfBirth')} />)}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field('emergencyContactName', isEn ? 'Emergency contact' : 'Người liên hệ khẩn cấp',
            <input type="text" maxLength={150} {...fieldProps('emergencyContactName')} />)}
          {field('emergencyContactPhone', isEn ? 'Emergency phone' : 'SĐT khẩn cấp',
            <input type="tel" inputMode="tel" maxLength={20} {...fieldProps('emergencyContactPhone')} />)}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-[40px] px-4 py-2 text-xs font-bold uppercase tracking-wider text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {isEn ? 'CANCEL' : 'HỦY'}
          </button>
          <button
            type="submit"
            disabled={saving}
            aria-busy={saving}
            className="min-h-[40px] px-5 py-2 bg-brand-sage-700 hover:bg-brand-sage-900 disabled:opacity-60 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[16px]${saving ? ' animate-spin' : ''}`} aria-hidden="true">{saving ? 'progress_activity' : 'save'}</span>
            <span>{saving ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save changes' : 'Lưu thay đổi')}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
