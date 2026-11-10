import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminApi } from '../../../entities/center/index.js';
import { MotionButton } from '../../../shared/ui/MotionButton.jsx';

// ─────────────────────────────────────────────────────────────
// Modal 2: Create Manager Modal
// ─────────────────────────────────────────────────────────────
export function ManagerModal({ centers, onClose, onSaved }) {
  const activeCenters = (centers || []).filter((c) => c.status === 'Active');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    centerId: activeCenters[0]?.id || ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [saving, onClose]);

  const save = async (e) => {
    e?.preventDefault();
    if (!form.fullName.trim()) return setErr('Vui lòng nhập họ và tên Manager.');
    if (!form.username.trim()) return setErr('Vui lòng nhập tên đăng nhập.');
    if (!form.email.trim()) return setErr('Vui lòng nhập email.');
    if (!form.password || form.password.length < 6) return setErr('Mật khẩu tối thiểu 6 ký tự.');
    if (!form.centerId) return setErr('Vui lòng chọn cơ sở trực thuộc.');

    setSaving(true);
    setErr('');
    try {
      await adminApi.createManager({ ...form, centerId: Number(form.centerId) });
      onSaved();
    } catch (e) {
      setErr(e.message || 'Đã xảy ra lỗi khi tạo tài khoản Manager.');
    } finally {
      setSaving(false);
    }
  };

  const node = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-brand-navy-950/65 backdrop-blur-md transition-all duration-300"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-brand-navy-900 rounded-3xl shadow-[0_25px_60px_-15px_rgba(30,34,53,0.35)] border border-brand-navy-100 dark:border-brand-navy-800 p-6 sm:p-8 text-left transition-all overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ambient lighting tint */}
        <div className="absolute top-0 inset-x-0 h-28 pointer-events-none bg-gradient-to-b from-brand-teal-500/15 via-brand-navy-700/5 to-transparent" />

        {/* Close Button */}
        <MotionButton
          type="button"
          disabled={saving}
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 text-brand-navy-500 dark:text-brand-navy-400 flex items-center justify-center transition-colors border border-brand-navy-200 dark:border-brand-navy-700 cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </MotionButton>

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-teal-600 to-brand-navy-800 text-white flex items-center justify-center shadow-md shadow-brand-teal-500/20 shrink-0">
            <span className="material-symbols-outlined text-[26px]">manage_accounts</span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-teal-700 dark:text-brand-teal-400">
              Nhân sự lãnh đạo cơ sở
            </span>
            <h3 className="text-xl font-black text-brand-navy-900 dark:text-white tracking-tight">
              Cấp Tài Khoản Manager
            </h3>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={save} className="relative z-10 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1.5">
                Họ và tên <span className="text-brand-danger-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-brand-navy-400">badge</span>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="VD: Trần Đình Trọng"
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal-500 transition-all placeholder:text-brand-navy-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1.5">
                Tên đăng nhập <span className="text-brand-danger-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-brand-navy-400">person</span>
                <input
                  type="text"
                  required
                  placeholder="VD: manager_q1"
                  value={form.username}
                  onChange={(e) => set('username', e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal-500 transition-all placeholder:text-brand-navy-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1.5">
                Email công vụ <span className="text-brand-danger-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-brand-navy-400">mail</span>
                <input
                  type="email"
                  required
                  placeholder="VD: manager.q1@sportscenter.vn"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal-500 transition-all placeholder:text-brand-navy-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1.5">
                Số điện thoại
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-brand-navy-400">call</span>
                <input
                  type="tel"
                  placeholder="VD: 0912345678"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal-500 transition-all placeholder:text-brand-navy-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1.5">
              Mật khẩu khởi tạo <span className="text-brand-danger-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-brand-navy-400">key</span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal-500 transition-all placeholder:text-brand-navy-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-2.5 text-brand-navy-400 hover:text-brand-navy-600 dark:hover:text-brand-navy-200 p-1"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1.5">
              Cơ sở chỉ định quản lý <span className="text-brand-danger-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-brand-navy-400">domain</span>
              <select
                required
                value={form.centerId}
                onChange={(e) => set('centerId', e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal-500 transition-all cursor-pointer"
              >
                {activeCenters.length === 0 && (
                  <option value="">(Chưa có cơ sở nào đang hoạt động)</option>
                )}
                {activeCenters.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} - {c.name} ({c.address})
                  </option>
                ))}
              </select>
            </div>
            {activeCenters.length === 0 && (
              <p className="text-xs text-brand-sand-700 dark:text-brand-sand-400 mt-1">
                Lưu ý: Bạn cần tạo hoặc kích hoạt ít nhất một cơ sở thể thao trước khi bổ nhiệm Manager.
              </p>
            )}
          </div>

          {err && (
            <div className="p-3 rounded-xl bg-brand-danger-50 dark:bg-brand-danger-950/60 border border-brand-danger-200 dark:border-brand-danger-800 text-xs font-medium text-brand-danger-700 dark:text-brand-danger-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{err}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800">
            <MotionButton
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </MotionButton>
            <MotionButton
              type="submit"
              disabled={saving || activeCenters.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-teal-600 to-brand-navy-800 hover:from-brand-teal-700 hover:to-brand-navy-800 text-white text-xs font-bold shadow-md shadow-brand-teal-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              <span>{saving ? 'Đang tạo...' : 'Xác Nhận Cấp Tài Khoản'}</span>
            </MotionButton>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
