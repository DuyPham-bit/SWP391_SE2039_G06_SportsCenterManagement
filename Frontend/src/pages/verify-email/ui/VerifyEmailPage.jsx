import React, { useEffect, useRef, useState } from 'react';
import { authApi, useAuth } from '../../../entities/session/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { AccountInfoBox, AccountSetupShell, SetPasswordForm } from '../../../features/auth/index.js';

const REDIRECT_SECONDS = 3;

function readToken() {
  const fromHash = (window.location.hash.split('?')[1] || '');
  const token = new URLSearchParams(fromHash).get('token') || new URLSearchParams(window.location.search).get('token');
  return token?.trim() || '';
}

/** Landing page of the activation email: verify the email and replace the default (phone) password. */
export function VerifyEmailPage() {
  const { isAuthenticated, logout } = useAuth();
  const { showSuccess } = useToast();
  const tokenRef = useRef(readToken());
  const [state, setState] = useState(tokenRef.current ? 'loading' : 'invalid');
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(tokenRef.current ? '' : 'Liên kết không chứa mã xác nhận.');
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    // Keep the single-use token out of the visible URL and browser history.
    if (tokenRef.current) window.history.replaceState(null, '', `${window.location.pathname}#/verify-email`);
    if (!tokenRef.current) return undefined;
    const controller = new AbortController();
    authApi.previewActivation(tokenRef.current, { signal: controller.signal })
      .then(result => { setAccount(result); setState('form'); })
      .catch(err => {
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Liên kết xác nhận không hợp lệ hoặc đã hết hạn.');
        setState('invalid');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (state !== 'success') return undefined;
    if (countdown <= 0) { window.location.hash = '#/login'; return undefined; }
    const timer = window.setTimeout(() => setCountdown(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [state, countdown]);

  const handleSubmit = async ({ newPassword, confirmPassword }) => {
    await authApi.completeActivation(tokenRef.current, newPassword, confirmPassword);
    // Any session opened with the default password was revoked server-side.
    if (isAuthenticated) logout();
    showSuccess('Kích hoạt tài khoản thành công. Vui lòng đăng nhập bằng mật khẩu mới.');
    setState('success');
  };

  if (state === 'loading') {
    return (
      <AccountSetupShell title="Đang kiểm tra liên kết">
        <div role="status" className="flex items-center gap-2.5 text-sm text-brand-navy-500 dark:text-brand-navy-300">
          <span className="w-4 h-4 border-2 border-brand-sand-600 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <span>Đang xác thực liên kết kích hoạt...</span>
        </div>
      </AccountSetupShell>
    );
  }

  if (state === 'invalid') {
    return (
      <AccountSetupShell
        title="Liên kết không còn hiệu lực"
        description={<p role="alert">{error}</p>}
        footer={<span>Liên kết chỉ dùng được một lần và có hiệu lực 24 giờ.</span>}
      >
        <div className="flex flex-col gap-2">
          <a href="#/login" className="w-full min-h-[44px] inline-flex items-center justify-center px-5 py-3 bg-brand-navy-900 hover:bg-brand-navy-950 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors">
            Đến trang đăng nhập
          </a>
          <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 text-center mt-1">
            Cần liên kết mới? Vui lòng liên hệ quầy lễ tân để được gửi lại email xác nhận.
          </p>
        </div>
      </AccountSetupShell>
    );
  }

  if (state === 'success') {
    return (
      <AccountSetupShell title="Tài khoản đã được kích hoạt">
        <div role="status" className="flex flex-col items-center text-center gap-3">
          <span className="w-14 h-14 rounded-full bg-brand-sage-100 text-brand-sage-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]" aria-hidden="true">verified</span>
          </span>
          <p className="text-sm text-brand-navy-600 dark:text-brand-navy-300">
            Email đã được xác nhận và mật khẩu mới đã được lưu. Tự động chuyển đến trang đăng nhập sau {countdown} giây.
          </p>
          <a href="#/login" className="w-full min-h-[44px] inline-flex items-center justify-center px-5 py-3 bg-brand-navy-900 hover:bg-brand-navy-950 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors">
            Đăng nhập ngay
          </a>
        </div>
      </AccountSetupShell>
    );
  }

  return (
    <AccountSetupShell
      title="Xác nhận & thiết lập mật khẩu"
      description={<p>Xin chào <strong className="text-brand-navy-900 dark:text-white">{account?.fullName}</strong>, hãy đặt mật khẩu riêng để hoàn tất kích hoạt tài khoản hội viên.</p>}
      footer={<span>Sau khi lưu, mật khẩu mặc định (số điện thoại) sẽ không còn dùng được.</span>}
    >
      <AccountInfoBox rows={[['Email đăng nhập', account?.email], ['Số điện thoại', account?.phone]]} />
      <SetPasswordForm
        idPrefix="activation"
        email={account?.email}
        phone={account?.phone}
        submitLabel="Hoàn tất kích hoạt & Lưu mật khẩu"
        onSubmit={handleSubmit}
      />
    </AccountSetupShell>
  );
}
