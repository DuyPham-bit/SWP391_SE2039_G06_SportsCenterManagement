import { authApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { PasswordInput } from './PasswordInput.js';
import { isAsciiPassword, PASSWORD_CHARACTER_ERROR } from '../../services/passwordPolicy.js';

const { useState } = React;

export function ForgotPasswordModal({ isOpen, onClose, onResetSuccess }) {
  const { showSuccess, showError, showInfo } = useToast();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [developmentOtp, setDevelopmentOtp] = useState(null);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showError('Vui lòng nhập email đăng ký tài khoản!');
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.requestPasswordReset(email);
      setDevelopmentOtp(result.developmentOtp || null);
      setLoading(false);
      setStep(2);
      showInfo(result.developmentOtp
        ? `Mã OTP môi trường Development: ${result.developmentOtp}`
        : 'Nếu email tồn tại, mã xác thực đã được gửi đến địa chỉ đăng ký.');
    } catch (err) {
      showError(err.message || 'Không thể yêu cầu mã xác thực.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      showError('Vui lòng nhập mã OTP!');
      return;
    }
    if (!isAsciiPassword(newPassword) || !isAsciiPassword(confirmPassword)) {
      showError(PASSWORD_CHARACTER_ERROR);
      return;
    }
    if (newPassword.length < 6) {
      showError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Xác nhận mật khẩu mới không khớp!');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(email, otp.trim(), newPassword);
      showSuccess('Khôi phục mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
      onClose();
      if (onResetSuccess) onResetSuccess(email);
      // Reset state
      setStep(1);
      setEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setDevelopmentOtp(null);
    } catch (err) {
      showError(err.message || 'Khôi phục mật khẩu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Khôi Phục Mật Khẩu">
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
              placeholder="vidu@scms.vn"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors"
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
              placeholder="Nhập mã OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full px-3.5 py-2.5 text-center font-chivo text-lg tracking-widest rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
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
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
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
              placeholder="Khớp với mật khẩu mới ở trên"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div className="flex justify-between items-center pt-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Quay lại bước trước
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors"
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
