import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { authApi } from '../../services/api.js';
import { loadGoogleIdentity, googleClientId } from '../../services/googleIdentity.js';

export function GoogleLoginModal({ isOpen, onClose, onSuccess, linkAccount = false }) {
  const { loginWithGoogle } = useAuth();
  const { showSuccess, showError } = useToast();
  const buttonRef = useRef(null);
  const passwordRef = useRef('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hỗ trợ bấm phím Escape để đóng modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setError('');
    passwordRef.current = '';
    if (!googleClientId) {
      setError('Đăng nhập Google chưa được kích hoạt cho hệ thống này.');
      return;
    }
    loadGoogleIdentity().then(google => {
      if (!active || !buttonRef.current) return;
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          if (!active) return;
          if (linkAccount && !passwordRef.current) {
            showError('Vui lòng nhập mật khẩu hiện tại trước khi liên kết Google.');
            return;
          }
          setLoading(true);
          try {
            if (linkAccount) {
              await authApi.linkGoogle(credential, passwordRef.current);
              showSuccess('Đã liên kết Google thành công. Bạn có thể dùng Google để đăng nhập lần sau.');
              onClose();
            } else {
              const user = await loginWithGoogle({ credential });
              showSuccess('Đăng nhập Google thành công.');
              onClose();
              onSuccess?.(user);
            }
          } catch (err) {
            showError(err.message || 'Xác thực tài khoản Google thất bại.');
          } finally {
            if (active) setLoading(false);
          }
        }
      });
      google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: 320,
        text: linkAccount ? 'continue_with' : 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      });
    }).catch(err => {
      if (active) setError(err.message || 'Không thể kết nối đến dịch vụ Google.');
    });
    return () => { active = false; };
  }, [isOpen, linkAccount]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={linkAccount ? 'Liên kết Google' : 'Đăng nhập Google'}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-200 animate-modal-entrance"
        onClick={e => e.stopPropagation()}
      >
        {/* Dải màu Google 4 màu ở mép trên cùng */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853]" />

        {/* Nút đóng (X) góc phải trên */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng hộp thoại"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all duration-150 active:scale-90 focus:outline-none"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Header với Icon Google và tiêu đề nổi bật */}
          <div className="text-center pt-1">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center mx-auto mb-3.5 transition-transform hover:scale-105 duration-200">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            </div>
            <h2 className="font-bold text-xl sm:text-2xl text-slate-900 tracking-tight font-lexend">
              {linkAccount ? 'Liên kết tài khoản Google' : 'Đăng nhập bằng Google'}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
              {linkAccount
                ? 'Chọn tài khoản Google có cùng email với tài khoản SCMS của bạn để liên kết.'
                : 'Google sẽ xác minh an toàn tài khoản trước khi đăng nhập vào SCMS.'}
            </p>
          </div>

          {/* Form mật khẩu khi liên kết tài khoản */}
          {linkAccount && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-slate-500">lock</span>
                Mật khẩu SCMS hiện tại
              </label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu để xác minh..."
                onChange={e => { passwordRef.current = e.target.value; }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
              />
              <p className="text-[11px] text-slate-400">Yêu cầu xác nhận mật khẩu để bảo vệ an toàn tài khoản của bạn.</p>
            </div>
          )}

          {/* Hiển thị lỗi nếu có */}
          {error && (
            <div role="alert" className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <span className="material-symbols-outlined text-rose-500 text-[18px] shrink-0 mt-0.5">error</span>
              <span className="font-medium text-xs leading-relaxed">{error}</span>
            </div>
          )}

          {/* Khung nút đăng nhập Google được căn giữa và làm đẹp */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-center py-1">
              <div
                ref={buttonRef}
                className={`min-h-[44px] flex justify-center transition-all ${loading ? 'pointer-events-none opacity-40 scale-98' : 'hover:shadow-sm'}`}
              />
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 mt-2.5 animate-pulse">
                <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Đang xác thực với Google...</span>
              </div>
            )}
          </div>

          {/* Dòng cam kết bảo mật */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <span className="material-symbols-outlined text-[14px] text-emerald-500">verified_user</span>
            <span>Bảo mật OAuth 2.0 chuẩn Google • An toàn tuyệt đối</span>
          </div>

          {/* Nút đóng */}
          <div className="pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-sm font-medium transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>Đóng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
