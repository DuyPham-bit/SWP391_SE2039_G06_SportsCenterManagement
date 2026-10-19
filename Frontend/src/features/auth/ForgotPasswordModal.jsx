import { authApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { PasswordInput } from './PasswordInput.js';
import { isAsciiPassword, PASSWORD_CHARACTER_ERROR } from '../../services/passwordPolicy.js';

const { useState, useEffect, useRef } = React;

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
  const [developmentOtp, setDevelopmentOtp] = useState(null);
  const pendingRequest = useRef(null);

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
    setLoading(true);
    try {
      const result = await authApi.requestPasswordReset(requestedEmail, { signal: controller.signal });
      if (!isCurrent()) return;
      setEmail(requestedEmail);
      setDevelopmentOtp(result.developmentOtp || null);
      setStep(2);
      showInfo(result.developmentOtp
        ? `Mã OTP môi trường Development: ${result.developmentOtp}`
        : result.message || 'Nếu email tồn tại, mã xác thực đã được gửi đến địa chỉ đăng ký.');
    } catch (err) {
      if (isCurrent()) showError(err.message || 'Không thể yêu cầu mã xác thực.');
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
    setLoading(true);
    try {
      await authApi.resetPassword(requestedEmail, otp.trim(), newPassword, { signal: controller.signal });
      if (!isCurrent()) return;
      showSuccess('Khôi phục mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
      handleClose();
      if (onResetSuccess) onResetSuccess(requestedEmail);
    } catch (err) {
      if (isCurrent()) showError(err.message || 'Khôi phục mật khẩu thất bại!');
    } finally {
      if (isCurrent()) {
        pendingRequest.current = null;
        setLoading(false);
      }
    }
  };

  return (
    <Modal isOpen={true} onClose={handleClose} title="Khôi Phục Mật Khẩu">
      {step === 1 ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            Nhập email đã đăng ký tại hệ thống SCMS. Chúng tôi sẽ gửi mã xác thực gồm 6 chữ số để bạn đặt lại mật khẩu mới an toàn.
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Email đăng ký *
            </label>
            <input
              type="email"
              required
              disabled={loading}
              placeholder="vidu@scms.vn"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600"
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
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
            {developmentOtp
              ? <>Mã OTP môi trường Development: <strong>{developmentOtp}</strong></>
              : <>Nếu email tồn tại, mã OTP đã được gửi đến <strong>{email}</strong>.</>}
            {' '}Vui lòng nhập mã để xác nhận.
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Mã xác thực OTP (6 chữ số) *
            </label>
            <input
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              disabled={loading}
              placeholder="Nhập mã OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full px-3.5 py-2.5 text-center font-dm-sans text-lg tracking-widest rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-white"
            />
          </div>

          <div>
            <label htmlFor="reset-new-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
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
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-white"
            />
          </div>

          <div>
            <label htmlFor="reset-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
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
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-white"
            />
          </div>

          <div className="flex justify-between items-center pt-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setStep(1);
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
                setDevelopmentOtp(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Quay lại bước trước
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-[var(--custom-btn-bg-color)] hover:bg-[var(--custom-btn-bg-hover-color)] text-[var(--secondary-color)] hover:text-white shadow-md transition-colors"
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
