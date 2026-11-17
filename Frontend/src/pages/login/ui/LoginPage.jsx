import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, authApi } from '../../../entities/session/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { isAsciiPassword, PASSWORD_CHARACTER_ERROR } from '../../../shared/lib/passwordPolicy.js';
import { loadGoogleIdentity, googleClientId } from '../../../shared/lib/googleIdentity.js';
import { AuthField, ForgotPasswordModal, GoogleLoginModal } from '../../../features/auth/index.js';
import { Logo } from '../../../shared/ui/Logo.jsx';
import { OtpDialogContent, OTP_CARD_CLASS, withMinDuration } from '../../../shared/ui/OtpCode.jsx';
import { getMembershipIntent, getPostLoginRoute } from '../../../entities/membership/index.js';
import { useLandingContent } from '../../../entities/landing-content/index.js';

const REMEMBERED_EMAIL_KEY = 'SCMS_REMEMBERED_EMAIL';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Login accepts what the backend accepts: email, phone number (any common spelling) or username.
const PHONE_LOGIN_PATTERN = /^\+?[0-9 ().-]{8,20}$/;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,100}$/;
const isValidLoginIdentifier = value => EMAIL_PATTERN.test(value) || PHONE_LOGIN_PATTERN.test(value) || USERNAME_PATTERN.test(value);

