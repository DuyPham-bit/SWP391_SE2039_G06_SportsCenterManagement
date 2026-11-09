import React from 'react';
import { useAuth } from '../../../entities/session/index.js';
import { getPostLoginRoute } from '../../../entities/membership/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { AccountInfoBox, AccountSetupShell, SetPasswordForm } from '../../../features/auth/index.js';

/** Shown for every route while the signed-in account still uses its default (phone) password. */
export function InitialPasswordPage() {
  const { currentUser, changeInitialPassword, logout } = useAuth();
  const { showSuccess } = useToast();

  const handleSubmit = async ({ currentPassword, newPassword, confirmPassword }) => {
    const updated = await changeInitialPassword(currentPassword, newPassword, confirmPassword);
    showSuccess('Đã đổi mật khẩu. Chào mừng bạn đến với hệ thống!');
    window.location.hash = getPostLoginRoute(updated?.role || currentUser?.role);
  };

  return (
    <AccountSetupShell
      eyebrow="Bảo mật tài khoản"
      title="Đổi mật khẩu lần đầu"
      description={<p>Tài khoản đang dùng mật khẩu mặc định là số điện thoại. Vui lòng đặt mật khẩu mới trước khi tiếp tục.</p>}
      footer={
        <button type="button" onClick={logout} className="min-h-[44px] px-3 font-semibold text-brand-navy-600 dark:text-brand-navy-300 hover:text-brand-navy-900 dark:hover:text-white underline-offset-4 hover:underline cursor-pointer">
          Đăng xuất
        </button>
      }
    >
      <AccountInfoBox rows={[['Họ và tên', currentUser?.fullName], ['Email', currentUser?.email], ['Số điện thoại', currentUser?.phone]]} />
      <SetPasswordForm
        idPrefix="initial-password"
        email={currentUser?.email}
        phone={currentUser?.phone}
        requireCurrent
        currentLabel="Mật khẩu hiện tại"
        currentHint="Mật khẩu mặc định là số điện thoại đã đăng ký tại quầy."
        submitLabel="Lưu mật khẩu mới"
        onSubmit={handleSubmit}
      />
    </AccountSetupShell>
  );
}
