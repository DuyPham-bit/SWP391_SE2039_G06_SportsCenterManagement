import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { SUPPORTED_SPORTS } from '../../services/sportsCatalog.js';
import { isAsciiPassword, PASSWORD_CHARACTER_ERROR } from '../../services/passwordPolicy.js';
import { loadGoogleIdentity, googleClientId } from '../../services/googleIdentity.js';
import { AuthField } from './AuthField.js';
import { ForgotPasswordModal } from './ForgotPasswordModal.js';
import { GoogleLoginModal } from './GoogleLoginModal.js';

const REMEMBERED_EMAIL_KEY = 'SCMS_REMEMBERED_EMAIL';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FACILITY_COUNT = new Set(SUPPORTED_SPORTS.map(sport => sport.facilityId)).size;

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

function redirectToRoleDashboard(role) {
  const normalized = String(role || '').toUpperCase();
  const routes = {
    SYSTEMADMIN: '#/manager/dashboard',
    ADMIN: '#/manager/dashboard',
    MANAGER: '#/manager/dashboard',
    RECEPTIONIST: '#/receptionist/dashboard',
    COACH: '#/coach/dashboard',
    MEMBER: '#/member/dashboard'
  };
  window.location.hash = routes[normalized] || '#/';
}

export function LoginPage() {
  const { login, register, logout, loginWithGoogle, isAuthenticated, role } = useAuth();
  const { showSuccess, showError } = useToast();
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const isRegister = activeTab === 'register';

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
        callback: async ({ credential }) => {
          if (!active) return;
          setGoogleLoading(true);
          try {
            const user = await loginWithGoogle({ credential });
            showSuccess('Đăng nhập Google thành công! Chào mừng ' + (user.fullName || 'bạn') + '.');
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

      const buttonWidth = Math.min(380, Math.max(260, googleButtonRef.current?.offsetWidth || 360));
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
    setActiveTab(tab);
    window.location.hash = tab === 'register' ? '#/register' : '#/login';
  };

  const updateField = (id, value, setter) => {
    setter(value);
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
    if (!email) errors['login-email'] = 'Vui lòng nhập email của bạn.';
    else if (!EMAIL_PATTERN.test(email)) errors['login-email'] = 'Email chưa đúng định dạng.';
    if (!loginPassword) errors['login-password'] = 'Vui lòng nhập mật khẩu.';
    else if (!isAsciiPassword(loginPassword)) errors['login-password'] = PASSWORD_CHARACTER_ERROR;
    if (hasValidationErrors(errors)) return;

    setIsSubmitting(true);
    try {
      const user = await login(email, loginPassword);
      saveRememberedEmail(rememberEmail ? email : '');
      showSuccess('Đăng nhập thành công! Chào mừng ' + user.fullName + '.');
      redirectToRoleDashboard(user.role);
    } catch (error) {
      const rawMessage = error.payload?.message || error.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      const cleanMessage = rawMessage.replace(/\s*\[.*HTTP\s*\d+.*\]$/, '').trim();
      const finalMessage = (error.status === 401 || cleanMessage === 'Thông tin đăng nhập không hợp lệ.')
        ? 'Email hoặc mật khẩu không chính xác.'
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
    if (!regConfirmPassword) errors['register-confirm'] = 'Vui lòng nhập lại mật khẩu.';
    else if (!isAsciiPassword(regConfirmPassword)) errors['register-confirm'] = PASSWORD_CHARACTER_ERROR;
    else if (regPassword !== regConfirmPassword) errors['register-confirm'] = 'Mật khẩu xác nhận chưa khớp.';
    if (!regAgree) errors['register-agree'] = 'Vui lòng xác nhận thông tin trước khi đăng ký.';
    if (hasValidationErrors(errors)) return;

    setIsSubmitting(true);
    try {
      const user = await register({ fullName: regFullName.trim(), email, phone, password: regPassword });
      showSuccess('Đăng ký thành công! Mã hội viên của bạn: ' + user.memberCode);
      redirectToRoleDashboard(user.role || 'MEMBER');
    } catch (error) {
      setFormError(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitButton = (
    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full min-h-11 sm:min-h-12 py-3 px-6 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--custom-btn-bg-color)] hover:bg-[var(--custom-btn-bg-hover-color)] text-[var(--secondary-color)] hover:text-white font-dm-sans text-sm font-bold shadow-md shadow-[#F2CC8F]/25 hover:shadow-lg hover:shadow-[#E07A5F]/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-wait transition-all duration-200 group"
    >
      {isSubmitting && <span className="w-4 h-4 border-2 border-[var(--secondary-color)]/40 border-t-[var(--secondary-color)] rounded-full animate-spin" aria-hidden="true" />}
      <span>{isSubmitting ? (isRegister ? 'Đang kích hoạt tài khoản...' : 'Đang đăng nhập...') : (isRegister ? 'Tạo tài khoản hội viên' : 'Đăng nhập vào SCMS')}</span>
      {!isSubmitting && (
        <span className="material-symbols-outlined text-[19px] group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true">
          arrow_forward
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#FAF9F6] font-dm-sans text-slate-900 lg:overflow-hidden select-text">
      {/* ========================================================
          CỘT TRÁI: SHOWCASE THỂ THAO ĐỈNH CAO (Cinematic Athletic Hero)
          ======================================================== */}
      <aside className="hidden lg:flex lg:w-[48%] xl:w-[50%] 2xl:w-[52%] h-full relative overflow-hidden bg-[#2D3047] text-white flex-col justify-between p-8 sm:p-10 xl:p-12 select-none shrink-0 border-r border-white/5">
        <img
          alt="Sports Arena"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 object-cover w-full h-full opacity-35 scale-105 transition-transform duration-1000 ease-out hover:scale-100"
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=75&w=800&auto=format&fit=crop"
        />
        {/* Gradient mờ ảo Tiya Slate Navy & Sage */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#27293D] via-[#3D405B]/85 to-[#3D405B]/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(129,178,154,0.3),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(242,204,143,0.18),transparent_60%)]" />

        {/* Thanh Header thương hiệu góc trên bên trái */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <a href="#/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[var(--primary-color)] via-[#A8DADC] to-[var(--custom-btn-bg-color)] text-white flex items-center justify-center shadow-lg shadow-[var(--primary-color)]/30 font-dm-sans font-bold text-xl tracking-tight transition-transform duration-300 group-hover:scale-105">
              S
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-dm-sans font-bold text-xl tracking-tight text-white leading-none">SCMS</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--primary-color)]/20 text-[#A8DADC] font-bold uppercase border border-[var(--primary-color)]/40">OLYMPIC</span>
              </div>
              <span className="text-[10px] font-bold text-[var(--custom-btn-bg-color)]/80 tracking-[0.2em] uppercase mt-1">Olympic Sports Arena</span>
            </div>
          </a>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold uppercase tracking-wider text-slate-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-pulse shadow-[0_0_8px_rgba(129,178,154,0.8)]" aria-hidden="true" />
            <span>Sân tập mở cửa 24/7</span>
          </div>
        </div>

        {/* Khối trung tâm: Headline nghệ thuật & Thẻ kính nổi */}
        <div className="relative z-10 py-4 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--custom-btn-bg-color)] mb-2">
            <span className="w-4 h-0.5 bg-[var(--custom-btn-bg-color)] inline-block" />
            <span>Khởi đầu bứt phá</span>
          </div>

          <h2 className="font-dm-sans text-3xl sm:text-4xl xl:text-5xl font-bold leading-[1.15] tracking-tight text-white">
            {isRegister ? (
              <>
                Hành trình mới, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[var(--custom-btn-bg-color)] to-[var(--primary-color)]">
                  phiên bản khỏe hơn.
                </span>
              </>
            ) : (
              <>
                Tập luyện hôm nay, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[var(--custom-btn-bg-color)] to-[#F4A261]">
                  bứt phá mỗi ngày.
                </span>
              </>
            )}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-3.5 leading-relaxed max-w-lg font-normal">
            Hệ sinh thái thể thao đa năng với 9 cụm sân thi đấu chuẩn Olympic. Đặt sân siêu tốc, cá nhân hóa lịch tập và theo dõi chỉ số InBody cùng huấn luyện viên hàng đầu.
          </p>

          {/* 2 Thẻ kính Frosted Glass Cards */}
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[var(--custom-btn-bg-color)]/25 text-[var(--custom-btn-bg-color)] flex items-center justify-center shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Đặt chỗ trong 30s</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">Giữ sân &amp; lớp học 7 ngày</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[var(--primary-color)]/25 text-[var(--primary-color)] flex items-center justify-center shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Chuẩn Olympic 5★</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">Hệ thống sân bãi cao cấp</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Cột trái: Thống kê số liệu */}
        <div className="relative z-10 border-t border-white/10 pt-4 flex items-center justify-between gap-6">
          <div className="flex gap-8 sm:gap-10">
            <div>
              <div className="font-dm-sans text-2xl sm:text-3xl font-bold text-white tracking-tight">09</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Bộ môn thi đấu</div>
            </div>
            <div>
              <div className="font-dm-sans text-2xl sm:text-3xl font-bold text-white tracking-tight">09</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Khu tập luyện</div>
            </div>
            <div>
              <div className="font-dm-sans text-2xl sm:text-3xl font-bold text-[var(--custom-btn-bg-color)] tracking-tight">2.5K+</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Hội viên active</div>
            </div>
          </div>

          <a
            href="#khoa-hoc"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-[var(--custom-btn-bg-color)] transition-colors group"
          >
            <span>Khám phá</span>
            <span className="material-symbols-outlined text-[17px] group-hover:translate-x-1 transition-transform" aria-hidden="true">
              arrow_forward
            </span>
          </a>
        </div>
      </aside>

      {/* ========================================================
          CỘT PHẢI: FORM AUTHENTICATION SANG TRỌNG TIYA STYLE
          ======================================================== */}
      <section
        aria-labelledby="auth-heading"
        className="flex-1 h-full flex flex-col justify-between overflow-y-auto p-4 sm:p-6 lg:p-8 xl:p-10 bg-gradient-to-b from-[#FAF8F5] via-white to-[#F4F1DE]/30 relative"
      >
        {/* Đèn ánh sáng nền mờ ảo nghệ thuật phía sau Form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-[var(--primary-color)]/[0.08] rounded-full blur-3xl pointer-events-none" />

        {/* Thanh điều hướng góc trên */}
        <div className="flex items-center justify-between w-full shrink-0 mb-1 z-10">
          <a href="#/" aria-label="SCMS Olympic Sports Arena - Trang chủ" className="lg:hidden flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--primary-color)] via-[#A8DADC] to-[var(--custom-btn-bg-color)] text-white flex items-center justify-center shadow-md font-dm-sans font-bold text-base transition-transform duration-300 group-hover:scale-105">
              S
            </span>
            <span className="flex flex-col">
              <span className="flex items-center gap-1.5">
                <span className="font-dm-sans font-bold text-sm leading-none text-slate-900">SCMS</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--primary-color)]/20 text-[var(--primary-color)] font-bold uppercase border border-[var(--primary-color)]/30">OLYMPIC</span>
              </span>
              <span className="text-[9px] font-bold text-slate-500 tracking-[0.16em] uppercase mt-0.5 leading-none">Olympic Sports Arena</span>
            </span>
          </a>

          <a
            href="#/"
            className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-semibold text-slate-600 hover:text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 border border-slate-200/80 hover:border-[var(--primary-color)]/40 bg-white shadow-sm ml-auto transition-all duration-150"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
            <span>Về trang chủ</span>
          </a>
        </div>

        {/* Khung Auth Card cao cấp nổi bật giữa màn hình */}
        <div className="my-auto py-2 sm:py-3 w-full max-w-[430px] mx-auto z-10">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-[0_15px_45px_-10px_rgba(61,64,91,0.08)] p-6 sm:p-7 transition-all duration-200">
            {/* Tab chuyển đổi Đăng nhập / Đăng ký Tiya Style */}
            <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 mb-3.5 sm:mb-4 border border-slate-200/60" role="group" aria-label="Chọn đăng nhập hoặc đăng ký">
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
                      'flex-1 min-h-9 sm:min-h-10 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] disabled:opacity-60 ' +
                      (isActive
                        ? 'bg-white text-[var(--secondary-color)] shadow-sm border border-slate-200/60 font-bold'
                        : 'text-slate-500 hover:text-slate-800 font-medium')
                    }
                  >
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-color)] inline-block" />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tiêu đề & Lời chào thân thiện */}
            <div className="mb-3.5 sm:mb-4">
              <h1 id="auth-heading" className="font-dm-sans text-xl sm:text-2xl font-bold text-[var(--secondary-color)] tracking-tight leading-tight flex items-center gap-1.5">
                <span>{isRegister ? 'Gia nhập SCMS' : 'Chào mừng trở lại!'}</span>
                <span className="text-lg sm:text-xl">{isRegister ? '⚡' : '👋'}</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1 leading-snug line-clamp-2">
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
                  className="w-full min-h-10 sm:min-h-10.5 px-3 py-2 inline-flex items-center justify-center gap-2.5 border border-slate-200 hover:border-slate-300 rounded-xl bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] disabled:opacity-60 transition-all active:scale-[0.99] cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px' }} viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
                  </svg>
                  <span className="font-medium text-slate-800">{isRegister ? 'Đăng ký với Google' : 'Tiếp tục với Google'}</span>
                </button>
              )}

              {googleLoading && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--primary-color)] mt-1.5 animate-pulse">
                  <svg className="animate-spin h-3.5 w-3.5 text-[var(--primary-color)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang xác thực thông tin với Google...</span>
                </div>
              )}
            </div>

            {/* Dải phân cách mỏng thanh lịch */}
            <div className="flex items-center gap-3 my-2.5 sm:my-3 text-xs text-slate-400">
              <span className="h-px bg-slate-200 flex-1" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">hoặc qua email</span>
              <span className="h-px bg-slate-200 flex-1" />
            </div>

            {formError && (
              <div role="alert" className="mb-3 p-2.5 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700 leading-snug font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-red-500 shrink-0">error</span>
                <span>{formError}</span>
              </div>
            )}

            {!isRegister ? (
              <form onSubmit={handleLoginSubmit} noValidate aria-labelledby="auth-heading" aria-busy={isSubmitting}>
                <fieldset disabled={isSubmitting} className="space-y-3 min-w-0">
                  <AuthField key="login-email" id="login-email" label="Email tài khoản" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={150} placeholder="ban@example.com" required value={loginEmail} error={fieldErrors['login-email']} onChange={event => updateField('login-email', event.target.value, setLoginEmail)} />
                  <AuthField key="login-password" id="login-password" label="Mật khẩu" type="password" autoComplete="current-password" placeholder="Nhập mật khẩu của bạn" required value={loginPassword} error={fieldErrors['login-password']} onChange={event => updateField('login-password', event.target.value, setLoginPassword)} />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-0.5">
                    <label className="inline-flex items-center gap-1.5 text-slate-600 cursor-pointer select-none">
                      <input type="checkbox" checked={rememberEmail} onChange={event => { setRememberEmail(event.target.checked); if (!event.target.checked) saveRememberedEmail(''); }} className="w-3.5 h-3.5 accent-[var(--primary-color)] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)]" />
                      <span className="font-medium text-slate-600">Ghi nhớ email</span>
                    </label>
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="font-semibold text-[var(--primary-color)] hover:text-[#52796F] hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)]">
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="pt-1.5">
                    {submitButton}
                  </div>
                </fieldset>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} noValidate aria-labelledby="auth-heading" aria-busy={isSubmitting}>
                <fieldset disabled={isSubmitting} className="space-y-2.5 min-w-0">
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <AuthField key="register-name" id="register-name" label="Họ và tên" autoComplete="name" maxLength={150} placeholder="Nguyễn Văn A" required value={regFullName} error={fieldErrors['register-name']} onChange={event => updateField('register-name', event.target.value, setRegFullName)} />
                    <AuthField key="register-phone" id="register-phone" label="Số điện thoại" type="tel" autoComplete="tel" maxLength={20} placeholder="0901234567" value={regPhone} error={fieldErrors['register-phone']} onChange={event => updateField('register-phone', event.target.value, setRegPhone)} />
                  </div>
                  <AuthField key="register-email" id="register-email" label="Địa chỉ Email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={150} placeholder="ban@example.com" required value={regEmail} error={fieldErrors['register-email']} onChange={event => updateField('register-email', event.target.value, setRegEmail)} />
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <AuthField key="register-password" id="register-password" label="Mật khẩu" type="password" autoComplete="new-password" minLength={6} maxLength={128} placeholder="Tạo mật khẩu" hint="Tối thiểu 6 ký tự." required value={regPassword} error={fieldErrors['register-password']} onChange={event => updateField('register-password', event.target.value, setRegPassword)} />
                    <AuthField key="register-confirm" id="register-confirm" label="Nhập lại mật khẩu" type="password" autoComplete="new-password" maxLength={128} placeholder="Xác nhận mật khẩu" required value={regConfirmPassword} error={fieldErrors['register-confirm']} onChange={event => updateField('register-confirm', event.target.value, setRegConfirmPassword)} />
                  </div>
                  <div>
                    <label htmlFor="register-agree" className="flex items-start gap-2 text-[11px] leading-4 text-slate-600 cursor-pointer select-none">
                      <input id="register-agree" type="checkbox" required checked={regAgree} aria-invalid={Boolean(fieldErrors['register-agree'])} aria-describedby={fieldErrors['register-agree'] ? 'register-agree-error' : undefined} onChange={event => updateField('register-agree', event.target.checked, setRegAgree)} className="w-3.5 h-3.5 shrink-0 mt-0.5 accent-[var(--primary-color)] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)]" />
                      <span>Tôi xác nhận thông tin là chính xác và đồng ý tạo tài khoản hội viên SCMS.</span>
                    </label>
                    {fieldErrors['register-agree'] && <p id="register-agree-error" className="text-[11px] text-red-600 leading-4 mt-0.5">{fieldErrors['register-agree']}</p>}
                  </div>
                  <div className="pt-1">
                    {submitButton}
                  </div>
                </fieldset>
              </form>
            )}

            {/* Chuyển đổi trạng thái tài khoản */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 text-center text-xs leading-5 text-slate-500">
              {isRegister ? 'Đã có tài khoản?' : 'Bạn chưa có tài khoản?'}{' '}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleTabChange(isRegister ? 'login' : 'register')}
                className="font-bold text-[var(--primary-color)] hover:text-[#52796F] underline-offset-4 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] disabled:opacity-60"
              >
                {isRegister ? 'Đăng nhập ngay' : 'Đăng ký hội viên'}
              </button>
            </div>
          </div>
        </div>

        {/* Chân trang hỗ trợ & Bảo mật */}
        <div className="text-[11px] text-slate-400 text-center shrink-0 py-1 leading-5 z-10 flex items-center justify-center gap-3">
          <span>
            Hỗ trợ 24/7:{' '}
            <a href="tel:0859859367" className="font-semibold text-slate-600 hover:text-[var(--primary-color)] transition-colors rounded">
              0859 859 367
            </a>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="material-symbols-outlined text-[13px] text-emerald-500">lock</span>
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