function readRememberedEmail() {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

function saveRememberedEmail(email) {
  try {
    if (email) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  } catch {
    // Lưu trữ có thể bị tắt; người dùng vẫn đăng nhập bình thường.
  }
}

export function LoginPage() {
  const { login, register, logout, loginWithGoogle, isAuthenticated, role } = useAuth();
  const { showSuccess, showError } = useToast();
  const landingContent = useLandingContent();
  const authShowcase = landingContent?.authShowcase || {};
  const supportPhone = landingContent?.ctaAndFooter?.contactPhone?.trim() || '';

  const showcaseBadge = authShowcase.badge || 'Sân tập mở cửa 24/7';
  const showcaseTagline = authShowcase.tagline || 'Khởi đầu bứt phá';
  const showcaseLoginTitle = authShowcase.loginTitle || 'Tập luyện hôm nay, \nbứt phá mỗi ngày.';
  const showcaseRegisterTitle = authShowcase.registerTitle || 'Hành trình mới, \nphiên bản khỏe hơn.';
  const showcaseDescription = authShowcase.description || 'Hệ sinh thái thể thao đa năng với 9 cụm sân thi đấu chuẩn Olympic. Đặt sân siêu tốc, cá nhân hóa lịch tập và theo dõi chỉ số InBody cùng huấn luyện viên hàng đầu.';
  const showcasePosterUrl = authShowcase.posterUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop';
  const authVideoUrl = authShowcase.videoUrl || landingContent?.heroBanner?.videoUrl || './hero-video.mp4';
  
  const feature1Title = authShowcase.feature1Title || 'Đặt chỗ trong 30s';
  const feature1Desc = authShowcase.feature1Desc || 'Giữ sân & lớp học 7 ngày';
  const feature1Icon = authShowcase.feature1Icon || 'bolt';

  const feature2Title = authShowcase.feature2Title || 'Chuẩn Olympic 5★';
  const feature2Desc = authShowcase.feature2Desc || 'Hệ thống sân bãi cao cấp';
  const feature2Icon = authShowcase.feature2Icon || 'verified';

  const stat1Value = authShowcase.stat1Value || '09';
  const stat1Label = authShowcase.stat1Label || 'Bộ môn thi đấu';

  const stat2Value = authShowcase.stat2Value || '09';
  const stat2Label = authShowcase.stat2Label || 'Khu tập luyện';

  const stat3Value = authShowcase.stat3Value || '2.5K+';
  const stat3Label = authShowcase.stat3Label || 'Hội viên active';

  const membershipIntent = useRef(getMembershipIntent(window.location.hash));
  const redirectToRoleDashboard = role => {
    window.location.hash = getPostLoginRoute(role, membershipIntent.current);
  };
  const [activeTab, setActiveTab] = useState(() => window.location.hash.split('?')[0] === '#/register' ? 'register' : 'login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState(readRememberedEmail);
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(() => Boolean(readRememberedEmail()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAgree, setRegAgree] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationPhone, setVerificationPhone] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regOtpVerified, setRegOtpVerified] = useState(false);
  const [regOtpNotice, setRegOtpNotice] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const normalizedRegistrationPhone = regPhone.replace(/[\s().-]/g, '');
  const needsEmailCode = verificationEmail !== ''
    && verificationEmail === regEmail.trim().toLowerCase()
    && verificationPhone === normalizedRegistrationPhone;
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const isRegister = activeTab === 'register';
  const lastFocusedElementRef = useRef(null);
  const otpModalRef = useRef(null);
  const holdAuthRedirectRef = useRef(false);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds(seconds => Math.max(0, seconds - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  useEffect(() => {
    if (needsEmailCode) {
      lastFocusedElementRef.current = document.activeElement;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const focusOtp = () => {
        const otpInput = document.getElementById('register-otp');
        if (otpInput) {
          otpInput.focus();
        } else {
          otpModalRef.current?.focus();
        }
      };

      const animationTimer = setTimeout(focusOtp, 150);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !isSubmitting) {
          closeRegisterOtp();
          return;
        }
        if (e.key === 'Tab' && otpModalRef.current) {
          const focusables = otpModalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(animationTimer);
        document.body.style.overflow = previousOverflow;
        window.removeEventListener('keydown', handleKeyDown);
        if (lastFocusedElementRef.current && typeof lastFocusedElementRef.current.focus === 'function') {
          lastFocusedElementRef.current.focus();
        }
      };
    }
  }, [needsEmailCode, isSubmitting]);

  // Tự động xác thực khi đã nhập đủ 6 số
  useEffect(() => {
    if (!needsEmailCode || regOtp.length !== 6 || isSubmitting || regOtpVerified || formError) return;
    document.getElementById('register-form')?.requestSubmit();
  }, [needsEmailCode, regOtp, isSubmitting, regOtpVerified, formError]);

  // Tích hợp Google Identity trực tiếp trên trang
  const googleButtonRef = useRef(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleRendered, setGoogleRendered] = useState(false);

  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.split('?')[0];
      membershipIntent.current = getMembershipIntent(window.location.hash);
      if (h === '#/register') setActiveTab('register');
      else if (h === '#/login') setActiveTab('login');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    if (isAuthenticated && role === 'GUEST') {
      logout();
      window.location.hash = '#/login';
      return;
    }
    // Đang chạy animation xác thực thành công: handleRegisterSubmit tự chuyển trang sau đó
    if (isAuthenticated && !holdAuthRedirectRef.current) redirectToRoleDashboard(role);
  }, [isAuthenticated, role, logout]);

  // Render nút Google Identity trực tiếp trên trang
  useEffect(() => {
    let cancelled = false;
    async function initGoogle() {
      if (!googleClientId) return;
      try {
        await loadGoogleIdentity();
        if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (!response?.credential) return;
            setGoogleLoading(true);
            setFormError('');
            try {
              const user = await loginWithGoogle({ credential: response.credential });
              showSuccess('Đăng nhập thành công!');
              redirectToRoleDashboard(user.role || 'MEMBER');
            } catch (err) {
              setFormError(err.payload?.message || err.message || 'Đăng nhập Google thất bại.');
            } finally {
              setGoogleLoading(false);
            }
          },
        });
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: isRegister ? 'signup_with' : 'signin_with',
          shape: 'pill',
          locale: 'vi',
        });
        setGoogleRendered(true);
      } catch {
        setGoogleRendered(false);
      }
    }
    initGoogle();
    return () => { cancelled = true; };
  }, [isRegister]);

  const handleTabChange = tab => {
    setActiveTab(tab);
    setFieldErrors({});
    setFormError('');
    setRegOtpNotice('');
    window.location.hash = tab === 'register' ? '#/register' : '#/login';
  };

  const updateField = (field, value, setter) => {
    setter(value);
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setFormError('');
  };

  const closeRegisterOtp = () => {
    setVerificationEmail('');
    setRegOtp('');
    setFormError('');
    setRegOtpNotice('');
  };

  const hasValidationErrors = (errors) => {
    setFieldErrors(errors);
    setFormError('');
    const firstInvalidKey = Object.keys(errors)[0];
    if (firstInvalidKey) {
      document.getElementById(firstInvalidKey)?.focus();
      return true;
    }
    return false;
  };

  const handleLoginSubmit = async event => {
    event.preventDefault();
    if (isSubmitting) return;
    const identifier = loginEmail.trim();
    const errors = {};
    if (!identifier) errors['login-email'] = 'Vui lòng nhập email hoặc số điện thoại.';
    else if (!isValidLoginIdentifier(identifier)) {
      errors['login-email'] = 'Email, số điện thoại hoặc tên đăng nhập không hợp lệ.';
    }
    if (!loginPassword) errors['login-password'] = 'Vui lòng nhập mật khẩu.';
    else if (!isAsciiPassword(loginPassword)) errors['login-password'] = PASSWORD_CHARACTER_ERROR;
    if (hasValidationErrors(errors)) return;

    setIsSubmitting(true);
    try {
      const user = await login(identifier, loginPassword);
      saveRememberedEmail(rememberEmail ? identifier : '');
      showSuccess('Đăng nhập thành công!');
      redirectToRoleDashboard(user.role);
    } catch (error) {
      const message = error.payload?.message || error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
      if (error.status === 401) {
        setFormError('Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.');
      } else if (error.status === 403) {
        setFormError('Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt.');
      } else {
        setFormError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async event => {
    event.preventDefault();
    if (isSubmitting) return;
    const email = regEmail.trim();
    const phone = regPhone.replace(/[\s().-]/g, '');
    const errors = {};
    if (!regFullName.trim()) errors['register-name'] = 'Vui lòng nhập họ và tên.';
    if (!email) errors['register-email'] = 'Vui lòng nhập email của bạn.';
    else if (!EMAIL_PATTERN.test(email)) errors['register-email'] = 'Email chưa đúng định dạng.';
    if (phone && !/^(0\d{9}|\+84\d{9})$/.test(phone)) {
      errors['register-phone'] = 'Nhập số điện thoại gồm 10 số hoặc dùng đầu số +84.';
    }
    if (!isAsciiPassword(regPassword)) errors['register-password'] = PASSWORD_CHARACTER_ERROR;
    else if (regPassword.length < 6) errors['register-password'] = 'Mật khẩu cần ít nhất 6 ký tự.';
    else if (!/[A-Z]/.test(regPassword) || !/[a-z]/.test(regPassword) || !/[0-9]/.test(regPassword) || !/[^a-zA-Z0-9]/.test(regPassword)) errors['register-password'] = 'Mật khẩu cần có chữ hoa, chữ thường, số và ký tự đặc biệt.';
    if (!regConfirmPassword) errors['register-confirm'] = 'Vui lòng nhập lại mật khẩu.';
    else if (!isAsciiPassword(regConfirmPassword)) errors['register-confirm'] = PASSWORD_CHARACTER_ERROR;
    else if (regPassword !== regConfirmPassword) errors['register-confirm'] = 'Mật khẩu xác nhận chưa khớp.';
    if (!regAgree) errors['register-agree'] = 'Vui lòng xác nhận thông tin trước khi đăng ký.';
    if (needsEmailCode && !/^[0-9]{6}$/.test(regOtp)) errors['register-otp'] = 'Vui lòng nhập mã gồm 6 chữ số trong email.';
    if (hasValidationErrors(errors)) return;

    setIsSubmitting(true);
    try {
      if (!needsEmailCode) {
        await authApi.requestEmailVerification(email, phone);
        setVerificationEmail(email.toLowerCase());
        setVerificationPhone(phone);
        setRegOtp('');
        setResendSeconds(60);
        return;
      }
      holdAuthRedirectRef.current = true;
      const user = await withMinDuration(register({ fullName: regFullName.trim(), email, phone, password: regPassword, emailOtp: regOtp }));
      setRegOtpVerified(true);
      await new Promise(resolve => setTimeout(resolve, 1400));
      showSuccess('Đăng ký thành công! Mã hội viên của bạn: ' + user.memberCode);
      redirectToRoleDashboard(user.role || 'MEMBER');
    } catch (error) {
      holdAuthRedirectRef.current = false;
      const message = error.payload?.message || error.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      if (error.payload?.code === 'OTP_INVALID' && error.payload.remainingAttempts === 0) {
        // Sai đủ 5 lần: báo đỏ một chút rồi tự gửi mã mới
        setFormError(message);
        await new Promise(resolve => setTimeout(resolve, 1900));
        try {
          await authApi.requestEmailVerification(verificationEmail, verificationPhone);
          setRegOtp('');
          setFormError('');
          setResendSeconds(60);
          setRegOtpNotice('Bạn đã nhập sai 5 lần. Mã mới đã được gửi tới email, vui lòng nhập mã mới.');
        } catch (resendError) {
          setFormError(resendError.payload?.message || resendError.message || 'Không thể gửi mã mới. Vui lòng thử lại.');
        }
        return;
      }
      const duplicateField = error.payload?.field
        || (error.status === 409 && /^Email/.test(message) ? 'email' : error.status === 409 && /^Số điện thoại/.test(message) ? 'phone' : null);
      if (duplicateField === 'email' || duplicateField === 'phone') {
        // Trùng email/SĐT: đóng OTP (nếu đang mở) và báo ngay dưới ô tương ứng
        const fieldId = duplicateField === 'email' ? 'register-email' : 'register-phone';
        closeRegisterOtp();
        setFieldErrors(prev => ({ ...prev, [fieldId]: message }));
        setTimeout(() => document.getElementById(fieldId)?.focus(), 0);
        return;
      }
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendSeconds > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setFormError('');
    setRegOtpNotice('');
    try {
      await authApi.requestEmailVerification(verificationEmail, verificationPhone);
      setResendSeconds(60);
      showSuccess('Đã gửi lại mã xác nhận qua email!');
    } catch (error) {
      setFormError(error.payload?.message || error.message || 'Không thể gửi lại mã. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitButton = (
    <button
      id={isRegister ? 'register-submit-button' : 'login-submit-button'}
      type="submit"
      disabled={isSubmitting}
      className="w-full min-h-12 py-3 px-6 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none"
    >
      <span>
        {isSubmitting
          ? 'Đang xử lý...'
          : isRegister
            ? (needsEmailCode ? 'Xác thực & Tạo tài khoản' : 'Tiếp tục đăng ký')
            : 'Đăng nhập vào Olympic Sports Arena'}
      </span>
      {!isSubmitting && (
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          arrow_forward
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen lg:h-screen w-full relative flex flex-col lg:flex-row overflow-x-hidden font-dm-sans select-text bg-[#0b0d14] text-white">
      {/* 🎬 Fullscreen Cinematic Ambient Background Video (Tràn viền toàn trang) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-105"
          poster={showcasePosterUrl}
        >
          <source src={authVideoUrl} type="video/mp4" />
        </video>
        {/* Lớp phủ cinematic đa tầng: giữ độ nét, độ tương phản và chuyển động sống động của video thể thao */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy-950/85 via-brand-navy-950/50 to-brand-navy-950/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-950/90 via-transparent to-brand-navy-950/70" />
        {/* Đốm sáng ambient đỏ thể thao Olympic rực rỡ */}
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-red-600/25 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] bg-rose-600/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* ========================================================
          CỘT TRÁI: SHOWCASE THỂ THAO ĐỈNH CAO (Cinematic Athletic Hero)
          ======================================================== */}
      <aside className="hidden lg:flex lg:w-[48%] xl:w-[50%] 2xl:w-[52%] h-full relative z-10 flex-col justify-between p-8 sm:p-10 xl:p-12 select-none shrink-0 border-r border-white/10">
        {/* Thanh Header thương hiệu góc trên bên trái */}
        <div className="flex items-center justify-between gap-4">
          <Logo variant="auto" size="lg" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-[13px] font-semibold text-white shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]" />
            </span>
            <span>{showcaseBadge}</span>
          </div>
        </div>

        {/* Khối trung tâm: Headline nghệ thuật & Thẻ kính nổi */}
        <div className="py-4 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-500/20 backdrop-blur-xl border border-red-500/35 text-xs font-bold uppercase tracking-wider text-red-200 mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[15px] text-red-400">sports_score</span>
            <span>{showcaseTagline}</span>
          </div>

          <h2 className="font-dm-sans text-3xl sm:text-4xl xl:text-5xl font-extrabold leading-[1.14] tracking-tight text-white whitespace-pre-line drop-shadow-lg">
            {isRegister ? (
              <>
                {showcaseRegisterTitle.split('\n')[0]} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-rose-300">
                  {showcaseRegisterTitle.split('\n').slice(1).join('\n') || ''}
                </span>
              </>
            ) : (
              <>
                {showcaseLoginTitle.split('\n')[0]} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-rose-300">
                  {showcaseLoginTitle.split('\n').slice(1).join('\n') || ''}
                </span>
              </>
            )}
          </h2>

          <p className="text-base text-slate-200 mt-4 leading-relaxed max-w-lg font-normal drop-shadow">
            {showcaseDescription}
          </p>

          {/* 2 Thẻ kính Frosted Glass Cards */}
          <div className="grid sm:grid-cols-2 gap-3.5 mt-6">
            <div className="p-4 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/15 hover:bg-white/[0.14] hover:border-red-500/40 hover:-translate-y-0.5 transition-all duration-300 shadow-xl group">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30 group-hover:scale-110 group-hover:shadow-[0_0_12px_rgba(251,191,36,0.4)] transition-all shadow-inner">
                  <span className="material-symbols-outlined text-[22px]">{feature1Icon}</span>
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">{feature1Title}</h4>
                  <p className="text-[12.5px] text-slate-300 mt-0.5 font-normal">{feature1Desc}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/15 hover:bg-white/[0.14] hover:border-red-500/40 hover:-translate-y-0.5 transition-all duration-300 shadow-xl group">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-red-500/20 text-red-300 flex items-center justify-center shrink-0 border border-red-500/30 group-hover:scale-110 group-hover:shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all shadow-inner">
                  <span className="material-symbols-outlined text-[22px]">{feature2Icon}</span>
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">{feature2Title}</h4>
                  <p className="text-[12.5px] text-slate-300 mt-0.5 font-normal">{feature2Desc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Cột trái: Thống kê số liệu */}
        <div className="pt-4 flex items-center justify-between gap-6 border-t border-white/15">
          <div className="flex gap-8 sm:gap-10">
            <div>
              <div className="font-dm-sans text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">{stat1Value}</div>
              <div className="text-[12.5px] text-slate-300 font-medium mt-0.5">{stat1Label}</div>
            </div>
            <div>
              <div className="font-dm-sans text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">{stat2Value}</div>
              <div className="text-[12.5px] text-slate-300 font-medium mt-0.5">{stat2Label}</div>
            </div>
            <div>
              <div className="font-dm-sans text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight drop-shadow-[0_0_10px_rgba(252,211,77,0.3)]">{stat3Value}</div>
              <div className="text-[12.5px] text-slate-300 font-medium mt-0.5">{stat3Label}</div>
            </div>
          </div>

          <a
            href="#khoa-hoc"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 group shadow-lg backdrop-blur-md"
          >
            <span>Khám phá</span>
            <span className="material-symbols-outlined text-[17px] group-hover:translate-x-1 transition-transform" aria-hidden="true">
              arrow_forward
            </span>
          </a>
        </div>
      </aside>

      {/* ========================================================
          CỘT PHẢI: FORM AUTHENTICATION SANG TRỌNG FROSTED GLASS
          ======================================================== */}
      <section
        aria-labelledby="auth-heading"
        className="flex-1 h-full relative z-10 flex flex-col justify-between overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 xl:p-10 backdrop-blur-sm lg:backdrop-blur-none"
      >
        {/* Thanh điều hướng góc trên */}
        <div className="flex items-center justify-between w-full shrink-0 mb-2 z-10">
          <Logo variant="auto" size="sm" className="lg:hidden" />

          <a
            href="#/"
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full text-[13px] font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-xl shadow-lg border border-white/20 ml-auto transition-all duration-200 hover:-translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
            <span>Về trang chủ</span>
          </a>
        </div>

        {/* Khung Auth Card cao cấp nổi bật giữa màn hình với Glassmorphism */}
        <div className="my-auto py-2 sm:py-3 w-full max-w-[464px] mx-auto z-10">
          <div className="bg-slate-900/80 dark:bg-brand-navy-950/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.7)] border border-white/15 transition-all duration-300">
            {/* Tab chuyển đổi Đăng nhập / Đăng ký Tiya Style */}
            <div className="flex gap-1.5 rounded-2xl bg-black/40 backdrop-blur-md p-1.5 mb-5 border border-white/10 shadow-inner" role="group" aria-label="Chọn đăng nhập hoặc đăng ký">
              {[{ id: 'login', label: 'Đăng nhập' }, { id: 'register', label: 'Đăng ký' }].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={isActive}
                    disabled={isSubmitting}
                    onClick={() => handleTabChange(tab.id)}
                    className={
                      'flex-1 min-h-10 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60 ' +
                      (isActive
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30 font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-white/10 font-medium')
                    }
                  >
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block shadow-[0_0_6px_rgba(255,255,255,0.9)]" />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tiêu đề & Lời chào thân thiện */}
            <div className="mb-5">
              <h1 id="auth-heading" className="font-dm-sans text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                <span>{isRegister ? 'Gia nhập Olympic Sports Arena' : 'Chào mừng trở lại!'}</span>
              </h1>
              <p className="text-sm text-slate-300 mt-1.5 leading-snug line-clamp-2">
                {isRegister
                  ? 'Tạo tài khoản để khám phá khóa học, đặt sân và bắt đầu tập luyện.'
                  : 'Đăng nhập để quản lý lịch tập, đặt sân và theo dõi tiến độ của bạn.'}
              </p>
            </div>

            {/* Nút Đăng nhập Google trực tiếp trên trang */}
            <div className="w-full flex flex-col items-center justify-center mb-3 sm:mb-3.5">
              <div
                ref={googleButtonRef}
                className={`w-full flex justify-center min-h-[40px] transition-all ${googleLoading ? 'pointer-events-none opacity-40' : ''}`}
              />

              {!googleRendered && (
                <button
                  type="button"
                  disabled={isSubmitting || googleLoading}
                  onClick={() => setShowGoogleModal(true)}
                  className="w-full min-h-11 px-3.5 py-2.5 inline-flex items-center justify-center gap-2.5 border border-white/20 hover:border-white/35 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60 transition-all active:scale-[0.99] cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }} viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
                  </svg>
                  <span className="font-semibold text-slate-800">{isRegister ? 'Đăng ký với Google' : 'Tiếp tục với Google'}</span>
                </button>
              )}

              {googleLoading && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-400 mt-1.5 animate-pulse">
                  <svg className="animate-spin h-3.5 w-3.5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang xác thực tài khoản Google...</span>
                </div>
              )}
            </div>

            {/* Dòng phân cách "hoặc qua email" */}
            <div className="relative flex items-center justify-center my-3.5">
              <div className="border-t border-white/15 w-full" />
              <span className="bg-slate-900/90 dark:bg-brand-navy-950 px-3 text-[11.5px] uppercase tracking-wider text-slate-400 font-medium shrink-0">
                hoặc qua email
              </span>
              <div className="border-t border-white/15 w-full" />
            </div>

            {/* Thông báo lỗi tổng quát */}
            {formError && (
              <div
                role="alert"
                className="mb-3.5 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs sm:text-[13px] leading-5 flex items-start gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px] text-red-400 shrink-0 mt-0.5" aria-hidden="true">
                  error
                </span>
                <span className="flex-1">{formError}</span>
              </div>
            )}

            {/* Form Đăng nhập */}
            {!isRegister ? (
              <form id="login-form" onSubmit={handleLoginSubmit} noValidate aria-labelledby="auth-heading" aria-busy={isSubmitting}>
                <fieldset disabled={isSubmitting} className="space-y-3.5 min-w-0">
                  <AuthField
                    key="login-email"
                    id="login-email"
                    label="Email hoặc số điện thoại"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={150}
                    placeholder="ban@example.com hoặc 0912345678"
                    required
                    value={loginEmail}
                    error={fieldErrors['login-email']}
                    onChange={event => updateField('login-email', event.target.value, setLoginEmail)}
                  />

                  <AuthField
                    key="login-password"
                    id="login-password"
                    label="Mật khẩu"
                    type="password"
                    autoComplete="current-password"
                    maxLength={128}
                    placeholder="Nhập mật khẩu của bạn"
                    required
                    value={loginPassword}
                    error={fieldErrors['login-password']}
                    onChange={event => updateField('login-password', event.target.value, setLoginPassword)}
                  />

                  <div className="flex items-center justify-between text-xs pt-0.5 select-none">
                    <label htmlFor="remember-email" className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        id="remember-email"
                        type="checkbox"
                        checked={rememberEmail}
                        onChange={event => setRememberEmail(event.target.checked)}
                        className="w-3.5 h-3.5 accent-red-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      />
                      <span>Ghi nhớ email</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="font-bold text-red-400 hover:text-red-300 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded px-1"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  <div className="pt-1">
                    {submitButton}
                  </div>
                </fieldset>
              </form>
            ) : (
              <form id="register-form" onSubmit={handleRegisterSubmit} noValidate aria-labelledby="auth-heading" aria-busy={isSubmitting}>
                <fieldset disabled={isSubmitting} className="space-y-2.5 min-w-0">
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <AuthField key="register-name" id="register-name" label="Họ và tên" autoComplete="name" maxLength={150} placeholder="Nguyễn Văn A" required value={regFullName} error={fieldErrors['register-name']} onChange={event => updateField('register-name', event.target.value, setRegFullName)} />
                    <AuthField key="register-phone" id="register-phone" label="Số điện thoại" type="tel" autoComplete="tel" maxLength={20} placeholder="0901234567" value={regPhone} error={fieldErrors['register-phone']} onChange={event => updateField('register-phone', event.target.value, setRegPhone)} />
                  </div>
                  <AuthField key="register-email" id="register-email" label="Địa chỉ Email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={150} placeholder="ban@example.com" required value={regEmail} error={fieldErrors['register-email']} onChange={event => updateField('register-email', event.target.value, setRegEmail)} />
                  <div>
                    <div className="grid sm:grid-cols-2 gap-2.5 items-start">
                      <AuthField key="register-password" id="register-password" label="Mật khẩu" type="password" autoComplete="new-password" minLength={6} maxLength={128} placeholder="Tạo mật khẩu" hintId="register-password-rule" required value={regPassword} error={fieldErrors['register-password']} onChange={event => updateField('register-password', event.target.value, setRegPassword)} />
                      <AuthField key="register-confirm" id="register-confirm" label="Nhập lại mật khẩu" type="password" autoComplete="new-password" maxLength={128} placeholder="Xác nhận mật khẩu" required value={regConfirmPassword} error={fieldErrors['register-confirm']} onChange={event => updateField('register-confirm', event.target.value, setRegConfirmPassword)} />
                    </div>
                    <p id="register-password-rule" className="mt-1.5 flex items-center gap-1.5 text-xs leading-4 text-slate-300">
                      <span className="material-symbols-outlined text-[14px] text-red-400" aria-hidden="true">info</span>
                      Từ 6 ký tự, có chữ hoa, thường, số và ký tự đặc biệt.
                    </p>
                  </div>
                  <div className="pt-0.5">
                    <label htmlFor="register-agree" className="flex items-start gap-2 text-xs leading-[18px] text-slate-300 cursor-pointer select-none">
                      <input id="register-agree" type="checkbox" required checked={regAgree} aria-invalid={Boolean(fieldErrors['register-agree'])} aria-describedby={fieldErrors['register-agree'] ? 'register-agree-error' : undefined} onChange={event => updateField('register-agree', event.target.checked, setRegAgree)} className="w-3.5 h-3.5 shrink-0 mt-0.5 accent-red-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" />
                      <span>Tôi xác nhận thông tin là chính xác và đồng ý tạo tài khoản hội viên Olympic Sports Arena.</span>
                    </label>
                    {fieldErrors['register-agree'] && <p id="register-agree-error" className="text-[11px] text-red-400 leading-4 mt-0.5">{fieldErrors['register-agree']}</p>}
                  </div>
                  {needsEmailCode && typeof document !== 'undefined' && createPortal(
                    <div
                      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-brand-navy-950/70 backdrop-blur-md transition-all duration-300"
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="otp-dialog-title"
                      onClick={(e) => {
                        if (e.target === e.currentTarget && !isSubmitting) closeRegisterOtp();
                      }}
                    >
                      {/* Modal OTP tối: 6 ô gom thành khối gradient khi kiểm tra, xanh khi đúng, đỏ khi sai */}
                      <div
                        ref={otpModalRef}
                        tabIndex={-1}
                        className={OTP_CARD_CLASS}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <OtpDialogContent
                          titleId="otp-dialog-title"
                          inputId="register-otp"
                          email={verificationEmail}
                          code={regOtp}
                          onCodeChange={(next) => { setRegOtpNotice(''); updateField('register-otp', next, setRegOtp); }}
                          status={regOtpVerified ? 'success' : (formError || fieldErrors['register-otp']) ? 'error' : isSubmitting ? 'verifying' : 'idle'}
                          errorText={formError || fieldErrors['register-otp']}
                          notice={regOtpNotice}
                          onSubmit={() => document.getElementById('register-form')?.requestSubmit()}
                          onErrorReset={() => setRegOtp('')}
                          resendSeconds={resendSeconds}
                          onResend={handleResendVerification}
                          onClose={closeRegisterOtp}
                          onBack={() => {
                            closeRegisterOtp();
                            setTimeout(() => document.getElementById('register-email')?.focus(), 0);
                          }}
                          labels={{ success: 'Email đã được xác thực! Đang tạo tài khoản…', submit: 'Xác thực & tạo tài khoản' }}
                        />
                      </div>
                    </div>,
                    document.body
                  )}
                  <div className="pt-1">
                    {submitButton}
                  </div>
                </fieldset>
              </form>
            )}

            {/* Chuyển đổi trạng thái tài khoản */}
            <div className="mt-5 text-center text-[13px] leading-5 text-slate-300">
              {isRegister ? 'Đã có tài khoản?' : 'Bạn chưa có tài khoản?'}{' '}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleTabChange(isRegister ? 'login' : 'register')}
                className="font-bold text-red-400 hover:text-red-300 underline-offset-4 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60"
              >
                {isRegister ? 'Đăng nhập ngay' : 'Đăng ký hội viên'}
              </button>
            </div>
          </div>
        </div>

        {/* Chân trang hỗ trợ & Bảo mật */}
        <div className="text-xs text-slate-300 text-center shrink-0 py-2 leading-5 z-10 flex items-center justify-center gap-3">
          {supportPhone && (
            <>
              <span>
                Hỗ trợ 24/7:{' '}
                <a href={`tel:${supportPhone.replace(/\s+/g, '')}`} className="font-semibold text-white hover:text-red-400 transition-colors rounded">
                  {supportPhone}
                </a>
              </span>
              <span aria-hidden="true">•</span>
            </>
          )}
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-emerald-400">lock</span>
            Bảo mật 256-bit SSL
          </span>
        </div>
      </section>

      {/* Modal Quên Mật Khẩu */}
      {showForgotPassword && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPassword(false)}
          defaultEmail={loginEmail}
        />
      )}

      {/* Modal Hướng dẫn Đăng nhập Google */}
      {showGoogleModal && (
        <GoogleLoginModal
          onClose={() => setShowGoogleModal(false)}
        />
      )}
    </div>
  );
}

export default LoginPage;
