import React, { useState, useEffect, useRef } from 'react';
import { authApi } from '../../../entities/session/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { PasswordInput } from './PasswordInput.jsx';
import { OtpCodeInput } from '../../../shared/ui/OtpCode.jsx';
import { isAsciiPassword, PASSWORD_CHARACTER_ERROR } from '../../../shared/lib/passwordPolicy.js';


export function ForgotPasswordModal({ isOpen, onClose, onResetSuccess }) {
  // Each opening owns its form and requests; closing must discard both.
  return isOpen ? <PasswordResetForm onClose={onClose} onResetSuccess={onResetSuccess} /> : null;
}

function PasswordResetForm({ onClose, onResetSuccess }) {
  const { showSuccess, showError, showInfo } = useToast();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [resetDone, setResetDone] = useState(false);
  const pendingRequest = useRef(null);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds(seconds => Math.max(0, seconds - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  useEffect(() => () => {
    pendingRequest.current?.abort();
    pendingRequest.current = null;
  }, []);

  const handleClose = () => {
    pendingRequest.current?.abort();
    pendingRequest.current = null;
    onClose();
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (pendingRequest.current) return;
    if (!email.trim()) {
      showError('Vui lòng nhập email đăng ký tài khoản!');
      return;
    }
    const controller = new AbortController();
    pendingRequest.current = controller;
    const isCurrent = () => pendingRequest.current === controller && !controller.signal.aborted;
    const requestedEmail = email.trim();
    setFormError('');
    setLoading(true);
    try {
      const result = await authApi.requestPasswordReset(requestedEmail, { signal: controller.signal });
      if (!isCurrent()) return;
      setEmail(requestedEmail);
      setOtp('');
      setResendSeconds(60);
      setStep(2);
      showInfo(result.message || 'Nếu email tồn tại, mã xác thực đã được gửi đến địa chỉ đăng ký.');
    } catch (err) {
      if (isCurrent()) setFormError(err.message || 'Không thể yêu cầu mã xác thực.');
    } finally {
      if (isCurrent()) {
        pendingRequest.current = null;
        setLoading(false);
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (pendingRequest.current) return;
    if (!/^[0-9]{6}$/.test(otp.trim())) {
      showError('Mã OTP phải gồm đúng 6 chữ số.');
      return;
    }
    if (!isAsciiPassword(newPassword) || !isAsciiPassword(confirmPassword)) {
      showError(PASSWORD_CHARACTER_ERROR);
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 128) {
      showError('Mật khẩu mới phải có từ 6 đến 128 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Xác nhận mật khẩu mới không khớp!');
      return;
    }

    const controller = new AbortController();
    pendingRequest.current = controller;
    const isCurrent = () => pendingRequest.current === controller && !controller.signal.aborted;
    const requestedEmail = email.trim();
    setFormError('');
    setLoading(true);
    try {
      await authApi.resetPassword(requestedEmail, otp.trim(), newPassword, { signal: controller.signal });
      if (!isCurrent()) return;
      setResetDone(true);
      await new Promise(resolve => setTimeout(resolve, 900));
      if (!isCurrent()) return;
      showSuccess('Khôi phục mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
      handleClose();
      if (onResetSuccess) onResetSuccess(requestedEmail);
    } catch (err) {
      if (isCurrent()) setFormError(err.message || 'Khôi phục mật khẩu thất bại!');
    } finally {
      if (isCurrent()) {
        pendingRequest.current = null;
        setLoading(false);
      }
    }
  };

  return (
    <Modal isOpen={true} onClose={handleClose} title="Khôi Phục Mật Khẩu">
      {formError && <p role="alert" className="mb-3 rounded-xl border border-brand-danger-200 bg-brand-danger-50 p-3 text-sm text-brand-danger-700">{formError}</p>}
      {step === 1 ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-brand-navy-50 border border-brand-navy-200 text-xs text-brand-navy-600 leading-relaxed">
            Nhập email đã đăng ký tại hệ thống SCMS. Chúng tôi sẽ gửi mã xác thực gồm 6 chữ số để bạn đặt lại mật khẩu mới an toàn.
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 mb-1">
              Email đăng ký *
            </label>
            <input
              type="email"
              required
              disabled={loading}
              placeholder="vidu@scms.vn"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border border-brand-navy-200 hover:bg-brand-navy-50 text-brand-navy-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-[var(--custom-btn-bg-color)] hover:bg-[var(--custom-btn-bg-hover-color)] text-[var(--secondary-color)] hover:text-white shadow-md transition-colors"
            >
              {loading ? 'Đang gửi mã...' : 'Nhận Mã Xác Thực'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="p-3 rounded-lg bg-brand-sage-50 text-brand-sage-800 border border-brand-sage-200 text-xs">
            Nếu email tồn tại, mã OTP đã được gửi đến <strong className="break-all">{email}</strong>.
            {' '}Kiểm tra cả thư rác. Mã có hạn 5 phút và chỉ dùng một lần.
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="reset-otp" className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700">
                Mã xác thực OTP (6 chữ số) *
              </label>
              <span className="text-[10px] text-brand-sand-700 font-semibold bg-brand-sand-100/80 px-2 py-0.5 rounded-full">
                Hạn 5 phút
              </span>
            </div>

            <div className="my-3">
              <OtpCodeInput
                id="reset-otp"
                value={otp}
                onChange={(next) => { setOtp(next); setFormError(''); }}
                status={resetDone ? 'success' : formError ? 'error' : loading ? 'verifying' : 'idle'}
              />
            </div>

            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-brand-navy-400 text-[11px]">Không chia sẻ mã với người khác</span>
              <button type="button" disabled={loading || resendSeconds > 0} onClick={handleRequestOtp} className="min-h-11 text-xs text-brand-navy-700 underline disabled:opacity-60">{resendSeconds > 0 ? `Gửi lại mã sau ${resendSeconds}s` : 'Gửi lại mã'}</button>
            </div>
          </div>

          <div>
            <label htmlFor="reset-new-password" className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 mb-1">
              Mật khẩu mới *
            </label>
            <PasswordInput
              id="reset-new-password"
              autoComplete="new-password"
              required
              minLength={6}
              maxLength={128}
              disabled={loading}
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white"
            />
          </div>

          <div>
            <label htmlFor="reset-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 mb-1">
              Nhập lại mật khẩu mới *
            </label>
            <PasswordInput
              id="reset-confirm-password"
              autoComplete="new-password"
              required
              maxLength={128}
              disabled={loading}
              placeholder="Khớp với mật khẩu mới ở trên"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center pt-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setStep(1);
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
                setFormError('');
              }}
              className="min-h-11 text-xs text-brand-navy-500 hover:text-brand-navy-800 underline"
            >
              Quay lại bước trước
            </button>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="min-h-11 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border border-brand-navy-200 hover:bg-brand-navy-50 text-brand-navy-600"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={loading}
                className="min-h-11 flex-1 px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-[var(--custom-btn-bg-color)] hover:bg-[var(--custom-btn-bg-hover-color)] text-[var(--secondary-color)] hover:text-white shadow-md transition-colors"
              >
                {loading ? 'Đang cập nhật...' : 'Xác Nhận Đổi Mật Khẩu'}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}
