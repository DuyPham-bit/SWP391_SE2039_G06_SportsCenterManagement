import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, authApi } from '../../../entities/session/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { isAsciiPassword, PASSWORD_CHARACTER_ERROR } from '../../../shared/lib/passwordPolicy.js';
import { loadGoogleIdentity, googleClientId } from '../../../shared/lib/googleIdentity.js';
import { AuthField, ForgotPasswordModal, GoogleLoginModal } from '../../../features/auth/index.js';
import { Logo } from '../../../shared/ui/Logo.jsx';
import { getMembershipIntent, getPostLoginRoute } from '../../../entities/membership/index.js';
import { useLandingContent } from '../../../entities/landing-content/index.js';
import { resolveHeroVideoUrl } from '../../landing/ui/heroVideo.js';

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

  const showcaseBadge = authShowcase.badge || 'Sân tập mở cửa 24/7';
  const showcaseTagline = authShowcase.tagline || 'Khởi đầu bứt phá';
  const showcaseLoginTitle = authShowcase.loginTitle || 'Tập luyện hôm nay, \nbứt phá mỗi ngày.';
  const showcaseRegisterTitle = authShowcase.registerTitle || 'Hành trình mới, \nphiên bản khỏe hơn.';
  const showcaseDescription = authShowcase.description || 'Hệ sinh thái thể thao đa năng với 9 cụm sân thi đấu chuẩn Olympic. Đặt sân siêu tốc, cá nhân hóa lịch tập và theo dõi chỉ số InBody cùng huấn luyện viên hàng đầu.';
  const showcasePosterUrl = authShowcase.posterUrl || '';
  const authVideoUrl = authShowcase.videoUrl || resolveHeroVideoUrl(landingContent?.heroBanner);
  
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
      focusOtp();
      const frame = requestAnimationFrame(focusOtp);
      const timer = setTimeout(focusOtp, 60);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setVerificationEmail('');
          setRegOtp('');
          return;
        }

        if (e.key === 'Tab') {
          const modal = otpModalRef.current;
          if (!modal) return;
          const focusable = [
            ...modal.querySelectorAll(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ].filter(el => el.getClientRects().length > 0);

          if (focusable.length === 0) {
            e.preventDefault();
            modal.focus();
            return;
          }

          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          const active = document.activeElement;

          if (e.shiftKey) {
            if (active === first || !modal.contains(active)) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (active === last || !modal.contains(active)) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = previousOverflow;
        if (lastFocusedElementRef.current && typeof lastFocusedElementRef.current.focus === 'function') {
          try {
            lastFocusedElementRef.current.focus();
          } catch {
            // ignore
          }
        }
      };
    }
  }, [needsEmailCode]);

  // Tích hợp Google Identity trực tiếp trên trang
  const googleButtonRef = useRef(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleRendered, setGoogleRendered] = useState(false);

  const clearFormFeedback = () => {
    setFieldErrors({});
    setFormError('');
  };

  useEffect(() => {
    const handleHashChange = () => {
      const path = window.location.hash.split('?')[0];
      if (path === '#/login' || path === '#/register') {
        setActiveTab(path === '#/register' ? 'register' : 'login');
        setFieldErrors({});
        setFormError('');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (window.location.hash.includes('logout=true')) {
      logout();
      window.location.hash = '#/login';
      return;
    }
    if (isAuthenticated) redirectToRoleDashboard(role);
  }, [isAuthenticated, role, logout]);

  // Render nút Google Identity trực tiếp trên trang
  useEffect(() => {
    if (!googleClientId) return;
    let active = true;
    loadGoogleIdentity().then(google => {
      if (!active || !googleButtonRef.current) return;
      google.accounts.id.initialize({
        client_id: googleClientId,
        error_callback: () => {
          if (active) setGoogleRendered(false);
        },
        callback: async ({ credential }) => {
          if (!active) return;
          setGoogleLoading(true);
          try {
            const user = await loginWithGoogle({ credential });
            showSuccess(`Đăng nhập thành công, ${user.fullName || 'bạn'}!`);
            redirectToRoleDashboard(user.role);
          } catch (err) {
            showError(err.message || 'Đăng nhập Google thất bại.');
          } finally {
            if (active) setGoogleLoading(false);
          }
        }
      });

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
      }

      const buttonWidth = Math.min(400, Math.max(260, googleButtonRef.current?.offsetWidth || 360));
      google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: buttonWidth,
        text: isRegister ? 'signup_with' : 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      });
      if (active) setGoogleRendered(true);
    }).catch(() => {
      if (active) setGoogleRendered(false);
    });
    return () => { active = false; };
  }, [isRegister]);

  const handleTabChange = (tab) => {
    if (isSubmitting || tab === activeTab) return;
    clearFormFeedback();
    setLoginPassword('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegAgree(false);
    setVerificationEmail('');
    setVerificationPhone('');
    setRegOtp('');
    setActiveTab(tab);
    const authPath = tab === 'register' ? '#/register' : '#/login';
    window.location.hash = authPath + (membershipIntent.current ? `?next=${membershipIntent.current}` : '');
  };

  const updateField = (id, value, setter) => {
    setter(value);
    if (id === 'register-email' || id === 'register-phone') {
      setVerificationEmail('');
      setVerificationPhone('');
      setRegOtp('');
    }
    setFieldErrors(previous => ({ ...previous, [id]: undefined }));
    setFormError('');
  };

  const hasValidationErrors = (errors) => {
    setFieldErrors(errors);
    setFormError('');
    const firstField = Object.keys(errors)[0];
    if (firstField) document.getElementById(firstField)?.focus();
    return Boolean(firstField);
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    const email = loginEmail.trim();
    const errors = {};
    if (!email) errors['login-email'] = 'Vui lòng nhập email hoặc số điện thoại.';
    else if (!isValidLoginIdentifier(email)) errors['login-email'] = 'Email hoặc số điện thoại chưa đúng định dạng.';
    if (!loginPassword) errors['login-password'] = 'Vui lòng nhập mật khẩu.';
    else if (!isAsciiPassword(loginPassword)) errors['login-password'] = PASSWORD_CHARACTER_ERROR;
    if (hasValidationErrors(errors)) return;

    setIsSubmitting(true);
    try {
      const user = await login(email, loginPassword);
      saveRememberedEmail(rememberEmail ? email : '');
      showSuccess(`Đăng nhập thành công, ${user.fullName}!`);
      redirectToRoleDashboard(user.role);
    } catch (error) {
      const rawMessage = error.payload?.message || error.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      const cleanMessage = rawMessage.replace(/\s*\[.*HTTP\s*\d+.*\]$/, '').trim();
      const finalMessage = (error.status === 401 || cleanMessage === 'Thông tin đăng nhập không hợp lệ.')
        ? 'Email/số điện thoại hoặc mật khẩu không chính xác.'
        : (cleanMessage || 'Đăng nhập thất bại. Vui lòng thử lại.');
      setFormError(finalMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
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
      const user = await register({ fullName: regFullName.trim(), email, phone, password: regPassword, emailOtp: regOtp });
      showSuccess('Đăng ký thành công! Mã hội viên của bạn: ' + user.memberCode);
      redirectToRoleDashboard(user.role || 'MEMBER');
    } catch (error) {
      setFormError(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (isSubmitting || resendSeconds > 0) return;
    setIsSubmitting(true);
    setFormError('');
    try {
      await authApi.requestEmailVerification(verificationEmail, verificationPhone);
      setRegOtp('');
      setResendSeconds(60);
      showSuccess('Đã yêu cầu gửi lại mã xác thực. Vui lòng kiểm tra email và thư rác.');
    } catch (error) {
      setFormError(error.message || 'Không thể gửi lại mã. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitButton = (
    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full min-h-11 sm:min-h-12 py-3 px-4 sm:px-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:via-rose-500 hover:to-red-600 text-white font-dm-sans text-sm sm:text-[15px] font-bold shadow-lg shadow-red-600/30 hover:shadow-red-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-wait transition-all duration-200 group"
    >
      {isSubmitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
      <span>{isSubmitting ? (isRegister ? 'Đang xử lý...' : 'Đang đăng nhập...') : (isRegister ? (needsEmailCode ? 'Xác thực và tạo tài khoản' : 'Tiếp tục xác thực email') : 'Đăng nhập vào Olympic Sports Arena')}</span>
      {!isSubmitting && (
        <span className="material-symbols-outlined max-[399px]:!hidden text-[19px] group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true">
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
          poster={showcasePosterUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop'}
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
                  <span>Đang xác thực thông tin với Google...</span>
                </div>
              )}
            </div>

            {/* Dải phân cách mỏng thanh lịch */}
            <div className="flex items-center gap-3 my-3 sm:my-4">
              <span className="flex-1 h-px bg-white/15" aria-hidden="true" />
              <span className="text-[13px] font-medium text-slate-400">hoặc qua email</span>
              <span className="flex-1 h-px bg-white/15" aria-hidden="true" />
            </div>

            {formError && (
              <div role="alert" className="mb-3 p-3 rounded-xl border border-red-500/40 bg-red-950/40 text-xs text-red-200 leading-snug font-medium flex items-center gap-2 backdrop-blur-md">
                <span className="material-symbols-outlined text-[16px] text-red-400 shrink-0">error</span>
                <span>{formError}</span>
              </div>
            )}

            {!isRegister ? (
              <form onSubmit={handleLoginSubmit} noValidate aria-labelledby="auth-heading" aria-busy={isSubmitting}>
                <fieldset disabled={isSubmitting} className="space-y-3 min-w-0">
                  <AuthField key="login-email" id="login-email" label="Email hoặc số điện thoại" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={150} placeholder="ban@example.com hoặc 0912345678" required value={loginEmail} error={fieldErrors['login-email']} onChange={event => updateField('login-email', event.target.value, setLoginEmail)} />
                  <AuthField key="login-password" id="login-password" label="Mật khẩu" type="password" autoComplete="current-password" placeholder="Nhập mật khẩu của bạn" required value={loginPassword} error={fieldErrors['login-password']} onChange={event => updateField('login-password', event.target.value, setLoginPassword)} />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] pt-0.5">
                    <label className="inline-flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                      <input type="checkbox" checked={rememberEmail} onChange={event => { setRememberEmail(event.target.checked); if (!event.target.checked) saveRememberedEmail(''); }} className="w-3.5 h-3.5 accent-red-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" />
                      <span className="font-medium text-slate-300">Ghi nhớ email</span>
                    </label>
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="font-semibold text-red-400 hover:text-red-300 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="pt-1.5">
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
                        if (e.target === e.currentTarget) {
                          setVerificationEmail('');
                          setRegOtp('');
                        }
                      }}
                    >
                      {/* Modal Card - Thiết kế chuẩn ảnh 2, 3, 4 */}
                      <div
                        ref={otpModalRef}
                        tabIndex={-1}
                        className="relative w-full max-w-[420px] bg-white rounded-[36px] shadow-[0_25px_70px_-15px_rgba(61,64,91,0.2),0_0_0_1px_rgba(249,250,251,0.8)] border border-brand-navy-100/90 p-7 sm:p-9 text-center transition-all duration-300 overflow-hidden animate-scaleUp focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Nút đóng góc phải */}
                        <button
                          type="button"
                          onClick={() => {
                            setVerificationEmail('');
                            setRegOtp('');
                          }}
                          aria-label="Đóng bảng xác thực"
                          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-brand-navy-50 hover:bg-brand-navy-100 text-brand-navy-400 hover:text-brand-navy-600 flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy-700 z-10 cursor-pointer"
                        >
                          <span className="text-sm font-bold">✕</span>
                        </button>

                        {/* Top Lock Badge với vòng cung viền xoay (Ảnh 2 & 4) */}
                        <div className="relative mx-auto mb-4 w-20 h-20 flex items-center justify-center">
                          <div className="relative w-18 h-18 rounded-full bg-brand-navy-100 flex items-center justify-center shadow-inner">
                            {/* Vòng cung viền tiến trình phía trên */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 72 72">
                              <circle
                                cx="36"
                                cy="36"
                                r="34"
                                fill="none"
                                stroke="#3D405B"
                                strokeWidth="2.2"
                                strokeDasharray="213"
                                strokeDashoffset="145"
                                strokeLinecap="round"
                              />
                            </svg>
                            <svg className="w-7 h-7 text-brand-navy-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="3" ry="3" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              <circle cx="12" cy="16" r="1.2" fill="currentColor" />
                            </svg>
                          </div>
                        </div>

                        {/* Tiêu đề & Email gửi tới */}
                        <h3 id="otp-dialog-title" className="text-2xl sm:text-[26px] font-black text-brand-navy-900 tracking-tight">
                          Verify it's you
                        </h3>
                        <p role="status" className="text-xs sm:text-sm text-brand-navy-500 mt-2 mb-6 leading-relaxed font-normal">
                          Enter the 6-digit code we just sent to <br />
                          <strong className="font-bold text-brand-navy-900">{verificationEmail}</strong>
                        </p>

                        {/* Khối 6 Ô nhập OTP (Ảnh 2 & 4) */}
                        <div className="relative my-4">
                          {/* Input ẩn nhận focus, bàn phím và Paste từ clipboard */}
                          <input
                            id="register-otp"
                            name="register-otp"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            pattern="[0-9]{6}"
                            placeholder="Nhập 6 chữ số"
                            required
                            autoFocus
                            value={regOtp}
                            aria-invalid={Boolean(fieldErrors['register-otp'])}
                            aria-describedby={fieldErrors['register-otp'] ? 'register-otp-error' : undefined}
                            onChange={event => updateField('register-otp', event.target.value.replace(/[^0-9]/g, '').slice(0, 6), setRegOtp)}
                            className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer text-center"
                          />

                          {/* 6 Ô hiển thị bo góc và thanh gạch chân */}
                          <div className="flex items-center justify-between gap-2 sm:gap-2.5 w-full">
                            {[0, 1, 2, 3, 4, 5].map((index) => {
                              const digit = regOtp[index] || '';
                              const isCurrent = regOtp.length === index;
                              const isFilled = Boolean(digit);
                              const isError = Boolean(formError || fieldErrors['register-otp']);

                              let boxClass = 'bg-white border-2 border-brand-navy-800 text-brand-navy-900';
                              let underlineClass = 'bg-brand-navy-800';

                              if (isError) {
                                boxClass = 'bg-white border-2 border-brand-danger-400 text-brand-danger-600 shadow-xs';
                                underlineClass = 'bg-brand-danger-600';
                              } else if (isCurrent) {
                                boxClass = 'bg-white border-2 border-brand-navy-700 text-brand-navy-900 ring-4 ring-brand-navy-700/20 shadow-sm scale-[1.04]';
                                underlineClass = 'bg-brand-navy-700';
                              } else if (isFilled) {
                                boxClass = 'bg-white border-2 border-brand-navy-800 text-brand-navy-900 shadow-xs';
                                underlineClass = 'bg-brand-navy-800';
                              }

                              return (
                                <div key={index} className="flex flex-col items-center flex-1">
                                  <div
                                    className={`w-full h-[64px] sm:h-[70px] rounded-[20px] flex items-center justify-center text-2xl sm:text-3xl font-extrabold transition-all duration-150 select-none ${boxClass}`}
                                  >
                                    {digit ? (
                                      digit
                                    ) : isCurrent ? (
                                      <span className="w-0.5 h-6 bg-brand-navy-700 animate-pulse rounded-full" />
                                    ) : null}
                                  </div>

                                  {/* Thanh gạch chân (Underline Bar) */}
                                  <div className={`w-5 h-[2.5px] rounded-full mt-2 transition-all duration-200 ${underlineClass}`} />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Nút hành động nhanh: Dán mã từ email & Sao chép mã */}
                        <div className="flex items-center justify-center gap-2 mt-2 mb-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const text = await navigator.clipboard.readText();
                                const match = text.trim().match(/\d{6}/);
                                const digits = match ? match[0] : text.replace(/[^0-9]/g, '').slice(0, 6);
                                if (digits) {
                                  updateField('register-otp', digits, setRegOtp);
                                }
                              } catch {}
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-brand-navy-800 bg-brand-navy-50 hover:bg-brand-navy-100 border border-brand-navy-200 transition-colors cursor-pointer"
                            title="Dán nhanh mã 6 chữ số từ email"
                          >
                            <svg className="w-3.5 h-3.5 text-brand-navy-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>Dán mã từ email</span>
                          </button>
                          {regOtp.length === 6 && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(regOtp);
                                } catch {}
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-brand-navy-700 bg-brand-navy-100 hover:bg-brand-navy-200 border border-brand-navy-200 transition-colors cursor-pointer"
                              title="Sao chép mã OTP"
                            >
                              <svg className="w-3.5 h-3.5 text-brand-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span>Sao chép mã</span>
                            </button>
                          )}
                        </div>

                        {/* Thông báo lỗi dạng pill đỏ (Ảnh 4: "! That code didn't match. Try again.") */}
                        {(formError || fieldErrors['register-otp']) && (
                          <div role="alert" aria-live="assertive" className="flex items-center justify-center gap-1.5 text-xs sm:text-[13px] font-semibold text-brand-danger-600 mt-2 mb-3">
                            <svg className="w-4 h-4 text-brand-danger-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-10v6h2V7h-2z" clipRule="evenodd" />
                            </svg>
                            <span>{formError || fieldErrors['register-otp'] || "That code didn't match. Try again."}</span>
                          </div>
                        )}

                        {/* Nút xác thực chính (Ảnh 2: "Verifying" xoay tròn / Ảnh 4: "Verify code") */}
                        <div className="mt-4 mb-2">
                          {isSubmitting ? (
                            <button
                              type="button"
                              disabled
                              className="w-full h-12 sm:h-13 rounded-2xl font-bold text-white bg-brand-navy-700 opacity-95 shadow-lg shadow-brand-navy-700/25 flex items-center justify-center gap-2 cursor-wait"
                            >
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span className="tracking-wide">Verifying</span>
                            </button>
                          ) : (
                            <button
                              type="submit"
                              form="register-form"
                              disabled={isSubmitting}
                              className="w-full h-12 sm:h-13 rounded-2xl font-bold text-white bg-brand-navy-700 hover:bg-brand-navy-800 shadow-lg shadow-brand-navy-700/25 flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer"
                            >
                              <span>Verify code</span>
                            </button>
                          )}
                        </div>

                        {/* Dòng gửi lại mã ở chân modal (Ảnh 2 & 4: "Didn't get a code? ⭮ Resend in 0:xx") */}
                        <div className="mt-3 text-xs sm:text-[13px] text-brand-navy-500 flex items-center justify-center gap-1.5" aria-live="polite">
                          <span>Didn't get a code?</span>
                          {resendSeconds > 0 ? (
                            <span className="inline-flex items-center gap-1 font-medium text-brand-navy-700">
                              <svg className="w-3.5 h-3.5 text-brand-navy-700 animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                              </svg>
                              <span>Resend in 0:{resendSeconds < 10 ? `0${resendSeconds}` : resendSeconds}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={handleResendVerification}
                              className="font-bold text-brand-navy-700 hover:underline cursor-pointer focus:outline-none"
                            >
                              Resend now
                            </button>
                          )}
                        </div>
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
          <span>
            Hỗ trợ 24/7:{' '}
            <a href="tel:0859859367" className="font-semibold text-white hover:text-red-400 transition-colors rounded">
              0859 859 367
            </a>
          </span>
          <span aria-hidden="true">•</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-emerald-400">lock</span>
            Bảo mật 256-bit SSL
          </span>
        </div>
      </section>

      {/* Modals hỗ trợ dự phòng */}
      <GoogleLoginModal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} onSuccess={user => redirectToRoleDashboard(user.role)} />
      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} onResetSuccess={email => { setLoginEmail(email); clearFormFeedback(); handleTabChange('login'); }} />
    </div>
  );
}

export default LoginPage;
