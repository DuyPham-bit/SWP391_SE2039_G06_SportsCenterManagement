import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/StatCard.js';
import { PasswordInput } from './PasswordInput.js';
import { isAsciiPassword, PASSWORD_CHARACTER_ERROR } from '../../services/passwordPolicy.js';

const { useState } = React;

export function ProfileModal({ isOpen, onClose }) {
  const { currentUser, updateProfile, changePassword } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'

  // Profile Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showError('Họ và tên không được để trống!');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      showSuccess('Cập nhật hồ sơ cá nhân thành công!');
    } catch (err) {
      showError(err.message || 'Cập nhật thất bại!');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showError('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }
    if (![currentPassword, newPassword, confirmPassword].every(isAsciiPassword)) {
      showError(PASSWORD_CHARACTER_ERROR);
      return;
    }
    if (newPassword.length < 6) {
      showError('Mật khẩu mới phải có tối thiểu 6 ký tự!');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Mật khẩu xác nhận không khớp!');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      showSuccess('Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('profile');
    } catch (err) {
      showError(err.message || 'Đổi mật khẩu thất bại!');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hồ Sơ & Bảo Mật Tài Khoản">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'profile'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Thông Tin Cá Nhân
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'password'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Đổi Mật Khẩu
        </button>
      </div>

      {activeTab === 'profile' ? (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-red-600 shadow"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-chivo text-base font-bold text-slate-900">{currentUser?.fullName}</span>
                <Badge variant={currentUser?.role}>{currentUser?.role}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{currentUser?.email}</p>
              {currentUser?.memberCode && (
                <p className="text-[11px] font-semibold text-red-600 mt-1">Mã thẻ: {currentUser.memberCode}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Email đăng nhập (Cố định)
            </label>
            <input
              type="email"
              disabled
              value={currentUser?.email || ''}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Họ và tên *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0912 345 678"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          {currentUser?.packageName && (
            <div className="p-3 rounded-lg bg-red-50/60 border border-red-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800">Gói tập hiện tại: </span>
                <span className="text-red-700 font-semibold">{currentUser.packageName}</span>
              </div>
              <Badge variant={currentUser.packageStatus}>{currentUser.packageStatus}</Badge>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors"
            >
              {savingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-800 text-xs flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">shield</span>
            <span>Mật khẩu phải dài tối thiểu 6 ký tự (gồm chữ hoa, thường, số và ký tự đặc biệt) để tương thích với chính sách bảo mật của backend.</span>
          </div>

          <div>
            <label htmlFor="profile-current-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Mật khẩu hiện tại *
            </label>
            <PasswordInput
              id="profile-current-password"
              autoComplete="current-password"
              required
              placeholder="Nhập mật khẩu đang dùng (Mặc định: password123)"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div>
            <label htmlFor="profile-new-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Mật khẩu mới *
            </label>
            <PasswordInput
              id="profile-new-password"
              autoComplete="new-password"
              required
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div>
            <label htmlFor="profile-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Xác nhận mật khẩu mới *
            </label>
            <PasswordInput
              id="profile-confirm-password"
              autoComplete="new-password"
              required
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors"
            >
              {savingPassword ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
