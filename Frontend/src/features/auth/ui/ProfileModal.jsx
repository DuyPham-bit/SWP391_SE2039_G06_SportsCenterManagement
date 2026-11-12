import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { authApi, useAuth } from '../../../entities/session/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { OtpDialogContent, OTP_CARD_CLASS } from '../../../shared/ui/OtpCode.jsx';
import { Badge } from '../../../shared/ui/StatCard.jsx';
import { PasswordInput } from './PasswordInput.jsx';
import { GoogleLoginModal } from './GoogleLoginModal.jsx';
import { isAsciiPassword, PASSWORD_CHARACTER_ERROR } from '../../../shared/lib/passwordPolicy.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { translatePackageName } from '../../../shared/i18n/i18nHelper.js';
import { processAvatarFile, getInitials } from '../../../shared/lib/avatarHelper.js';

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
  const isMember = currentUser?.role === 'MEMBER';

  // Member-owned details (coach AI uses them for age / gender / level)
  const [gender, setGender] = useState(currentUser?.gender || '');
  const [dateOfBirth, setDateOfBirth] = useState(currentUser?.dateOfBirth || '');
  const [fitnessLevel, setFitnessLevel] = useState(currentUser?.fitnessLevel || '');
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

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
      setGender(currentUser.gender || '');
      setDateOfBirth(currentUser.dateOfBirth || '');
      setFitnessLevel(currentUser.fitnessLevel || '');
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
    if (isMember && dateOfBirth && dateOfBirth > todayIso) {
      showError(isEn ? 'Date of birth cannot be in the future!' : 'Ngày sinh không được ở tương lai!');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatar: avatarChanged ? (avatarPreview || null) : currentUser?.avatar,
        ...(isMember ? { memberDetails: { gender, dateOfBirth, fitnessLevel } } : {})
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
      // Giữ mã màu đỏ; gõ số mới sẽ tự nhập lại từ đầu
      setTimeout(() => document.getElementById('profile-change-pwd-otp')?.focus(), 0);
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
      maxWidth="max-w-2xl"
    >
      {/* Top Header Row: Tabs & Google Link aligned together */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-navy-200 dark:border-brand-navy-700 pb-2 mb-4">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2 px-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-brand-sage-500 text-brand-sage-700 dark:text-brand-sage-400'
                : 'border-transparent text-brand-navy-500 hover:text-brand-navy-800 dark:hover:text-brand-navy-200'
            }`}
          >
            {isEn ? 'Personal Profile' : 'Thông Tin Cá Nhân'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`pb-2 px-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === 'password'
                ? 'border-brand-sage-500 text-brand-sage-700 dark:text-brand-sage-400'
                : 'border-transparent text-brand-navy-500 hover:text-brand-navy-800 dark:hover:text-brand-navy-200'
            }`}
          >
            {isEn ? 'Change Password' : 'Đổi Mật Khẩu'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setGoogleOpen(true)}
          className="px-2.5 py-1 border border-brand-navy-300 dark:border-brand-navy-700 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 rounded-lg text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <span className="material-symbols-outlined text-[16px] text-brand-danger-500">link</span>
          <span>{isEn ? 'Link Google' : 'Liên kết Google'}</span>
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
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              isDraggingAvatar
                ? 'bg-brand-sage-500/15 border-brand-sage-500 ring-2 ring-brand-sage-500/40'
                : 'bg-brand-navy-50 dark:bg-brand-navy-800/50 border-brand-navy-200 dark:border-brand-navy-700'
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

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
              {/* Avatar Squircle with Camera Overlay & Floating Badge */}
              <div className="relative group shrink-0">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden cursor-pointer relative shadow-md ring-2 ring-brand-sage-500/50 transition-all group-hover:scale-105 select-none bg-brand-navy-200 dark:bg-brand-navy-700"
                  title={isEn ? "Click to change avatar from phone or computer" : "Nhấp để tải ảnh đại diện từ điện thoại hoặc máy tính"}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-sage-500 via-brand-teal-300 to-brand-sand-300 text-white font-black text-xl flex items-center justify-center">
                      <span>{userInitials}</span>
                    </div>
                  )}

                  {/* Hover Camera Overlay */}
                  <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">
                      {isEn ? 'Change' : 'Đổi ảnh'}
                    </span>
                  </div>

                  {/* Processing Spinner during image compression */}
                  {isProcessingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                    </div>
                  )}
                </div>

                {/* Floating Camera Button Badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-navy-900 hover:bg-brand-navy-800 text-brand-sand-300 hover:text-white border-2 border-white dark:border-brand-navy-800 flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
                  title={isEn ? 'Upload photo from phone or computer' : 'Tải ảnh từ điện thoại hoặc máy tính'}
                >
                  <span className="material-symbols-outlined text-[13px]">add_a_photo</span>
                </button>
              </div>

              {/* User Info & Avatar Controls */}
              <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                    <span className="font-chivo text-sm sm:text-base font-bold text-brand-navy-900 dark:text-brand-navy-100">
                      {currentUser?.fullName}
                    </span>
                    <Badge variant={currentUser?.role}>{currentUser?.role}</Badge>
                    {avatarChanged && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-sand-100 dark:bg-brand-sand-950/60 text-brand-sand-800 dark:text-brand-sand-300 border border-brand-sand-300 dark:border-brand-sand-700 animate-pulse">
                        {isEn ? 'Unsaved Photo' : 'Ảnh chưa lưu'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">{currentUser?.email}</p>
                  {currentUser?.memberCode && (
                    <p className="text-[11px] font-semibold text-brand-sage-700 dark:text-brand-sage-500">
                      {isEn ? `Member Code: ${currentUser.memberCode}` : `Mã thẻ: ${currentUser.memberCode}`}
                    </p>
                  )}
                </div>

                {/* Action Buttons for Avatar */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingAvatar}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-brand-navy-700 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-600 text-brand-navy-700 dark:text-brand-navy-200 border border-brand-navy-300 dark:border-brand-navy-600 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px] text-brand-sage-700 dark:text-brand-sage-500">upload_file</span>
                    <span>{isEn ? 'Choose Photo' : 'Tải ảnh lên'}</span>
                  </button>

                  {avatarChanged && (
                    <button
                      type="button"
                      onClick={handleQuickSaveAvatar}
                      disabled={savingAvatarOnly}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-sage-700 hover:bg-brand-sage-900 text-white flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">check_circle</span>
                      <span>{savingAvatarOnly ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save Photo' : 'Lưu ảnh')}</span>
                    </button>
                  )}

                  {avatarChanged && (
                    <button
                      type="button"
                      onClick={handleRevertAvatar}
                      className="px-2 py-1 rounded-lg text-xs font-semibold text-brand-navy-600 hover:text-brand-navy-900 hover:bg-brand-navy-200/60 dark:text-brand-navy-400 dark:hover:text-brand-navy-200 transition-colors cursor-pointer"
                      title={isEn ? 'Revert change' : 'Hoàn tác'}
                    >
                      {isEn ? 'Revert' : 'Hoàn tác'}
                    </button>
                  )}

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="px-2 py-1 rounded-lg text-xs font-semibold text-brand-danger-600 hover:text-brand-danger-700 hover:bg-brand-danger-50 dark:hover:bg-brand-danger-950/40 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      <span>{isEn ? 'Remove' : 'Gỡ ảnh'}</span>
                    </button>
                  )}
                </div>

                {/* Helper Tips */}
                <p className="text-[10.5px] text-brand-navy-400 dark:text-brand-navy-500 leading-normal">
                  {isEn
                    ? '📱 Mobile: Take photo or choose from library • 💻 PC: JPG, PNG, WEBP auto-cropped.'
                    : '📱 Điện thoại: Chụp ảnh trực tiếp hoặc chọn từ Album • 💻 Máy tính: Chọn JPG, PNG, WEBP tự động cắt tròn.'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
              {isEn ? 'Login Email (Fixed)' : 'Email đăng nhập (Cố định)'}
            </label>
            <input
              type="email"
              disabled
              value={currentUser?.email || ''}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-500 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                {isEn ? 'Full Name *' : 'Họ và tên *'}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white dark:bg-brand-navy-800 dark:text-brand-navy-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                {isEn ? 'Phone Number' : 'Số điện thoại'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white dark:bg-brand-navy-800 dark:text-brand-navy-100"
              />
            </div>
          </div>

          {currentUser?.role === 'MEMBER' && (
            <fieldset className="space-y-2.5 p-3 sm:p-4 rounded-xl border border-brand-sage-200 dark:border-brand-sage-800 bg-brand-sage-50/50 dark:bg-brand-sage-950/20">
              <legend className="px-1 text-xs font-bold uppercase tracking-wider text-brand-sage-800 dark:text-brand-sage-400">
                {isEn ? 'Training profile' : 'Thông tin thể trạng'}
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="min-w-0">
                  <label htmlFor="profile-gender" className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                    {isEn ? 'Gender' : 'Giới tính'}
                  </label>
                  <select
                    id="profile-gender"
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white dark:bg-brand-navy-800 dark:text-brand-navy-100 cursor-pointer"
                  >
                    <option value="">{isEn ? '— Not set —' : '— Chưa chọn —'}</option>
                    <option value="Male">{isEn ? 'Male' : 'Nam'}</option>
                    <option value="Female">{isEn ? 'Female' : 'Nữ'}</option>
                    <option value="Other">{isEn ? 'Other' : 'Khác'}</option>
                  </select>
                </div>
                <div className="min-w-0">
                  <label htmlFor="profile-dob" className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                    {isEn ? 'Date of birth' : 'Ngày sinh'}
                  </label>
                  <input
                    id="profile-dob"
                    type="date"
                    max={todayIso}
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    className="w-full px-2.5 sm:px-3 py-2 text-sm rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white dark:bg-brand-navy-800 dark:text-brand-navy-100"
                  />
                </div>
                <div className="min-w-0">
                  <label htmlFor="profile-fitness-level" className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                    {isEn ? 'Fitness level' : 'Trình độ'}
                  </label>
                  <select
                    id="profile-fitness-level"
                    value={fitnessLevel}
                    onChange={e => setFitnessLevel(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white dark:bg-brand-navy-800 dark:text-brand-navy-100 cursor-pointer"
                  >
                    <option value="">{isEn ? '— Not set —' : '— Chưa chọn —'}</option>
                    <option value="Beginner">{isEn ? 'Beginner (0-6 months)' : 'Mới bắt đầu (0-6 tháng)'}</option>
                    <option value="Intermediate">{isEn ? 'Intermediate (6m-2y)' : 'Trung cấp (6 tháng - 2 năm)'}</option>
                    <option value="Advanced">{isEn ? 'Advanced (2+ years)' : 'Nâng cao (trên 2 năm)'}</option>
                    <option value="Athlete">{isEn ? 'Athlete' : 'Vận động viên'}</option>
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 leading-normal">
                {isEn
                  ? 'Your coach uses these details (age, gender, level) to personalize your training plan.'
                  : 'Huấn luyện viên dùng các thông tin này (tuổi, giới tính, trình độ) để cá nhân hóa giáo án cho bạn.'}
              </p>
            </fieldset>
          )}

          {currentUser?.role === 'MEMBER' && currentUser?.packageName && (
            <div className="p-3 rounded-lg bg-brand-sage-500/10 border border-brand-sage-500/30 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-brand-navy-800">
                  {isEn ? 'Current Package: ' : 'Gói tập hiện tại: '}
                </span>
                <span className="text-brand-sage-700 dark:text-brand-sage-400 font-semibold">{translatePackageName(currentUser.packageName, isEn)}</span>
              </div>
              <Badge variant={currentUser.packageStatus}>{currentUser.packageStatus}</Badge>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-brand-navy-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-brand-navy-200 hover:bg-brand-navy-50 text-brand-navy-600 cursor-pointer"
            >
              {isEn ? 'Close' : 'Đóng'}
            </button>
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-brand-navy-900 hover:bg-brand-navy-800 text-brand-sand-300 hover:text-white shadow-md transition-colors cursor-pointer"
            >
              {savingProfile ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save Changes' : 'Lưu Thay Đổi')}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="p-3 rounded-lg bg-brand-teal-50 text-brand-teal-800 text-xs flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">shield</span>
            <span>
              {isEn
                ? 'Password must be at least 6 characters (including letters, numbers, and special characters) to comply with system security policy.'
                : 'Mật khẩu phải dài tối thiểu 6 ký tự (gồm chữ hoa, thường, số và ký tự đặc biệt) theo đúng chính sách bảo mật của hệ thống.'}
            </span>
          </div>

          <div>
            <label htmlFor="profile-current-password" className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 mb-1">
              {isEn ? 'Current Password *' : 'Mật khẩu hiện tại *'}
            </label>
            <PasswordInput
              id="profile-current-password"
              autoComplete="current-password"
              required
              placeholder={isEn ? "Enter current password (Default: password123)" : "Nhập mật khẩu đang dùng (Mặc định: password123)"}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-brand-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white"
            />
          </div>

          <div>
            <label htmlFor="profile-new-password" className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 mb-1">
              {isEn ? 'New Password *' : 'Mật khẩu mới *'}
            </label>
            <PasswordInput
              id="profile-new-password"
              autoComplete="new-password"
              required
              placeholder={isEn ? "At least 6 characters" : "Tối thiểu 6 ký tự"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-brand-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white"
            />
          </div>

          <div>
            <label htmlFor="profile-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 mb-1">
              {isEn ? 'Confirm New Password *' : 'Xác nhận mật khẩu mới *'}
            </label>
            <PasswordInput
              id="profile-confirm-password"
              autoComplete="new-password"
              required
              placeholder={isEn ? "Re-enter new password" : "Nhập lại mật khẩu mới"}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-brand-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-brand-navy-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-brand-navy-200 hover:bg-brand-navy-50 text-brand-navy-600 cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-brand-navy-900 hover:bg-brand-navy-800 text-brand-sand-300 hover:text-white shadow-md transition-colors cursor-pointer"
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-brand-navy-950/70 backdrop-blur-md transition-all duration-300"
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
          {/* Modal nhập mã OTP: ô xám nhạt, xanh khi đúng, đỏ khi sai */}
          <div className={OTP_CARD_CLASS} onClick={(e) => e.stopPropagation()}>
            <OtpDialogContent
              titleId="profile-otp-dialog-title"
              inputId="profile-change-pwd-otp"
              email={currentUser?.email}
              code={otpCode}
              onCodeChange={handleOtpInput}
              status={isVerifiedOtp ? 'success' : isVerifyingOtp ? 'verifying' : otpError ? 'error' : 'idle'}
              errorText={otpError}
              resendSeconds={resendSeconds}
              onResend={handleResendOtp}
              onClose={isVerifiedOtp ? handleFinishAndProceed : () => setShowOtpModal(false)}
              labels={isEn ? {
                title: 'Enter verification code',
                sentTo: 'We sent a code to',
                verifying: 'Checking code…',
                success: 'Code accepted, password updated!',
                resendIn: (s) => <>Didn't get the code?<br />Request a new one in {s}s</>,
                resendHint: <>Didn't get the code? Check your spam folder<br />or request a new one.</>,
                resend: 'Get a new code',
                close: 'Close verification'
              } : { success: 'Mã chính xác, đã đổi mật khẩu!' }}
            />
          </div>
        </div>,
        document.body
      )}
    </Modal>
  );
}
