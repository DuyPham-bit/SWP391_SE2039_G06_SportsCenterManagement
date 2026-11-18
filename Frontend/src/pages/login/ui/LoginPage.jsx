import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { useAuth, authApi } from '../../../entities/session/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { isAsciiPassword, PASSWORD_CHARACTER_ERROR, PASSWORD_RULES } from '../../../shared/lib/passwordPolicy.js';
import { loadGoogleIdentity, googleClientId } from '../../../shared/lib/googleIdentity.js';
import { AuthField, ForgotPasswordModal, GoogleLoginModal } from '../../../features/auth/index.js';
import { Logo } from '../../../shared/ui/Logo.jsx';
import { OtpDialogContent, OTP_CARD_CLASS, withMinDuration } from '../../../shared/ui/OtpCode.jsx';
import { getMembershipIntent, getPostLoginRoute } from '../../../entities/membership/index.js';
import { useLandingContent } from '../../../entities/landing-content/index.js';
import { CountUp } from '../../../shared/ui/CountUp.jsx';
import { prefersReducedMotion } from '../../../shared/lib/motion.js';
import { useCan3D, SplitWords, TiltCard, MagneticLink, AnimatedCheckbox, useTilt } from './authMotion.jsx';
import { playAuthTransition } from '../lib/authTransition.js';
import './auth-experience.css';

// The stadium scene (three.js) is fetched only on capable desktops, after the page has painted.
const AuthHeroScene = lazy(() => import('./AuthHeroScene.jsx'));

