import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Badge } from '../../components/common/StatCard.js';
import { PasswordInput } from './PasswordInput.js';
import { GoogleLoginModal } from './GoogleLoginModal.jsx';
import { isAsciiPassword, PASSWORD_CHARACTER_ERROR } from '../../services/passwordPolicy.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { translatePackageName } from '../../services/i18nHelper.js';
import { processAvatarFile, getInitials } from '../../services/avatarHelper.js';
import { deleteUploadedAvatar, uploadAvatar } from '../../services/r2ImageStorage.js';

export function ProfileModal({ isOpen, onClose }) {
  const { currentUser, updateProfile, changePassword } = useAuth();
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'
  const [googleOpen, setGoogleOpen] = useState(false);

  // Profile Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar Management State
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [savingAvatarOnly, setSavingAvatarOnly] = useState(false);
  const fileInputRef = useRef(null);

  // Synchronize state when modal opens or currentUser updates
  useEffect(() => {
    if (isOpen && currentUser) {
      setFullName(currentUser.fullName || '');
      setPhone(currentUser.phone || '');
      setAvatarPreview(currentUser.avatar || '');
      setAvatarFile(null);
      setAvatarChanged(false);
    }
  }, [isOpen, currentUser]);

  const userInitials = useMemo(() => {
    return getInitials(fullName || currentUser?.fullName || currentUser?.username || 'U');
  }, [fullName, currentUser?.fullName, currentUser?.username]);

  // Xử lý tệp hình ảnh được chọn từ máy tính hoặc chụp từ camera điện thoại
  const handleProcessImage = async (file) => {
    if (!file) return;
    setIsProcessingAvatar(true);
    try {
      const result = await processAvatarFile(file, 360, 0.88);
      setAvatarPreview(result.dataUrl);
      setAvatarFile(result.file);
      setAvatarChanged(true);
      showSuccess(
        isEn
          ? `Photo selected (${result.sizeKb} KB). Click "Save Photo" or "Save Changes" to apply.`
          : `Đã tải ảnh lên (${result.sizeKb} KB). Nhấn "Lưu ảnh" hoặc "Lưu Thay Đổi" để áp dụng.`
      );
    } catch (err) {
      showError(err.message || (isEn ? 'Failed to process image!' : 'Không thể xử lý hình ảnh!'));
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    setAvatarFile(null);
    setAvatarChanged(true);
    showSuccess(
      isEn
        ? 'Avatar removed. Click "Save Changes" or "Save Photo" to apply.'
        : 'Đã gỡ ảnh đại diện. Nhấn "Lưu Thay Đổi" để áp dụng.'
    );
  };

  const handleRevertAvatar = () => {
    setAvatarPreview(currentUser?.avatar || '');
    setAvatarFile(null);
    setAvatarChanged(false);
  };

  const handleQuickSaveAvatar = async () => {
    if (!avatarChanged) return;
    setSavingAvatarOnly(true);
    let uploadedAvatar = null;
    try {
      if (avatarFile) uploadedAvatar = await uploadAvatar(avatarFile);
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarKey: uploadedAvatar?.key || (avatarChanged ? null : currentUser?.avatarKey || null)
      });
      setAvatarFile(null);
      setAvatarChanged(false);
      showSuccess(isEn ? 'Avatar updated successfully!' : 'Đã cập nhật ảnh đại diện thành công!');
    } catch (err) {
      if (uploadedAvatar?.key) {
        try { await deleteUploadedAvatar(uploadedAvatar.key); } catch { /* Preserve the profile error. */ }
      }
      showError(err.message || (isEn ? 'Failed to update avatar!' : 'Cập nhật ảnh đại diện thất bại!'));
    } finally {
      setSavingAvatarOnly(false);
    }
  };

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showError(isEn ? 'Full name cannot be empty!' : 'Họ và tên không được để trống!');
      return;
    }
    setSavingProfile(true);
    let uploadedAvatar = null;
    try {
      if (avatarFile) uploadedAvatar = await uploadAvatar(avatarFile);
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarKey: uploadedAvatar?.key || (avatarChanged ? null : currentUser?.avatarKey || null)
      });
      setAvatarFile(null);
      setAvatarChanged(false);
      showSuccess(isEn ? 'Profile updated successfully!' : 'Cập nhật hồ sơ cá nhân thành công!');
    } catch (err) {
      if (uploadedAvatar?.key) {
        try { await deleteUploadedAvatar(uploadedAvatar.key); } catch { /* Preserve the profile error. */ }
      }
      showError(err.message || (isEn ? 'Profile update failed!' : 'Cập nhật thất bại!'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showError(isEn ? 'Please enter your current password!' : 'Vui lòng nhập mật khẩu hiện tại!');
      return;
    }
    if (![currentPassword, newPassword, confirmPassword].every(isAsciiPassword)) {
      showError(PASSWORD_CHARACTER_ERROR);
      return;
    }
    if (newPassword.length < 6) {
      showError(isEn ? 'New password must be at least 6 characters!' : 'Mật khẩu mới phải có tối thiểu 6 ký tự!');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError(isEn ? 'Password confirmation does not match!' : 'Mật khẩu xác nhận không khớp!');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      showSuccess(isEn ? 'Password changed successfully! New credentials are now active.' : 'Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('profile');
    } catch (err) {
      showError(err.message || (isEn ? 'Failed to change password!' : 'Đổi mật khẩu thất bại!'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEn ? "Profile & Account Security" : "Hồ Sơ & Bảo Mật Tài Khoản"}
    >
      {/* Tabs */}
      <button
        type="button"
        onClick={() => setGoogleOpen(true)}
        className="mb-4 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px] text-red-500">link</span>
        <span>{isEn ? 'Link Google Account' : 'Liên kết Google'}</span>
      </button>

      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-[#81B29A] text-[#2D6A4F]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {isEn ? 'Personal Profile' : 'Thông Tin Cá Nhân'}
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'password'
              ? 'border-[#81B29A] text-[#2D6A4F]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {isEn ? 'Change Password' : 'Đổi Mật Khẩu'}
        </button>
      </div>

      {activeTab === 'profile' ? (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {/* Avatar & Device Upload Section */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDraggingAvatar(true); }}
            onDragLeave={() => setIsDraggingAvatar(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingAvatar(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleProcessImage(file);
            }}
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              isDraggingAvatar
                ? 'bg-[#81B29A]/15 border-[#81B29A] ring-2 ring-[#81B29A]/40'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
            }`}
          >
            {/* Hidden native file input - accept="image/*" gives Phone camera/gallery and PC file picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessImage(file);
                e.target.value = '';
              }}
            />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
              {/* Avatar Squircle with Camera Overlay & Floating Badge */}
              <div className="relative group shrink-0">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden cursor-pointer relative shadow-md ring-2 ring-[#81B29A]/50 transition-all group-hover:scale-105 select-none bg-slate-200 dark:bg-slate-700"
                  title={isEn ? "Click to change avatar from phone or computer" : "Nhấp để tải ảnh đại diện từ điện thoại hoặc máy tính"}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#81B29A] via-[#A8DADC] to-[#F2CC8F] text-white font-black text-xl flex items-center justify-center">
                      <span>{userInitials}</span>
                    </div>
                  )}

                  {/* Hover Camera Overlay */}
                  <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                      {isEn ? 'Change' : 'Đổi ảnh'}
                    </span>
                  </div>

                  {/* Processing Spinner during image compression */}
                  {isProcessingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[24px] animate-spin">progress_activity</span>
                    </div>
                  )}
                </div>

                {/* Floating Camera Button Badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1E2235] hover:bg-[#2B2D42] text-[#F2CC8F] hover:text-white border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
                  title={isEn ? 'Upload photo from phone or computer' : 'Tải ảnh từ điện thoại hoặc máy tính'}
                >
                  <span className="material-symbols-outlined text-[15px]">add_a_photo</span>
                </button>
              </div>

              {/* User Info & Avatar Controls */}
              <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="font-chivo text-base font-bold text-slate-900 dark:text-slate-100">
                      {currentUser?.fullName}
                    </span>
                    <Badge variant={currentUser?.role}>{currentUser?.role}</Badge>
                    {avatarChanged && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                        {isEn ? 'Unsaved Photo' : 'Ảnh chưa lưu'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentUser?.email}</p>
                  {currentUser?.memberCode && (
                    <p className="text-[11px] font-semibold text-[#2D6A4F] dark:text-[#81B29A] mt-0.5">
                      {isEn ? `Member Code: ${currentUser.memberCode}` : `Mã thẻ: ${currentUser.memberCode}`}
                    </p>
                  )}
                </div>

                {/* Action Buttons for Avatar */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingAvatar}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#2D6A4F] dark:text-[#81B29A]">upload_file</span>
                    <span>{isEn ? 'Choose Photo / Camera' : 'Tải ảnh từ máy / Chụp ảnh'}</span>
                  </button>

                  {avatarChanged && (
                    <button
                      type="button"
                      onClick={handleQuickSaveAvatar}
                      disabled={savingAvatarOnly}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#2D6A4F] hover:bg-[#1B4332] text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>{savingAvatarOnly ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save Photo' : 'Lưu ảnh')}</span>
                    </button>
                  )}

                  {avatarChanged && (
                    <button
                      type="button"
                      onClick={handleRevertAvatar}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title={isEn ? 'Revert change' : 'Hoàn tác'}
                    >
                      {isEn ? 'Revert' : 'Hoàn tác'}
                    </button>
                  )}

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                      <span>{isEn ? 'Remove' : 'Gỡ ảnh'}</span>
                    </button>
                  )}
                </div>

                {/* Helper Tips */}
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
                  {isEn
                    ? '📱 Mobile: Take a photo or pick from photo library • 💻 PC: Select JPG, PNG, WEBP. Auto-cropped & optimized.'
                    : '📱 Điện thoại: Chụp ảnh trực tiếp hoặc chọn từ Album • 💻 Máy tính: Chọn tệp ảnh JPG, PNG, WEBP. Tự động cắt tròn chuẩn nét.'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {isEn ? 'Login Email (Fixed)' : 'Email đăng nhập (Cố định)'}
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
              {isEn ? 'Full Name *' : 'Họ và tên *'}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {isEn ? 'Phone Number' : 'Số điện thoại'}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0912 345 678"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-white"
            />
          </div>

          {currentUser?.role === 'MEMBER' && currentUser?.packageName && (
            <div className="p-3 rounded-lg bg-[#81B29A]/10 border border-[#81B29A]/30 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800">
                  {isEn ? 'Current Package: ' : 'Gói tập hiện tại: '}
                </span>
                <span className="text-[#2D6A4F] font-semibold">{translatePackageName(currentUser.packageName, isEn)}</span>
              </div>
              <Badge variant={currentUser.packageStatus}>{currentUser.packageStatus}</Badge>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
            >
              {isEn ? 'Close' : 'Đóng'}
            </button>
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-[#1E2235] hover:bg-[#2B2D42] text-[#F2CC8F] hover:text-white shadow-md transition-colors cursor-pointer"
            >
              {savingProfile ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save Changes' : 'Lưu Thay Đổi')}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-800 text-xs flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">shield</span>
            <span>
              {isEn
                ? 'Password must be at least 6 characters (including letters, numbers, and special characters) to comply with system security policy.'
                : 'Mật khẩu phải dài tối thiểu 6 ký tự (gồm chữ hoa, thường, số và ký tự đặc biệt) theo đúng chính sách bảo mật của hệ thống.'}
            </span>
          </div>

          <div>
            <label htmlFor="profile-current-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {isEn ? 'Current Password *' : 'Mật khẩu hiện tại *'}
            </label>
            <PasswordInput
              id="profile-current-password"
              autoComplete="current-password"
              required
              placeholder={isEn ? "Enter current password (Default: password123)" : "Nhập mật khẩu đang dùng (Mặc định: password123)"}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-white"
            />
          </div>

          <div>
            <label htmlFor="profile-new-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {isEn ? 'New Password *' : 'Mật khẩu mới *'}
            </label>
            <PasswordInput
              id="profile-new-password"
              autoComplete="new-password"
              required
              placeholder={isEn ? "At least 6 characters" : "Tối thiểu 6 ký tự"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-white"
            />
          </div>

          <div>
            <label htmlFor="profile-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {isEn ? 'Confirm New Password *' : 'Xác nhận mật khẩu mới *'}
            </label>
            <PasswordInput
              id="profile-confirm-password"
              autoComplete="new-password"
              required
              placeholder={isEn ? "Re-enter new password" : "Nhập lại mật khẩu mới"}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-[#1E2235] hover:bg-[#2B2D42] text-[#F2CC8F] hover:text-white shadow-md transition-colors cursor-pointer"
            >
              {savingPassword ? (isEn ? 'Updating...' : 'Đang cập nhật...') : (isEn ? 'Change Password' : 'Đổi Mật Khẩu')}
            </button>
          </div>
        </form>
      )}
      <GoogleLoginModal isOpen={googleOpen && isOpen} onClose={() => setGoogleOpen(false)} linkAccount />
    </Modal>
  );
}
