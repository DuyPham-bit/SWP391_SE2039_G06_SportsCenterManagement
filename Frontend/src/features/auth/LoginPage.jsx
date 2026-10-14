import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { SUPPORTED_SPORTS } from '../../services/sportsCatalog.js';
import { isAsciiPassword, PASSWORD_CHARACTER_ERROR } from '../../services/passwordPolicy.js';
import { AuthField } from './AuthField.js';
import { ForgotPasswordModal } from './ForgotPasswordModal.js';

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
  const { login, register, logout, isAuthenticated, role } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState(() => window.location.hash.split('?')[0] === '#/register' ? 'register' : 'login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
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
      className="w-full min-h-10 sm:min-h-11 py-2.5 px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-chivo text-sm font-bold shadow-lg shadow-red-600/25 hover:shadow-red-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-wait transition-all duration-200 group"
    >
      {isSubmitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
      <span>{isSubmitting ? (isRegister ? 'Đang kích hoạt tài khoản...' : 'Đang đăng nhập...') : (isRegister ? 'Tạo tài khoản hội viên' : 'Đăng nhập vào SCMS')}</span>
      {!isSubmitting && (
        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true">
          arrow_forward
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#080d1a] font-lexend text-slate-900 lg:overflow-hidden select-text">
      {/* ========================================================
          CỘT TRÁI: SHOWCASE THỂ THAO ĐỈNH CAO (Cinematic Athletic Hero)
          ======================================================== */}
      <aside className="hidden lg:flex lg:w-[48%] xl:w-[50%] 2xl:w-[52%] h-full relative overflow-hidden bg-slate-950 text-white flex-col justify-between p-8 sm:p-10 xl:p-12 select-none shrink-0 border-r border-white/5">
        <img
          alt="Sports Arena"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 object-cover w-full h-full opacity-40 scale-105 transition-transform duration-1000 ease-out hover:scale-100"
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=75&w=800&auto=format&fit=crop"
        />
        {/* Gradient mờ ảo đa tầng */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(225,29,72,0.28),transparent_60%)]" />
        <div className="absolute inset-0 dynamic-typo-grid opacity-30" />

        {/* Thanh Header thương hiệu góc trên bên trái */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <a href="#/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 font-chivo font-black text-xl tracking-tight transition-transform duration-300 group-hover:scale-105">
              S
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-chivo font-black text-xl tracking-tight text-white leading-none">SCMS</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-600/20 text-red-400 font-extrabold uppercase border border-red-500/30">PRO</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">Olympic Sports Arena</span>
            </div>
          </a>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold uppercase tracking-wider text-slate-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-live shadow-[0_0_8px_rgba(52,211,153,0.8)]" aria-hidden="true" />
            <span>Sân tập mở cửa 24/7</span>
          </div>
        </div>

        {/* Khối trung tâm: Headline nghệ thuật & Thẻ kính nổi (Glassmorphism Cards) */}
        <div className="relative z-10 py-4 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-rose-400 mb-2">
            <span className="w-4 h-0.5 bg-rose-500 inline-block" />
            <span>Khởi đầu bứt phá</span>
          </div>

          <h2 className="font-chivo text-3xl sm:text-4xl xl:text-5xl font-black leading-[1.15] tracking-tight text-white">
            {isRegister ? (
              <>
                Hành trình mới, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-200 to-rose-400">
                  phiên bản khỏe hơn.
                </span>
              </>
            ) : (
              <>
                Tập luyện hôm nay, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-200 to-rose-400">
                  bứt phá mỗi ngày.
                </span>
              </>
            )}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-3.5 leading-relaxed max-w-lg font-normal">
            Hệ sinh thái thể thao đa năng với 9 cụm sân thi đấu chuẩn Olympic. Đặt sân siêu tốc, cá nhân hóa lịch tập và theo dõi chỉ số InBody cùng huấn luyện viên hàng đầu.
          </p>

          {/* 2 Thẻ kính Frosted Glass Cards nghệ thuật */}
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Đặt chỗ trong 30s</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">Giữ sân & lớp học 7 ngày</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-sm hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white shadow-sm shrink-0">
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

        {/* Footer Cột trái: Thống kê số liệu đẳng cấp */}
        <div className="relative z-10 border-t border-white/10 pt-4 flex items-center justify-between gap-6">
          <div className="flex gap-8 sm:gap-10">
            <div>
              <div className="font-chivo text-2xl sm:text-3xl font-black text-white tracking-tight">09</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Bộ môn thi đấu</div>
            </div>
            <div>
              <div className="font-chivo text-2xl sm:text-3xl font-black text-white tracking-tight">09</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Khu tập luyện</div>
            </div>
            <div>
              <div className="font-chivo text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">2.5K+</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Hội viên актив</div>
            </div>
          </div>

          <a
            href="#khoa-hoc"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors group"
          >
            <span>Khám phá</span>
            <span className="material-symbols-outlined text-[17px] group-hover:translate-x-1 transition-transform" aria-hidden="true">
              arrow_forward
            </span>
          </a>
        </div>
      </aside>

      {/* ========================================================
          CỘT PHẢI: FORM AUTHENTICATION SANG TRỌNG & NGHỆ THUẬT
          ======================================================== */}
      <section
        aria-labelledby="auth-heading"
        className="flex-1 h-full flex flex-col justify-between overflow-y-auto p-4 sm:p-6 lg:p-8 xl:p-10 bg-gradient-to-b from-slate-50 via-white to-slate-50/80 relative"
      >
        {/* Đèn ánh sáng nền mờ ảo nghệ thuật phía sau Form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-rose-500/[0.04] rounded-full blur-3xl pointer-events-none" />

        {/* Thanh điều hướng góc trên */}
        <div className="flex items-center justify-between w-full shrink-0 mb-1 z-10">
          <a href="#/" aria-label="SCMS Olympic Sports Arena - Trang chủ" className="lg:hidden flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-red-600/30 font-chivo font-black text-base transition-transform duration-300 group-hover:scale-105">
              S
            </span>
            <span className="flex flex-col">
              <span className="flex items-center gap-1.5">
                <span className="font-chivo font-black text-sm leading-none text-slate-900">SCMS</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-red-600/10 text-red-600 font-extrabold uppercase border border-red-500/20">PRO</span>
              </span>
              <span className="text-[9px] font-bold text-slate-500 tracking-[0.16em] uppercase mt-0.5 leading-none">Olympic Sports Arena</span>
            </span>
          </a>

          <a
            href="#/"
            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50/80 border border-slate-200/80 hover:border-red-200 bg-white shadow-sm ml-auto transition-all duration-150"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
            <span>Về trang chủ</span>
          </a>
        </div>

        {/* Khung Auth Card cao cấp nổi bật giữa màn hình */}
        <div className="my-auto py-2 sm:py-3 w-full max-w-[430px] mx-auto z-10">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-[0_12px_40px_-10px_rgba(15,23,42,0.07)] p-6 sm:p-7 transition-all duration-200">
            {/* Tab chuyển đổi Đăng nhập / Đăng ký hiện đại */}
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
                      'flex-1 min-h-9 sm:min-h-10 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60 ' +
                      (isActive
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60 font-black'
                        : 'text-slate-500 hover:text-slate-800 font-medium')
                    }
                  >
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tiêu đề & Lời chào thân thiện */}
            <div className="mb-3.5 sm:mb-4">
              <h1 id="auth-heading" className="font-chivo text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                <span>{isRegister ? 'Gia nhập SCMS' : 'Chào mừng trở lại!'}</span>
                <span className="text-rose-600 text-lg sm:text-xl">{isRegister ? '⚡' : '👋'}</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1 leading-snug line-clamp-2">
                {isRegister
                  ? 'Tạo tài khoản để khám phá khóa học, đặt sân và bắt đầu tập luyện.'
                  : 'Đăng nhập để quản lý lịch tập, đặt sân và theo dõi tiến độ của bạn.'}
              </p>
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
                      <input type="checkbox" checked={rememberEmail} onChange={event => { setRememberEmail(event.target.checked); if (!event.target.checked) saveRememberedEmail(''); }} className="w-3.5 h-3.5 accent-red-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" />
                      <span className="font-medium text-slate-600">Ghi nhớ email</span>
                    </label>
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="font-semibold text-red-600 hover:text-red-700 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
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
                      <input id="register-agree" type="checkbox" required checked={regAgree} aria-invalid={Boolean(fieldErrors['register-agree'])} aria-describedby={fieldErrors['register-agree'] ? 'register-agree-error' : undefined} onChange={event => updateField('register-agree', event.target.checked, setRegAgree)} className="w-3.5 h-3.5 shrink-0 mt-0.5 accent-red-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" />
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
                className="font-bold text-red-600 hover:text-red-700 underline-offset-4 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60"
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
            <a href="tel:0859859367" className="font-semibold text-slate-600 hover:text-red-600 transition-colors rounded">
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

      {/* Modal quên mật khẩu */}
      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} onResetSuccess={email => { setLoginEmail(email); clearFormFeedback(); handleTabChange('login'); }} />
    </div>
  );
}