const DUST = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 41) % 100}%`, s: `${2 + (i % 3)}px`, t: `${12 + (i % 5) * 2}s`, dl: `${-(i * 1.6).toFixed(1)}s`, dx: `${((i % 5) - 2) * 14}px`,
}));

/** Left-panel backdrop: intentional emerald/teal radial ambient glow + subtle gold particles (no stray streaks). */
function HeroFallback({ posterUrl, videoUrl }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="lp-layer" data-depth="1">
        {(videoUrl || posterUrl) && (
          <video autoPlay loop muted playsInline className="lp-drift h-full w-full object-cover opacity-35" poster={posterUrl || undefined}>
            {videoUrl && <source src={videoUrl} type={/\.webm($|\?)/i.test(videoUrl) ? 'video/webm' : 'video/mp4'} />}
          </video>
        )}
      </div>
      <div className="lp-layer" data-depth="2">
        <div className="lp-breathe absolute -left-24 top-[6%] h-[460px] w-[460px] rounded-full bg-brand-sage-700/25 blur-[130px]" />
        <div className="absolute -right-24 bottom-[4%] h-[400px] w-[400px] rounded-full bg-brand-teal-500/15 blur-[135px]" />
      </div>
      <div className="lp-layer lp-dust" data-depth="4">
        {DUST.map((d, i) => <span key={i} style={{ left: d.left, '--s': d.s, '--t': d.t, '--dl': d.dl, '--dx': d.dx }} />)}
      </div>
    </div>
  );
}


/** Splits the showcase title into a lead and a sand-coloured second line: at "\n", else after the first comma. */
function splitHeadline(title = '') {
  const text = String(title).trim();
  const nl = text.indexOf('\n');
  if (nl >= 0) return [text.slice(0, nl).trim(), text.slice(nl + 1).trim()];
  const comma = text.indexOf(',');
  if (comma > 0 && comma < text.length - 1) return [text.slice(0, comma + 1), text.slice(comma + 1).trim()];
  return [text, ''];
}

/** Sport names taken from the real zone list ("Khu B: Bóng Rổ, Cầu Lông & Bóng Bàn"). */
function sportsFromZones(zones) {
  const names = (zones || []).flatMap(zone =>
    String(zone?.name || '').replace(/^[^:]*:\s*/, '').split(/\s*(?:,|&)\s*/)
  ).map(name => name.trim()).filter(Boolean);
  return [...new Set(names)];
}

function SportsMarquee({ sports, className = '' }) {
  if (sports.length < 3) return null;
  const row = (hidden) => (
    <ul className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={hidden || undefined}>
      {sports.map(sport => (
        <li key={sport} className="flex items-center gap-8 whitespace-nowrap text-sm font-semibold tracking-tight text-brand-sand-100/90">
          <span className="lp-marquee-item inline-block cursor-default">{sport}</span>
          <span className="h-1.5 w-1.5 rotate-45 rounded-[2px] bg-brand-sand-300 shadow-[0_0_8px_rgb(var(--brand-sand-300)/0.65)]" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`lp-marquee relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] py-3 backdrop-blur-md [mask-image:linear-gradient(90deg,transparent,rgb(255_255_255)_12%,rgb(255_255_255)_88%,transparent)] ${className}`}>
      <p className="sr-only">Các bộ môn: {sports.join(', ')}</p>
      <div className="lp-marquee-track flex w-max">
        {row(true)}{row(true)}
      </div>
    </div>
  );
}

/** Court markings on the cream panel: drawn in once (stroke-dashoffset), then drift with the pointer. */
function CourtLines() {
  return (
    <div className="lp-court-wrap absolute inset-0">
      <svg
        aria-hidden="true"
        viewBox="0 0 610 1340"
        preserveAspectRatio="xMidYMid meet"
        className="lp-court pointer-events-none absolute left-1/2 top-1/2 h-[145%] -translate-x-1/2 -translate-y-1/2 -rotate-[24deg] text-brand-sage-700 opacity-[0.09] dark:text-brand-sand-100 dark:opacity-[0.06]"
        fill="none" stroke="currentColor" strokeWidth="4.5"
      >
        <rect x="5" y="5" width="600" height="1330" pathLength="1" />
        <path d="M50 5V1335M560 5V1335" pathLength="1" />
        <path d="M5 670H605" pathLength="1" strokeWidth="8" />
        <path d="M5 472H605M5 868H605" pathLength="1" />
        <path d="M5 81H605M5 1259H605" pathLength="1" />
        <path d="M305 5V472M305 868V1335" pathLength="1" />
        <circle cx="305" cy="670" r="92" pathLength="1" />
      </svg>
    </div>
  );
}

const gisCallback = { current: null, initialized: false };
const REMEMBERED_EMAIL_KEY = 'SCMS_REMEMBERED_EMAIL';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Login accepts what the backend accepts: email, phone number (any common spelling) or username.
const PHONE_LOGIN_PATTERN = /^\+?[0-9 ().-]{8,20}$/;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,100}$/;
const REGISTER_PHONE_PATTERN = /^(0\d{9}|\+84\d{9})$/;
// Short labels for the live password chips (same rules as PASSWORD_RULES / backend).
const PASSWORD_CHIP_LABELS = { length: '6+ ký tự', case: 'Aa', digit: '123', symbol: '#@!' };
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

  // Showcase copy comes from the published home content (GET /api/home-content?lang=…); no fallback text.
  const showcaseBadge = authShowcase.badge || '';
  const showcaseTagline = authShowcase.tagline || '';
  const showcaseLoginTitle = authShowcase.loginTitle || '';
  const showcaseRegisterTitle = authShowcase.registerTitle || '';
  const showcaseDescription = authShowcase.description || '';
  const showcasePosterUrl = authShowcase.posterUrl || '';
  const authVideoUrl = authShowcase.videoUrl || landingContent?.heroBanner?.videoUrl || '';

  const feature1Title = authShowcase.feature1Title || '';
  const feature1Desc = authShowcase.feature1Desc || '';
  const feature1Icon = authShowcase.feature1Icon || '';

  const feature2Title = authShowcase.feature2Title || '';
  const feature2Desc = authShowcase.feature2Desc || '';
  const feature2Icon = authShowcase.feature2Icon || '';

  const stat1Value = authShowcase.stat1Value || '';
  const stat1Label = authShowcase.stat1Label || '';

  const stat2Value = authShowcase.stat2Value || '';
  const stat2Label = authShowcase.stat2Label || '';

  const stat3Value = authShowcase.stat3Value || '';
  const stat3Label = authShowcase.stat3Label || '';
  const sports = sportsFromZones(landingContent?.zonesLayout?.zones);

  // Cursor spotlight on the showcase: one CSS variable pair, updated once per frame.
  const asideRef = useRef(null);
  const spotFrame = useRef(0);
  const moveSpotlight = event => {
    const el = asideRef.current;
    if (!el || spotFrame.current || event.pointerType === 'touch') return;
    const { clientX, clientY } = event;
    spotFrame.current = requestAnimationFrame(() => {
      spotFrame.current = 0;
      const box = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${clientX - box.left}px`);
      el.style.setProperty('--my', `${clientY - box.top}px`);
      // Normalised pointer (-1…1) for the parallax layers and the court drift.
      el.style.setProperty('--px', ((clientX / window.innerWidth) * 2 - 1).toFixed(3));
      el.style.setProperty('--py', ((clientY / window.innerHeight) * 2 - 1).toFixed(3));
    });
  };

  const can3D = useCan3D();
  const [sceneReady, setSceneReady] = useState(false);
  const cardTiltRef = useTilt(3);
  // Tab content slides in from the side of the tab that was picked.
  const [slideDir, setSlideDir] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);

  const membershipIntent = useRef(getMembershipIntent(window.location.hash));
  const redirectToRoleDashboard = role => {
    window.location.hash = getPostLoginRoute(role, membershipIntent.current);
  };
  // Success hand-off: the button morphs into a tick, then a green sheet sweeps over and the route changes.
  const finishAuth = async role => {
    setAuthSuccess(true);
    if (!prefersReducedMotion()) await new Promise(resolve => setTimeout(resolve, 560));
    playAuthTransition(() => redirectToRoleDashboard(role));
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
  // Fallback button only when GIS is not configured or failed to load (no flash of two buttons while it loads).
  const [googleRendered, setGoogleRendered] = useState(googleClientId ? null : false); // null = loading, true = GIS button, false = fallback

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
    if (window.location.hash.includes('logout=true') || (isAuthenticated && role === 'GUEST')) {
      logout();
      window.location.hash = '#/login';
      return;
    }
    // Đang chạy animation xác thực thành công: handleRegisterSubmit tự chuyển trang sau đó
    if (isAuthenticated && !holdAuthRedirectRef.current) redirectToRoleDashboard(role);
  }, [isAuthenticated, role, logout]);

  // GIS is initialised once per page load (re-initialising logs a GSI warning); the callback always
  // reaches the mounted LoginPage through the module-level handler.
  gisCallback.current = async (response) => {
    if (!response?.credential) return;
    setGoogleLoading(true);
    setFormError('');
    holdAuthRedirectRef.current = true;
    try {
      const user = await loginWithGoogle({ credential: response.credential });
      showSuccess('Đăng nhập thành công!');
      await finishAuth(user.role || 'MEMBER');
    } catch (err) {
      holdAuthRedirectRef.current = false;
      setFormError(err.payload?.message || err.message || 'Đăng nhập Google thất bại.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Render nút Google Identity trực tiếp trên trang
  useEffect(() => {
    let cancelled = false;
    async function initGoogle() {
      if (!googleClientId) return;
      try {
        await loadGoogleIdentity();
        if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;
        if (!gisCallback.initialized) {
          gisCallback.initialized = true;
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: response => gisCallback.current?.(response),
          });
        }
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          // GIS caps width at 400px; match the form column so it lines up with inputs
          width: Math.min(400, googleButtonRef.current.offsetWidth || 320),
          text: isRegister ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
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

  const clearFormFeedback = () => {
    setFieldErrors({});
    setFormError('');
    setRegOtpNotice('');
  };

  const handleTabChange = tab => {
    if (isSubmitting || tab === activeTab) return;
    clearFormFeedback();
    setSlideDir(tab === 'register' ? 'next' : 'prev');
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

  const updateField = (field, value, setter) => {
    setter(value);
    if (field === 'register-email' || field === 'register-phone') {
      setVerificationEmail('');
      setVerificationPhone('');
      setRegOtp('');
    }
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
    holdAuthRedirectRef.current = true;
    try {
      const user = await login(identifier, loginPassword);
      saveRememberedEmail(rememberEmail ? identifier : '');
      showSuccess('Đăng nhập thành công!');
      await finishAuth(user.role);
    } catch (error) {
      holdAuthRedirectRef.current = false;
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
      playAuthTransition(() => redirectToRoleDashboard(user.role || 'MEMBER'));
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
      disabled={isSubmitting || authSuccess}
      aria-live="polite"
      className={`lp-btn group relative overflow-hidden select-none w-full min-h-[52px] py-3 px-6 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 to-brand-teal-500 bg-[length:160%_100%] bg-left hover:bg-right text-white shadow-[0_10px_24px_-10px_rgb(var(--brand-sage-900)/0.55)] hover:shadow-[0_16px_34px_-12px_rgb(var(--brand-teal-600)/0.6)] hover:-translate-y-px transition-[background-position,box-shadow,transform] duration-500 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage-700 focus-visible:ring-offset-2 disabled:pointer-events-none ${authSuccess ? 'is-success' : 'disabled:opacity-70'}`}
    >
      <span className="lp-btn-label flex items-center justify-center gap-2">
        {isSubmitting && !authSuccess && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        <span>
          {isSubmitting
            ? (isRegister ? 'Đang xử lý...' : 'Đang đăng nhập...')
            : isRegister
              ? (needsEmailCode ? 'Xác thực & Tạo tài khoản' : 'Tiếp tục đăng ký')
              : <>Đăng nhập<span className="hidden sm:inline"> vào Olympic Sports Arena</span></>}
        </span>
        {!isSubmitting && (
          <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
            arrow_forward
          </span>
        )}
      </span>
      <span className="lp-btn-check" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" strokeOpacity=".35" />
          <path d="M7 12.5l3.2 3.2L17 9" pathLength="1" />
        </svg>
      </span>
      {authSuccess && <span className="sr-only">Thành công</span>}
    </button>
  );

  const [headLead, headAccent] = splitHeadline(isRegister ? showcaseRegisterTitle : showcaseLoginTitle);
  const headLeadWords = headLead.split(/\s+/).filter(Boolean).length;

  return (
    <MotionConfig reducedMotion="user">
    <div ref={asideRef} onPointerMove={moveSpotlight} className="auth-root min-h-screen lg:h-screen w-full relative flex flex-col lg:flex-row overflow-x-hidden font-sans select-text bg-brand-sand-100 dark:bg-brand-navy-950 text-brand-navy-900 dark:text-white">
      {/* ========================================================
          CỘT TRÁI: SÂN VẬN ĐỘNG 3D (three.js, lazy) · fallback parallax
          ======================================================== */}
      <aside className="hidden lg:flex lg:w-[53%] xl:w-[55%] 2xl:w-[56%] h-full relative z-10 flex-col p-8 xl:p-12 2xl:px-16 select-none shrink-0 overflow-hidden bg-brand-forest-950 text-white">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <HeroFallback posterUrl={can3D ? '' : showcasePosterUrl} videoUrl={can3D ? '' : authVideoUrl} />
          {can3D && (
            <div className={`lp-scene absolute inset-0 ${sceneReady ? 'is-ready' : ''}`}>
              <Suspense fallback={null}>
                <AuthHeroScene onReady={() => setSceneReady(true)} />
              </Suspense>
            </div>
          )}
          {/* Subtle intentional vignettes keeping foreground copy crisp */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-forest-950/75 via-brand-forest-950/10 to-brand-forest-950/75" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-forest-950/80 via-brand-forest-950/30 to-transparent" />
          <div className="lp-spot absolute inset-0" />
        </div>
        <div className="absolute right-0 inset-y-0 w-px bg-gradient-to-b from-transparent via-brand-sand-300/25 to-transparent pointer-events-none z-10" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-[700px] xl:max-w-[760px] mx-auto h-full flex flex-col justify-between gap-5 xl:gap-6">
          <div className="lp-in flex items-center justify-between gap-4">
            <Logo variant="dark" size="lg" />
            {showcaseBadge && (
              <div className="lp-ring-border inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-brand-forest-950/60 backdrop-blur-xl text-[13px] font-semibold text-white shadow-lg">
                <span className="lp-pulse" aria-hidden="true"><i /></span>
                <span>{showcaseBadge}</span>
              </div>
            )}
          </div>

          <div className="my-auto flex flex-col gap-5 py-2 max-w-[500px] xl:max-w-[540px] 2xl:max-w-[580px]">
            {showcaseTagline && (
              <div style={{ '--d': '80ms' }} className="lp-in lp-ring-border self-start inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-sage-700/35 backdrop-blur-xl text-xs font-bold uppercase tracking-[0.14em] text-brand-sand-100 shadow-sm">
                <span className="lp-pulse scale-75" aria-hidden="true"><i /></span>
                <span>{showcaseTagline}</span>
              </div>
            )}

            <h2 key={`hero-${activeTab}`} className="font-sans text-4xl/[1.06] xl:text-[52px]/[1.05] 2xl:text-[58px]/[1.05] font-extrabold tracking-[-0.02em] text-white [text-wrap:balance] drop-shadow-[0_4px_24px_rgb(var(--brand-forest-950)/0.65)]">
              <SplitWords text={headLead} start={160} step={65} />
              {headAccent && (
                <>
                  <br />
                  <span className="lp-shimmer pb-1" style={{ '--wd': `${160 + headLeadWords * 65 + 40}ms` }}>{headAccent}</span>
                </>
              )}
            </h2>

            <p style={{ '--d': '420ms' }} className="lp-in text-[15px] xl:text-base text-brand-sand-100/80 leading-[1.6] max-w-[56ch] font-normal">
              {showcaseDescription}
            </p>

            <div style={{ '--d': '520ms' }} className="lp-in grid sm:grid-cols-2 gap-4 pt-1 [perspective:900px]">
              {[
                { icon: feature1Icon, title: feature1Title, desc: feature1Desc, tone: 'bg-brand-sand-300/15 text-brand-sand-300 border-brand-sand-300/30' },
                { icon: feature2Icon, title: feature2Title, desc: feature2Desc, tone: 'bg-brand-teal-500/15 text-brand-teal-400 border-brand-teal-500/30' },
              ].map((card, i) => (
                <TiltCard key={i} max={6} className="lp-spot-card relative overflow-hidden p-4 rounded-2xl backdrop-blur-xl group">
                  <div className="flex items-center gap-3.5">
                    <span className={`lp-icon w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${card.tone}`}>
                      <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{card.icon}</span>
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white tracking-wide leading-snug">{card.title}</h4>
                      <p className="text-[12.5px] text-brand-sand-100/80 mt-0.5 font-normal leading-snug">{card.desc}</p>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>

            {/* Dải bộ môn chạy ngang (từ danh sách khu tập thật); fallback dải cam kết */}
            {sports.length >= 3 ? <div style={{ '--d': '620ms' }} className="lp-in"><SportsMarquee sports={sports} /></div> : (
              <div style={{ '--d': '620ms' }} className="lp-in px-4 py-3 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-brand-sand-100/85">
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-brand-sage-300" aria-hidden="true">verified_user</span>
                  Đăng ký hội viên trực tuyến
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-brand-sand-300" aria-hidden="true">calendar_month</span>
                  Đặt lịch tập linh hoạt
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-brand-sage-300" aria-hidden="true">monitoring</span>
                  Theo dõi chỉ số InBody
                </span>
              </div>
            )}
          </div>

          {/* Footer cột trái: số liệu count-up + vạch sáng đồng nhất */}
          <div style={{ '--d': '700ms' }} className="lp-in pt-6 flex items-end justify-between gap-6 border-t border-white/10">
            <div className="grid grid-cols-3 divide-x divide-white/10 [&>div]:px-6 [&>div:first-child]:pl-0 [&>div:last-child]:pr-0">
              {[
                { value: stat1Value, label: stat1Label, delay: 720, gold: false },
                { value: stat2Value, label: stat2Label, delay: 840, gold: false },
                { value: stat3Value, label: stat3Label, delay: 960, gold: true },
              ].map((stat, i) => (
                <div key={i} className="min-w-0">
                  <div className={`font-sans text-2xl sm:text-3xl xl:text-[34px] tabular-nums font-extrabold tracking-tight leading-none ${stat.gold ? 'text-brand-sand-300 drop-shadow-[0_0_14px_rgb(var(--brand-sand-300)/0.35)]' : 'text-white'}`}>
                    <CountUp value={stat.value} delay={stat.delay} />
                  </div>
                  <div className="lp-statbar" style={{ '--d': `${1.2 + i * 0.4}s` }} aria-hidden="true" />
                  <div className="text-[12.5px] text-brand-sand-100/80 font-medium mt-2 truncate">{stat.label}</div>
                </div>
              ))}
            </div>

            <MagneticLink
              href="#khoa-hoc"
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-sand-100/10 hover:bg-brand-sand-300 hover:text-brand-forest-950 border border-brand-sand-100/25 hover:border-brand-sand-300 text-sm font-bold text-brand-sand-100 shadow-lg backdrop-blur-md"
            >
              <span>Khám phá</span>
              <span className="lp-arrow material-symbols-outlined text-[17px]" aria-hidden="true">arrow_forward</span>
            </MagneticLink>
          </div>
        </div>
      </aside>

      {/* Mobile (<lg): cột showcase thu thành header xanh ngắn (không chạy 3D / tilt) */}
      <header className="lg:hidden relative z-10 overflow-hidden rounded-b-[28px] bg-brand-forest-950 px-4 sm:px-6 pt-4 pb-5 text-white shadow-[0_18px_40px_-22px_rgb(var(--brand-forest-950)/0.85)]">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 -left-16 h-60 w-60 rounded-full bg-brand-sage-700/45 blur-[80px]" />
          <div className="absolute -bottom-28 right-0 h-60 w-60 rounded-full bg-brand-teal-500/20 blur-[90px]" />
        </div>
        <div className="relative w-full max-w-[496px] mx-auto">
          <div className="lp-in flex items-center justify-between gap-3">
            <Logo variant="dark" size="sm" />
            <a href="#/" className="inline-flex items-center gap-1.5 min-h-[40px] py-2 px-3.5 rounded-full text-[13px] font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sand-300">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
              <span>Về trang chủ</span>
            </a>
          </div>
          <p key={`m-hero-${activeTab}`} className="mt-4 font-sans text-[26px]/[1.1] sm:text-4xl/[1.1] font-extrabold tracking-[-0.02em] [text-wrap:balance]">
            <SplitWords text={headLead} start={100} step={55} />
            {headAccent && <> <span className="lp-shimmer" style={{ '--wd': `${100 + headLeadWords * 55 + 40}ms` }}>{headAccent}</span></>}
          </p>
          <div style={{ '--d': '160ms' }} className="lp-in"><SportsMarquee sports={sports} className="mt-4" /></div>
        </div>
      </header>

      {/* ========================================================
          CỘT PHẢI: NỀN KEM + VẠCH SÂN, CARD FORM 3D
          ======================================================== */}
      <section
        aria-labelledby="auth-heading"
        className="flex-1 lg:h-full relative z-10 flex flex-col justify-between overflow-y-auto overflow-x-hidden px-4 py-6 sm:p-8 lg:p-8 xl:p-10"
      >
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <CourtLines />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgb(var(--brand-sand-50)/0.85),transparent_65%)] dark:bg-none" />
        </div>

        <div className="lp-in relative z-10 w-full max-w-[496px] mx-auto hidden lg:flex items-center justify-between gap-4 shrink-0">
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-brand-sage-700/15 dark:border-white/15 text-xs font-semibold text-brand-sage-900 dark:text-brand-sand-100 shadow-sm">
            <span className="lp-pulse scale-75" aria-hidden="true"><i /></span>
            Cổng hội viên Olympic
          </span>
          <MagneticLink
            href="#/"
            strength={0.22}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full text-[13px] font-semibold text-brand-sage-900 dark:text-white bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-xl shadow-sm hover:shadow-md border border-brand-sage-700/15 dark:border-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage-700"
          >
            <span className="lp-arrow material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
            <span>Về trang chủ</span>
          </MagneticLink>
        </div>

        {/* Card form: vào bằng rotateX 12° → 0, tilt ±3° theo chuột, border 3px gradient đầy đủ mép trên */}
        <div className="lp-card-stage relative my-auto py-4 w-full max-w-[496px] mx-auto z-10">
          <div aria-hidden="true" className="lp-halo pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-[radial-gradient(closest-side,rgb(var(--brand-sage-700)/0.18),rgb(var(--brand-sand-300)/0.24)_55%,transparent)] blur-2xl" />
          <div style={{ '--d': '160ms' }} className="lp-card-enter">
          <div ref={cardTiltRef} className="lp-card-tilt">
          <motion.div
            layout
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden bg-white dark:bg-brand-navy-900 rounded-3xl p-6 sm:p-8 border border-brand-sage-700/12 dark:border-white/10"
          >
            <span className="lp-topline" aria-hidden="true" />
            {/* Tab chuyển đổi Đăng nhập / Đăng ký */}
            <div className="relative flex gap-1.5 rounded-2xl bg-brand-sand-100 dark:bg-brand-navy-950 p-1.5 mb-6 border border-brand-sage-700/10 dark:border-white/10" role="group" aria-label="Chọn đăng nhập hoặc đăng ký">
              <span
                aria-hidden="true"
                className="lp-tab-pill absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-0.5rem)] rounded-xl bg-gradient-to-r from-brand-sage-700 to-brand-teal-600 shadow-[0_6px_16px_-6px_rgb(var(--brand-sage-900)/0.55)] motion-reduce:transition-none"
                style={{ transform: isRegister ? 'translateX(calc(100% + 0.375rem))' : 'translateX(0)' }}
              />
              {[{ id: 'login', label: 'Đăng nhập' }, { id: 'register', label: 'Đăng ký' }].map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={isActive}
                    disabled={isSubmitting}
                    onClick={() => handleTabChange(tab.id)}
                    data-no-ripple
                    className={
                      'relative z-10 flex-1 min-h-[44px] rounded-xl text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage-700 disabled:opacity-60 ' +
                      (isActive
                        ? 'text-white font-bold'
                        : 'text-brand-navy-700 dark:text-brand-navy-300 hover:text-brand-sage-900 dark:hover:text-white hover:bg-white/75 dark:hover:bg-white/10 font-medium')
                    }
                  >
                    {isActive && <span className="lp-tick w-1.5 h-1.5 rounded-full bg-brand-sand-300 inline-block shadow-[0_0_8px_rgb(var(--brand-sand-300)/0.9)]" />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tiêu đề & Lời chào thân thiện */}
            <div key={`head-${activeTab}`} className={`${slideDir ? `lp-slide-${slideDir}` : 'lp-swap'} mb-5`}>
              <h1 id="auth-heading" className="font-sans text-2xl sm:text-[28px] font-extrabold text-brand-navy-900 dark:text-white tracking-[-0.02em] leading-tight [text-wrap:balance]">
                <span>{isRegister ? 'Gia nhập Olympic Sports Arena' : 'Chào mừng trở lại!'}</span>
              </h1>
              <p className="text-sm text-brand-navy-600 dark:text-brand-navy-300 mt-1.5 leading-snug [text-wrap:pretty]">
                {isRegister
                  ? 'Tạo tài khoản để khám phá khóa học, đặt sân và bắt đầu tập luyện.'
                  : 'Đăng nhập để quản lý lịch tập, đặt sân và theo dõi tiến độ của bạn.'}
              </p>
            </div>

            {/* Nút Đăng nhập Google đồng nhất 100% với form (52px, bo góc 12px, full-width, không bị tràn 390px) */}
            <div className="w-full flex flex-col items-center justify-center mb-4">
              <div className={`lp-google relative w-full h-[52px] overflow-hidden rounded-xl border border-brand-navy-200 hover:border-brand-sage-700/45 bg-brand-sand-50 hover:bg-white dark:border-white/15 dark:bg-white/[0.06] dark:hover:bg-white/10 shadow-xs transition-colors ${googleLoading ? 'pointer-events-none opacity-45' : ''}`}>
                {/* Visual unified button layer matching inputs */}
                <button
                  type="button"
                  disabled={isSubmitting || googleLoading}
                  onClick={() => { if (!googleRendered) setShowGoogleModal(true); }}
                  aria-hidden={googleRendered === true ? true : undefined}
                  tabIndex={googleRendered === true ? -1 : 0}
                  className="w-full h-full px-4 inline-flex items-center justify-center gap-3 text-sm font-semibold text-brand-navy-900 dark:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage-700"
                >
                  <svg className="w-5 h-5 shrink-0" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
                  </svg>
                  <span>{isRegister ? 'Đăng ký với Google' : 'Tiếp tục với Google'}</span>
                </button>

                {/* Real Google Identity iframe overlaid interactively when GSI is active */}
                {googleRendered !== false && (
                  <div
                    ref={googleButtonRef}
                    className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden opacity-[0.005] cursor-pointer [&_iframe]:scale-125"
                    aria-label={isRegister ? 'Đăng ký với Google' : 'Tiếp tục với Google'}
                  />
                )}
              </div>

              {googleLoading && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-sage-700 dark:text-brand-sage-300 mt-2 animate-pulse">
                  <svg className="animate-spin h-3.5 w-3.5 text-brand-sage-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang xác thực tài khoản Google...</span>
                </div>
              )}
            </div>

            {/* Dòng phân cách "hoặc qua email" */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-brand-navy-200 dark:border-white/15 w-full" />
              <span className="bg-white dark:bg-brand-navy-900 px-3 text-[11.5px] uppercase tracking-wider text-brand-navy-600 dark:text-brand-navy-400 font-semibold shrink-0">
                hoặc qua email
              </span>
              <div className="border-t border-brand-navy-200 dark:border-white/15 w-full" />
            </div>

            {/* Thông báo lỗi tổng quát */}
            {formError && (
              <div
                key={formError}
                role="alert"
                className="lp-msg-in mb-4 p-3 rounded-xl bg-brand-danger-50 border border-brand-danger-200 text-brand-danger-700 text-xs sm:text-[13px] leading-5 flex items-start gap-2 shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px] text-brand-danger-600 shrink-0 mt-0.5" aria-hidden="true">
                  error
                </span>
                <span className="flex-1">{formError}</span>
              </div>
            )}

            {/* Form Đăng nhập / Đăng ký */}
            <AnimatePresence mode="wait" initial={false}>
            {!isRegister ? (
              <motion.form
                key="login"
                id="login-form"
                initial={prefersReducedMotion() ? false : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReducedMotion() ? undefined : { opacity: 0, x: 16 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className={slideDir ? 'lp-slide-prev' : 'lp-swap'}
                onSubmit={handleLoginSubmit}
                noValidate
                aria-labelledby="auth-heading"
                aria-busy={isSubmitting}
              >
                <fieldset disabled={isSubmitting} className="space-y-4 min-w-0">
                  <AuthField
                    key="login-email"
                    floating
                    icon="alternate_email"
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
                    floating
                    icon="lock"
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
                    <label htmlFor="remember-email" className="flex items-center gap-2 cursor-pointer text-brand-navy-700 dark:text-brand-navy-300 hover:text-brand-navy-900">
                      <AnimatedCheckbox
                        id="remember-email"
                        checked={rememberEmail}
                        onChange={event => {
                          setRememberEmail(event.target.checked);
                          if (!event.target.checked) saveRememberedEmail('');
                        }}
                      />
                      <span className="font-medium">Ghi nhớ email</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="font-bold text-brand-sage-700 hover:text-brand-sage-900 dark:text-brand-sage-300 dark:hover:text-brand-sage-200 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage-700 rounded px-1"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  <div className="pt-1">
                    {submitButton}
                  </div>
                </fieldset>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                id="register-form"
                initial={prefersReducedMotion() ? false : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReducedMotion() ? undefined : { opacity: 0, x: -16 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className={slideDir ? 'lp-slide-next' : 'lp-swap'}
                onSubmit={handleRegisterSubmit}
                noValidate
                aria-labelledby="auth-heading"
                aria-busy={isSubmitting}
              >
                <fieldset disabled={isSubmitting} className="space-y-3 min-w-0">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <AuthField key="register-name" floating icon="badge" id="register-name" label="Họ và tên" check={{ ok: regFullName.trim().length >= 2, hint: 'Nhập đầy đủ họ tên' }} autoComplete="name" maxLength={150} placeholder="Nguyễn Văn A" required value={regFullName} error={fieldErrors['register-name']} onChange={event => updateField('register-name', event.target.value, setRegFullName)} />
                    <AuthField key="register-phone" floating icon="call" id="register-phone" label="Số điện thoại" check={{ ok: REGISTER_PHONE_PATTERN.test(regPhone.replace(/[\s().-]/g, '')), hint: '10 số, bắt đầu bằng 0' }} type="tel" autoComplete="tel" maxLength={20} placeholder="0901234567" value={regPhone} error={fieldErrors['register-phone']} onChange={event => updateField('register-phone', event.target.value, setRegPhone)} />
                  </div>
                  <AuthField key="register-email" floating icon="mail" id="register-email" label="Địa chỉ Email" check={{ ok: EMAIL_PATTERN.test(regEmail.trim()), hint: 'Chưa đúng dạng ten@mien.com' }} type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={150} placeholder="ban@example.com" required value={regEmail} error={fieldErrors['register-email']} onChange={event => updateField('register-email', event.target.value, setRegEmail)} />
                  <div>
                    <div className="grid sm:grid-cols-2 gap-3 items-start">
                      <AuthField key="register-password" floating icon="lock" id="register-password" label="Mật khẩu" check={{ ok: PASSWORD_RULES.every(rule => rule.test(regPassword)) }} type="password" autoComplete="new-password" minLength={6} maxLength={128} placeholder="Tạo mật khẩu" hintId="register-password-rule" required value={regPassword} error={fieldErrors['register-password']} onChange={event => updateField('register-password', event.target.value, setRegPassword)} />
                      <AuthField key="register-confirm" floating icon="lock_reset" id="register-confirm" label="Nhập lại mật khẩu" check={{ ok: regConfirmPassword === regPassword, hint: 'Chưa khớp mật khẩu' }} type="password" autoComplete="new-password" maxLength={128} placeholder="Xác nhận mật khẩu" required value={regConfirmPassword} error={fieldErrors['register-confirm']} onChange={event => updateField('register-confirm', event.target.value, setRegConfirmPassword)} />
                    </div>
                    {regPassword && (() => {
                      const level = PASSWORD_RULES.filter(rule => rule.test(regPassword)).length;
                      const bar = level <= 1 ? 'bg-brand-danger-500' : level === 2 ? 'bg-brand-sand-500' : level === 3 ? 'bg-brand-teal-500' : 'bg-brand-sage-700';
                      return (
                        <div id="register-password-rule" className="lp-swap mt-2">
                          <div className="h-1 overflow-hidden rounded-full bg-brand-navy-100 dark:bg-white/10" aria-hidden="true">
                            <div className={`h-full rounded-full transition-all duration-300 ${bar}`} style={{ width: `${level * 25}%` }} />
                          </div>
                          {level < PASSWORD_RULES.length && <ul className="mt-1.5 flex flex-wrap gap-1.5">
                            {PASSWORD_RULES.map(rule => {
                              const ok = rule.test(regPassword);
                              return (
                                <li key={rule.id} title={rule.label} className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors duration-200 ${ok ? 'bg-brand-sage-50 text-brand-sage-700 dark:bg-brand-sage-700/20 dark:text-brand-sage-300' : 'bg-brand-navy-50 text-brand-navy-600 dark:bg-white/5 dark:text-brand-navy-400'}`}>
                                  <span className="material-symbols-outlined text-[13px]" aria-hidden="true">{ok ? 'check' : 'close'}</span>
                                  {PASSWORD_CHIP_LABELS[rule.id] || rule.label}
                                  <span className="sr-only">{`: ${rule.label} ${ok ? '(đã đạt)' : '(chưa đạt)'}`}</span>
                                </li>
                              );
                            })}
                          </ul>}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="pt-0.5">
                    <label htmlFor="register-agree" className="flex items-start gap-2 text-xs leading-[18px] text-brand-navy-700 dark:text-brand-navy-300 cursor-pointer select-none">
                      <AnimatedCheckbox id="register-agree" required checked={regAgree} aria-invalid={Boolean(fieldErrors['register-agree'])} aria-describedby={fieldErrors['register-agree'] ? 'register-agree-error' : undefined} onChange={event => updateField('register-agree', event.target.checked, setRegAgree)} />
                      <span>Tôi xác nhận thông tin là chính xác và đồng ý tạo tài khoản hội viên Olympic Sports Arena.</span>
                    </label>
                    {fieldErrors['register-agree'] && <p id="register-agree-error" className="lp-msg-in text-[11px] text-brand-danger-600 leading-4 mt-0.5">{fieldErrors['register-agree']}</p>}
                  </div>
                  {needsEmailCode && typeof document !== 'undefined' && createPortal(
                    <div
                      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-brand-navy-900/35 backdrop-blur-sm transition-all duration-300"
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="otp-dialog-title"
                      onClick={(e) => {
                        if (e.target === e.currentTarget && !isSubmitting) closeRegisterOtp();
                      }}
                    >
                      {/* Modal OTP sáng */}
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
              </motion.form>
            )}
            </AnimatePresence>

            {/* Chuyển đổi trạng thái tài khoản */}
            <div className="mt-5 text-center text-[13px] leading-5 text-brand-navy-600 dark:text-brand-navy-300">
              {isRegister ? 'Đã có tài khoản?' : 'Bạn chưa có tài khoản?'}{' '}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleTabChange(isRegister ? 'login' : 'register')}
                className="font-bold text-brand-sage-700 hover:text-brand-sage-900 dark:text-brand-sage-300 dark:hover:text-brand-sage-200 underline-offset-4 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage-700 disabled:opacity-60"
              >
                {isRegister ? 'Đăng nhập ngay' : 'Đăng ký hội viên'}
              </button>
            </div>
          </motion.div>
          </div>
          </div>
        </div>

        {/* Chân trang hỗ trợ & Bảo mật */}
        <div className="relative z-10 w-full max-w-[496px] mx-auto pt-3 border-t border-brand-sage-700/15 dark:border-white/15 text-xs text-brand-navy-600 dark:text-brand-navy-300 shrink-0 py-2 leading-5 flex flex-wrap items-center justify-between gap-2">
          {supportPhone ? (
            <span>
              Hỗ trợ 24/7:{' '}
              <a href={`tel:${supportPhone.replace(/\s+/g, '')}`} className="font-semibold text-brand-sage-900 dark:text-white hover:text-brand-sage-700 dark:hover:text-brand-sand-300 transition-colors rounded">
                {supportPhone}
              </a>
            </span>
          ) : (
            <span className="font-semibold text-brand-sage-900 dark:text-white/90">Olympic Sports Arena</span>
          )}
          <span className="flex items-center gap-1 font-medium text-brand-navy-600 dark:text-brand-navy-300">
            <span className="material-symbols-outlined text-[14px] text-brand-sage-700 dark:text-brand-sage-300" aria-hidden="true">lock</span>
            Bảo mật 256-bit SSL
          </span>
        </div>
      </section>

      {/* Modals hỗ trợ dự phòng */}
      <GoogleLoginModal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} onSuccess={user => redirectToRoleDashboard(user.role)} />
      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} onResetSuccess={email => { setLoginEmail(email); clearFormFeedback(); handleTabChange('login'); }} />
    </div>
    </MotionConfig>
  );
}

export default LoginPage;
