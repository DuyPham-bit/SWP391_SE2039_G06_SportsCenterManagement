import React from 'react';
import { useLanguage } from '../../shared/i18n/LanguageContext.jsx';

/**
 * Olympic Luxury 404 Not Found View
 * Adheres to UI/UX Pro Max guidelines:
 * - Theme: Olympic Sports Arena (Royal Navy, Teal/Sage, Gold/Sand accent)
 * - Accessibility: WCAG 4.5:1 contrast, min 44x44px touch targets
 * - Multi-language: full vi/en support via useLanguage
 * - Smart recovery: role-aware dashboard button + go back + home
 */
export function NotFoundView({ path = '', currentUser = null }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const role = (currentUser?.role || '').toUpperCase();
  const getRoleDashboard = () => {
    switch (role) {
      case 'MEMBER':
        return {
          url: '#/member/dashboard',
          label: isEn ? 'Go to Member Dashboard' : 'Về Bàn làm việc Hội viên',
          icon: 'fitness_center'
        };
      case 'COACH':
        return {
          url: '#/coach/dashboard',
          label: isEn ? 'Go to Coach Dashboard' : 'Về Bàn làm việc HLV',
          icon: 'sports'
        };
      case 'MANAGER':
        return {
          url: '#/manager/dashboard',
          label: isEn ? 'Go to Manager Dashboard' : 'Về Quản lý Trung tâm',
          icon: 'space_dashboard'
        };
      case 'RECEPTIONIST':
        return {
          url: '#/receptionist/dashboard',
          label: isEn ? 'Go to Reception Desk' : 'Về Bàn Lễ tân',
          icon: 'support_agent'
        };
      case 'ADMIN':
      case 'SYSTEMADMIN':
        return {
          url: '#/admin/dashboard',
          label: isEn ? 'Go to Admin Dashboard' : 'Về Quản trị Hệ thống',
          icon: 'admin_panel_settings'
        };
      default:
        return {
          url: '#/login',
          label: isEn ? 'Sign In to SCMS' : 'Đến Trang Đăng nhập',
          icon: 'login'
        };
    }
  };

  const dashboardTarget = getRoleDashboard();

  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.hash = dashboardTarget.url;
      }
    }
  };

  return (
    <main
      role="main"
      className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-brand-navy-950 via-[#0a1122] to-brand-navy-900 text-slate-100"
    >
      {/* Ambient Olympic Glow Spheres */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-teal-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-brand-sand-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-lg p-6 sm:p-10 rounded-3xl bg-brand-navy-900/80 backdrop-blur-xl border border-white/10 shadow-2xl text-center animate-fade-slide-up">
        {/* Badge Chip */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-teal-500/10 border border-brand-teal-500/25 text-brand-teal-400 text-xs font-chivo font-bold uppercase tracking-widest mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-teal-400 animate-pulse" />
          <span>{isEn ? 'Error 404 • Page Not Found' : 'Mã lỗi: 404 • Không tìm thấy'}</span>
        </div>

        {/* Olympic Compass / Explore Icon Badge */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-teal-500/20 to-brand-sand-500/15 border border-brand-teal-400/30 text-brand-teal-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <span className="material-symbols-outlined text-[42px]" aria-hidden="true">
            explore_off
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-chivo text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isEn ? 'Page Not Found' : 'Trang Không Tồn Tại'}
        </h1>

        {/* Description & Attempted Path */}
        <p className="font-lexend text-sm text-slate-300 mt-3 leading-relaxed max-w-md mx-auto">
          {isEn
            ? 'The route you visited does not exist on SCMS or has moved to a new destination.'
            : 'Đường dẫn bạn vừa truy cập không có trên hệ thống hoặc đã được cập nhật địa chỉ mới.'}
        </p>

        {path && (
          <div className="mt-4">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
              {isEn ? 'Requested URL:' : 'Đường dẫn yêu cầu:'}
            </span>
            <code className="inline-block px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-brand-sand-300 text-xs font-mono break-all max-w-full">
              {path}
            </code>
          </div>
        )}

        {/* Action Buttons (Touch Target >= 44px) */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          {/* Primary Action Button */}
          <a
            href={dashboardTarget.url}
            className="flex-1 min-h-[44px] px-5 py-3 rounded-xl bg-gradient-to-r from-brand-teal-600 to-brand-teal-500 hover:from-brand-teal-500 hover:to-brand-teal-400 text-white font-chivo font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-teal-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {dashboardTarget.icon}
            </span>
            <span>{dashboardTarget.label}</span>
          </a>

          {/* Secondary Action: Go Back */}
          <button
            type="button"
            onClick={handleGoBack}
            className="min-h-[44px] px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-chivo font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              arrow_back
            </span>
            <span>{isEn ? 'Go Back' : 'Quay lại'}</span>
          </button>
        </div>

        {/* Tertiary Footer Link */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center gap-4 text-xs font-lexend text-slate-400">
          <a
            href="#/"
            className="hover:text-brand-teal-400 transition-colors flex items-center gap-1.5 py-1"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              home
            </span>
            <span>{isEn ? 'Back to Landing Home' : 'Về Trang chủ SCMS'}</span>
          </a>
          <span className="text-slate-600">•</span>
          <a
            href="#/login"
            className="hover:text-brand-sand-300 transition-colors flex items-center gap-1.5 py-1"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              login
            </span>
            <span>{isEn ? 'Login Page' : 'Trang Đăng nhập'}</span>
          </a>
        </div>
      </div>
    </main>
  );
}

export default NotFoundView;

