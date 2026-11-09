import React, { useState } from 'react';
import { AuthField } from './AuthField.jsx';
import { PASSWORD_RULES, getPasswordPolicyError } from '../../../shared/lib/passwordPolicy.js';

/**
 * New password + confirmation with a live rule checklist.
 * Used by the email activation page and the forced first-login password page.
 * `requireCurrent` adds a "current password" field (the default phone password).
 */
export function SetPasswordForm({
  idPrefix,
  email,
  phone,
  requireCurrent = false,
  currentLabel = 'Mật khẩu hiện tại',
  currentHint,
  submitLabel,
  submittingLabel = 'Đang lưu...',
  onSubmit
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (requireCurrent && !currentPassword) next.current = 'Vui lòng nhập mật khẩu hiện tại.';
    const policyError = getPasswordPolicyError(newPassword, { email, phone });
    if (!newPassword) next.password = 'Vui lòng nhập mật khẩu mới.';
    else if (policyError) next.password = policyError;
    else if (requireCurrent && newPassword === currentPassword) next.password = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
    if (!confirmPassword) next.confirm = 'Vui lòng nhập lại mật khẩu mới.';
    else if (confirmPassword !== newPassword) next.confirm = 'Mật khẩu xác nhận không khớp.';
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) {
      const firstKey = ['current', 'password', 'confirm'].find(key => next[key]);
      document.getElementById(`${idPrefix}-${firstKey}`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ currentPassword, newPassword, confirmPassword });
    } catch (error) {
      setFormError(error?.message || 'Không thể lưu mật khẩu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = key => setErrors(prev => (prev[key] ? { ...prev, [key]: undefined } : prev));

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && (
        <div role="alert" className="p-3 bg-brand-danger-50 dark:bg-brand-danger-950/30 border border-brand-danger-200 dark:border-brand-danger-800 text-brand-danger-700 dark:text-brand-danger-300 text-xs rounded-xl flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
          <span>{formError}</span>
        </div>
      )}

      {requireCurrent && (
        <AuthField
          id={`${idPrefix}-current`}
          label={currentLabel}
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={e => { setCurrentPassword(e.target.value); clearError('current'); }}
          error={errors.current}
          hint={currentHint}
          disabled={submitting}
        />
      )}

      <AuthField
        id={`${idPrefix}-password`}
        label="Mật khẩu mới"
        type="password"
        required
        autoComplete="new-password"
        maxLength={128}
        value={newPassword}
        onChange={e => { setNewPassword(e.target.value); clearError('password'); }}
        error={errors.password}
        disabled={submitting}
      />

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5" aria-label="Yêu cầu mật khẩu">
        {PASSWORD_RULES.map(rule => {
          const passed = rule.test(newPassword);
          return (
            <li key={rule.id} className={`flex items-center gap-1.5 text-[12px] leading-4 ${passed ? 'text-brand-sage-700 dark:text-brand-sage-400' : 'text-brand-navy-500 dark:text-brand-navy-400'}`}>
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{passed ? 'check_circle' : 'radio_button_unchecked'}</span>
              <span>{rule.label}<span className="sr-only">{passed ? ' (đã đạt)' : ' (chưa đạt)'}</span></span>
            </li>
          );
        })}
      </ul>

      <AuthField
        id={`${idPrefix}-confirm`}
        label="Xác nhận mật khẩu mới"
        type="password"
        required
        autoComplete="new-password"
        maxLength={128}
        value={confirmPassword}
        onChange={e => { setConfirmPassword(e.target.value); clearError('confirm'); }}
        error={errors.confirm}
        disabled={submitting}
      />

      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        className="w-full min-h-[44px] px-5 py-3 bg-brand-navy-900 hover:bg-brand-navy-950 disabled:opacity-60 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-sand-600/40"
      >
        {submitting ? (
          <>
            <span className="material-symbols-outlined text-[16px] animate-spin" aria-hidden="true">progress_activity</span>
            <span>{submittingLabel}</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[16px] text-brand-sand-300" aria-hidden="true">lock_reset</span>
            <span>{submitLabel}</span>
          </>
        )}
      </button>
    </form>
  );
}
