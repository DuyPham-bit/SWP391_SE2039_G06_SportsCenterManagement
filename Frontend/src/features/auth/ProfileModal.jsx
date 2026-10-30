import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { authApi } from '../../services/api.js';
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

export function ProfileModal({ isOpen, onClose }) {
  const { currentUser, updateProfile, updateAvatar, changePassword } = useAuth();
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
    setAvatarChanged(true);
    showSuccess(
      isEn
        ? 'Avatar removed. Click "Save Changes" or "Save Photo" to apply.'
        : 'Đã gỡ ảnh đại diện. Nhấn "Lưu Thay Đổi" để áp dụng.'
    );
  };

  const handleRevertAvatar = () => {
    setAvatarPreview(currentUser?.avatar || '');
    setAvatarChanged(false);
  };

  const handleQuickSaveAvatar = async () => {
    if (!avatarChanged) return;
    setSavingAvatarOnly(true);
    try {
      if (updateAvatar) {
        await updateAvatar(avatarPreview || null);
      } else {
        await updateProfile({ fullName: fullName.trim(), phone: phone.trim(), avatar: avatarPreview || null });
      }
      setAvatarChanged(false);
      showSuccess(isEn ? 'Avatar updated successfully!' : 'Đã cập nhật ảnh đại diện thành công!');
    } catch (err) {
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

  // OTP Verification for Password Change
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isVerifiedOtp, setIsVerifiedOtp] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);

  // Reset OTP state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowOtpModal(false);
      setOtpCode('');
      setOtpError('');
      setIsVerifyingOtp(false);
      setIsVerifiedOtp(false);
      setShakeKey(0);
      setResendSeconds(0);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const interval = setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendSeconds]);

  // Auto focus OTP input when modal opens
  useEffect(() => {
    if (showOtpModal) {
      const focusOtp = () => document.getElementById('profile-change-pwd-otp')?.focus();
      focusOtp();
      const frame = requestAnimationFrame(focusOtp);
      const timer = setTimeout(focusOtp, 60);
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
      };
    }
  }, [showOtpModal]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showError(isEn ? 'Full name cannot be empty!' : 'Họ và tên không được để trống!');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatar: avatarChanged ? (avatarPreview || null) : currentUser?.avatar
      });
      setAvatarChanged(false);
      showSuccess(isEn ? 'Profile updated successfully!' : 'Cập nhật hồ sơ cá nhân thành công!');
    } catch (err) {
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
    if (newPassword === currentPassword) {
      showError(isEn ? 'New password must be different from current password!' : 'Mật khẩu mới không được trùng với mật khẩu hiện tại!');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError(isEn ? 'Password confirmation does not match!' : 'Mật khẩu xác nhận không khớp!');
      return;
    }
    if (!currentUser?.email) {
      showError(isEn ? 'Your account does not have an associated email for verification!' : 'Tài khoản chưa có email để gửi mã xác thực!');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.requestChangePasswordOtp(currentPassword, newPassword);
      setOtpCode('');
      setOtpError('');
      setResendSeconds(60);
      setShowOtpModal(true);
      showSuccess(
        isEn
          ? 'Verification code has been sent to your email. Please check your inbox.'
          : 'Mã xác thực đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư.'
      );
    } catch (err) {
      showError(err.message || (isEn ? 'Failed to send verification code!' : 'Không thể gửi mã xác thực qua email!'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleFinishAndProceed = () => {
    setShowOtpModal(false);
    setIsVerifiedOtp(false);
    setShakeKey(0);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtpCode('');
    setOtpError('');
    setActiveTab('profile');
  };

  const handleVerifyOtpAndChangePassword = async (codeToVerify) => {
    if (isVerifyingOtp || isVerifiedOtp) return;
    const code = (codeToVerify || otpCode).trim();
    if (!code || code.length !== 6) {
      setOtpError(isEn ? 'Please enter a valid 6-digit code.' : 'Vui lòng nhập đủ 6 chữ số mã xác thực.');
      setShakeKey((prev) => prev + 1);
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      await changePassword(currentPassword, newPassword, code);
      setIsVerifiedOtp(true);
      showSuccess(
        isEn
          ? 'Password changed successfully! New credentials are now active.'
          : 'Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật.'
      );

      // Báo thành công xong khoảng 1.4s rồi mới chuyển vào trong
      setTimeout(() => {
        handleFinishAndProceed();
      }, 1400);
    } catch (err) {
      const msg = err.message || (isEn ? "That code didn't match. Please enter again." : "Mã xác thực không chính xác. Vui lòng nhập lại.");
      setOtpError(msg);
      setShakeKey((prev) => prev + 1);

      // Báo đỏ xong sau 500ms xóa mã và tự động focus để bắt người dùng nhập lại từ đầu
      setTimeout(() => {
        setOtpCode('');
        const inputEl = document.getElementById('profile-change-pwd-otp');
        if (inputEl) {
          inputEl.focus();
        }
      }, 500);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendSeconds > 0 || isVerifyingOtp) return;
    try {
      await authApi.requestChangePasswordOtp(currentPassword, newPassword);
      setResendSeconds(60);
      setOtpCode('');
      setOtpError('');
      showSuccess(
        isEn
          ? 'A new verification code has been sent to your email.'
          : 'Đã gửi lại mã xác thực mới tới email của bạn.'
      );
    } catch (err) {
      setOtpError(err.message || (isEn ? 'Failed to resend code.' : 'Không thể gửi lại mã xác thực.'));
    }
  };

  const handleOtpInput = (val) => {
    if (isVerifyingOtp || isVerifiedOtp) return;
    const clean = val.replace(/[^0-9]/g, '').slice(0, 6);
    setOtpCode(clean);
    if (otpError) setOtpError('');
    if (clean.length === 6) {
      handleVerifyOtpAndChangePassword(clean);
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
              {savingPassword ? (isEn ? 'Sending code...' : 'Đang gửi mã...') : (isEn ? 'Change Password' : 'Đổi Mật Khẩu')}
            </button>
          </div>
        </form>
      )}
      <GoogleLoginModal isOpen={googleOpen && isOpen} onClose={() => setGoogleOpen(false)} linkAccount />

      {/* Modal Xác thực OTP bảo mật - Đồng bộ 100% giao diện với Đăng ký */}
      {showOtpModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md transition-all duration-300"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-otp-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isVerifyingOtp) {
              if (isVerifiedOtp) {
                handleFinishAndProceed();
              } else {
                setShowOtpModal(false);
              }
            }
          }}
        >
          {/* Modal Card - Thiết kế chuẩn Card bo 36px và bóng tím mờ */}
          <div
            className="relative w-full max-w-[420px] bg-white rounded-[36px] shadow-[0_25px_70px_-15px_rgba(99,102,241,0.2),0_0_0_1px_rgba(238,242,255,0.8)] border border-slate-100/90 p-7 sm:p-9 text-center transition-all duration-300 overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút đóng góc phải */}
            <button
              type="button"
              disabled={isVerifyingOtp}
              onClick={isVerifiedOtp ? handleFinishAndProceed : () => setShowOtpModal(false)}
              aria-label="Đóng bảng xác thực"
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] z-10 cursor-pointer disabled:opacity-50"
            >
              <span className="text-sm font-bold">✕</span>
            </button>

            {/* Top Badge: Ổ khóa tím hoặc Tích xanh thành công */}
            {isVerifiedOtp ? (
              <div className="relative mx-auto mb-4 w-20 h-20 flex items-center justify-center">
                <div className="w-18 h-18 rounded-full bg-[#10b981] flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-[8px] ring-emerald-100/80 transition-transform duration-300 scale-105">
                  <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="relative mx-auto mb-4 w-20 h-20 flex items-center justify-center">
                <div className={`relative w-18 h-18 rounded-full ${otpError ? 'bg-rose-50' : 'bg-[#f4f3ff]'} flex items-center justify-center shadow-inner transition-colors duration-200`}>
                  {/* Vòng cung viền tiến trình phía trên */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 72 72">
                    <circle
                      cx="36"
                      cy="36"
                      r="34"
                      fill="none"
                      stroke={otpError ? "#f87171" : "#4f46e5"}
                      strokeWidth="2.2"
                      strokeDasharray="213"
                      strokeDashoffset="145"
                      strokeLinecap="round"
                    />
                  </svg>
                  <svg className={`w-7 h-7 ${otpError ? 'text-rose-500' : 'text-[#4f46e5]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="3" ry="3" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    <circle cx="12" cy="16" r="1.2" fill="currentColor" />
                  </svg>
                </div>
              </div>
            )}

            {/* Tiêu đề & Email gửi tới */}
            <h3 id="profile-otp-dialog-title" className={`text-2xl sm:text-[26px] font-black tracking-tight ${isVerifiedOtp ? 'text-emerald-600' : 'text-gray-900'}`}>
              {isVerifiedOtp ? (isEn ? "You're verified!" : "Xác thực thành công!") : "Verify it's you"}
            </h3>
            <p role="status" className="text-xs sm:text-sm text-gray-500 mt-2 mb-6 leading-relaxed font-normal">
              {isVerifiedOtp ? (
                <span className="font-semibold text-emerald-700">
                  {isEn ? "Password updated successfully! Redirecting..." : "Mật khẩu đã được cập nhật thành công! Đang chuyển hướng..."}
                </span>
              ) : (
                <>
                  {isEn ? 'Enter the 6-digit code we just sent to' : 'Nhập mã gồm 6 chữ số đã được gửi tới'} <br />
                  <strong className="font-bold text-gray-900">{currentUser?.email}</strong>
                </>
              )}
            </p>

            {/* Khối 6 Ô nhập OTP (có hiệu ứng rung khi sai mã) */}
            <div className={`relative my-4 ${shakeKey ? 'animate-otp-shake' : ''}`} key={shakeKey}>
              {/* Input ẩn nhận focus, bàn phím và Paste từ clipboard */}
              <input
                id="profile-change-pwd-otp"
                name="profile-change-pwd-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="Nhập 6 chữ số"
                required
                autoFocus
                disabled={isVerifyingOtp || isVerifiedOtp}
                value={otpCode}
                aria-invalid={Boolean(otpError)}
                aria-describedby={otpError ? 'profile-otp-error' : undefined}
                onChange={(e) => handleOtpInput(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer text-center"
              />

              {/* 6 Ô hiển thị bo góc và thanh gạch chân */}
              <div className="flex items-center justify-between gap-2 sm:gap-2.5 w-full">
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const digit = otpCode[index] || '';
                  const isCurrent = otpCode.length === index;
                  const isFilled = Boolean(digit);
                  const isError = Boolean(otpError);

                  let boxClass = 'bg-white border-2 border-[#3730a3] text-gray-900';
                  let underlineClass = 'bg-[#3730a3]';

                  if (isVerifiedOtp) {
                    boxClass = 'bg-[#10b981] border-2 border-[#10b981] text-white shadow-md shadow-emerald-500/25 scale-[1.02]';
                    underlineClass = 'opacity-0';
                  } else if (isError) {
                    boxClass = 'bg-rose-50/50 border-2 border-[#f87171] text-[#dc2626] shadow-xs';
                    underlineClass = 'bg-[#dc2626]';
                  } else if (isCurrent) {
                    boxClass = 'bg-white border-2 border-[#4f46e5] text-gray-900 ring-4 ring-indigo-500/20 shadow-sm scale-[1.04]';
                    underlineClass = 'bg-[#4f46e5]';
                  } else if (isFilled) {
                    boxClass = 'bg-white border-2 border-[#3730a3] text-gray-900 shadow-xs';
                    underlineClass = 'bg-[#3730a3]';
                  }

                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div
                        className={`w-full h-[64px] sm:h-[70px] rounded-[20px] flex items-center justify-center text-2xl sm:text-3xl font-extrabold transition-all duration-150 select-none ${boxClass}`}
                      >
                        {digit ? (
                          digit
                        ) : isCurrent && !isVerifiedOtp ? (
                          <span className="w-0.5 h-6 bg-[#4f46e5] animate-pulse rounded-full" />
                        ) : null}
                      </div>

                      {/* Thanh gạch chân (Underline Bar) */}
                      <div className={`w-5 h-[2.5px] rounded-full mt-2 transition-all duration-200 ${underlineClass}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thông báo lỗi dạng pill đỏ */}
            {otpError && !isVerifiedOtp && (
              <div id="profile-otp-error" role="alert" className="flex items-center justify-center gap-1.5 text-xs sm:text-[13px] font-semibold text-rose-600 mt-2 mb-3 animate-fade-slide-up">
                <svg className="w-4 h-4 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-10v6h2V7h-2z" clipRule="evenodd" />
                </svg>
                <span>{otpError}</span>
              </div>
            )}

            {/* Nút xác thực chính */}
            <div className="mt-4 mb-2">
              {isVerifiedOtp ? (
                <button
                  type="button"
                  onClick={handleFinishAndProceed}
                  className="w-full h-12 sm:h-13 rounded-2xl font-bold text-white bg-[#10b981] hover:bg-[#059669] shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer text-base"
                >
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{isEn ? 'Completed' : 'Hoàn tất ✓'}</span>
                </button>
              ) : isVerifyingOtp ? (
                <button
                  type="button"
                  disabled
                  className="w-full h-12 sm:h-13 rounded-2xl font-bold text-white bg-[#4f46e5] opacity-95 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-wait"
                >
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="tracking-wide">{isEn ? 'Verifying...' : 'Đang xác thực...'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={otpCode.length !== 6 || isVerifyingOtp}
                  onClick={() => handleVerifyOtpAndChangePassword(otpCode)}
                  className="w-full h-12 sm:h-13 rounded-2xl font-bold text-white bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-50 disabled:hover:bg-[#4f46e5] shadow-lg shadow-indigo-500/25 flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>{isEn ? 'Verify code' : 'Xác thực & Đổi mật khẩu'}</span>
                </button>
              )}
            </div>

            {/* Dòng gửi lại mã ở chân modal */}
            {!isVerifiedOtp && (
              <div className="mt-3 text-xs sm:text-[13px] text-gray-500 flex items-center justify-center gap-1.5">
                <span>{isEn ? "Didn't get a code?" : "Chưa nhận được mã?"}</span>
                {resendSeconds > 0 ? (
                  <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                    <svg className="w-3.5 h-3.5 text-indigo-600 animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span>Resend in 0:{resendSeconds < 10 ? `0${resendSeconds}` : resendSeconds}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isVerifyingOtp}
                    onClick={handleResendOtp}
                    className="font-bold text-[#4f46e5] hover:underline cursor-pointer focus:outline-none"
                  >
                    {isEn ? 'Resend now' : 'Gửi lại ngay'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </Modal>
  );
}
