import React, { useEffect, useState } from 'react';
import { receptionApi } from '../../../entities/member/index.js';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { startResendCooldown } from './ResendVerificationButton.jsx';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_FORM = { fullName: '', phoneNumber: '', email: '', gender: '', dateOfBirth: '', address: '' };

/** Same rule as the backend: Vietnamese mobile, 10 digits, +84 accepted. */
export function normalizeVietnamesePhone(value) {
  let phone = String(value || '').replace(/[\s.\-()]/g, '');
  if (phone.startsWith('+84')) phone = `0${phone.slice(3)}`;
  else if (phone.startsWith('84') && phone.length === 11) phone = `0${phone.slice(2)}`;
  return /^0[35789][0-9]{8}$/.test(phone) ? phone : null;
}

function validate(form) {
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên.';
  if (!form.phoneNumber.trim()) errors.phoneNumber = 'Vui lòng nhập số điện thoại.';
  else if (!normalizeVietnamesePhone(form.phoneNumber)) errors.phoneNumber = 'Số di động Việt Nam gồm 10 chữ số, ví dụ 0912345678.';
  if (!form.email.trim()) errors.email = 'Vui lòng nhập email.';
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Email không đúng định dạng.';
  if (form.dateOfBirth && form.dateOfBirth > new Date().toISOString().slice(0, 10)) errors.dateOfBirth = 'Ngày sinh không được ở tương lai.';
  return errors;
}

// Matches the existing counter modal field styling in MemberLookup.
const inputClass = (hasError) => `w-full min-h-[40px] px-3 py-2 text-sm rounded-lg border bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 ${
  hasError ? 'border-brand-danger-400 focus:ring-brand-danger-500/30' : 'border-brand-navy-300 dark:border-brand-navy-700 focus:ring-brand-sage-500'
}`;
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1';

function Field({ id, label, required, error, children }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}{required && <span className="text-brand-terra-700 dark:text-brand-terra-400 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && <p id={`${id}-error`} className="text-[11px] font-medium text-brand-danger-600 dark:text-brand-danger-400 mt-1">{error}</p>}
    </div>
  );
}

/**
 * Counter quick-create. The backend sets the phone number as the initial password (must change)
 * and emails the member a 24h verify + set-password link.
 */
export function QuickCreateMemberModal({ isOpen, onClose, initialValues, onCreated, isEn = false }) {
  const { showSuccess, showWarning } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({ ...EMPTY_FORM, ...initialValues });
    setErrors({});
    setFormError('');
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (key) => (event) => {
    const value = event.target.value;
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const fieldProps = (key) => ({
    id: `quick-member-${key}`,
    name: key,
    value: form[key],
    onChange: update(key),
    disabled: saving,
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `quick-member-${key}-error` : undefined,
    className: inputClass(Boolean(errors[key]))
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setFormError('');
    const firstInvalid = ['fullName', 'phoneNumber', 'email', 'dateOfBirth'].find(key => nextErrors[key]);
    if (firstInvalid) {
      document.getElementById(`quick-member-${firstInvalid}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const result = await receptionApi.quickCreateMember({
        ...form,
        phoneNumber: normalizeVietnamesePhone(form.phoneNumber)
      });
      if (result.emailSent) {
        startResendCooldown(result.member.id, result.resendCooldownSeconds);
        showSuccess(`${result.message} Mã hội viên: ${result.member.memberCode}`);
      } else {
        showWarning(result.message);
      }
      onCreated?.(result.member, result);
      onClose();
    } catch (error) {
      const message = error?.message || 'Không thể tạo tài khoản hội viên.';
      // Route duplicate messages to the matching field so the receptionist sees where to fix.
      if (error?.status === 409 && /điện thoại/i.test(message)) setErrors({ phoneNumber: message });
      else if (error?.status === 409 && /email/i.test(message)) setErrors({ email: message });
      else setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!saving) onClose(); }}
      title={isEn ? 'Quick Create Member at Counter' : 'Tạo Nhanh Hội Viên Tại Quầy'}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="p-3 rounded-xl bg-brand-sand-50 dark:bg-brand-navy-800/60 border-l-4 border-brand-sand-600 text-xs text-brand-navy-700 dark:text-brand-navy-200 flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] text-brand-sand-700 dark:text-brand-sand-300" aria-hidden="true">info</span>
          <span>
            Mật khẩu mặc định ban đầu của hội viên sẽ được đặt tự động bằng <strong>Số điện thoại</strong>.
            Hệ thống gửi email để hội viên xác nhận và đổi mật khẩu mới.
          </span>
        </div>

        {formError && (
          <div role="alert" className="p-3 bg-brand-danger-50 dark:bg-brand-danger-950/30 border border-brand-danger-200 dark:border-brand-danger-800 text-brand-danger-700 dark:text-brand-danger-300 text-xs rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
            <span>{formError}</span>
          </div>
        )}

        <Field id="quick-member-fullName" label="Họ và tên" required error={errors.fullName}>
          <input type="text" autoComplete="name" placeholder="Nguyễn Văn A" maxLength={150} {...fieldProps('fullName')} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field id="quick-member-phoneNumber" label="Số điện thoại" required error={errors.phoneNumber}>
            <input type="tel" inputMode="tel" autoComplete="tel" placeholder="0912345678" maxLength={20} {...fieldProps('phoneNumber')} />
          </Field>
          <Field id="quick-member-email" label="Email" required error={errors.email}>
            <input type="email" inputMode="email" autoComplete="email" placeholder="hoivien@example.com" maxLength={150} {...fieldProps('email')} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field id="quick-member-gender" label="Giới tính (tùy chọn)" error={errors.gender}>
            <select {...fieldProps('gender')}>
              <option value="">— Không chọn —</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
              <option value="Other">Khác</option>
            </select>
          </Field>
          <Field id="quick-member-dateOfBirth" label="Ngày sinh (tùy chọn)" error={errors.dateOfBirth}>
            <input type="date" max={new Date().toISOString().slice(0, 10)} {...fieldProps('dateOfBirth')} />
          </Field>
        </div>

        <Field id="quick-member-address" label="Địa chỉ (tùy chọn)" error={errors.address}>
          <input type="text" autoComplete="street-address" maxLength={255} {...fieldProps('address')} />
        </Field>

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
            {saving ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin" aria-hidden="true">progress_activity</span>
                <span>Đang tạo & gửi mail...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">mark_email_unread</span>
                <span>Tạo tài khoản & Gửi mail xác nhận</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
